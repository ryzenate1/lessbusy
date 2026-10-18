import { LessBusyDealsService } from 'src/modules/lessbusy/services/lessbusy-deals.service';
import { LessBusyStockTransferService } from 'src/modules/lessbusy/services/lessbusy-stock-transfer.service';
import { LessBusyCustomersService } from 'src/modules/lessbusy/services/lessbusy-customers.service';
import { LessBusyWorkspaceGuard } from 'src/modules/lessbusy/controllers/lessbusy-workspace.guard';
import { LessBusyTasksService } from 'src/modules/lessbusy/services/lessbusy-tasks.service';
import { LessBusyStockExpiryService } from 'src/modules/lessbusy/services/lessbusy-stock-expiry.service';
import { LessBusyChatwootConnectionStore } from 'src/modules/lessbusy/chatwoot/lessbusy-chatwoot-connection.store';
import { LessBusySalesReportService } from 'src/modules/lessbusy/services/lessbusy-sales-report.service';
import { LessBusyInvoiceAdjustmentsService } from 'src/modules/lessbusy/services/lessbusy-invoice-adjustments.service';
import { LessBusyOrderInventoryService } from 'src/modules/lessbusy/services/lessbusy-order-inventory.service';
import { LessBusySalesConversionService } from 'src/modules/lessbusy/services/lessbusy-sales-conversion.service';
import { LessBusyCatalogueService } from 'src/modules/lessbusy/services/lessbusy-catalogue.service';
import { LessBusyLeadsService } from 'src/modules/lessbusy/services/lessbusy-leads.service';
import { Body, ConflictException, Controller, Get, Param, ParseUUIDPipe, Post, Query, Put, Res, UseFilters, UseGuards } from '@nestjs/common';
import { type Response } from 'express';
import { z } from 'zod';
import { LessBusyChatwootService } from 'src/modules/lessbusy/chatwoot/lessbusy-chatwoot.service';
import { ApiPath } from 'twenty-shared/types';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { getWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { AuthRestApiExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-rest-api-exception.filter';
import { PermissionsRestApiExceptionFilter } from 'src/engine/metadata-modules/permissions/utils/permissions-rest-api-exception.filter';
import { LessBusyInventoryService } from 'src/modules/lessbusy/services/lessbusy-inventory.service';
import { LessBusySalesService } from 'src/modules/lessbusy/services/lessbusy-sales.service';
import { BusinessInputFilter } from 'src/modules/lessbusy/filters/business-input.filter';
import { renderInvoicePdf } from 'src/modules/lessbusy/utils/render-invoice-pdf.util';

@Controller(`${ApiPath.App}/lessbusy`)
@UseGuards(JwtAuthGuard, AuthPrincipalGuard({ userSession: { standard: true, impersonated: false, playground: false, workspaceAgnostic: false }, apiKey: false, oauthClient: false, application: false }), LessBusyWorkspaceGuard)
@UseFilters(BusinessInputFilter, PermissionsRestApiExceptionFilter, AuthRestApiExceptionFilter)
export class LessBusyBusinessController {
  constructor(private readonly deals: LessBusyDealsService, private readonly stockTransfers: LessBusyStockTransferService, private readonly customers: LessBusyCustomersService, private readonly tasks: LessBusyTasksService, private readonly stockExpiry: LessBusyStockExpiryService, private readonly connectionSettings: LessBusyChatwootConnectionStore, private readonly salesReports: LessBusySalesReportService, private readonly invoiceAdjustments: LessBusyInvoiceAdjustmentsService, private readonly orderInventory: LessBusyOrderInventoryService, private readonly conversions: LessBusySalesConversionService, private readonly catalogue: LessBusyCatalogueService, private readonly leads: LessBusyLeadsService, private readonly inventory: LessBusyInventoryService, private readonly sales: LessBusySalesService, private readonly chatwoot: LessBusyChatwootService) {}

  @Post('customers/import')
  importCustomer(@Body() body: unknown) { return this.customers.importOne(getWorkspaceAuthContext(), body); }

  @Post('customers/bulk')
  bulkCustomers(@Body() body: unknown) { return this.customers.bulk(getWorkspaceAuthContext(), body); }

  @Post('tasks/:id/reminder')
  taskReminder(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) { return this.tasks.reminder(getWorkspaceAuthContext(), id, body); }

  @Put('deals/:id/pipeline')
  updateDealPipeline(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) { return this.deals.updatePipeline(getWorkspaceAuthContext(), id, body); }

  @Post('tasks')
  createTask(@Body() body: unknown) { return this.tasks.create(getWorkspaceAuthContext(), body); }

  @Get('reports/sales')
  salesReport(@Query('from') from: string, @Query('to') to: string, @Query('cursor') cursor?: string) { return this.salesReports.batch(getWorkspaceAuthContext(), { from, to, ...(cursor ? { cursor } : {}) }); }

  @Get('products/export')
  exportCatalogue(@Query('cursor') cursor?: string, @Query('includeCost') includeCost = 'false') { return this.catalogue.exportBatch(getWorkspaceAuthContext(), { ...(cursor ? { cursor } : {}), includeCost: z.enum(['true', 'false']).parse(includeCost) === 'true' }); }

  @Get('products/:id')
  product(@Param('id', ParseUUIDPipe) id: string) { return this.catalogue.get(getWorkspaceAuthContext(), id); }

  @Post('products')
  createProduct(@Body() body: unknown) { return this.catalogue.save(getWorkspaceAuthContext(), null, body); }

  @Put('products/:id')
  updateProduct(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) { return this.catalogue.save(getWorkspaceAuthContext(), id, body); }

  @Get('leads/:id')
  getLead(@Param('id', ParseUUIDPipe) id: string) { return this.leads.get(getWorkspaceAuthContext(), id); }

  @Post('leads')
  createLead(@Body() body: unknown) { return this.leads.save(getWorkspaceAuthContext(), null, body); }

  @Put('leads/:id')
  reviewLead(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) { return this.leads.save(getWorkspaceAuthContext(), id, body); }

  @Post('leads/:id/convert')
  leadToDeal(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) { return this.leads.convertToDeal(getWorkspaceAuthContext(), id, body); }

  @Post('leads/:id/follow-up')
  leadFollowUp(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) { return this.leads.followUp(getWorkspaceAuthContext(), id, body); }

  @Get('chatwoot/settings')
  chatwootSettings() { return this.connectionSettings.settings(getWorkspaceAuthContext()); }

  @Get('chatwoot/settings/activity')
  chatwootActivity() { return this.connectionSettings.syncActivity(getWorkspaceAuthContext()); }

  @Get('chatwoot/settings/health')
  chatwootAdminHealth() { return this.chatwoot.adminHealth(getWorkspaceAuthContext()); }

  @Put('chatwoot/settings')
  saveChatwootSettings(@Body() body: unknown) { return this.connectionSettings.save(getWorkspaceAuthContext(), body); }

  @Get('chatwoot/status')
  chatwootStatus() { return this.chatwoot.status(getWorkspaceAuthContext()); }

  @Get('chatwoot/conversations')
  conversations(@Query('page') page = '1', @Query('view') view = 'all') { return this.chatwoot.list(getWorkspaceAuthContext(), z.coerce.number().int().min(1).max(10000).parse(page), z.enum(['all', 'awaiting_business', 'human', 'resolved']).parse(view)); }

  @Get('chatwoot/conversations/:id/messages')
  messages(@Param('id') id: string, @Query('before') before?: string) { return this.chatwoot.messages(getWorkspaceAuthContext(), z.coerce.number().int().positive().safe().parse(id), before ? z.coerce.number().int().positive().safe().parse(before) : undefined); }

  @Get('chatwoot/conversations/:id/crm')
  crmLink(@Param('id') id: string) { return this.chatwoot.crmLink(getWorkspaceAuthContext(), z.coerce.number().int().positive().safe().parse(id)); }

  @Put('chatwoot/conversations/:id/crm')
  updateCrmLink(@Param('id') id: string, @Body() body: unknown) { return this.chatwoot.updateCrmLink(getWorkspaceAuthContext(), z.coerce.number().int().positive().safe().parse(id), body); }

  @Post('chatwoot/conversations/:id/customer')
  conversationCustomer(@Param('id') id: string, @Body() body: unknown) { return this.chatwoot.createCustomer(getWorkspaceAuthContext(), z.coerce.number().int().positive().safe().parse(id), body); }

  @Post('chatwoot/conversations/:id/handoff')
  handoff(@Param('id') id: string, @Body() body: unknown) { z.object({ confirmed: z.literal(true) }).strict().parse(body); return this.chatwoot.handoff(getWorkspaceAuthContext(), z.coerce.number().int().positive().safe().parse(id)); }

  @Get('inventory/low-stock')
  lowStock(@Query('cursor') cursor?: string) { return this.inventory.lowStock(getWorkspaceAuthContext(), cursor); }

  @Post('inventory/balances')
  createBalance(@Body() body: unknown) { return this.inventory.createBalance(getWorkspaceAuthContext(), body); }

  @Post('inventory/expire-reservations')
  releaseExpiredReservations(@Body() body: unknown) { return this.stockExpiry.release(getWorkspaceAuthContext(), body); }

  @Post('inventory/transfers')
  transferStock(@Body() body: unknown) { return this.stockTransfers.transfer(getWorkspaceAuthContext(), body); }

  @Post('inventory/actions')
  updateStock(@Body() body: unknown) { return this.inventory.execute(getWorkspaceAuthContext(), body); }

  @Post('invoices')
  createInvoice(@Body() body: unknown) { return this.sales.createDocument(getWorkspaceAuthContext(), 'invoice', body); }

  @Post('quotations')
  createQuotation(@Body() body: unknown) { return this.sales.createDocument(getWorkspaceAuthContext(), 'quotation', body); }

  @Post('orders')
  createOrder(@Body() body: unknown) { return this.sales.createDocument(getWorkspaceAuthContext(), 'order', body); }

  @Post('orders/:id/inventory')
  orderStock(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) { return this.orderInventory.execute(getWorkspaceAuthContext(), id, body); }

  @Post('quotations/:id/convert')
  quotationToOrder(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) { return this.conversions.convert(getWorkspaceAuthContext(), 'quotation', id, body); }

  @Post('orders/:id/convert')
  orderToInvoice(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) { return this.conversions.convert(getWorkspaceAuthContext(), 'order', id, body); }

  @Get('quotations/:id/pdf')
  async quotationPdf(@Param('id', ParseUUIDPipe) id: string, @Query('inline') inline: string | undefined, @Res() response: Response) {
    const source = await this.sales.getSalesDocument(getWorkspaceAuthContext(), 'quotation', id);
    if (source.status === 'DRAFT' || !source.issuedAt || !source.businessIdentity || !source.customerSnapshot) throw new ConflictException('Issue the quotation before downloading its PDF');
    const quotation = z.object({ name: z.string(), customerId: z.string().uuid(), currency: z.string(), lines: z.unknown(), totals: z.object({ subtotalMinor: z.string(), discountMinor: z.string(), taxMinor: z.string(), totalMinor: z.string() }), businessIdentity: z.unknown(), customerSnapshot: z.unknown(), validUntil: z.string().nullable(), issuedAt: z.string() }).parse(source);
    const buffer = await renderInvoicePdf({ name: quotation.name, customerId: quotation.customerId, currency: quotation.currency, lines: quotation.lines, totals: quotation.totals, businessIdentity: quotation.businessIdentity, customerSnapshot: quotation.customerSnapshot, status: source.status === 'CANCELLED' ? 'CANCELLED' : 'FINALIZED', amountPaidMinor: '0', dueAt: quotation.validUntil, finalizedAt: quotation.issuedAt }, { label: 'QUOTATION', showPayments: false, dueLabel: 'Valid until' });
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `${inline === 'true' ? 'inline' : 'attachment'}; filename="${quotation.name.replace(/[^a-zA-Z0-9-]/g, '')}.pdf"`);
    response.setHeader('Cache-Control', 'private, no-store');
    response.send(buffer);
  }

  @Get('quotations/:id')
  getQuotation(@Param('id', ParseUUIDPipe) id: string) { return this.sales.getSalesDocument(getWorkspaceAuthContext(), 'quotation', id); }

  @Get('orders/:id')
  getOrder(@Param('id', ParseUUIDPipe) id: string) { return this.sales.getSalesDocument(getWorkspaceAuthContext(), 'order', id); }

  @Put('quotations/:id/draft')
  editQuotation(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) { return this.sales.updateDraft(getWorkspaceAuthContext(), id, body, 'quotation'); }

  @Put('orders/:id/draft')
  editOrder(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) { return this.sales.updateDraft(getWorkspaceAuthContext(), id, body, 'order'); }

  @Post('quotations/:id/status')
  quotationStatus(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) { return this.sales.transitionDocument(getWorkspaceAuthContext(), 'quotation', id, body); }

  @Post('orders/:id/status')
  orderStatus(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) { return this.sales.transitionDocument(getWorkspaceAuthContext(), 'order', id, body); }

  @Put('invoices/:id/draft')
  editDraft(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) { return this.sales.updateDraft(getWorkspaceAuthContext(), id, body); }

  @Post('invoices/:id/finalize')
  finalize(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) { return this.sales.finalize(getWorkspaceAuthContext(), id, body); }

  @Post('invoices/:id/payments')
  payment(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) { return this.sales.recordPayment(getWorkspaceAuthContext(), id, body); }

  @Get('invoices/:id/adjustments')
  adjustments(@Param('id', ParseUUIDPipe) id: string, @Query('kind') kind: string, @Query('cursor') cursor?: string) { return this.invoiceAdjustments.list(getWorkspaceAuthContext(), id, z.enum(['credit', 'refund']).parse(kind), cursor); }

  @Post('invoices/:id/credits')
  credit(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) { return this.invoiceAdjustments.record(getWorkspaceAuthContext(), id, 'credit', body); }

  @Post('invoices/:id/refunds')
  refund(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) { return this.invoiceAdjustments.record(getWorkspaceAuthContext(), id, 'refund', body); }

  @Post('invoices/:id/cancel')
  cancel(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) { return this.sales.cancel(getWorkspaceAuthContext(), id, body); }

  @Get('invoices/:id')
  getInvoice(@Param('id', ParseUUIDPipe) id: string) { return this.sales.getInvoice(getWorkspaceAuthContext(), id); }

  @Get('invoices/:id/pdf')
  async pdf(@Param('id', ParseUUIDPipe) id: string, @Query('inline') inline: string | undefined, @Res() response: Response) {
    const invoice = await this.sales.getInvoice(getWorkspaceAuthContext(), id);
    if (invoice.status === 'DRAFT') throw new ConflictException('Finalize the invoice before downloading its official PDF');
    const buffer = await renderInvoicePdf(invoice);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `${inline === 'true' ? 'inline' : 'attachment'}; filename="${invoice.name.replace(/[^a-zA-Z0-9-]/g, '')}.pdf"`);
    response.setHeader('Cache-Control', 'private, no-store');
    response.send(buffer);
  }
}
