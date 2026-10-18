import { BadRequestException, Injectable } from '@nestjs/common';
import { Between, MoreThan, Not, In } from 'typeorm';
import { z } from 'zod';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { type BusinessInvoice } from 'src/modules/lessbusy/types/business-records.type';
import { getInvoiceSettlement } from 'src/modules/lessbusy/utils/get-invoice-settlement.util';

@Injectable()
export class LessBusySalesReportService {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  async batch(auth: WorkspaceAuthContext, input: unknown) {
    const command = z.object({ from: z.string().datetime({ offset: true }), to: z.string().datetime({ offset: true }), cursor: z.string().uuid().optional() }).strict().parse(input);
    const from = new Date(command.from); const to = new Date(command.to);
    if (from > to || to.getTime() - from.getTime() > 366 * 86400000) throw new BadRequestException('Choose a reporting period of at most 366 days');
    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const records = await this.workspaceOrmManager.getRepositoryWithContextPermissions<BusinessInvoice>('lbInvoice').find({ where: { finalizedAt: Between(command.from, command.to), status: Not(In(['DRAFT', 'CANCELLED'])), ...(command.cursor ? { id: MoreThan(command.cursor) } : {}) }, order: { id: 'ASC' }, take: 101, select: { id: true, currency: true, totals: true, amountPaidMinor: true, amountCreditedMinor: true, amountRefundedMinor: true } });
      const visible = records.slice(0, 100);
      const groups = new Map<string, { invoices: number; billed: bigint; paid: bigint; credited: bigint; refunded: bigint; outstanding: bigint; refundDue: bigint }>();
      for (const invoice of visible) {
        z.string().regex(/^[A-Z]{3}$/).parse(invoice.currency);
        const settlement = getInvoiceSettlement(invoice);
        const group = groups.get(invoice.currency) ?? { invoices: 0, billed: BigInt(0), paid: BigInt(0), credited: BigInt(0), refunded: BigInt(0), outstanding: BigInt(0), refundDue: BigInt(0) };
        group.invoices++; group.billed += settlement.total; group.paid += settlement.paid; group.credited += settlement.credited; group.refunded += settlement.refunded;
        group.outstanding += settlement.outstanding > BigInt(0) ? settlement.outstanding : BigInt(0); group.refundDue += settlement.refundDue;
        groups.set(invoice.currency, group);
      }
      return { groups: [...groups].map(([currency, group]) => ({ currency, invoices: group.invoices, billedMinor: group.billed.toString(), paidMinor: group.paid.toString(), creditedMinor: group.credited.toString(), refundedMinor: group.refunded.toString(), outstandingMinor: group.outstanding.toString(), refundDueMinor: group.refundDue.toString() })), scanned: visible.length, hasMore: records.length > 100, nextCursor: records.length > 100 ? visible[99].id : null, from: command.from, to: command.to };
    }, auth);
  }
}
