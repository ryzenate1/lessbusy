import { z } from 'zod';
import { ToolCategory } from 'twenty-shared/ai';
import { getWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { DefineTool } from 'src/engine/core-modules/tool-provider/decorators/define-tool.decorator';
import { BaseTool } from 'src/engine/core-modules/tool-provider/interfaces/base-tool.interface';
import { type ToolProviderContext } from 'src/engine/core-modules/tool-provider/interfaces/tool-provider-context.type';
import { type ToolOutput } from 'src/engine/core-modules/tool/types/tool-output.type';
import { LessBusyInventoryService } from 'src/modules/lessbusy/services/lessbusy-inventory.service';

const inputSchema = z.object({ cursor: z.string().uuid().optional() }).strict();
@DefineTool({ name: 'lessbusy_get_low_stock', category: ToolCategory.ACTION, description: 'Check available stock against each authorized variant threshold. Scans at most 50 stock balances per call. If hasMore is true, continue with nextCursor; do not describe a partial batch as the complete inventory. Does not change stock.' })
export class LessBusyLowStockTool extends BaseTool<typeof inputSchema> {
  readonly inputSchema = inputSchema;
  constructor(private readonly inventory: LessBusyInventoryService) { super(); }
  async execute(input: z.infer<typeof inputSchema>, context: ToolProviderContext): Promise<ToolOutput> {
    const auth = context.authContext ?? getWorkspaceAuthContext();
    if (auth.workspace.id !== context.workspaceId) return { success: false, message: 'Workspace context does not match' };
    const result = await this.inventory.lowStock(auth, input.cursor, context.rolePermissionConfig);
    return { success: true, message: `Checked ${result.scanned} authorized stock balances. ${result.hasMore ? 'Continue with nextCursor to check the next batch.' : 'End of inventory reached.'}`, result };
  }
}
