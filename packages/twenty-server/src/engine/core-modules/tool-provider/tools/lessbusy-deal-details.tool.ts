import { z } from 'zod';
import { ToolCategory } from 'twenty-shared/ai';
import { getWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { FindRecordsService } from 'src/engine/core-modules/record-crud/services/find-records.service';
import { DefineTool } from 'src/engine/core-modules/tool-provider/decorators/define-tool.decorator';
import { BaseTool } from 'src/engine/core-modules/tool-provider/interfaces/base-tool.interface';
import { type ToolProviderContext } from 'src/engine/core-modules/tool-provider/interfaces/tool-provider-context.type';
import { type ToolOutput } from 'src/engine/core-modules/tool/types/tool-output.type';

const inputSchema = z.object({ dealId: z.string().uuid(), includeSales: z.boolean().default(false) }).strict();
@DefineTool({ name: 'lessbusy_get_deal_details', category: ToolCategory.ACTION, description: 'Read the exact authorized native deal, stage, expected amount/currency, owner, customer link and closing date. Optional sales sections contain at most five linked quotes/orders/invoices each and are permission-checked separately. A deal amount is an expected opportunity value, not paid revenue or a confirmed order. Never change the stage or create sales documents with this tool.' })
export class LessBusyDealDetailsTool extends BaseTool<typeof inputSchema> {
  readonly inputSchema = inputSchema;
  constructor(private readonly findRecords: FindRecordsService) { super(); }
  async execute(input: z.infer<typeof inputSchema>, context: ToolProviderContext): Promise<ToolOutput> {
    const authContext = context.authContext ?? getWorkspaceAuthContext();
    if (authContext.workspace.id !== context.workspaceId) return { success: false, message: 'Workspace context does not match' };
    const common = { authContext, rolePermissionConfig: context.rolePermissionConfig, shouldBuildEffectiveSelectFields: true };
    const deal = await this.findRecords.execute({ ...common, objectName: 'opportunity', filter: { id: { eq: input.dealId } }, limit: 1, select: ['id', 'name', 'stage', 'amount', 'closeDate', 'ownerId', 'pointOfContactId', 'companyId'] });
    if (!deal.success || !deal.result?.records.length) return { success: false, message: 'Deal unavailable in your workspace access' };
    const sales = input.includeSales ? await Promise.all(['lbQuotation', 'lbSalesOrder', 'lbInvoice'].map(async (objectName) => ({ objectName, result: await this.findRecords.execute({ ...common, objectName, filter: { opportunityId: { eq: input.dealId } }, limit: 5, select: ['id', 'name', 'status', 'currency'] }) }))) : undefined;
    return { success: true, message: 'Authorized deal retrieved; expected deal value is separate from sales/payment records.', result: { deal: deal.result.records[0], ...(sales ? { sales, limitPerSalesSection: 5 } : {}) }, recordReferences: deal.recordReferences, ...(deal.warnings ? { warnings: deal.warnings } : {}) };
  }
}
