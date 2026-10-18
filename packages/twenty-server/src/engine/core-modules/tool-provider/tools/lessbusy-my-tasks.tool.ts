import { z } from 'zod';
import { ToolCategory } from 'twenty-shared/ai';
import { getWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { FindRecordsService } from 'src/engine/core-modules/record-crud/services/find-records.service';
import { DefineTool } from 'src/engine/core-modules/tool-provider/decorators/define-tool.decorator';
import { BaseTool } from 'src/engine/core-modules/tool-provider/interfaces/base-tool.interface';
import { type ToolProviderContext } from 'src/engine/core-modules/tool-provider/interfaces/tool-provider-context.type';
import { type ToolOutput } from 'src/engine/core-modules/tool/types/tool-output.type';

const inputSchema = z.object({ view: z.enum(['open', 'overdue', 'completed']).default('open'), limit: z.number().int().min(1).max(20).default(10) }).strict();

@DefineTool({ name: 'lessbusy_get_my_tasks', category: ToolCategory.ACTION, description: 'Read a bounded page of tasks assigned to the authenticated workspace member. Does not guess the assignee or accept another user ID. Overdue uses the current instant; no task is mutated.' })
export class LessBusyMyTasksTool extends BaseTool<typeof inputSchema> {
  readonly inputSchema = inputSchema;
  constructor(private readonly findRecords: FindRecordsService) { super(); }
  async execute(input: z.infer<typeof inputSchema>, context: ToolProviderContext): Promise<ToolOutput> {
    const authContext = context.authContext ?? getWorkspaceAuthContext();
    if (authContext.workspace.id !== context.workspaceId || authContext.type !== 'user') return { success: false, message: 'Personal tasks require the authenticated workspace member context' };
    return this.findRecords.execute({ objectName: 'task', filter: { and: [{ assigneeId: { eq: authContext.workspaceMemberId } }, { status: input.view === 'completed' ? { eq: 'DONE' } : { in: ['TODO', 'IN_PROGRESS'] } }, ...(input.view === 'overdue' ? [{ dueAt: { lt: new Date().toISOString() } }] : [])] }, limit: input.limit, select: ['id', 'title', 'status', 'dueAt'], shouldBuildEffectiveSelectFields: true, authContext, rolePermissionConfig: context.rolePermissionConfig });
  }
}
