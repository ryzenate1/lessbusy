import { z } from 'zod';
import { ToolCategory } from 'twenty-shared/ai';
import { getWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { FindRecordsService } from 'src/engine/core-modules/record-crud/services/find-records.service';
import { DefineTool } from 'src/engine/core-modules/tool-provider/decorators/define-tool.decorator';
import { BaseTool } from 'src/engine/core-modules/tool-provider/interfaces/base-tool.interface';
import { type ToolProviderContext } from 'src/engine/core-modules/tool-provider/interfaces/tool-provider-context.type';
import { type ToolOutput } from 'src/engine/core-modules/tool/types/tool-output.type';

const inputSchema = z.object({ limit: z.number().int().min(1).max(20).default(10) }).strict();

@DefineTool({ name: 'lessbusy_get_overdue_invoices', category: ToolCategory.ACTION, description: 'Retrieve a bounded page of authorized finalized or partly paid invoices whose due date has passed. Amounts are decimal integer minor-unit strings; calculate outstanding as totals.totalMinor minus amountCreditedMinor minus amountPaidMinor plus amountRefundedMinor (missing adjustment amounts are zero) and keep currencies separate. Results are not an aggregate or complete business report. No payment, reminder or other mutation is performed.' })
export class LessBusyOverdueInvoicesTool extends BaseTool<typeof inputSchema> {
  readonly inputSchema = inputSchema;
  constructor(private readonly findRecords: FindRecordsService) { super(); }

  async execute(input: z.infer<typeof inputSchema>, context: ToolProviderContext): Promise<ToolOutput> {
    const authContext = context.authContext ?? getWorkspaceAuthContext();
    if (authContext.workspace.id !== context.workspaceId) return { success: false, message: 'Workspace context does not match' };
    return this.findRecords.execute({
      objectName: 'lbInvoice', filter: { and: [{ status: { in: ['FINALIZED', 'PART_PAID'] } }, { dueAt: { lt: new Date().toISOString() } }] },
      limit: input.limit, select: ['id', 'name', 'status', 'currency', 'dueAt', 'totals', 'amountPaidMinor', 'amountCreditedMinor', 'amountRefundedMinor'],
      shouldBuildEffectiveSelectFields: true, authContext, rolePermissionConfig: context.rolePermissionConfig,
    });
  }
}
