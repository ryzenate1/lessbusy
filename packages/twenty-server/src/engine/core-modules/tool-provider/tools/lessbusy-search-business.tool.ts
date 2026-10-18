import { z } from 'zod';
import { ToolCategory } from 'twenty-shared/ai';
import { escapeForIlike } from 'twenty-shared/utils';
import { getWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { FindRecordsService } from 'src/engine/core-modules/record-crud/services/find-records.service';
import { DefineTool } from 'src/engine/core-modules/tool-provider/decorators/define-tool.decorator';
import { BaseTool } from 'src/engine/core-modules/tool-provider/interfaces/base-tool.interface';
import { type ToolProviderContext } from 'src/engine/core-modules/tool-provider/interfaces/tool-provider-context.type';
import { type ToolOutput } from 'src/engine/core-modules/tool/types/tool-output.type';

const inputSchema = z.object({ kind: z.enum(['customers', 'products', 'deals', 'invoices']), query: z.string().trim().min(1).max(150), limit: z.number().int().min(1).max(20).default(10), offset: z.number().int().min(0).max(1000).default(0) }).strict();
@DefineTool({ name: 'lessbusy_search_business', category: ToolCategory.ACTION, description: 'Search names of authorized customers, products, deals or invoices in the current workspace. Returns minimal record references and at most 20 matches per page. Customer search uses first/last names without exposing contact details. Product search does not include costs. These are stored records, not a prediction or a complete business report.' })
export class LessBusySearchBusinessTool extends BaseTool<typeof inputSchema> {
  readonly inputSchema = inputSchema;
  constructor(private readonly findRecords: FindRecordsService) { super(); }
  async execute(input: z.infer<typeof inputSchema>, context: ToolProviderContext): Promise<ToolOutput> {
    const authContext = context.authContext ?? getWorkspaceAuthContext();
    if (authContext.workspace.id !== context.workspaceId) return { success: false, message: 'Workspace context does not match' };
    const definitions = { customers: { name: 'person', select: ['id', 'name'] }, products: { name: 'lbProduct', select: ['id', 'name', 'category', 'isService', 'status', 'currency'] }, deals: { name: 'opportunity', select: ['id', 'name', 'stage', 'closeDate'] }, invoices: { name: 'lbInvoice', select: ['id', 'name', 'status', 'currency', 'dueAt'] } };
    const definition = definitions[input.kind]; const pattern = `%${escapeForIlike(input.query)}%`;
    return this.findRecords.execute({ objectName: definition.name, filter: input.kind === 'customers' ? { or: [{ name: { firstName: { ilike: pattern } } }, { name: { lastName: { ilike: pattern } } }] } : { name: { ilike: pattern } }, limit: input.limit, offset: input.offset, select: definition.select, shouldBuildEffectiveSelectFields: true, authContext, rolePermissionConfig: context.rolePermissionConfig });
  }
}
