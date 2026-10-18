import { z } from 'zod';
import { ToolCategory } from 'twenty-shared/ai';
import { getWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { CommonApiContextBuilderService } from 'src/engine/core-modules/record-crud/services/common-api-context-builder.service';
import { DefineTool } from 'src/engine/core-modules/tool-provider/decorators/define-tool.decorator';
import { BaseTool } from 'src/engine/core-modules/tool-provider/interfaces/base-tool.interface';
import { type ToolProviderContext } from 'src/engine/core-modules/tool-provider/interfaces/tool-provider-context.type';
import { type ToolOutput } from 'src/engine/core-modules/tool/types/tool-output.type';

const DESTINATIONS = {
  overview: null, integrations: null, reports: 'lbInvoice', 'create-invoice': 'lbInvoice', 'create-quotation': 'lbQuotation', 'create-order': 'lbSalesOrder', 'create-product': 'lbProduct', 'create-task': 'task',
  customers: 'person', companies: 'company', deals: 'opportunity', tasks: 'task', notes: 'note',
  leads: 'lbLead', 'hot-leads': 'lbLead', products: 'lbProduct', variants: 'lbProductVariant',
  'stock-locations': 'lbWarehouse', inventory: 'lbStockBalance', 'low-stock': 'lbStockBalance', invoices: 'lbInvoice', 'unpaid-invoices': 'lbInvoice', orders: 'lbSalesOrder', quotations: 'lbQuotation',
  'business-settings': 'lbBusinessProfile',
} as const;
const inputSchema = z.object({ destination: z.enum(Object.keys(DESTINATIONS) as [keyof typeof DESTINATIONS, ...Array<keyof typeof DESTINATIONS>]) }).strict();

@DefineTool({ name: 'lessbusy_find_destination', category: ToolCategory.ACTION, description: 'Find a registered LessBusy page the current user is allowed to read. Returns a user-clickable navigation action. Use for where-to questions; never invent URLs. Missing business modules must be installed before they can be opened.' })
export class LessBusyFindDestinationTool extends BaseTool<typeof inputSchema> {
  readonly inputSchema = inputSchema;
  constructor(private readonly contextBuilder: CommonApiContextBuilderService) { super(); }

  async execute(input: z.infer<typeof inputSchema>, context: ToolProviderContext): Promise<ToolOutput> {
    const authContext = context.authContext ?? getWorkspaceAuthContext();
    if (authContext.workspace.id !== context.workspaceId) return { success: false, message: 'Workspace context does not match' };
    const objectName = DESTINATIONS[input.destination];
    if (objectName) {
      await this.contextBuilder.build({ authContext, objectName, rolePermissionConfig: context.rolePermissionConfig });
    }
    return { success: true, message: 'Open the registered page when you are ready.', result: { lessbusyNavigation: { destination: input.destination, workspaceId: context.workspaceId } } };
  }
}
