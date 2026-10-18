import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { LessThanOrEqual } from 'typeorm';
import { z } from 'zod';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { LessBusyInventoryService } from 'src/modules/lessbusy/services/lessbusy-inventory.service';
import { isPostgresUniqueViolation } from 'src/modules/lessbusy/utils/is-postgres-unique-violation.util';

@Injectable()
export class LessBusyStockExpiryService {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager, private readonly inventory: LessBusyInventoryService) {}

  async release(auth: WorkspaceAuthContext, input: unknown) {
    const userActor = auth.type === 'user' && !auth.agentId && !auth.application && !auth.viaApplication ? auth.workspaceMemberId : null;
    const applicationActor = auth.type === 'application' && !auth.agentId && !auth.actingAgent && auth.application.universalIdentifier === '21ec822f-cd03-4479-a8f8-e5cdd0c0670a' ? auth.application.id : null;
    if (!userActor && !applicationActor) throw new ForbiddenException('Reservation expiry requires a workspace member or the installed LessBusy worker');
    const command = z.object({ confirmed: z.literal(true), operationKey: z.string().uuid(), asOf: z.string().datetime({ offset: true }) }).strict().parse(input);
    if (new Date(command.asOf).getTime() > Date.now()) throw new BadRequestException('Expiry cutoff cannot be in the future');
    const requestHash = createHash('sha256').update(command.asOf).digest('hex');
    try {
      return await this.workspaceOrmManager.executeInWorkspaceContext(() => this.workspaceOrmManager.runInWorkspaceTransaction(async (scope) => {
        const receipts = this.workspaceOrmManager.getRepositoryWithContextPermissions('lbInventoryOperation', scope);
        const previous = await receipts.findOne({ where: { id: command.operationKey } });
        if (previous) {
          if (previous.kind !== 'RESERVATION_EXPIRY' || previous.requestHash !== requestHash) throw new ConflictException('Expiry key belongs to another cutoff');
          return previous.result;
        }
        const reservations = this.workspaceOrmManager.getRepositoryWithContextPermissions('lbStockReservation', scope);
        const expired = await reservations.find({ where: { status: 'ACTIVE', expiresAt: LessThanOrEqual(command.asOf) }, take: 11, order: { expiresAt: 'ASC' } });
        const handledOrders = new Set<string>(); let released = 0;
        for (const reservation of expired.slice(0, 10)) {
          if (reservation.salesOrderId) {
            if (handledOrders.has(String(reservation.salesOrderId))) continue;
            handledOrders.add(String(reservation.salesOrderId));
            const orders = this.workspaceOrmManager.getRepositoryWithContextPermissions('lbSalesOrder', scope);
            const order = await orders.findOne({ where: { id: reservation.salesOrderId } });
            if (!order || order.status !== 'CONFIRMED' || order.inventoryState !== 'RESERVED') throw new ConflictException('Linked order needs inventory review before expiry can proceed');
            const linked = await reservations.find({ where: { salesOrderId: order.id, status: 'ACTIVE' }, take: 201, order: { balanceId: 'ASC' } });
            if (linked.length > 200 || linked.some((entry) => !entry.expiresAt || new Date(entry.expiresAt).getTime() > new Date(command.asOf).getTime())) throw new ConflictException('Order reservation expiry dates need review');
            for (const entry of linked) { await this.inventory.execute(auth, { action: 'release', reservationId: entry.id, operationKey: randomUUID(), confirmed: true }, scope, String(order.id), true); released++; }
            const changed = await orders.update({ id: order.id, version: order.version }, { stockReservations: [], inventoryState: 'RELEASED', version: Number(order.version) + 1, auditEvents: [...(Array.isArray(order.auditEvents) ? order.auditEvents : []), { action: 'ORDER_RESERVATION_EXPIRED', actorId: userActor ?? applicationActor, at: new Date().toISOString(), releasedReservations: linked.length }] });
            if (changed.affected !== 1) throw new ConflictException('Order changed during expiry; retry the same operation');
          } else {
            const current = await reservations.findOne({ where: { id: reservation.id } });
            if (!current) throw new NotFoundException('Reservation unavailable');
            if (current.status !== 'ACTIVE') continue;
            await this.inventory.execute(auth, { action: 'release', reservationId: reservation.id, operationKey: randomUUID(), confirmed: true }, scope, undefined, true); released++;
          }
        }
        const remaining = await reservations.find({ where: { status: 'ACTIVE', expiresAt: LessThanOrEqual(command.asOf) }, take: 1, select: { id: true } });
        const result = { released, hasMore: remaining.length > 0, asOf: command.asOf };
        await receipts.insert({ id: command.operationKey, name: 'Reservation expiry', kind: 'RESERVATION_EXPIRY', requestHash, actorId: userActor ?? applicationActor, result });
        return result;
      }), auth);
    } catch (failure) {
      if (isPostgresUniqueViolation(failure)) throw new ConflictException('Expiry run raced with another request; retry with the same operation key to review the recorded run');
      throw failure;
    }
  }
}
