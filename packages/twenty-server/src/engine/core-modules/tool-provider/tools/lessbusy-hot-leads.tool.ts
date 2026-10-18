import { z } from 'zod';
import { ToolCategory } from 'twenty-shared/ai';
import { getWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { FindRecordsService } from 'src/engine/core-modules/record-crud/services/find-records.service';
import { DefineTool } from 'src/engine/core-modules/tool-provider/decorators/define-tool.decorator';
import { BaseTool } from 'src/engine/core-modules/tool-provider/interfaces/base-tool.interface';
import { type ToolProviderContext } from 'src/engine/core-modules/tool-provider/interfaces/tool-provider-context.type';
import { type ToolOutput } from 'src/engine/core-modules/tool/types/tool-output.type';

const inputSchema = z.object({ limit: z.number().int().min(1).max(20).default(10) }).strict();

@DefineTool({ name: 'lessbusy_get_hot_leads', category: ToolCategory.ACTION, description: 'Find authorized leads explicitly classified HOT in this workspace. Does not guess buying readiness from a deal stage. Returns at most 20 records; no financial or customer-facing action is performed.' })
export class LessBusyHotLeadsTool extends BaseTool<typeof inputSchema> {
  readonly inputSchema = inputSchema;
  constructor(private readonly findRecords: FindRecordsService) { super(); }
  async execute(input: z.infer<typeof inputSchema>, context: ToolProviderContext): Promise<ToolOutput> {
    const authContext = context.authContext ?? getWorkspaceAuthContext();
    if (authContext.workspace.id !== context.workspaceId) return { success: false, message: 'Workspace context does not match' };
    return this.findRecords.execute({ objectName: 'lbLead', filter: { temperature: { eq: 'HOT' } }, limit: input.limit, select: ['id', 'name', 'temperature', 'recommendedAction', 'nextFollowUpAt'], shouldBuildEffectiveSelectFields: true, authContext, rolePermissionConfig: context.rolePermissionConfig });
  }
}
