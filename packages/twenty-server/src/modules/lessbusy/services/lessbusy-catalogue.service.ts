import { In, MoreThan } from 'typeorm';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { isPostgresUniqueViolation } from 'src/modules/lessbusy/utils/is-postgres-unique-violation.util';

const attributeName = z.string().trim().min(1).max(80);
const attributeValue = z.string().trim().min(1).max(200);
const variantSchema = z.object({ id: z.string().uuid().optional(), sku: z.string().trim().min(1).max(80).regex(/^[a-zA-Z0-9._/-]+$/).transform((value) => value.toUpperCase()), attributes: z.record(attributeName, attributeValue), unitAmountMinor: z.string().regex(/^\d{1,18}$/), costAmountMinor: z.string().regex(/^\d{1,18}$/).nullable(), taxBasisPoints: z.number().int().min(0).max(10000), lowStockThresholdUnits: z.number().int().min(0).max(1000000000), barcode: z.string().trim().max(100), status: z.enum(['ACTIVE', 'ARCHIVED']), tracksInventory: z.boolean() }).strict();
const productSchema = z.object({ name: z.string().trim().min(1).max(250), description: z.string().trim().max(10000), category: z.string().trim().max(250), isService: z.boolean(), status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']), currency: z.string().regex(/^[A-Z]{3}$/), attributes: z.record(attributeName, z.array(attributeValue).min(1).max(100)), images: z.array(z.object({ url: z.string().url().refine((value) => new URL(value).protocol === 'https:'), alt: z.string().max(250) }).strict()).max(12), variants: z.array(variantSchema).min(1).max(100) }).strict();
const historySchema = z.array(z.object({ action: z.string(), actorId: z.string(), at: z.string(), operationKey: z.string(), requestHash: z.string() }).passthrough());

@Injectable()
export class LessBusyCatalogueService {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  async exportBatch(auth: WorkspaceAuthContext, input: unknown) {
    const command = z.object({ cursor: z.string().uuid().optional(), includeCost: z.boolean().default(false) }).strict().parse(input);
    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const options = await this.workspaceOrmManager.getRepositoryWithContextPermissions('lbProductVariant').find({ ...(command.cursor ? { where: { id: MoreThan(command.cursor) } } : {}), order: { id: 'ASC' }, take: 51, select: { id: true, productId: true, sku: true, attributes: true, unitAmountMinor: true, taxBasisPoints: true, lowStockThresholdUnits: true, barcode: true, status: true, tracksInventory: true, ...(command.includeCost ? { costAmountMinor: true } : {}) } });
      const batch = options.slice(0, 50);
      const products = batch.length ? await this.workspaceOrmManager.getRepositoryWithContextPermissions('lbProduct').find({ where: { id: In([...new Set(batch.map((option) => option.productId))]) }, take: 50, select: { id: true, name: true, description: true, category: true, isService: true, status: true, currency: true } }) : [];
      const byId = new Map(products.map((product) => [product.id, product]));
      const rows = batch.flatMap((option) => {
        const product = byId.get(option.productId);
        return product ? [{ productId: product.id, variantId: option.id, name: product.name, description: product.description ?? '', category: product.category ?? '', isService: product.isService === true, status: product.status, currency: product.currency, sku: option.sku, attributes: option.attributes ?? {}, unitAmountMinor: option.unitAmountMinor, ...(command.includeCost ? { costAmountMinor: option.costAmountMinor ?? null } : {}), taxBasisPoints: option.taxBasisPoints ?? 0, lowStockThreshold: option.lowStockThresholdUnits ?? 0, barcode: option.barcode ?? '', optionStatus: option.status, tracksInventory: option.tracksInventory === true }] : [];
      });
      return { rows, scannedOptions: batch.length, inaccessibleProducts: batch.length - rows.length, nextCursor: options.length > 50 ? batch[batch.length - 1].id : null, asOf: new Date().toISOString() };
    }, auth);
  }

  async get(auth: WorkspaceAuthContext, id: string) {
    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const product = await this.workspaceOrmManager.getRepositoryWithContextPermissions('lbProduct').findOne({ where: { id } });
      if (!product) throw new NotFoundException('Product unavailable');
      const variants = await this.workspaceOrmManager.getRepositoryWithContextPermissions('lbProductVariant').find({ where: { productId: id }, take: 101, order: { createdAt: 'ASC' } });
      if (variants.length > 100) throw new BadRequestException('This catalogue editor supports up to 100 variants per product');
      return { ...product, variants };
    }, auth);
  }

  async save(auth: WorkspaceAuthContext, id: string | null, input: unknown) {
    if (auth.type !== 'user' || auth.agentId || auth.application || auth.viaApplication) throw new ForbiddenException('Catalogue changes require an explicit workspace member action');
    const command = z.object({ confirmed: z.literal(true), expectedVersion: z.number().int().nonnegative().nullable(), operationKey: z.string().uuid(), product: productSchema }).strict().parse(input);
    const { variants, ...product } = command.product;
    try { new Intl.NumberFormat('en', { style: 'currency', currency: product.currency }); } catch { throw new BadRequestException('Unsupported currency'); }
    const normalize = (value: string) => value.normalize('NFKC').trim().toLocaleLowerCase('en');
    const definitionNames = Object.keys(product.attributes);
    if (definitionNames.length > 20 || new Set(definitionNames.map(normalize)).size !== definitionNames.length) throw new BadRequestException('Use at most 20 distinct attribute names');
    const preparedVariants = variants.map((variant) => {
      if (product.isService && variant.tracksInventory) throw new BadRequestException('Service products do not track physical inventory');
      const keys = Object.keys(variant.attributes);
      if (keys.length !== definitionNames.length || definitionNames.some((name) => !product.attributes[name].includes(variant.attributes[name]))) throw new BadRequestException('Every variant must select one configured value for every product attribute');
      const canonical = JSON.stringify(keys.map((key) => [normalize(key), normalize(variant.attributes[key])]).sort(([left], [right]) => left.localeCompare(right)));
      return { ...variant, canonical };
    });
    if (new Set(preparedVariants.map((variant) => variant.sku)).size !== variants.length || new Set(preparedVariants.map((variant) => variant.canonical)).size !== variants.length) throw new ConflictException('Each variant needs a distinct SKU and attribute combination');
    const requestHash = createHash('sha256').update(JSON.stringify(command.product)).digest('hex');
    try {
      return await this.workspaceOrmManager.executeInWorkspaceContext(() => this.workspaceOrmManager.runInWorkspaceTransaction(async (scope) => {
        const products = this.workspaceOrmManager.getRepositoryWithContextPermissions('lbProduct', scope);
        const variantRecords = this.workspaceOrmManager.getRepositoryWithContextPermissions('lbProductVariant', scope);
        const productId = id ?? command.operationKey;
        const existing = await products.findOne({ where: { id: productId } });
        if (id && !existing) throw new NotFoundException('Product unavailable');
        const history = historySchema.parse(existing?.auditEvents ?? []);
        const previous = history.find((entry) => entry.operationKey === command.operationKey);
        if (previous) {
          if (previous.requestHash !== requestHash) throw new ConflictException('Operation key already used with different catalogue details');
          return { id: productId };
        }
        if (!id && existing) throw new ConflictException('Creation key already used');
        if (existing && existing.version !== command.expectedVersion) throw new ConflictException('Product changed; reopen it before saving');
        const existingVariants = existing ? await variantRecords.find({ where: { productId }, take: 101 }) : [];
        if (existingVariants.length > 100 || existingVariants.some((variant) => !preparedVariants.some((candidate) => candidate.id === variant.id))) throw new BadRequestException('Keep existing variants in the editor; archive options instead of deleting their history');
        const suppliedIds = preparedVariants.flatMap((variant) => variant.id ? [variant.id] : []);
        if (new Set(suppliedIds).size !== suppliedIds.length || suppliedIds.some((variantId) => !existingVariants.some((variant) => variant.id === variantId))) throw new BadRequestException('Variant does not belong to this product');
        const auditEvents = [...history, { action: existing ? 'CATALOGUE_UPDATED' : 'PRODUCT_CREATED', actorId: auth.workspaceMemberId, at: new Date().toISOString(), operationKey: command.operationKey, requestHash }];
        if (existing) {
          const changed = await products.update({ id: productId, version: command.expectedVersion }, { ...product, version: existing.version + 1, auditEvents });
          if (changed.affected !== 1) throw new ConflictException('Product changed; reopen it before saving');
        } else await products.insert({ id: productId, ...product, version: 0, requestHash, auditEvents });
        for (const { canonical, id: variantId, ...variant } of preparedVariants) {
          const values = { ...variant, currency: product.currency, productId, name: `${product.name}${Object.values(variant.attributes).length ? ` · ${Object.values(variant.attributes).join(' / ')}` : ''}`, attributesKey: `${productId}:${createHash('sha256').update(canonical).digest('hex')}` };
          if (variantId) {
            const previousVariant = existingVariants.find((candidate) => candidate.id === variantId)!;
            if (previousVariant.tracksInventory && !variant.tracksInventory) {
              const balances = await this.workspaceOrmManager.getRepositoryWithContextPermissions('lbStockBalance', scope).find({ where: { variantId }, take: 1001 });
              if (balances.length > 1000 || balances.some((balance) => balance.onHandUnits !== 0 || balance.reservedUnits !== 0)) throw new ConflictException('Clear stock and reservations before disabling inventory tracking');
            }
            await variantRecords.update({ id: variantId, productId }, values);
          } else await variantRecords.insert({ id: randomUUID(), ...values });
        }
        return { id: productId };
      }), auth);
    } catch (failure) {
      if (isPostgresUniqueViolation(failure)) throw new ConflictException('Catalogue key raced with another request; reopen the product and retry');
      throw failure;
    }
  }
}
