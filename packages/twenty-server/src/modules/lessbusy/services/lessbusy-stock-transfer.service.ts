import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { In } from 'typeorm';
import { z } from 'zod';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { type StockBalance } from 'src/modules/lessbusy/types/business-records.type';
import { isPostgresUniqueViolation } from 'src/modules/lessbusy/utils/is-postgres-unique-violation.util';

@Injectable()
export class LessBusyStockTransferService {
  constructor(private readonly orm: WorkspaceOrmManager) {}

  async transfer(auth: WorkspaceAuthContext, input: unknown) {
    if (auth.type !== 'user' || auth.agentId || auth.application || auth.viaApplication) throw new ForbiddenException('Stock transfers require a workspace member');
    const command = z.object({ confirmed: z.literal(true), operationKey: z.string().uuid(), sourceBalanceId: z.string().uuid(), targetBalanceId: z.string().uuid(), expectedSourceVersion: z.number().int().nonnegative(), expectedTargetVersion: z.number().int().nonnegative(), quantityUnits: z.number().int().positive().max(1000000000), reason: z.string().trim().min(3).max(1000) }).strict().parse(input);
    if (command.sourceBalanceId === command.targetBalanceId) throw new BadRequestException('Choose different stock balances');
    const hash = createHash('sha256').update(JSON.stringify({ ...command, actorId: auth.workspaceMemberId })).digest('hex');
    try {
      return await this.orm.executeInWorkspaceContext(() => this.orm.runInWorkspaceTransaction(async (scope) => {
        const receipts = this.orm.getRepositoryWithContextPermissions('lbInventoryOperation', scope);
        const previous = await receipts.findOne({ where: { id: command.operationKey } });
        if (previous) {
          if (previous.kind !== 'STOCK_TRANSFER' || previous.requestHash !== hash) throw new ConflictException('Operation key belongs to another inventory change');
          return previous.result;
        }
        const balances = this.orm.getRepositoryWithContextPermissions<StockBalance>('lbStockBalance', scope);
        const records = await balances.find({ where: { id: In([command.sourceBalanceId, command.targetBalanceId]) }, take: 2 });
        const source = records.find((record) => record.id === command.sourceBalanceId);
        const target = records.find((record) => record.id === command.targetBalanceId);
        if (!source || !target) throw new NotFoundException('A stock balance is unavailable');
        if (source.variantId !== target.variantId || source.warehouseId === target.warehouseId) throw new BadRequestException('Transfer the same product option between different locations');
        if (source.version !== command.expectedSourceVersion || target.version !== command.expectedTargetVersion) throw new ConflictException('Stock changed. Reload and review the transfer.');
        const warehouses = await this.orm.getRepositoryWithContextPermissions('lbWarehouse', scope).find({ where: { id: In([source.warehouseId, target.warehouseId]), isActive: true }, take: 2, select: { id: true } });
        if (warehouses.length !== 2) throw new ConflictException('Both stock locations must be active and readable');
        const variant = await this.orm.getRepositoryWithContextPermissions('lbProductVariant', scope).findOne({ where: { id: source.variantId }, select: { id: true, tracksInventory: true } });
        if (!variant || variant.tracksInventory !== true) throw new ConflictException('The selected option must track physical stock');
        const sourceUnits = source.onHandUnits - command.quantityUnits;
        const targetUnits = target.onHandUnits + command.quantityUnits;
        if (![source.onHandUnits, target.onHandUnits, source.reservedUnits, target.reservedUnits, sourceUnits, targetUnits].every(Number.isSafeInteger) || source.onHandUnits < source.reservedUnits || target.onHandUnits < target.reservedUnits || sourceUnits < source.reservedUnits || source.reservedUnits < 0 || target.reservedUnits < 0 || targetUnits < target.reservedUnits) throw new ConflictException('Transfer exceeds available stock or needs a stock count review');
        for (const balance of [source, target].sort((a, b) => a.id.localeCompare(b.id))) {
          const changed = await balances.update({ id: balance.id, version: balance.version }, { onHandUnits: balance.id === source.id ? sourceUnits : targetUnits, version: balance.version + 1 });
          if (changed.affected !== 1) throw new ConflictException('Stock changed during transfer. Reload and try again.');
        }
        const result = { sourceBalanceId: source.id, targetBalanceId: target.id, quantityUnits: command.quantityUnits, sourceOnHandUnits: sourceUnits, targetOnHandUnits: targetUnits };
        const movements = this.orm.getRepositoryWithContextPermissions('lbStockMovement', scope);
        for (const [balanceId, kind, quantityUnits] of [[source.id, 'TRANSFER_OUT', -command.quantityUnits], [target.id, 'TRANSFER_IN', command.quantityUnits]] as const) {
          await movements.insert({ id: randomUUID(), name: kind, balanceId, operationKey: `${command.operationKey}:${kind}`, requestHash: hash, kind, quantityUnits, reason: command.reason, actorId: auth.workspaceMemberId, result });
        }
        await receipts.insert({ id: command.operationKey, name: 'Stock transfer', kind: 'STOCK_TRANSFER', requestHash: hash, actorId: auth.workspaceMemberId, result });
        return result;
      }), auth);
    } catch (failure) {
      if (isPostgresUniqueViolation(failure)) throw new ConflictException('Transfer key raced with another request; retry with the same operation key to review the recorded transfer');
      throw failure;
    }
  }
}
