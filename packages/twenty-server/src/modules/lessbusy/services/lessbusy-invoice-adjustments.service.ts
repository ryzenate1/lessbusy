import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { MoreThan } from 'typeorm';
import { z } from 'zod';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { type BusinessInvoice } from 'src/modules/lessbusy/types/business-records.type';
import { getInvoiceSettlement } from 'src/modules/lessbusy/utils/get-invoice-settlement.util';
import { isPostgresUniqueViolation } from 'src/modules/lessbusy/utils/is-postgres-unique-violation.util';

@Injectable()
export class LessBusyInvoiceAdjustmentsService {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  async list(auth: WorkspaceAuthContext, invoiceId: string, kind: 'credit' | 'refund', cursor?: string) {
    if (cursor) z.string().uuid().parse(cursor);
    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const invoice = await this.workspaceOrmManager.getRepositoryWithContextPermissions('lbInvoice').findOne({ where: { id: invoiceId }, select: { id: true } });
      if (!invoice) throw new NotFoundException('Invoice unavailable');
      const records = await this.workspaceOrmManager.getRepositoryWithContextPermissions(kind === 'credit' ? 'lbCreditAdjustment' : 'lbRefund').find({ where: { invoiceId, ...(cursor ? { id: MoreThan(cursor) } : {}) }, order: { id: 'ASC' }, take: 26, select: { id: true, name: true, amountMinor: true, currency: true, reason: true, recordedAt: true } });
      const visible = records.slice(0, 25);
      return { records: visible, hasMore: records.length > 25, nextCursor: records.length > 25 ? visible[24].id : null };
    }, auth);
  }

  async record(auth: WorkspaceAuthContext, invoiceId: string, kind: 'credit' | 'refund', input: unknown) {
    if (auth.type !== 'user' || auth.agentId || auth.application || auth.viaApplication) throw new ForbiddenException('Invoice adjustments require an explicit workspace member action');
    const base = z.object({ confirmed: z.literal(true), operationKey: z.string().uuid(), expectedVersion: z.number().int().nonnegative(), amountMinor: z.string().regex(/^[1-9]\d{0,30}$/), reason: z.string().trim().min(3).max(2000), recordedAt: z.string().datetime({ offset: true }) });
    const command = (kind === 'credit' ? base.strict() : base.extend({ method: z.enum(['BANK_TRANSFER', 'CASH', 'CARD', 'UPI', 'OTHER']), reference: z.string().trim().max(250) }).strict()).parse(input);
    const requestHash = createHash('sha256').update(JSON.stringify({ invoiceId, kind, ...command })).digest('hex');
    try {
      return await this.workspaceOrmManager.executeInWorkspaceContext(() => this.workspaceOrmManager.runInWorkspaceTransaction(async (scope) => {
        const adjustments = this.workspaceOrmManager.getRepositoryWithContextPermissions(kind === 'credit' ? 'lbCreditAdjustment' : 'lbRefund', scope);
        const previous = await adjustments.findOne({ where: { operationKey: command.operationKey } });
        if (previous) {
          if (previous.requestHash !== requestHash) throw new ConflictException('Adjustment key already used with different details');
          return { id: previous.id };
        }
        const invoices = this.workspaceOrmManager.getRepositoryWithContextPermissions<BusinessInvoice>('lbInvoice', scope);
        const invoice = await invoices.findOne({ where: { id: invoiceId } });
        if (!invoice) throw new NotFoundException('Invoice unavailable');
        if (['DRAFT', 'CANCELLED'].includes(invoice.status)) throw new ConflictException('Adjustments require a finalized invoice');
        if (invoice.version !== command.expectedVersion) throw new ConflictException('Invoice changed; reload it before recording an adjustment');
        const settlement = getInvoiceSettlement(invoice);
        const amount = BigInt(command.amountMinor);
        if (kind === 'credit' && amount > settlement.receivable) throw new BadRequestException('Credit exceeds the uncredited invoice amount');
        if (kind === 'refund' && (amount > settlement.refundDue || amount > settlement.netPaid)) throw new BadRequestException('Refund exceeds the amount owed back after credit adjustments');
        const next = { ...invoice, amountCreditedMinor: (settlement.credited + (kind === 'credit' ? amount : BigInt(0))).toString(), amountRefundedMinor: (settlement.refunded + (kind === 'refund' ? amount : BigInt(0))).toString() };
        const recalculated = getInvoiceSettlement(next);
        const id = randomUUID();
        const changed = await invoices.update({ id: invoiceId, version: command.expectedVersion }, { amountCreditedMinor: next.amountCreditedMinor, amountRefundedMinor: next.amountRefundedMinor, status: recalculated.status, version: invoice.version + 1, auditEvents: [...(invoice.auditEvents ?? []), { action: kind === 'credit' ? 'CREDIT_RECORDED' : 'REFUND_RECORDED', actorId: auth.workspaceMemberId, at: new Date().toISOString(), adjustmentId: id, amountMinor: command.amountMinor, reason: command.reason }] });
        if (changed.affected !== 1) throw new ConflictException('Invoice changed; reload it before recording an adjustment');
        const values = { id, name: `${invoice.name} · ${kind === 'credit' ? 'credit' : 'refund'} · ${id.slice(0, 8)}`, invoiceId, operationKey: command.operationKey, requestHash, amountMinor: command.amountMinor, currency: invoice.currency, reason: command.reason, recordedAt: command.recordedAt, actorId: auth.workspaceMemberId };
        await adjustments.insert(kind === 'credit' ? { ...values, snapshot: { invoiceName: invoice.name, businessIdentity: invoice.businessIdentity, customer: invoice.customerSnapshot, originalTotals: invoice.totals } } : { ...values, method: 'method' in command ? command.method : null, reference: 'reference' in command ? command.reference : null });
        return { id };
      }), auth);
    } catch (failure) {
      if (isPostgresUniqueViolation(failure)) throw new ConflictException('Adjustment key raced with another request; retry with the same key to review the recorded adjustment');
      throw failure;
    }
  }
}
