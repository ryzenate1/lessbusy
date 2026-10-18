import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { buildActorMetadataFromAuthContext } from 'src/engine/core-modules/actor/utils/build-actor-metadata-from-auth-context.util';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { isPostgresUniqueViolation } from 'src/modules/lessbusy/utils/is-postgres-unique-violation.util';

const optionalText = (maximum: number) => z.string().trim().max(maximum).nullable();
const qualificationSchema = z.object({
  source: z.string().trim().max(250).nullable().default(null), assignedEmployeeId: z.string().uuid().nullable().default(null),
  name: z.string().trim().min(1).max(250), customerId: z.string().uuid().nullable(),
  temperature: z.enum(['COLD', 'WARM', 'HOT']), priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']),
  handlingStatus: z.enum(['AWAITING_BUSINESS', 'AWAITING_CUSTOMER', 'HUMAN_HANDLING', 'RESOLVED']),
  intent: optionalText(1000), productInterest: optionalText(1000), requestedQuantity: optionalText(100), budget: optionalText(250), urgency: optionalText(250),
  followUpRequired: z.boolean(), nextFollowUpAt: z.string().datetime({ offset: true }).nullable(), recommendedAction: optionalText(2000), protectManualQualification: z.boolean(),
}).strict();
const historySchema = z.array(z.object({ action: z.string(), actorId: z.string(), at: z.string(), operationKey: z.string().optional(), requestHash: z.string().optional(), taskId: z.string().optional() }).passthrough());
const audit = (action: string, actorId: string, details: Record<string, unknown> = {}) => ({ action, actorId, at: new Date().toISOString(), ...details });

@Injectable()
export class LessBusyLeadsService {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  private actor(auth: WorkspaceAuthContext) {
    if (auth.type !== 'user' || auth.agentId || auth.application || auth.viaApplication) throw new ForbiddenException('Lead reviews require an explicit workspace member action');
    return auth.workspaceMemberId;
  }

  async get(auth: WorkspaceAuthContext, id: string) {
    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const lead = await this.workspaceOrmManager.getRepositoryWithContextPermissions('lbLead').findOne({ where: { id } });
      if (!lead) throw new NotFoundException('Lead unavailable in your workspace access');
      return lead;
    }, auth);
  }

  async save(auth: WorkspaceAuthContext, id: string | null, input: unknown) {
    const actorId = this.actor(auth);
    const command = z.object({ confirmed: z.literal(true), operationKey: z.string().uuid(), expectedVersion: z.number().int().nonnegative().nullable(), qualification: qualificationSchema }).strict().parse(input);
    const { protectManualQualification, ...qualification } = command.qualification;
    const requestHash = createHash('sha256').update(JSON.stringify(command.qualification)).digest('hex');
    try {
      return await this.workspaceOrmManager.executeInWorkspaceContext(() => this.workspaceOrmManager.runInWorkspaceTransaction(async (scope) => {
        const leads = this.workspaceOrmManager.getRepositoryWithContextPermissions('lbLead', scope);
        const lead = await leads.findOne({ where: { id: id ?? command.operationKey } });
        if (!id && lead) {
          if (lead.requestHash !== requestHash) throw new ConflictException('Creation key already used with different lead details');
          return lead;
        }
        if (id && !lead) throw new NotFoundException('Lead unavailable');
        if (qualification.customerId && !await this.workspaceOrmManager.getRepositoryWithContextPermissions('person', scope).findOne({ where: { id: qualification.customerId }, select: { id: true } })) throw new NotFoundException('Customer unavailable in your workspace access');
        if (qualification.assignedEmployeeId && !await this.workspaceOrmManager.getRepositoryWithContextPermissions('workspaceMember', scope).findOne({ where: { id: qualification.assignedEmployeeId }, select: { id: true } })) throw new NotFoundException('Assigned employee unavailable in this workspace');
        const values = { ...qualification, classificationSource: protectManualQualification ? 'HUMAN' : 'RULES_PENDING', confidence: null, classifiedAt: new Date().toISOString() };
        if (!lead) {
          await leads.insert({ id: command.operationKey, ...values, requestHash, version: 0, reviewHistory: [audit('LEAD_CREATED', actorId)] });
          return leads.findOne({ where: { id: command.operationKey } });
        }
        const history = historySchema.parse(lead.reviewHistory ?? []);
        const previous = history.find((entry) => entry.operationKey === command.operationKey);
        if (previous) {
          if (previous.requestHash !== requestHash) throw new ConflictException('Review key already used with different details');
          return lead;
        }
        if (lead.version !== command.expectedVersion) throw new ConflictException('Lead changed; reload the current qualification before saving');
        const changed = await leads.update({ id, version: command.expectedVersion }, { ...values, version: lead.version + 1, reviewHistory: [...history, audit('QUALIFICATION_REVIEWED', actorId, { operationKey: command.operationKey, requestHash, protected: protectManualQualification })] });
        if (changed.affected !== 1) throw new ConflictException('Lead changed; reload it before saving');
        return leads.findOne({ where: { id } });
      }), auth);
    } catch (failure) {
      if (isPostgresUniqueViolation(failure)) throw new ConflictException('Lead creation key raced with another request; retry with the same key to review the recorded lead');
      throw failure;
    }
  }

  async convertToDeal(auth: WorkspaceAuthContext, leadId: string, input: unknown) {
    const actorId = this.actor(auth);
    const command = z.object({ confirmed: z.literal(true), expectedVersion: z.number().int().nonnegative(), operationKey: z.string().uuid(), name: z.string().trim().min(1).max(250), stage: z.string().trim().min(1).max(250), closeDate: z.string().datetime({ offset: true }).nullable(), amount: z.object({ currency: z.string().regex(/^[A-Z]{3}$/), amountMinor: z.string().regex(/^\d{1,18}$/) }).strict().nullable() }).strict().parse(input);
    const requestHash = createHash('sha256').update(JSON.stringify({ leadId, ...command })).digest('hex');
    return this.workspaceOrmManager.executeInWorkspaceContext(() => this.workspaceOrmManager.runInWorkspaceTransaction(async (scope) => {
      const leads = this.workspaceOrmManager.getRepositoryWithContextPermissions('lbLead', scope);
      const lead = await leads.findOne({ where: { id: leadId } });
      if (!lead) throw new NotFoundException('Lead unavailable');
      const opportunities = this.workspaceOrmManager.getRepositoryWithContextPermissions('opportunity', scope);
      const history = historySchema.parse(lead.reviewHistory ?? []);
      const previous = history.find((entry) => entry.operationKey === command.operationKey);
      if (previous && previous.requestHash !== requestHash) throw new ConflictException('Conversion key belongs to a different request');
      if (lead.convertedOpportunityId) {
        const deal = await opportunities.findOne({ where: { id: lead.convertedOpportunityId }, select: { id: true } });
        if (!deal) throw new NotFoundException('The linked deal is unavailable in your access');
        return { id: deal.id, alreadyConverted: true };
      }
      if (lead.version !== command.expectedVersion) throw new ConflictException('Lead changed; review it before conversion');
      if (!lead.customerId) throw new BadRequestException('Link a customer to this lead before converting it to a deal');
      const customer = await this.workspaceOrmManager.getRepositoryWithContextPermissions('person', scope).findOne({ where: { id: lead.customerId }, select: { id: true, companyId: true } });
      if (!customer) throw new NotFoundException('Linked customer unavailable');
      let amount: { amountMicros: number; currencyCode: string } | null = null;
      if (command.amount) {
        const decimals = new Intl.NumberFormat('en', { style: 'currency', currency: command.amount.currency }).resolvedOptions().maximumFractionDigits ?? 2;
        if (decimals > 6) throw new BadRequestException('Currency precision exceeds the deal amount format');
        const micros = BigInt(command.amount.amountMinor) * BigInt(10) ** BigInt(6 - decimals);
        if (micros > BigInt(Number.MAX_SAFE_INTEGER)) throw new BadRequestException('Deal amount exceeds the supported range');
        amount = { amountMicros: Number(micros), currencyCode: command.amount.currency };
      }
      const id = randomUUID();
      const actor = buildActorMetadataFromAuthContext(auth);
      await opportunities.insert({ id, name: command.name, stage: command.stage, pointOfContactId: customer.id, companyId: customer.companyId ?? null, ownerId: actorId, amount, closeDate: command.closeDate ? new Date(command.closeDate) : null, createdBy: actor, updatedBy: actor });
      const changed = await leads.update({ id: leadId, version: command.expectedVersion }, { convertedOpportunityId: id, version: lead.version + 1, reviewHistory: [...history, audit('CONVERTED_TO_DEAL', actorId, { operationKey: command.operationKey, requestHash, opportunityId: id })] });
      if (changed.affected !== 1) throw new ConflictException('Lead changed; review it before conversion');
      if (lead.lastFollowUpTaskId) {
        const task = await this.workspaceOrmManager.getRepositoryWithContextPermissions('task', scope).findOne({ where: { id: lead.lastFollowUpTaskId }, select: { id: true } });
        if (task) await this.workspaceOrmManager.getRepositoryWithContextPermissions('taskTarget', scope).insert({ id: randomUUID(), taskId: task.id, targetOpportunityId: id });
      }
      return { id, alreadyConverted: false };
    }), auth);
  }

  async followUp(auth: WorkspaceAuthContext, leadId: string, input: unknown) {
    const actorId = this.actor(auth);
    const command = z.object({ confirmed: z.literal(true), operationKey: z.string().uuid(), expectedVersion: z.number().int().nonnegative(), title: z.string().trim().min(1).max(250), dueAt: z.string().datetime({ offset: true }) }).strict().parse(input);
    const requestHash = createHash('sha256').update(JSON.stringify({ leadId, title: command.title, dueAt: command.dueAt })).digest('hex');
    return this.workspaceOrmManager.executeInWorkspaceContext(() => this.workspaceOrmManager.runInWorkspaceTransaction(async (scope) => {
      const leads = this.workspaceOrmManager.getRepositoryWithContextPermissions('lbLead', scope);
      const lead = await leads.findOne({ where: { id: leadId } });
      if (!lead) throw new NotFoundException('Lead unavailable');
      const history = historySchema.parse(lead.reviewHistory ?? []);
      const tasks = this.workspaceOrmManager.getRepositoryWithContextPermissions('task', scope);
      const previous = history.find((entry) => entry.operationKey === command.operationKey);
      if (previous) {
        if (previous.requestHash !== requestHash || !previous.taskId) throw new ConflictException('Operation key already used with different details');
        const task = await tasks.findOne({ where: { id: previous.taskId }, select: { id: true } });
        if (!task) throw new NotFoundException('The previously created task is no longer available');
        return { taskId: task.id };
      }
      if (lead.version !== command.expectedVersion) throw new ConflictException('Lead changed; reload it before creating a follow-up');
      if (lead.customerId && !await this.workspaceOrmManager.getRepositoryWithContextPermissions('person', scope).findOne({ where: { id: lead.customerId }, select: { id: true } })) throw new NotFoundException('Linked customer unavailable');
      const taskId = randomUUID();
      const changed = await leads.update({ id: leadId, version: command.expectedVersion }, { nextFollowUpAt: command.dueAt, followUpRequired: true, lastFollowUpTaskId: taskId, version: lead.version + 1, reviewHistory: [...history, audit('FOLLOW_UP_CREATED', actorId, { operationKey: command.operationKey, requestHash, taskId })] });
      if (changed.affected !== 1) throw new ConflictException('Lead changed; reload it before creating a follow-up');
      const actor = buildActorMetadataFromAuthContext(auth);
      await tasks.insert({ id: taskId, title: command.title, dueAt: new Date(command.dueAt), status: 'TODO', assigneeId: actorId, createdBy: actor, updatedBy: actor });
      if (lead.customerId) await this.workspaceOrmManager.getRepositoryWithContextPermissions('taskTarget', scope).insert({ id: randomUUID(), taskId, targetPersonId: lead.customerId });
      return { taskId };
    }), auth);
  }
}
