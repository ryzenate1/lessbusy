import { z } from 'zod';
import { ToolCategory } from 'twenty-shared/ai';
import { getWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { FindRecordsService } from 'src/engine/core-modules/record-crud/services/find-records.service';
import { DefineTool } from 'src/engine/core-modules/tool-provider/decorators/define-tool.decorator';
import { BaseTool } from 'src/engine/core-modules/tool-provider/interfaces/base-tool.interface';
import { type ToolProviderContext } from 'src/engine/core-modules/tool-provider/interfaces/tool-provider-context.type';
import { type ToolOutput } from 'src/engine/core-modules/tool/types/tool-output.type';

const inputSchema = z.object({ customerId: z.string().uuid(), include: z.array(z.enum(['leads', 'deals', 'orders', 'invoices'])).max(4).default(['leads', 'deals']) }).strict();

@DefineTool({ name: 'lessbusy_get_customer_summary', category: ToolCategory.ACTION, description: 'Get a minimal authorized customer summary and up to five records per requested related section. Verify the customer first; include financial sections only when relevant to the user request. Contact details, notes and message contents are not transmitted. Missing/inaccessible sections are reported separately; results are not a complete account history.' })
export class LessBusyCustomerSummaryTool extends BaseTool<typeof inputSchema> {
  readonly inputSchema = inputSchema;
  constructor(private readonly findRecords: FindRecordsService) { super(); }

  async execute(input: z.infer<typeof inputSchema>, context: ToolProviderContext): Promise<ToolOutput> {
    const authContext = context.authContext ?? getWorkspaceAuthContext();
    if (authContext.workspace.id !== context.workspaceId) return { success: false, message: 'Workspace context does not match' };
    const common = { authContext, rolePermissionConfig: context.rolePermissionConfig, shouldBuildEffectiveSelectFields: true };
    const customer = await this.findRecords.execute({ ...common, objectName: 'person', filter: { id: { eq: input.customerId } }, limit: 1, select: ['id', 'name'] });
    if (!customer.success || !customer.result?.records.length) return { success: false, message: 'Customer unavailable in your access' };
    const definitions = { leads: { object: 'lbLead', field: 'customerId', select: ['id', 'name', 'temperature', 'priority', 'recommendedAction', 'nextFollowUpAt'] }, deals: { object: 'opportunity', field: 'pointOfContactId', select: ['id', 'name', 'stage', 'closeDate'] }, orders: { object: 'lbSalesOrder', field: 'customerId', select: ['id', 'name', 'status'] }, invoices: { object: 'lbInvoice', field: 'customerId', select: ['id', 'name', 'status', 'currency', 'totals', 'amountPaidMinor', 'amountCreditedMinor', 'amountRefundedMinor', 'dueAt'] } };
    const sections = await Promise.all([...new Set(input.include)].map(async (section) => {
      const definition = definitions[section];
      const result = await this.findRecords.execute({ ...common, objectName: definition.object, filter: { [definition.field]: { eq: input.customerId } }, limit: 5, select: definition.select });
      return { section, result };
    }));
    return { success: true, message: 'Customer summary retrieved. Related sections are bounded and individually permission checked.', result: { customer: customer.result.records[0], sections, limitPerSection: 5 } };
  }
}
