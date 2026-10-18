import { In } from 'typeorm';
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { calculateDocumentTotals, salesDocumentInputSchema } from 'src/modules/lessbusy/utils/calculate-document-totals.util';
import { isPostgresUniqueViolation } from 'src/modules/lessbusy/utils/is-postgres-unique-violation.util';

@Injectable()
export class LessBusySalesConversionService {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  async convert(auth: WorkspaceAuthContext, kind: 'quotation' | 'order', sourceId: string, input: unknown) {
    if (auth.type !== 'user' || auth.agentId || auth.application || auth.viaApplication) throw new ForbiddenException('Sales conversions require an explicit workspace member action');
    const command = z.object({ confirmed: z.literal(true), expectedVersion: z.number().int().nonnegative(), operationKey: z.string().uuid() }).strict().parse(input);
    const targetKind = kind === 'quotation' ? 'order' : 'invoice';
    const targetObject = kind === 'quotation' ? 'lbSalesOrder' : 'lbInvoice';
    const targetField = kind === 'quotation' ? 'convertedOrderId' : 'convertedInvoiceId';
    const sourceDocumentKey = `${kind}:${sourceId}:${targetKind}`;
    const requestHash = createHash('sha256').update(JSON.stringify({ kind, sourceId, targetKind, version: command.expectedVersion })).digest('hex');
    try {
      return await this.workspaceOrmManager.executeInWorkspaceContext(() => this.workspaceOrmManager.runInWorkspaceTransaction(async (scope) => {
        const sources = this.workspaceOrmManager.getRepositoryWithContextPermissions(kind === 'quotation' ? 'lbQuotation' : 'lbSalesOrder', scope);
        const targets = this.workspaceOrmManager.getRepositoryWithContextPermissions(targetObject, scope);
        const source = await sources.findOne({ where: { id: sourceId } });
        if (!source) throw new NotFoundException('Source sales document unavailable');
        const previous = await targets.findOne({ where: { operationKey: command.operationKey } });
        if (previous) {
          if (previous.requestHash !== requestHash || previous.sourceDocumentKey !== sourceDocumentKey) throw new ConflictException('Conversion key belongs to another operation');
          return { id: previous.id, kind: targetKind, alreadyConverted: true };
        }
        if (source[targetField]) {
          const converted = await targets.findOne({ where: { id: source[targetField], sourceDocumentKey } });
          if (!converted) throw new NotFoundException('The converted document is outside your current access');
          return { id: converted.id, kind: targetKind, alreadyConverted: true };
        }
        if (source.version !== command.expectedVersion) throw new ConflictException('Source changed; review it before conversion');
        if (kind === 'quotation' ? source.status !== 'ACCEPTED' : !['CONFIRMED', 'FULFILLED'].includes(String(source.status))) throw new ConflictException('Accept the quotation or confirm the order before converting it');
        if (!await this.workspaceOrmManager.getRepositoryWithContextPermissions('person', scope).findOne({ where: { id: source.customerId }, select: { id: true } })) throw new NotFoundException('Customer unavailable');
        if (source.opportunityId && !await this.workspaceOrmManager.getRepositoryWithContextPermissions('opportunity', scope).findOne({ where: { id: source.opportunityId }, select: { id: true } })) throw new NotFoundException('Linked deal unavailable');
        const inputLines = z.array(salesDocumentInputSchema.shape.lines.element.strip()).parse(source.lines);
        const document = calculateDocumentTotals({ customerId: source.customerId, currency: source.currency, discountBasisPoints: source.discountBasisPoints ?? 0, lines: inputLines });
        const optionIds = [...new Set(document.lines.flatMap((line) => line.variantId ? [line.variantId] : []))];
        if (optionIds.length) { const options = await this.workspaceOrmManager.getRepositoryWithContextPermissions('lbProductVariant', scope).find({ where: { id: In(optionIds) }, select: { id: true }, take: 200 }); if (options.length !== optionIds.length) throw new NotFoundException('Product option unavailable'); }
        const id = randomUUID();
        const at = new Date().toISOString();
        const audit = { action: 'CONVERTED_FROM_DOCUMENT', actorId: auth.workspaceMemberId, at, sourceId, sourceKind: kind, sourceName: source.name };
        const target = { id, name: `DRAFT-${id}`, customerId: document.customerId, currency: document.currency, discountBasisPoints: document.discountBasisPoints, lines: document.lines, totals: document.totals, status: 'DRAFT', version: 0, operationKey: command.operationKey, requestHash, sourceDocumentId: sourceId, sourceDocumentKind: kind, sourceDocumentKey, opportunityId: source.opportunityId ?? null, auditEvents: [audit] };
        await targets.insert(targetKind === 'invoice' ? { ...target, amountPaidMinor: '0', amountCreditedMinor: '0', amountRefundedMinor: '0', dueAt: null } : { ...target, inventoryState: 'UNRESERVED', stockReservations: [] });
        const changed = await sources.update({ id: sourceId, version: command.expectedVersion }, { [targetField]: id, version: command.expectedVersion + 1, auditEvents: [...(Array.isArray(source.auditEvents) ? source.auditEvents : []), { action: 'CONVERTED_TO_DOCUMENT', actorId: auth.workspaceMemberId, at, targetId: id, targetKind }] });
        if (changed.affected !== 1) throw new ConflictException('Source changed; retry conversion after review');
        return { id, kind: targetKind, alreadyConverted: false };
      }), auth);
    } catch (failure) {
      if (isPostgresUniqueViolation(failure)) throw new ConflictException('Conversion key raced with another request; retry with the same key to review the recorded document');
      throw failure;
    }
  }
}
