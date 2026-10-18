import { type WorkspaceTransactionScope } from 'src/engine/twenty-orm/types/workspace-transaction-scope.type';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { In, MoreThan } from 'typeorm';
import { type RolePermissionConfig } from 'src/engine/twenty-orm/types/role-permission-config.type';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { isPostgresUniqueViolation } from 'src/modules/lessbusy/utils/is-postgres-unique-violation.util';
import { type StockBalance, type StockReservation } from 'src/modules/lessbusy/types/business-records.type';

const quantity = z.number().int().positive().max(1000000000);
const stockCommandSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('receive'), balanceId: z.string().uuid(), quantityUnits: quantity, reason: z.string().trim().min(3).max(1000), confirmed: z.literal(true), operationKey: z.string().uuid() }).strict(),
  z.object({ action: z.literal('adjust'), balanceId: z.string().uuid(), quantityUnits: z.number().int().min(-1000000000).max(1000000000).refine((value) => value !== 0), reason: z.string().trim().min(3).max(1000), confirmed: z.literal(true), operationKey: z.string().uuid() }).strict(),
  z.object({ action: z.literal('reserve'), balanceId: z.string().uuid(), quantityUnits: quantity, expiresAt: z.string().datetime({ offset: true }).optional(), confirmed: z.literal(true), operationKey: z.string().uuid() }).strict(),
  z.object({ action: z.enum(['release', 'commit']), reservationId: z.string().uuid(), confirmed: z.literal(true), operationKey: z.string().uuid() }).strict(),
]);

@Injectable()
export class LessBusyInventoryService {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  private assertHuman(auth: WorkspaceAuthContext) {
    if (auth.type !== 'user' || auth.agentId || auth.application || auth.viaApplication) {
      throw new ForbiddenException('Stock changes require a workspace member action');
    }
    return auth.workspaceMemberId;
  }

  async lowStock(auth: WorkspaceAuthContext, cursor?: string, permissions?: RolePermissionConfig) {
    if (cursor) z.string().uuid().parse(cursor);
    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const balances = permissions
        ? this.workspaceOrmManager.getRepository<StockBalance>('lbStockBalance', permissions)
        : this.workspaceOrmManager.getRepositoryWithContextPermissions<StockBalance>('lbStockBalance');
      const variants = permissions
        ? this.workspaceOrmManager.getRepository('lbProductVariant', permissions)
        : this.workspaceOrmManager.getRepositoryWithContextPermissions('lbProductVariant');
      const batch = await balances.find({ ...(cursor ? { where: { id: MoreThan(cursor) } } : {}), order: { id: 'ASC' }, take: 51, select: { id: true, name: true, variantId: true, onHandUnits: true, reservedUnits: true } });
      const visible = batch.slice(0, 50);
      const variantRecords = visible.length ? await variants.find({ where: { id: In([...new Set(visible.map((balance) => balance.variantId))]) }, take: 50, select: { id: true, name: true, sku: true, lowStockThresholdUnits: true } }) : [];
      const byId = new Map(variantRecords.map((variant) => [variant.id, variant]));
      const items = visible.flatMap((balance) => {
        const variant = byId.get(balance.variantId);
        if (!variant || typeof variant.lowStockThresholdUnits !== 'number') return [];
        const availableUnits = balance.onHandUnits - balance.reservedUnits;
        return availableUnits <= variant.lowStockThresholdUnits ? [{ id: balance.id, name: balance.name, sku: variant.sku, availableUnits, reservedUnits: balance.reservedUnits, thresholdUnits: variant.lowStockThresholdUnits }] : [];
      });
      return { items, scanned: visible.length, hasMore: batch.length > 50, nextCursor: batch.length > 50 ? visible[visible.length - 1].id : null };
    }, auth);
  }

  async createBalance(auth: WorkspaceAuthContext, input: unknown) {
    this.assertHuman(auth);
    const command = z.object({ variantId: z.string().uuid(), warehouseId: z.string().uuid() }).strict().parse(input);
    const variant = await this.workspaceOrmManager.getRepositoryWithContextPermissions('lbProductVariant').findOne({ where: { id: command.variantId } });
    const warehouse = await this.workspaceOrmManager.getRepositoryWithContextPermissions('lbWarehouse').findOne({ where: { id: command.warehouseId } });
    if (!variant || !warehouse) throw new NotFoundException('Product variant or location unavailable');
    if (!warehouse.isActive) throw new ConflictException('Activate this location before setting up stock');
    if (variant.tracksInventory !== true) throw new BadRequestException('This option does not track physical inventory');
    const balanceKey = `${command.variantId}:${command.warehouseId}`;
    try {
      return await this.workspaceOrmManager.executeInWorkspaceContext(() => this.workspaceOrmManager.runInWorkspaceTransaction(async (scope) => {
        const repository = this.workspaceOrmManager.getRepositoryWithContextPermissions<StockBalance>('lbStockBalance', scope);
        const existing = await repository.findOne({ where: { balanceKey } });
        if (existing) return existing;
        const id = randomUUID();
        await repository.insert({ id, name: `${variant.name ?? variant.id} · ${warehouse.name ?? warehouse.id}`, ...command, balanceKey, onHandUnits: 0, reservedUnits: 0, version: 0 });
        return repository.findOne({ where: { id } });
      }), auth);
    } catch (failure) {
      if (isPostgresUniqueViolation(failure)) throw new ConflictException('Stock balance setup raced with another request; retry with the same command to review the balance');
      throw failure;
    }
  }

  async execute(auth: WorkspaceAuthContext, input: unknown, transactionScope?: WorkspaceTransactionScope, orderId?: string, expirationOnly = false) {    const actorId = expirationOnly && auth.type === 'application' && !auth.agentId && !auth.actingAgent && auth.application.universalIdentifier === '21ec822f-cd03-4479-a8f8-e5cdd0c0670a' ? auth.application.id : this.assertHuman(auth);
    const command = stockCommandSchema.parse(input);
    if (expirationOnly && command.action !== 'release') throw new ForbiddenException('Expiry processing only releases expired reservations');
    const requestHash = createHash('sha256').update(JSON.stringify(command)).digest('hex');
    const work = async (scope: WorkspaceTransactionScope) => {
      const balances = this.workspaceOrmManager.getRepositoryWithContextPermissions<StockBalance>('lbStockBalance', scope);
      const movements = this.workspaceOrmManager.getRepositoryWithContextPermissions('lbStockMovement', scope);
      const reservations = this.workspaceOrmManager.getRepositoryWithContextPermissions<StockReservation>('lbStockReservation', scope);
      const previous = await movements.findOne({ where: { operationKey: command.operationKey } });
      if (previous) {
        if (previous.requestHash !== requestHash) throw new ConflictException('This operation key belongs to a different stock change');
        return previous.result;
      }
      let reservation: StockReservation | null = null;
      if ('reservationId' in command) {
        reservation = await reservations.findOne({ where: { id: command.reservationId } });
        if (!reservation) throw new NotFoundException('Reservation unavailable');
        if (expirationOnly && (!reservation.expiresAt || new Date(reservation.expiresAt).getTime() > Date.now())) throw new ConflictException('Only expired reservations may be released by expiry processing');
        if (reservation.salesOrderId && reservation.salesOrderId !== orderId) throw new ConflictException('Use the linked order inventory actions for this reservation');
        if (reservation.status !== 'ACTIVE') throw new ConflictException('Reservation has already been completed');
        if (command.action === 'commit' && reservation.expiresAt && new Date(reservation.expiresAt).getTime() <= Date.now()) {
          throw new ConflictException('Reservation expired; release it before reserving again');
        }
      }
      const balanceId = 'balanceId' in command ? command.balanceId : reservation!.balanceId;
      const balance = await balances.findOne({ where: { id: balanceId } });
      if (!balance) throw new NotFoundException('Stock balance unavailable');
      let onHandUnits = balance.onHandUnits;
      let reservedUnits = balance.reservedUnits;
      let reservationId = reservation?.id;
      if (command.action === 'adjust' || command.action === 'receive') onHandUnits += command.quantityUnits;
      if (command.action === 'reserve' || command.action === 'receive' || (command.action === 'adjust' && command.quantityUnits > 0)) {
        const warehouse = await this.workspaceOrmManager.getRepositoryWithContextPermissions('lbWarehouse', scope).findOne({ where: { id: balance.warehouseId }, select: { id: true, isActive: true } });
        if (!warehouse?.isActive) throw new ConflictException('Activate the stock location before receiving or reserving stock');
        const variant = await this.workspaceOrmManager.getRepositoryWithContextPermissions('lbProductVariant', scope).findOne({ where: { id: balance.variantId } });
        if (!variant || variant.tracksInventory !== true) throw new BadRequestException('This product option does not track physical stock');
        const product = await this.workspaceOrmManager.getRepositoryWithContextPermissions('lbProduct', scope).findOne({ where: { id: variant.productId } });
        if (!product || product.isService || product.status !== 'ACTIVE' || variant.status !== 'ACTIVE') throw new ConflictException('Activate the product and option before receiving or reserving stock');
      }
      if (command.action === 'reserve') {
        if (command.expiresAt && new Date(command.expiresAt).getTime() <= Date.now()) throw new BadRequestException('Reservation expiry must be in the future');
        reservedUnits += command.quantityUnits;
        reservationId = randomUUID();
        await reservations.insert({ id: reservationId, name: reservationId, salesOrderId: orderId ?? null, operationKey: command.operationKey, balanceId, quantityUnits: command.quantityUnits, status: 'ACTIVE', expiresAt: command.expiresAt ?? null, version: 0 });
      }
      if (reservation) {
        reservedUnits -= reservation.quantityUnits;
        if (command.action === 'commit') onHandUnits -= reservation.quantityUnits;
        const changed = await reservations.update({ id: reservation.id, version: reservation.version }, { status: command.action === 'commit' ? 'COMMITTED' : 'RELEASED', version: reservation.version + 1 });
        if (changed.affected !== 1) throw new ConflictException('Reservation changed; retry with the same operation key');
      }
      if (![onHandUnits, reservedUnits].every(Number.isSafeInteger) || onHandUnits < 0 || reservedUnits < 0 || reservedUnits > onHandUnits) {
        throw new ConflictException('Insufficient available stock for this change');
      }
      const changed = await balances.update({ id: balance.id, version: balance.version }, { onHandUnits, reservedUnits, version: balance.version + 1 });
      if (changed.affected !== 1) throw new ConflictException('Stock changed; retry with the same operation key');
      const result = { balanceId, onHandUnits, reservedUnits, availableUnits: onHandUnits - reservedUnits, reservationId, version: balance.version + 1 };
      await movements.insert({ id: randomUUID(), name: command.action, balanceId, operationKey: command.operationKey, requestHash, kind: command.action.toUpperCase(), quantityUnits: 'quantityUnits' in command ? command.quantityUnits : reservation!.quantityUnits, reason: 'reason' in command ? command.reason : null, actorId, result });
      return result;
    };
    try {
      return await this.workspaceOrmManager.executeInWorkspaceContext(() => transactionScope ? work(transactionScope) : this.workspaceOrmManager.runInWorkspaceTransaction(work), auth);
    } catch (failure) {
      if (isPostgresUniqueViolation(failure)) throw new ConflictException('Stock key raced with another request; retry with the same operation key to review the recorded change');
      throw failure;
    }
  }
}
