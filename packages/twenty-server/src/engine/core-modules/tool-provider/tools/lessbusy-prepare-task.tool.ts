import { z } from 'zod';
import { ToolCategory } from 'twenty-shared/ai';
import { getWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { CommonApiContextBuilderService } from 'src/engine/core-modules/record-crud/services/common-api-context-builder.service';
import { FindRecordsService } from 'src/engine/core-modules/record-crud/services/find-records.service';
import { DefineTool } from 'src/engine/core-modules/tool-provider/decorators/define-tool.decorator';
import { BaseTool } from 'src/engine/core-modules/tool-provider/interfaces/base-tool.interface';
import { type ToolProviderContext } from 'src/engine/core-modules/tool-provider/interfaces/tool-provider-context.type';
import { type ToolOutput } from 'src/engine/core-modules/tool/types/tool-output.type';

const inputSchema = z.object({ task: z.object({ title: z.string().min(1).max(250), description: z.string().max(10000).default(''), priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).default('NORMAL'), dueAt: z.string().datetime({ offset: true }).optional(), customerId: z.string().uuid().optional(), opportunityId: z.string().uuid().optional() }).strict() }).strict();

@DefineTool({ name: 'lessbusy_prepare_task', category: ToolCategory.ACTION, description: 'Prepare a follow-up task proposal for human review. This does not create, assign, send reminders or mutate records. The user must open the review form and explicitly confirm; the review form defaults to that user and permits an authorized employee assignment.' })
export class LessBusyPrepareTaskTool extends BaseTool<typeof inputSchema> {
  readonly inputSchema = inputSchema;
  constructor(private readonly contextBuilder: CommonApiContextBuilderService, private readonly findRecords: FindRecordsService) { super(); }

  async execute(input: z.infer<typeof inputSchema>, context: ToolProviderContext): Promise<ToolOutput> {
    const authContext = context.authContext ?? getWorkspaceAuthContext();
    if (authContext.workspace.id !== context.workspaceId) return { success: false, message: 'Workspace context does not match' };
    await this.contextBuilder.build({ authContext, objectName: 'task', rolePermissionConfig: context.rolePermissionConfig });
    for (const [objectName, id] of [['person', input.task.customerId], ['opportunity', input.task.opportunityId]]) {
      if (!id) continue;
      const record = await this.findRecords.execute({ objectName: objectName!, filter: { id: { eq: id } }, select: ['id'], limit: 1, shouldBuildEffectiveSelectFields: true, authContext, rolePermissionConfig: context.rolePermissionConfig });
      if (!record.success || !record.result?.records.length) return { success: false, message: 'A related record is unavailable in your access' };
    }
    return { success: true, message: 'Task proposal prepared. Ask the user to review and confirm before creation.', result: { lessbusyTaskProposal: { workspaceId: context.workspaceId, task: input.task } } };
  }
}
