import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { buildActorMetadataFromAuthContext } from 'src/engine/core-modules/actor/utils/build-actor-metadata-from-auth-context.util';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { isPostgresUniqueViolation } from 'src/modules/lessbusy/utils/is-postgres-unique-violation.util';

@Injectable()
export class LessBusyTasksService {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  async create(auth: WorkspaceAuthContext, input: unknown) {
    if (auth.type !== 'user' || auth.agentId || auth.application || auth.viaApplication) throw new ForbiddenException('Task proposals must be confirmed by a workspace member');
    const command = z.object({ confirmed: z.literal(true), operationKey: z.string().uuid(), task: z.object({ title: z.string().trim().min(1).max(250), description: z.string().max(10000).default(''), priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).default('NORMAL'), dueAt: z.string().datetime({ offset: true }).optional(), reminderAt: z.string().datetime({ offset: true }).optional(), assigneeId: z.string().uuid().optional(), customerId: z.string().uuid().optional(), opportunityId: z.string().uuid().optional() }).strict() }).strict().parse(input);
    const requestHash = createHash('sha256').update(JSON.stringify({ task: command.task, actorId: auth.workspaceMemberId })).digest('hex');
    try {
      return await this.workspaceOrmManager.executeInWorkspaceContext(() => this.workspaceOrmManager.runInWorkspaceTransaction(async (scope) => {
        const tasks = this.workspaceOrmManager.getRepositoryWithContextPermissions('task', scope);
        const previous = await tasks.findOne({ where: { id: command.operationKey } });
        if (previous) {
          if (previous.lbOperationHash !== requestHash) throw new ConflictException('Task creation key already used with different details');
          return { id: previous.id };
        }
        if (command.task.customerId && !await this.workspaceOrmManager.getRepositoryWithContextPermissions('person', scope).findOne({ where: { id: command.task.customerId }, select: { id: true } })) throw new NotFoundException('Customer unavailable');
        if (command.task.opportunityId) {
          const deal = await this.workspaceOrmManager.getRepositoryWithContextPermissions('opportunity', scope).findOne({ where: { id: command.task.opportunityId }, select: { id: true, pointOfContactId: true } });
          if (!deal) throw new NotFoundException('Deal unavailable');
          if (command.task.customerId && deal.pointOfContactId && deal.pointOfContactId !== command.task.customerId) throw new BadRequestException('Choose a deal for the selected customer');
        }
        if (command.task.assigneeId && !await this.workspaceOrmManager.getRepositoryWithContextPermissions('workspaceMember', scope).findOne({ where: { id: command.task.assigneeId }, select: { id: true } })) throw new NotFoundException('Task assignee unavailable');
        if (command.task.reminderAt && command.task.dueAt && new Date(command.task.reminderAt) > new Date(command.task.dueAt)) throw new BadRequestException('Set the reminder on or before the due date');
        const actor = buildActorMetadataFromAuthContext(auth);
        await tasks.insert({ id: command.operationKey, title: command.task.title, bodyV2: { blocknote: null, markdown: command.task.description }, dueAt: command.task.dueAt ? new Date(command.task.dueAt) : null, status: 'TODO', assigneeId: command.task.assigneeId ?? auth.workspaceMemberId, ...(command.task.reminderAt ? { lbReminderAt: new Date(command.task.reminderAt), lbReminderAcknowledgedAt: null } : {}), lbPriority: command.task.priority, lbOperationHash: requestHash, createdBy: actor, updatedBy: actor });
        const targets = this.workspaceOrmManager.getRepositoryWithContextPermissions('taskTarget', scope);
        if (command.task.customerId) await targets.insert({ id: randomUUID(), taskId: command.operationKey, targetPersonId: command.task.customerId });
        if (command.task.opportunityId) await targets.insert({ id: randomUUID(), taskId: command.operationKey, targetOpportunityId: command.task.opportunityId });
        return { id: command.operationKey };
      }), auth);
    } catch (failure) {
      if (isPostgresUniqueViolation(failure)) throw new ConflictException('Task creation key raced with another request; retry with the same key to review the recorded task');
      throw failure;
    }
  }

  async reminder(auth: WorkspaceAuthContext, id: string, input: unknown) {
    if (auth.type !== 'user' || auth.agentId || auth.application || auth.viaApplication) throw new ForbiddenException('Reminder changes require a workspace member');
    const command = z.object({ expectedUpdatedAt: z.string().datetime({ offset: true }), action: z.discriminatedUnion('kind', [z.object({ kind: z.literal('acknowledge') }).strict(), z.object({ kind: z.literal('snooze'), until: z.string().datetime({ offset: true }) }).strict()]) }).strict().parse(input);
    if (command.action.kind === 'snooze' && new Date(command.action.until).getTime() <= Date.now()) throw new BadRequestException('Choose a future reminder time');
    return this.workspaceOrmManager.executeInWorkspaceContext(() => this.workspaceOrmManager.runInWorkspaceTransaction(async (scope) => {
      const tasks = this.workspaceOrmManager.getRepositoryWithContextPermissions('task', scope);
      const task = await tasks.findOne({ where: { id }, select: { id: true, assigneeId: true, updatedAt: true, status: true } });
      if (!task) throw new NotFoundException('Task unavailable');
      if (task.assigneeId !== auth.workspaceMemberId) throw new ForbiddenException('Only the assigned employee can acknowledge or snooze this reminder');
      if (task.status === 'DONE') throw new ConflictException('This task is already complete');
      const changed = await tasks.update({ id, updatedAt: new Date(command.expectedUpdatedAt) }, { ...(command.action.kind === 'snooze' ? { lbReminderAt: new Date(command.action.until), lbReminderAcknowledgedAt: null } : { lbReminderAcknowledgedAt: new Date() }), updatedBy: buildActorMetadataFromAuthContext(auth) });
      if (changed.affected !== 1) throw new ConflictException('Task changed; reload before updating the reminder');
      return { id };
    }), auth);
  }

}
