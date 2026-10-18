import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { LessBusyInventoryService } from 'src/modules/lessbusy/services/lessbusy-inventory.service';

const reservationSchema = z.object({ reservationId: z.string().uuid(), balanceId: z.string().uuid(), variantId: z.string().uuid(), quantityUnits: z.number().int().positive() });
const lineSchema = z.array(z.object({ variantId: z.string().uuid().optional(), quantity: z.number().int().positive().max(1000000) }));

@Injectable()
export class LessBusyOrderInventoryService {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager, private readonly inventory: LessBusyInventoryService) {}

  async execute(auth: WorkspaceAuthContext, orderId: string, input: unknown) {
    if (auth.type !== 'user' || auth.agentId || auth.application || auth.viaApplication) throw new ForbiddenException('Order stock actions require an explicit workspace member action');
    const command = z.object({ confirmed: z.literal(true), operationKey: z.string().uuid(), expectedVersion: z.number().int().nonnegative(), action: z.enum(['reserve', 'release', 'fulfill']), warehouseId: z.string().uuid().optional(), expiresAt: z.string().datetime({ offset: true }).optional() }).strict().parse(input);
    const requestHash = createHash('sha256').update(JSON.stringify({ orderId, ...command })).digest('hex');
    return this.workspaceOrmManager.executeInWorkspaceContext(() => this.workspaceOrmManager.runInWorkspaceTransaction(async (scope) => {
      const orders = this.workspaceOrmManager.getRepositoryWithContextPermissions('lbSalesOrder', scope);
      const order = await orders.findOne({ where: { id: orderId } });
      if (!order) throw new NotFoundException('Order unavailable');
      const history = z.array(z.object({ operationKey: z.string().optional(), requestHash: z.string().optional() }).passthrough()).parse(order.auditEvents ?? []);
      const previous = history.find((entry) => entry.operationKey === command.operationKey);
      if (previous) {
        if (previous.requestHash !== requestHash) throw new ConflictException('Stock action key already used with different details');
        return { id: orderId, inventoryState: order.inventoryState, version: order.version };
      }
      if (order.version !== command.expectedVersion) throw new ConflictException('Order changed; review it before changing stock');
      if (order.status !== 'CONFIRMED') throw new ConflictException('Stock actions require a confirmed, unfulfilled order');
      let reservations = z.array(reservationSchema).parse(order.stockReservations ?? []);
      if (command.action === 'reserve') {
        if (order.inventoryState === 'RESERVED' || reservations.length) throw new ConflictException('Release the existing order reservation before reserving again');
        if (!command.warehouseId) throw new BadRequestException('Choose a stock location');
        const warehouse = await this.workspaceOrmManager.getRepositoryWithContextPermissions('lbWarehouse', scope).findOne({ where: { id: command.warehouseId } });
        if (!warehouse || !warehouse.isActive) throw new NotFoundException('Active stock location unavailable');
        const quantityByVariant = new Map<string, number>();
        for (const line of lineSchema.parse(order.lines)) if (line.variantId) quantityByVariant.set(line.variantId, (quantityByVariant.get(line.variantId) ?? 0) + line.quantity);
        for (const [variantId, quantityUnits] of [...quantityByVariant].sort(([left], [right]) => left.localeCompare(right))) {
          if (!Number.isSafeInteger(quantityUnits) || quantityUnits > 1000000000) throw new BadRequestException('Order quantity exceeds the supported stock range');
          const variant = await this.workspaceOrmManager.getRepositoryWithContextPermissions('lbProductVariant', scope).findOne({ where: { id: variantId } });
          if (!variant) throw new NotFoundException('Product option unavailable');
          if (!variant.tracksInventory) continue;
          const balance = await this.workspaceOrmManager.getRepositoryWithContextPermissions('lbStockBalance', scope).findOne({ where: { balanceKey: `${variantId}:${command.warehouseId}` } });
          if (!balance) throw new NotFoundException('Receive or initialize this option at the selected location before reserving it');
          const result = z.object({ reservationId: z.string().uuid() }).parse(await this.inventory.execute(auth, { action: 'reserve', balanceId: balance.id, quantityUnits, operationKey: randomUUID(), confirmed: true, ...(command.expiresAt ? { expiresAt: command.expiresAt } : {}) }, scope, orderId));
          reservations.push({ reservationId: result.reservationId, balanceId: balance.id, variantId, quantityUnits });
        }
        if (!reservations.length) throw new BadRequestException('This order has no stock-tracked product options; use the regular fulfillment status action for services');
      } else {
        if (order.inventoryState !== 'RESERVED' || !reservations.length) throw new ConflictException('Reserve order stock before releasing or fulfilling it');
        for (const reservation of [...reservations].sort((left, right) => left.balanceId.localeCompare(right.balanceId))) await this.inventory.execute(auth, { action: command.action === 'fulfill' ? 'commit' : 'release', reservationId: reservation.reservationId, operationKey: randomUUID(), confirmed: true }, scope, orderId);
      }
      const inventoryState = command.action === 'reserve' ? 'RESERVED' : command.action === 'fulfill' ? 'FULFILLED' : 'RELEASED';
      const at = new Date().toISOString();
      const changed = await orders.update({ id: orderId, version: command.expectedVersion, status: 'CONFIRMED' }, { inventoryState, stockReservations: command.action === 'release' ? [] : reservations, ...(command.action === 'fulfill' ? { status: 'FULFILLED' } : {}), version: order.version + 1, auditEvents: [...history, { action: `ORDER_STOCK_${inventoryState}`, actorId: auth.workspaceMemberId, at, operationKey: command.operationKey, requestHash, reservations }] });
      if (changed.affected !== 1) throw new ConflictException('Order changed; review it before changing stock');
      return { id: orderId, inventoryState, version: order.version + 1 };
    }), auth);
  }
}
