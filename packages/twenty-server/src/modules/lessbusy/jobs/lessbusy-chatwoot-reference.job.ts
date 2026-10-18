import { fromWorkspaceEntityToFlat } from 'src/engine/core-modules/workspace/utils/from-workspace-entity-to-flat.util';
import { LessBusyChatwootConnectionStore } from 'src/modules/lessbusy/chatwoot/lessbusy-chatwoot-connection.store';
import { ConflictException, Logger, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { IsNull, Repository } from 'typeorm';
import { z } from 'zod';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { ApplicationEntity } from 'src/engine/core-modules/application/application.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { withWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { buildApplicationAuthContext } from 'src/engine/core-modules/auth/utils/build-application-auth-context.util';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { LessBusyChatwootService } from 'src/modules/lessbusy/chatwoot/lessbusy-chatwoot.service';
import { classifyLeadMessage } from 'src/modules/lessbusy/utils/classify-lead-message.util';
import { isPostgresUniqueViolation } from 'src/modules/lessbusy/utils/is-postgres-unique-violation.util';

const jobSchema = z.object({ connectionId: z.string().uuid(), workspaceId: z.string().uuid(), conversationId: z.number().int().positive().safe(), inboxId: z.number().int().positive().safe(), event: z.string(), eventKey: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
const conversationSchema = z.object({ id: z.number(), inbox_id: z.number(), status: z.string(), meta: z.object({ sender: z.object({ id: z.number().optional(), name: z.string().nullable().optional() }).passthrough().optional() }).passthrough().optional() }).passthrough();

@Processor({ queueName: MessageQueue.webhookQueue, scope: Scope.REQUEST })
export class LessBusyChatwootReferenceJob {
  private readonly logger = new Logger(LessBusyChatwootReferenceJob.name);
  constructor(private readonly connectionStore: LessBusyChatwootConnectionStore, private readonly chatwoot: LessBusyChatwootService, private readonly workspaceOrmManager: WorkspaceOrmManager, @InjectRepository(ApplicationEntity) private readonly applications: Repository<ApplicationEntity>, @InjectRepository(WorkspaceEntity) private readonly workspaces: Repository<WorkspaceEntity>) {}

  @Process('LessBusyChatwootReferenceJob')
  async handle(rawData: unknown) {
    const data = jobSchema.parse(rawData);
    const connection = await this.chatwoot.getConnectionById(data.connectionId);
    if (connection.workspaceId !== data.workspaceId || !connection.inboxIds.includes(data.inboxId)) throw new Error('Chatwoot job binding is no longer valid');
    const [workspace, application] = await Promise.all([this.workspaces.findOneBy({ id: connection.workspaceId }), this.applications.findOneBy({ id: connection.applicationId, workspaceId: connection.workspaceId })]);
    if (!workspace || !application || application.universalIdentifier !== '21ec822f-cd03-4479-a8f8-e5cdd0c0670a') throw new Error('Chatwoot workspace application unavailable');
    const auth = buildApplicationAuthContext({ workspace: fromWorkspaceEntityToFlat(workspace), application });
    try {
    const conversation = conversationSchema.parse(await this.chatwoot.call(connection, `/conversations/${data.conversationId}`));
    if (conversation.id !== data.conversationId || conversation.inbox_id !== data.inboxId) throw new Error('Chatwoot conversation binding mismatch');
    const messageResponse = z.object({ payload: z.array(z.object({ id: z.number().int().positive().safe(), created_at: z.number().optional(), content: z.string().nullable(), private: z.boolean(), message_type: z.union([z.number(), z.string()]) }).passthrough()) }).parse(await this.chatwoot.call(connection, `/conversations/${data.conversationId}/messages`));
    const message = messageResponse.payload.filter((item) => !item.private && (item.message_type === 0 || item.message_type === 'incoming')).sort((a, b) => b.id - a.id)[0];
    const lastPublicMessage = messageResponse.payload.filter((item) => !item.private && [0, 1, 3, 'incoming', 'outgoing', 'template'].includes(item.message_type)).sort((left, right) => right.id - left.id)[0];
    const qualification = message?.content ? classifyLeadMessage(message.content) : null;
    await withWorkspaceAuthContext(auth, () => this.workspaceOrmManager.executeInWorkspaceContext(() => this.workspaceOrmManager.runInWorkspaceTransaction(async (scope) => {
      const events = this.workspaceOrmManager.getRepositoryWithContextPermissions('lbIntegrationEvent', scope);
      if (await events.findOne({ where: { externalKey: data.eventKey } })) return;
      const references = this.workspaceOrmManager.getRepositoryWithContextPermissions('lbConversationReference', scope);
      const externalKey = `${connection.id}:${data.conversationId}`;
      const existing = await references.findOne({ where: { externalKey } });
      const freshQualification = message && (!existing?.classifiedMessageId || BigInt(message.id) > BigInt(String(existing.classifiedMessageId))) ? qualification : null;
      const freshMessage = lastPublicMessage && (!existing?.lastMessageId || BigInt(lastPublicMessage.id) >= BigInt(String(existing.lastMessageId))) ? lastPublicMessage : null;
      const awaitingReply = freshMessage ? (freshMessage.message_type === 0 || freshMessage.message_type === 'incoming' ? 'AWAITING_BUSINESS' : 'AWAITING_CUSTOMER') : existing?.replyStatus ?? 'AWAITING_BUSINESS';
      const replyStatus = conversation.status === 'resolved' ? 'RESOLVED' : awaitingReply;
      const handlingStatus = conversation.status === 'resolved' ? 'RESOLVED' : existing?.handlingStatus === 'HUMAN_HANDLING' || freshQualification?.requiresHumanReview ? 'HUMAN_HANDLING' : 'AWAITING_BUSINESS';
      const record = { name: conversation.meta?.sender?.name || `Conversation ${data.conversationId}`, externalKey, conversationId: String(data.conversationId), connectionId: connection.id, inboxId: data.inboxId, accountId: connection.accountId, contactId: conversation.meta?.sender?.id ? String(conversation.meta.sender.id) : null, handlingStatus, replyStatus, ...(freshMessage ? { lastMessageId: String(freshMessage.id), ...(freshMessage.created_at ? { lastMessageAt: new Date(freshMessage.created_at * 1000).toISOString() } : {}) } : {}), ...(message && (!existing?.classifiedMessageId || BigInt(message.id) >= BigInt(String(existing.classifiedMessageId))) ? { classifiedMessageId: String(message.id) } : {}), ...(freshQualification ? { qualification: freshQualification } : {}), lastSyncedAt: new Date().toISOString() };
      if (existing) {
        const changed = await references.update({ id: existing.id, version: existing.version }, { ...record, version: Number(existing.version) + 1 });
        if (changed.affected !== 1) throw new ConflictException('Conversation changed during synchronization; retry the event');
      } else {
        const identity = record.contactId ? await this.workspaceOrmManager.getRepositoryWithContextPermissions('lbContactIdentity', scope).findOne({ where: { externalKey: `${connection.id}:${record.contactId}` }, select: { customerId: true } }) : null;
        const customer = identity?.customerId ? await this.workspaceOrmManager.getRepositoryWithContextPermissions('person', scope).findOne({ where: { id: identity.customerId }, select: { id: true } }) : null;
        await references.insert({ id: randomUUID(), version: 0, ...record, customerId: customer?.id ?? null });
      }
      if (existing?.leadId && qualification && message && (!existing.classifiedMessageId || BigInt(message.id) > BigInt(String(existing.classifiedMessageId)))) {
        const leads = this.workspaceOrmManager.getRepositoryWithContextPermissions('lbLead', scope);
        const lead = await leads.findOne({ where: { id: existing.leadId } });
        if (lead && lead.classificationSource !== 'HUMAN') {
          const classifiedAt = new Date().toISOString();
          const changed = await leads.update({ id: lead.id, version: lead.version, classificationSource: lead.classificationSource ?? IsNull() }, { version: Number(lead.version) + 1, temperature: qualification.temperature, intent: qualification.intent, productInterest: qualification.productInterest, requestedQuantity: qualification.requestedQuantity, budget: qualification.budget, urgency: qualification.urgency, followUpRequired: qualification.followUpRequired, recommendedAction: qualification.recommendedAction, confidence: qualification.confidence, priority: qualification.priority, classificationSource: qualification.classificationSource, classifiedAt, auditEvents: [...(Array.isArray(lead.auditEvents) ? lead.auditEvents : []), { action: 'MESSAGE_QUALIFIED', actorId: application.id, at: classifiedAt, messageId: String(message.id), classifierVersion: qualification.classifierVersion }] });
          if (changed.affected !== 1) throw new ConflictException('Lead changed during qualification; retry the event');
        }
      }
      await events.insert({ id: randomUUID(), name: data.event, externalKey: data.eventKey, connectionId: data.connectionId, eventType: data.event, processedAt: new Date().toISOString() });
    }), auth));
      try { await this.connectionStore.recordSyncAttempt(auth, connection.id, data.eventKey, data.event, true); } catch { this.logger.warn('LessBusy integration activity could not be recorded'); }
    } catch (failure) {
      try { await this.connectionStore.recordSyncAttempt(auth, connection.id, data.eventKey, data.event, false); } catch { this.logger.warn('LessBusy integration activity could not be recorded'); }
      if (isPostgresUniqueViolation(failure)) throw new ConflictException('Chatwoot event already recorded by another worker; a retry converges on the stored event');
      throw failure;
    }
  }
}
