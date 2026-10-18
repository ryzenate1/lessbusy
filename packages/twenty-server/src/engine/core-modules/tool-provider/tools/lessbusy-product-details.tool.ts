import { z } from 'zod';
import { ToolCategory } from 'twenty-shared/ai';
import { getWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { FindRecordsService } from 'src/engine/core-modules/record-crud/services/find-records.service';
import { DefineTool } from 'src/engine/core-modules/tool-provider/decorators/define-tool.decorator';
import { BaseTool } from 'src/engine/core-modules/tool-provider/interfaces/base-tool.interface';
import { type ToolProviderContext } from 'src/engine/core-modules/tool-provider/interfaces/tool-provider-context.type';
import { type ToolOutput } from 'src/engine/core-modules/tool/types/tool-output.type';

const inputSchema = z.object({ productId: z.string().uuid(), offset: z.number().int().min(0).max(1000).default(0) }).strict();
@DefineTool({ name: 'lessbusy_get_product_details', category: ToolCategory.ACTION, description: 'Read an authorized product and up to 20 of its active sellable options with SKU, configured attributes, exact stored selling price in minor units, tax basis points and inventory tracking setting. No cost prices. Check stock separately before claiming availability. This does not reserve stock, quote a final price or create a sales document.' })
export class LessBusyProductDetailsTool extends BaseTool<typeof inputSchema> {
  readonly inputSchema = inputSchema;
  constructor(private readonly findRecords: FindRecordsService) { super(); }
  async execute(input: z.infer<typeof inputSchema>, context: ToolProviderContext): Promise<ToolOutput> {
    const authContext = context.authContext ?? getWorkspaceAuthContext();
    if (authContext.workspace.id !== context.workspaceId) return { success: false, message: 'Workspace context does not match' };
    const common = { authContext, rolePermissionConfig: context.rolePermissionConfig, shouldBuildEffectiveSelectFields: true };
    const product = await this.findRecords.execute({ ...common, objectName: 'lbProduct', filter: { id: { eq: input.productId } }, limit: 1, select: ['id', 'name', 'description', 'category', 'isService', 'status', 'currency', 'attributes'] });
    if (!product.success || !product.result?.records.length) return { success: false, message: 'Product unavailable in your access' };
    const options = await this.findRecords.execute({ ...common, objectName: 'lbProductVariant', filter: { and: [{ productId: { eq: input.productId } }, { status: { eq: 'ACTIVE' } }] }, limit: 20, offset: input.offset, select: ['id', 'name', 'sku', 'attributes', 'unitAmountMinor', 'taxBasisPoints', 'tracksInventory'] });
    return { success: true, message: 'Product retrieved; selling options have a separate permission-checked result. Availability has not been checked.', result: { product: product.result.records[0], options }, recordReferences: product.recordReferences };
  }
}
