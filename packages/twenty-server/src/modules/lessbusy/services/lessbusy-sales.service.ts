import { In } from 'typeorm';
import { type WorkspaceTransactionScope } from 'src/engine/twenty-orm/types/workspace-transaction-scope.type';
import { getBusinessDocumentIdentity } from 'src/modules/lessbusy/utils/get-business-document-identity.util';
import { getInvoiceSettlement } from 'src/modules/lessbusy/utils/get-invoice-settlement.util';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { calculateDocumentTotals, salesDocumentInputSchema } from 'src/modules/lessbusy/utils/calculate-document-totals.util';
import { isPostgresUniqueViolation } from 'src/modules/lessbusy/utils/is-postgres-unique-violation.util';
import { type BusinessInvoice } from 'src/modules/lessbusy/types/business-records.type';

const documentCommandSchema = z.object({ operationKey: z.string().uuid(), confirmed: z.literal(true), document: salesDocumentInputSchema }).strict();
const confirmSchema = z.object({ confirmed: z.literal(true), expectedVersion: z.number().int().nonnegative() }).strict();
const auditEvent = (action: string, actorId: string, details: Record<string, unknown> = {}) => ({ action, actorId, at: new Date().toISOString(), ...details });

@Injectable()
export class LessBusySalesService {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  private actor(auth: WorkspaceAuthContext) {
    if (auth.type !== 'user' || auth.agentId || auth.application || auth.viaApplication) throw new ForbiddenException('Sales document changes require an explicit workspace member action');
    return auth.workspaceMemberId;
  }

  private async validateProductOptions(lines: Array<{ variantId?: string }>, scope: WorkspaceTransactionScope) {
    const ids = [...new Set(lines.flatMap((line) => line.variantId ? [line.variantId] : []))];
    if (!ids.length) return;
    const options = await this.workspaceOrmManager.getRepositoryWithContextPermissions('lbProductVariant', scope).find({ where: { id: In(ids), status: 'ACTIVE' }, select: { id: true, productId: true }, take: 200 });
    if (options.length !== ids.length) throw new BadRequestException('Choose active product options available in your access');
    const productIds = [...new Set(options.map((option) => option.productId))];
    const products = await this.workspaceOrmManager.getRepositoryWithContextPermissions('lbProduct', scope).find({ where: { id: In(productIds), status: 'ACTIVE' }, select: { id: true }, take: 200 });
    if (products.length !== productIds.length) throw new BadRequestException('Activate the catalogue products before adding their options to a new draft');
  }

  async createDocument(auth: WorkspaceAuthContext, kind: 'invoice' | 'quotation' | 'order', input: unknown) {
    const actorId = this.actor(auth);
    const command = documentCommandSchema.parse(input);
    const document = calculateDocumentTotals(command.document);
    const requestHash = createHash('sha256').update(JSON.stringify(document)).digest('hex');
    const objectName = { invoice: 'lbInvoice', quotation: 'lbQuotation', order: 'lbSalesOrder' }[kind];
    try {
      return await this.workspaceOrmManager.executeInWorkspaceContext(() => this.workspaceOrmManager.runInWorkspaceTransaction(async (scope) => {
        const documents = this.workspaceOrmManager.getRepositoryWithContextPermissions(objectName, scope);
        const previous = await documents.findOne({ where: { operationKey: command.operationKey } });
        if (previous) {
          if (previous.requestHash !== requestHash) throw new ConflictException('Operation key already used with different document details');
          return previous;
        }
        const customer = await this.workspaceOrmManager.getRepositoryWithContextPermissions('person', scope).findOne({ where: { id: document.customerId }, select: { id: true, name: true } });
        if (!customer) throw new NotFoundException('Customer unavailable in this workspace');
        if (document.opportunityId) {
          const deal = await this.workspaceOrmManager.getRepositoryWithContextPermissions('opportunity', scope).findOne({ where: { id: document.opportunityId }, select: { id: true, pointOfContactId: true } });
          if (!deal || (deal.pointOfContactId && deal.pointOfContactId !== document.customerId)) throw new BadRequestException('Choose a deal linked to this customer');
        }
        await this.validateProductOptions(document.lines, scope);
        const id = randomUUID();
        const base = { id, name: `DRAFT-${id}`, operationKey: command.operationKey, requestHash, customerId: document.customerId, opportunityId: document.opportunityId ?? null, currency: document.currency, discountBasisPoints: document.discountBasisPoints, lines: document.lines, totals: document.totals, status: 'DRAFT', version: 0, auditEvents: [auditEvent('DRAFT_CREATED', actorId)] };
        await documents.insert(kind === 'invoice' ? { ...base, amountPaidMinor: '0', amountCreditedMinor: '0', amountRefundedMinor: '0', dueAt: document.dueAt ?? null } : kind === 'quotation' ? { ...base, validUntil: document.dueAt ?? null } : base);
        return documents.findOne({ where: { id } });
      }), auth);
    } catch (failure) {
      if (isPostgresUniqueViolation(failure)) throw new ConflictException('Operation key raced with another request; retry with the same key to review the recorded document');
      throw failure;
    }
  }

  async updateDraft(auth: WorkspaceAuthContext, invoiceId: string, input: unknown, kind: 'invoice' | 'quotation' | 'order' = 'invoice') {
    const actorId = this.actor(auth);
    const command = z.object({ confirmed: z.literal(true), expectedVersion: z.number().int().nonnegative(), document: salesDocumentInputSchema }).strict().parse(input);
    const document = calculateDocumentTotals(command.document);
    return this.workspaceOrmManager.executeInWorkspaceContext(() => this.workspaceOrmManager.runInWorkspaceTransaction(async (scope) => {
      const invoices = this.workspaceOrmManager.getRepositoryWithContextPermissions<BusinessInvoice>({ invoice: 'lbInvoice', quotation: 'lbQuotation', order: 'lbSalesOrder' }[kind], scope);
      const invoice = await invoices.findOne({ where: { id: invoiceId } });
      if (!invoice) throw new NotFoundException('Sales document unavailable');
      if (invoice.status !== 'DRAFT') throw new ConflictException('Only draft documents can be edited');
      if (!await this.workspaceOrmManager.getRepositoryWithContextPermissions('person', scope).findOne({ where: { id: document.customerId }, select: { id: true } })) throw new NotFoundException('Customer unavailable');
      if (document.opportunityId) {
        const deal = await this.workspaceOrmManager.getRepositoryWithContextPermissions('opportunity', scope).findOne({ where: { id: document.opportunityId }, select: { id: true, pointOfContactId: true } });
        if (!deal || (deal.pointOfContactId && deal.pointOfContactId !== document.customerId)) throw new BadRequestException('Choose a deal linked to this customer');
      }
      await this.validateProductOptions(document.lines, scope);
      const auditEvents = [...(invoice.auditEvents ?? []), auditEvent('DRAFT_UPDATED', actorId)];
      const changed = await invoices.update({ id: invoiceId, version: command.expectedVersion, status: 'DRAFT' }, { customerId: document.customerId, opportunityId: document.opportunityId ?? null, currency: document.currency, discountBasisPoints: document.discountBasisPoints, lines: document.lines, totals: document.totals, ...(kind === 'invoice' ? { dueAt: document.dueAt ?? null } : kind === 'quotation' ? { validUntil: document.dueAt ?? null } : {}), version: command.expectedVersion + 1, auditEvents });
      if (changed.affected !== 1) throw new ConflictException('Invoice changed; reopen it before editing');
      return invoices.findOne({ where: { id: invoiceId } });
    }), auth);
  }

  async getSalesDocument(auth: WorkspaceAuthContext, kind: 'quotation' | 'order', id: string) {
    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const document = await this.workspaceOrmManager.getRepositoryWithContextPermissions(kind === 'quotation' ? 'lbQuotation' : 'lbSalesOrder').findOne({ where: { id } });
      if (!document) throw new NotFoundException('Sales document unavailable');
      return document;
    }, auth);
  }

  async transitionDocument(auth: WorkspaceAuthContext, kind: 'quotation' | 'order', id: string, input: unknown) {
    const actorId = this.actor(auth);
    const command = z.object({ confirmed: z.literal(true), expectedVersion: z.number().int().nonnegative(), status: z.enum(['SENT', 'ACCEPTED', 'DECLINED', 'CONFIRMED', 'FULFILLED', 'CANCELLED']) }).strict().parse(input);
    const transitions: Record<string, string[]> = kind === 'quotation'
      ? { DRAFT: ['SENT', 'CANCELLED'], SENT: ['ACCEPTED', 'DECLINED', 'CANCELLED'] }
      : { DRAFT: ['CONFIRMED', 'CANCELLED'], CONFIRMED: ['FULFILLED', 'CANCELLED'] };
    return this.workspaceOrmManager.executeInWorkspaceContext(() => this.workspaceOrmManager.runInWorkspaceTransaction(async (scope) => {
      const documents = this.workspaceOrmManager.getRepositoryWithContextPermissions(kind === 'quotation' ? 'lbQuotation' : 'lbSalesOrder', scope);
      const document = await documents.findOne({ where: { id } });
      if (!document) throw new NotFoundException('Sales document unavailable');
      if (!transitions[String(document.status)]?.includes(command.status)) throw new ConflictException('This status change is not available for the current document');
      if (document.version !== command.expectedVersion) throw new ConflictException('Document changed; reload it before confirming');
      if (kind === 'order' && command.status === 'FULFILLED') {
        const lines = z.array(z.object({ variantId: z.string().uuid().optional() })).parse(document.lines);
        for (const line of lines) {
          if (!line.variantId) continue;
          const option = await this.workspaceOrmManager.getRepositoryWithContextPermissions('lbProductVariant', scope).findOne({ where: { id: line.variantId }, select: { id: true, tracksInventory: true } });
          if (!option) throw new NotFoundException('A product option is unavailable');
          if (option.tracksInventory) throw new ConflictException('Reserve and fulfill stock-tracked items through the order inventory actions');
        }
      }
      if (kind === 'order' && document.inventoryState === 'RESERVED' && ['FULFILLED', 'CANCELLED'].includes(command.status)) throw new ConflictException('Fulfill or release the linked inventory reservation before changing this status');
      if (kind === 'quotation' && command.status === 'ACCEPTED' && document.validUntil && new Date(document.validUntil).getTime() < Date.now()) throw new ConflictException('This quotation has expired; prepare a new quotation for review');
      if (!await this.workspaceOrmManager.getRepositoryWithContextPermissions('person', scope).findOne({ where: { id: document.customerId }, select: { id: true } })) throw new NotFoundException('Customer unavailable');
      let quotationSnapshots: Record<string, unknown> = {};
      if (kind === 'quotation' && command.status === 'SENT') {
        const profile = await this.workspaceOrmManager.getRepositoryWithContextPermissions('lbBusinessProfile', scope).findOne({ where: { profileKey: 'workspace' } });
        if (!profile) throw new BadRequestException('Complete business identity before issuing a quotation');
        const customer = await this.workspaceOrmManager.getRepositoryWithContextPermissions('person', scope).findOne({ where: { id: document.customerId }, select: { id: true, name: true, lbBillingName: true, lbBillingAddress: true, lbTaxIdentifiers: true } });
        if (!customer) throw new NotFoundException('Customer unavailable');
        quotationSnapshots = { businessIdentity: getBusinessDocumentIdentity(profile), customerSnapshot: { id: customer.id, name: customer.name, billingName: z.string().max(250).nullish().parse(customer.lbBillingName), address: z.string().max(2000).nullish().parse(customer.lbBillingAddress), taxIdentifiers: z.record(z.string().max(50), z.string().max(100)).nullish().parse(customer.lbTaxIdentifiers) ?? {} }, issuedAt: new Date().toISOString() };
      }
      const changed = await documents.update({ id, version: command.expectedVersion, status: document.status }, {
        status: command.status,
        ...quotationSnapshots,
        name: String(document.name).startsWith('DRAFT-') ? `${kind === 'quotation' ? 'QUO' : 'ORD'}-${id}` : document.name,
        version: command.expectedVersion + 1,
        auditEvents: [...(Array.isArray(document.auditEvents) ? document.auditEvents : []), auditEvent('STATUS_CHANGED', actorId, { from: document.status, to: command.status })],
      });
      if (changed.affected !== 1) throw new ConflictException('Document changed; reload it before confirming');
      return documents.findOne({ where: { id } });
    }), auth);
  }

  async finalize(auth: WorkspaceAuthContext, invoiceId: string, input: unknown) {
    const actorId = this.actor(auth);
    const command = confirmSchema.parse(input);
    try {
      return await this.workspaceOrmManager.executeInWorkspaceContext(() => this.workspaceOrmManager.runInWorkspaceTransaction(async (scope) => {
        const invoices = this.workspaceOrmManager.getRepositoryWithContextPermissions<BusinessInvoice>('lbInvoice', scope);
        const invoice = await invoices.findOne({ where: { id: invoiceId } });
        if (!invoice) throw new NotFoundException('Invoice unavailable');
        if (invoice.status !== 'DRAFT') throw new ConflictException('Only a draft invoice can be finalized');
        if (invoice.version !== command.expectedVersion) throw new ConflictException('Invoice changed; review the current draft');
        const profile = await this.workspaceOrmManager.getRepositoryWithContextPermissions('lbBusinessProfile', scope).findOne({ where: { profileKey: 'workspace' } });
        if (!profile) throw new BadRequestException('Complete your business identity before finalizing invoices');
        const businessIdentity = getBusinessDocumentIdentity(profile);
        if (profile.currency !== invoice.currency) throw new BadRequestException('Invoice currency must match the configured business currency');
        const customer = await this.workspaceOrmManager.getRepositoryWithContextPermissions('person', scope).findOne({ where: { id: invoice.customerId }, select: { id: true, name: true, lbBillingName: true, lbBillingAddress: true, lbTaxIdentifiers: true } });
        if (!customer) throw new NotFoundException('Customer unavailable');
        const sequences = this.workspaceOrmManager.getRepositoryWithContextPermissions('lbNumberSequence', scope);
        const year = new Date().getUTCFullYear();
        const sequenceKey = `invoice-${year}`;
        const sequence = await sequences.findOne({ where: { name: sequenceKey } });
        const nextValue = sequence ? z.number().int().positive().max(999999999).parse(sequence.nextValue) : 1;
        if (sequence) {
          const changed = await sequences.update({ id: sequence.id, version: sequence.version }, { nextValue: nextValue + 1, version: Number(sequence.version) + 1 });
          if (changed.affected !== 1) throw new ConflictException('Invoice numbering changed; retry finalization');
        } else {
          await sequences.insert({ id: randomUUID(), name: sequenceKey, nextValue: 2, version: 0 });
        }
        const prefix = z.string().regex(/^[A-Z0-9-]{1,16}$/).parse(profile.invoicePrefix || 'INV');
        const name = `${prefix}-${year}-${String(nextValue).padStart(6, '0')}`;
        const finalizedAt = new Date().toISOString();
        const auditEvents = [...(invoice.auditEvents ?? []), auditEvent('FINALIZED', actorId, { name })];
        const changed = await invoices.update({ id: invoiceId, version: command.expectedVersion, status: 'DRAFT' }, { name, status: 'FINALIZED', businessIdentity, customerSnapshot: { id: customer.id, name: customer.name, billingName: z.string().trim().max(250).nullish().parse(customer.lbBillingName) ?? null, address: z.string().trim().max(2000).nullish().parse(customer.lbBillingAddress) ?? null, taxIdentifiers: z.record(z.string().max(50), z.string().max(100)).nullish().parse(customer.lbTaxIdentifiers) ?? {} }, finalizedAt, version: command.expectedVersion + 1, auditEvents });
        if (changed.affected !== 1) throw new ConflictException('Invoice changed; review the current draft');
        return invoices.findOne({ where: { id: invoiceId } });
      }), auth);
    } catch (failure) {
      if (isPostgresUniqueViolation(failure)) throw new ConflictException('Invoice numbering raced with another finalization; retry with the same confirmation to take the next number');
      throw failure;
    }
  }

  async recordPayment(auth: WorkspaceAuthContext, invoiceId: string, input: unknown) {
    const actorId = this.actor(auth);
    const command = z.object({ operationKey: z.string().uuid(), confirmed: z.literal(true), amountMinor: z.string().regex(/^[1-9]\d{0,20}$/), method: z.enum(['CASH', 'BANK_TRANSFER', 'CARD', 'UPI', 'OTHER']), reference: z.string().trim().max(250).optional(), receivedAt: z.string().datetime({ offset: true }) }).strict().parse(input);
    const requestHash = createHash('sha256').update(JSON.stringify({ invoiceId, ...command })).digest('hex');
    try {
      return await this.workspaceOrmManager.executeInWorkspaceContext(() => this.workspaceOrmManager.runInWorkspaceTransaction(async (scope) => {
        const payments = this.workspaceOrmManager.getRepositoryWithContextPermissions('lbPayment', scope);
        const previous = await payments.findOne({ where: { operationKey: command.operationKey } });
        if (previous) {
          if (previous.requestHash !== requestHash) throw new ConflictException('Payment operation key already used with different details');
          return previous;
        }
        const invoices = this.workspaceOrmManager.getRepositoryWithContextPermissions<BusinessInvoice>('lbInvoice', scope);
        const invoice = await invoices.findOne({ where: { id: invoiceId } });
        if (!invoice) throw new NotFoundException('Invoice unavailable');
        if (!['FINALIZED', 'PART_PAID'].includes(invoice.status)) throw new ConflictException('Payment requires an unpaid finalized invoice');
        const settlement = getInvoiceSettlement(invoice);
        if (BigInt(command.amountMinor) > settlement.outstanding) throw new BadRequestException('Payment exceeds the outstanding invoice balance');
        const paid = settlement.paid + BigInt(command.amountMinor);
        const status = getInvoiceSettlement({ ...invoice, amountPaidMinor: paid.toString() }).status;
        const paymentId = randomUUID();
        const auditEvents = [...(invoice.auditEvents ?? []), auditEvent('PAYMENT_RECORDED', actorId, { paymentId, amountMinor: command.amountMinor })];
        const changed = await invoices.update({ id: invoiceId, version: invoice.version }, { amountPaidMinor: paid.toString(), status, version: invoice.version + 1, auditEvents });
        if (changed.affected !== 1) throw new ConflictException('Invoice balance changed; retry with the same operation key');
        await payments.insert({ id: paymentId, name: `${invoice.name} payment`, invoiceId, operationKey: command.operationKey, requestHash, amountMinor: command.amountMinor, currency: invoice.currency, method: command.method, reference: command.reference ?? null, receivedAt: command.receivedAt, actorId });
        return payments.findOne({ where: { id: paymentId } });
      }), auth);
    } catch (failure) {
      if (isPostgresUniqueViolation(failure)) throw new ConflictException('Payment key raced with another request; retry with the same key to review the recorded payment');
      throw failure;
    }
  }

  async cancel(auth: WorkspaceAuthContext, invoiceId: string, input: unknown) {
    const actorId = this.actor(auth);
    const command = z.object({ confirmed: z.literal(true), expectedVersion: z.number().int().nonnegative(), reason: z.string().trim().min(3).max(1000) }).strict().parse(input);
    return this.workspaceOrmManager.executeInWorkspaceContext(() => this.workspaceOrmManager.runInWorkspaceTransaction(async (scope) => {
      const invoices = this.workspaceOrmManager.getRepositoryWithContextPermissions<BusinessInvoice>('lbInvoice', scope);
      const invoice = await invoices.findOne({ where: { id: invoiceId } });
      if (!invoice) throw new NotFoundException('Invoice unavailable');
      if (invoice.status === 'CANCELLED') return invoice;
      if (invoice.status !== 'DRAFT') await this.workspaceOrmManager.getRepositoryWithContextPermissions('lbPayment', scope).find({ take: 1, select: { id: true } });
      if (BigInt(invoice.amountCreditedMinor ?? '0') !== BigInt(0) || BigInt(invoice.amountRefundedMinor ?? '0') !== BigInt(0)) throw new ConflictException('Invoices with adjustments retain their correction history and cannot be cancelled');
      if (BigInt(invoice.amountPaidMinor) !== BigInt(0)) throw new ConflictException('Invoices with payments require a credit/refund workflow before cancellation');
      const changed = await invoices.update({ id: invoiceId, version: command.expectedVersion }, { status: 'CANCELLED', cancellationReason: command.reason, version: command.expectedVersion + 1, auditEvents: [...(invoice.auditEvents ?? []), auditEvent('CANCELLED', actorId, { reason: command.reason })] });
      if (changed.affected !== 1) throw new ConflictException('Invoice changed; review it before cancellation');
      return invoices.findOne({ where: { id: invoiceId } });
    }), auth);
  }

  async getInvoice(auth: WorkspaceAuthContext, invoiceId: string) {
    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const invoice = await this.workspaceOrmManager.getRepositoryWithContextPermissions<BusinessInvoice>('lbInvoice').findOne({ where: { id: invoiceId } });
      if (!invoice) throw new NotFoundException('Invoice unavailable');
      return invoice;
    }, auth);
  }
}
