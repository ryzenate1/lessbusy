import { z } from 'zod';
import { ToolCategory } from 'twenty-shared/ai';
import { getWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { FindRecordsService } from 'src/engine/core-modules/record-crud/services/find-records.service';
import { DefineTool } from 'src/engine/core-modules/tool-provider/decorators/define-tool.decorator';
import { BaseTool } from 'src/engine/core-modules/tool-provider/interfaces/base-tool.interface';
import { type ToolProviderContext } from 'src/engine/core-modules/tool-provider/interfaces/tool-provider-context.type';
import { type ToolOutput } from 'src/engine/core-modules/tool/types/tool-output.type';

const inputSchema = z.object({ variantId: z.string().uuid(), warehouseId: z.string().uuid().optional(), offset: z.number().int().min(0).max(1000).default(0) }).strict();
@DefineTool({ name: 'lessbusy_check_stock', category: ToolCategory.ACTION, description: 'Check authoritative permitted stock balances for an exact product option, optionally at a location. Available units are computed by the server as on hand minus reserved. Bounded to 20 readable locations per page, timestamped, and never a stock reservation or promise of future availability. An absent balance is not proof of zero global stock.' })
export class LessBusyCheckStockTool extends BaseTool<typeof inputSchema> {
  readonly inputSchema = inputSchema;
  constructor(private readonly findRecords: FindRecordsService) { super(); }
  async execute(input: z.infer<typeof inputSchema>, context: ToolProviderContext): Promise<ToolOutput> {
    const authContext = context.authContext ?? getWorkspaceAuthContext();
    if (authContext.workspace.id !== context.workspaceId) return { success: false, message: 'Workspace context does not match' };
    const common = { authContext, rolePermissionConfig: context.rolePermissionConfig, shouldBuildEffectiveSelectFields: true };
    const variant = await this.findRecords.execute({ ...common, objectName: 'lbProductVariant', filter: { id: { eq: input.variantId } }, limit: 1, select: ['id', 'name', 'sku', 'tracksInventory', 'status'] });
    if (!variant.success || !variant.result?.records.length) return { success: false, message: 'Product option unavailable in your access' };
    const result = await this.findRecords.execute({ ...common, objectName: 'lbStockBalance', filter: { and: [{ variantId: { eq: input.variantId } }, ...(input.warehouseId ? [{ warehouseId: { eq: input.warehouseId } }] : [])] }, limit: 20, offset: input.offset, select: ['id', 'name', 'onHandUnits', 'reservedUnits', 'warehouseId'] });
    if (!result.success || !result.result) return result;
    const balanceSchema = z.object({ id: z.string().uuid(), name: z.string().nullable(), onHandUnits: z.number().int().nonnegative().safe(), reservedUnits: z.number().int().nonnegative().safe(), warehouseId: z.string().uuid() });
    const balances = result.result.records.flatMap((record) => { const parsed = balanceSchema.safeParse(record); return parsed.success && parsed.data.reservedUnits <= parsed.data.onHandUnits ? [{ ...parsed.data, availableUnits: parsed.data.onHandUnits - parsed.data.reservedUnits }] : []; });
    return { success: true, message: 'Stock read without mutation. Missing balance quantities are not inferred.', result: { variant: variant.result.records[0], balances, unavailableBalances: result.result.records.length - balances.length, hasNextPage: result.result.hasNextPage, asOf: new Date().toISOString() }, recordReferences: result.recordReferences };
  }
}
