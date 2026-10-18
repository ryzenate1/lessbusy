import { z } from 'zod';
import { ToolCategory } from 'twenty-shared/ai';
import { getWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { CommonApiContextBuilderService } from 'src/engine/core-modules/record-crud/services/common-api-context-builder.service';
import { FindRecordsService } from 'src/engine/core-modules/record-crud/services/find-records.service';
import { DefineTool } from 'src/engine/core-modules/tool-provider/decorators/define-tool.decorator';
import { BaseTool } from 'src/engine/core-modules/tool-provider/interfaces/base-tool.interface';
import { type ToolProviderContext } from 'src/engine/core-modules/tool-provider/interfaces/tool-provider-context.type';
import { type ToolOutput } from 'src/engine/core-modules/tool/types/tool-output.type';
import { calculateDocumentTotals, salesDocumentInputSchema } from 'src/modules/lessbusy/utils/calculate-document-totals.util';

const inputSchema = z.object({ document: salesDocumentInputSchema }).strict();

@DefineTool({ name: 'lessbusy_prepare_invoice', category: ToolCategory.ACTION, description: 'Prepare an invoice proposal for explicit human review. Gather customer, currency, items, quantities and prices first. Validates visible customer/product references and calculates taxes/discounts safely. This tool never saves, finalizes, charges or sends an invoice; the user must open the review form and confirm.' })
export class LessBusyPrepareInvoiceTool extends BaseTool<typeof inputSchema> {
  readonly inputSchema = inputSchema;
  constructor(private readonly findRecords: FindRecordsService, private readonly contextBuilder: CommonApiContextBuilderService) { super(); }
  async execute(input: z.infer<typeof inputSchema>, context: ToolProviderContext): Promise<ToolOutput> {
    const authContext = context.authContext ?? getWorkspaceAuthContext();
    if (authContext.workspace.id !== context.workspaceId) return { success: false, message: 'Workspace context does not match' };
    await this.contextBuilder.build({ authContext, objectName: 'lbInvoice', rolePermissionConfig: context.rolePermissionConfig });
    const customer = await this.findRecords.execute({ objectName: 'person', filter: { id: { eq: input.document.customerId } }, select: ['id', 'name'], limit: 1, shouldBuildEffectiveSelectFields: true, authContext, rolePermissionConfig: context.rolePermissionConfig });
    if (!customer.success || !customer.result?.records.length) return { success: false, message: 'Select a customer available in your workspace access' };
    for (const line of input.document.lines) {
      if (!line.variantId) continue;
      const variant = await this.findRecords.execute({ objectName: 'lbProductVariant', filter: { id: { eq: line.variantId } }, select: ['id'], limit: 1, shouldBuildEffectiveSelectFields: true, authContext, rolePermissionConfig: context.rolePermissionConfig });
      if (!variant.success || !variant.result?.records.length) return { success: false, message: 'A product variant is unavailable in your access' };
    }
    const proposal = calculateDocumentTotals(input.document);
    return { success: true, message: 'Proposal prepared. Ask the user to open the review form and confirm the details before creating a draft.', result: { lessbusyInvoiceProposal: { workspaceId: context.workspaceId, document: input.document, totals: proposal.totals } } };
  }
}
