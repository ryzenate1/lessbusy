import { LessBusyChatwootConnectionStore } from 'src/modules/lessbusy/chatwoot/lessbusy-chatwoot-connection.store';
import { SecureHttpClientService } from 'src/engine/core-modules/secure-http-client/secure-http-client.service';
import { BadGatewayException, ConflictException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { z } from 'zod';
import { createHash, randomUUID } from 'node:crypto';
import { buildActorMetadataFromAuthContext } from 'src/engine/core-modules/actor/utils/build-actor-metadata-from-auth-context.util';
import { In } from 'typeorm';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { chatwootConnectionSchema } from 'src/modules/lessbusy/chatwoot/chatwoot-connection.schema';
import { isPostgresUniqueViolation } from 'src/modules/lessbusy/utils/is-postgres-unique-violation.util';

const conversationSchema = z.object({ id: z.number().int().positive().safe(), inbox_id: z.number().int().positive().safe(), status: z.string(), meta: z.object({ sender: z.object({ name: z.string().nullable().optional() }).passthrough().optional() }).passthrough().optional() }).passthrough();

@Injectable()
export class LessBusyChatwootService {
  constructor(private readonly connectionStore: LessBusyChatwootConnectionStore, private readonly secureHttp: SecureHttpClientService, private readonly configuration: TwentyConfigService, private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  private connections() {
    const connections = z.array(chatwootConnectionSchema).max(10000).parse(this.configuration.get('LESSBUSY_CHATWOOT_CONNECTIONS'));
    const ids = connections.map((connection) => connection.id);
    if (new Set(ids).size !== ids.length) throw new ServiceUnavailableException('Chatwoot connection IDs must be unique');
    for (const connection of connections) {
      const url = new URL(connection.baseUrl);
      if (url.username || url.password || url.search || url.hash || !['http:', 'https:'].includes(url.protocol)) throw new ServiceUnavailableException('Invalid Chatwoot endpoint configuration');
      if (url.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new ServiceUnavailableException('Remote Chatwoot connections require HTTPS');
    }
    const accountBindings = connections.filter((connection) => connection.enabled).map((connection) => `${new URL(connection.baseUrl).origin}:${connection.accountId}`);
    if (new Set(accountBindings).size !== accountBindings.length) throw new ServiceUnavailableException('A Chatwoot account cannot be bound to multiple workspaces');
    return connections;
  }

  async getConnectionById(id: string) {
    const stored = await this.connectionStore.getById(id);
    const environment = this.connections();
    const configured = environment.find((candidate) => candidate.id === id);
    const connection = configured ? (configured.enabled ? configured : undefined) : stored?.connection.enabled && !environment.some((candidate) => candidate.workspaceId === stored.connection.workspaceId) ? stored.connection : undefined;
    if (!connection) throw new NotFoundException('Chatwoot connection unavailable');
    await this.connectionStore.assertAccountBinding(connection);
    return connection;
  }

  async getWorkspaceConnection(workspaceId: string) {
    const configured = this.connections().filter((connection) => connection.workspaceId === workspaceId);
    if (configured.length === 1 && !configured[0].enabled) return undefined;
    if (configured.length > 1) throw new ServiceUnavailableException('Configure one Chatwoot account per workspace');
    if (configured.length) { await this.connectionStore.assertAccountBinding(configured[0]); return configured[0].enabled ? configured[0] : undefined; }
    const stored = await this.connectionStore.getByWorkspace(workspaceId);
    if (stored?.connection.enabled) { await this.connectionStore.assertAccountBinding(stored.connection); return stored.connection; }
    return undefined;
  }

  async call(connection: z.infer<typeof chatwootConnectionSchema>, path: string, method = 'GET', body?: unknown): Promise<unknown> {
    if (!/^\/(conversations|inboxes)([/?]|$)/.test(path)) throw new ForbiddenException('Unregistered Chatwoot API path');
    const url = `${connection.baseUrl.replace(/\/$/, '')}/api/v1/accounts/${connection.accountId}${path}`;
    try {
      const response = await this.secureHttp.getHttpClient({ timeout: 15000, retries: 0, maxRedirects: 0, maxContentLength: 2097152 }).request({ url, method, headers: { api_access_token: connection.apiToken, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { data: body }) });
      return response.data;
    } catch { throw new BadGatewayException('Chatwoot request failed. Review the connection and allowed outbound hosts.'); }
  }

  async adminHealth(auth: WorkspaceAuthContext) {
    const connection = await this.connectionStore.getAdminConnection(auth);
    if (!connection) return { connected: false, message: 'Save connection settings before checking the account.' };
    await this.connectionStore.assertAccountBinding(connection);
    try {
      const result = z.object({ payload: z.array(z.object({ id: z.number(), name: z.string() }).passthrough()) }).parse(await this.call(connection, '/inboxes'));
      return { connected: true, inboxes: result.payload.map((inbox) => ({ id: inbox.id, name: inbox.name, enabled: connection.inboxIds.includes(inbox.id) })) };
    } catch { return { connected: false, message: 'Connection check failed. Review the URL, account, credentials and allowed outbound hosts.' }; }
  }

  async status(auth: WorkspaceAuthContext) {
    const connection = await this.getWorkspaceConnection(auth.workspace.id);
    if (!connection) return { configured: false, connected: false };
    await this.workspaceOrmManager.executeInWorkspaceContext(() => this.workspaceOrmManager.getRepositoryWithContextPermissions('lbConversationReference').find({ take: 1, select: { id: true } }), auth);
    try {
      await this.call(connection, '/inboxes');
      return { configured: true, connected: true, connectionId: connection.id, inboxCount: connection.inboxIds.length };
    } catch {
      return { configured: true, connected: false, message: 'Chatwoot could not be reached. Ask an administrator to review the connection.' };
    }
  }

  async list(auth: WorkspaceAuthContext, page: number, view: 'all' | 'awaiting_business' | 'human' | 'resolved' = 'all') {
    const connection = await this.getWorkspaceConnection(auth.workspace.id);
    if (!connection) return { configured: false, conversations: [] };
    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const references = this.workspaceOrmManager.getRepositoryWithContextPermissions('lbConversationReference');
      await references.find({ take: 1, select: { id: true } });
      const response = z.object({ data: z.object({ payload: z.array(conversationSchema) }) }).parse(await this.call(connection, `/conversations?status=all&page=${page}`));
      const conversations = response.data.payload.filter((conversation) => connection.inboxIds.includes(conversation.inbox_id));
      if (!conversations.length) return { configured: true, conversations: [], hasMore: response.data.payload.length > 0 };
      const allowed = await references.find({ where: { externalKey: In(conversations.map((conversation) => `${connection.id}:${conversation.id}`)), ...(view === 'awaiting_business' ? { replyStatus: 'AWAITING_BUSINESS' } : view === 'human' ? { handlingStatus: 'HUMAN_HANDLING' } : view === 'resolved' ? { replyStatus: 'RESOLVED' } : {}) }, take: 100, select: { externalKey: true, handlingStatus: true, replyStatus: true, lastMessageAt: true } });
      const allowedByKey = new Map(allowed.map((reference) => [reference.externalKey, reference]));
      return { configured: true, hasMore: response.data.payload.length > 0, conversations: conversations.flatMap((conversation) => {
        const reference = allowedByKey.get(`${connection.id}:${conversation.id}`);
        return reference ? [{ id: conversation.id, inboxId: conversation.inbox_id, status: conversation.status, customerName: conversation.meta?.sender?.name ?? '', handlingStatus: reference.handlingStatus, replyStatus: reference.replyStatus, lastMessageAt: reference.lastMessageAt }] : [];
      }) };
    }, auth);
  }

  async authorizeConversation(auth: WorkspaceAuthContext, conversationId: number) {
    const connection = await this.getWorkspaceConnection(auth.workspace.id);
    if (!connection) throw new NotFoundException('Connect Chatwoot first');
    const reference = await this.workspaceOrmManager.executeInWorkspaceContext(() => this.workspaceOrmManager.getRepositoryWithContextPermissions('lbConversationReference').findOne({ where: { externalKey: `${connection.id}:${conversationId}` } }), auth);
    if (!reference) throw new NotFoundException('Conversation unavailable in your workspace access');
    const conversation = conversationSchema.parse(await this.call(connection, `/conversations/${conversationId}`));
    if (!connection.inboxIds.includes(conversation.inbox_id)) throw new ForbiddenException('Inbox is not enabled for this workspace');
    return { connection, reference, conversation };
  }

  async messages(auth: WorkspaceAuthContext, conversationId: number, before?: number) {
    const { connection } = await this.authorizeConversation(auth, conversationId);
    const response = z.object({ payload: z.array(z.object({ id: z.number().int().safe(), content: z.string().nullable(), private: z.boolean(), message_type: z.union([z.number(), z.string()]), created_at: z.number().optional() }).passthrough()) }).parse(await this.call(connection, `/conversations/${conversationId}/messages${before ? `?before=${before}` : ''}`));
    return { messages: response.payload.filter((message) => !message.private).map((message) => ({ id: message.id, content: message.content ?? '', type: message.message_type, createdAt: message.created_at })), hasMore: response.payload.length > 0 };
  }

  async crmLink(auth: WorkspaceAuthContext, conversationId: number) {
    const { reference } = await this.authorizeConversation(auth, conversationId);
    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const identity = reference.contactId ? await this.workspaceOrmManager.getRepositoryWithContextPermissions('lbContactIdentity').findOne({ where: { externalKey: `${reference.connectionId}:${reference.contactId}` }, select: { customerId: true, version: true } }) : null;
      return { customerId: reference.customerId ?? null, leadId: reference.leadId ?? null, version: reference.version, canRememberContact: Boolean(reference.contactId), identityVersion: identity?.version ?? null, identityCustomerId: identity?.customerId ?? null };
    }, auth);
  }

  async updateCrmLink(auth: WorkspaceAuthContext, conversationId: number, input: unknown) {
    if (auth.type !== 'user' || auth.agentId || auth.application || auth.viaApplication) throw new ForbiddenException('Linking records requires a workspace member');
    const command = z.object({ confirmed: z.literal(true), customerId: z.string().uuid().nullable(), leadId: z.string().uuid().nullable(), expectedVersion: z.number().int().nonnegative(), rememberContact: z.boolean().default(false), expectedIdentityVersion: z.number().int().nonnegative().nullable().default(null) }).strict().parse(input);
    const { connection } = await this.authorizeConversation(auth, conversationId);
    try {
      return await this.workspaceOrmManager.executeInWorkspaceContext(() => this.workspaceOrmManager.runInWorkspaceTransaction(async (scope) => {
        const references = this.workspaceOrmManager.getRepositoryWithContextPermissions('lbConversationReference', scope);
        const reference = await references.findOne({ where: { externalKey: `${connection.id}:${conversationId}` } });
        if (!reference) throw new NotFoundException('Conversation unavailable');
        if (reference.version !== command.expectedVersion) throw new ConflictException('Conversation changed; reload the linked records before saving');
        if (command.customerId && !await this.workspaceOrmManager.getRepositoryWithContextPermissions('person', scope).findOne({ where: { id: command.customerId }, select: { id: true } })) throw new NotFoundException('Customer unavailable in your workspace access');
        if (command.leadId) {
          const lead = await this.workspaceOrmManager.getRepositoryWithContextPermissions('lbLead', scope).findOne({ where: { id: command.leadId }, select: { id: true, customerId: true } });
          if (!lead) throw new NotFoundException('Lead unavailable in your workspace access');
          if (lead.customerId && lead.customerId !== command.customerId) throw new ConflictException('Choose the customer attached to this lead before linking it');
        }
        let identityVersion: number | null = null;
        if (command.rememberContact) {
          if (!reference.contactId) throw new ConflictException('This conversation has no verified provider contact identity yet');
          const identities = this.workspaceOrmManager.getRepositoryWithContextPermissions('lbContactIdentity', scope);
          const externalKey = `${connection.id}:${reference.contactId}`;
          const identity = await identities.findOne({ where: { externalKey } });
          if ((identity?.version ?? null) !== command.expectedIdentityVersion) throw new ConflictException('Contact mapping changed; reload the links before saving');
          if (identity) {
            const changed = await identities.update({ id: identity.id, version: command.expectedIdentityVersion }, { customerId: command.customerId, actorId: auth.workspaceMemberId, version: identity.version + 1 });
            if (changed.affected !== 1) throw new ConflictException('Contact mapping changed; reload before saving');
            identityVersion = identity.version + 1;
          } else {
            await identities.insert({ id: randomUUID(), name: `Contact ${reference.contactId}`, externalKey, connectionId: connection.id, contactId: reference.contactId, customerId: command.customerId, actorId: auth.workspaceMemberId, version: 0 });
            identityVersion = 0;
          }
        }
        const changed = await references.update({ id: reference.id, version: reference.version }, { customerId: command.customerId, leadId: command.leadId, version: command.expectedVersion + 1 });
        if (changed.affected !== 1) throw new ConflictException('Conversation changed; reload the linked records before saving');
        const saved = await references.findOne({ where: { id: reference.id }, select: { customerId: true, leadId: true, version: true } });
        return { ...saved, canRememberContact: Boolean(reference.contactId), identityVersion: command.rememberContact ? identityVersion : command.expectedIdentityVersion, identityCustomerId: command.rememberContact ? command.customerId : null };
      }), auth);
    } catch (failure) {
      if (isPostgresUniqueViolation(failure)) throw new ConflictException('Contact mapping raced with another request; reload the links before saving');
      throw failure;
    }
  }

  async createCustomer(auth: WorkspaceAuthContext, conversationId: number, input: unknown) {
    if (auth.type !== 'user' || auth.agentId || auth.application || auth.viaApplication) throw new ForbiddenException('Customer creation requires a workspace member');
    const command = z.object({ confirmed: z.literal(true), operationKey: z.string().uuid(), expectedVersion: z.number().int().nonnegative(), firstName: z.string().trim().min(1).max(150), lastName: z.string().trim().max(150).default(''), rememberContact: z.boolean().default(false), expectedIdentityVersion: z.number().int().nonnegative().nullable().default(null) }).strict().parse(input);
    const { connection } = await this.authorizeConversation(auth, conversationId);
    const hash = createHash('sha256').update(JSON.stringify({ connectionId: connection.id, conversationId, firstName: command.firstName, lastName: command.lastName, rememberContact: command.rememberContact, actorId: auth.workspaceMemberId })).digest('hex');
    try {
      return await this.workspaceOrmManager.executeInWorkspaceContext(() => this.workspaceOrmManager.runInWorkspaceTransaction(async (scope) => {
        const references = this.workspaceOrmManager.getRepositoryWithContextPermissions('lbConversationReference', scope);
        const reference = await references.findOne({ where: { externalKey: `${connection.id}:${conversationId}` } });
        if (!reference) throw new NotFoundException('Conversation unavailable');
        const people = this.workspaceOrmManager.getRepositoryWithContextPermissions('person', scope);
        const previous = await people.findOne({ where: { id: command.operationKey }, select: { id: true, lbImportHash: true } });
        if (previous) {
          if (previous.lbImportHash !== hash || reference.customerId !== previous.id) throw new ConflictException('Customer creation key already used or this conversation was relinked');
          return { customerId: previous.id };
        }
        if (reference.customerId) throw new ConflictException('This conversation already has a customer. Open or update the linked customer instead.');
        if (reference.version !== command.expectedVersion) throw new ConflictException('Conversation changed. Reload its CRM links before creating a customer.');
        if (reference.leadId) {
          const lead = await this.workspaceOrmManager.getRepositoryWithContextPermissions('lbLead', scope).findOne({ where: { id: reference.leadId }, select: { id: true, customerId: true } });
          if (!lead || lead.customerId) throw new ConflictException('Review the linked lead and its customer before creating another customer.');
        }
        if (command.rememberContact) {
          if (!reference.contactId) throw new ConflictException('A verified messaging contact is required to remember this customer');
          const identities = this.workspaceOrmManager.getRepositoryWithContextPermissions('lbContactIdentity', scope);
          const externalKey = `${connection.id}:${reference.contactId}`;
          const identity = await identities.findOne({ where: { externalKey } });
          if (identity?.customerId) throw new ConflictException('This messaging contact already has a remembered customer. Review that customer before creating another.');
          if ((identity?.version ?? null) !== command.expectedIdentityVersion) throw new ConflictException('Contact mapping changed. Reload the conversation links.');
          if (identity) {
            const changed = await identities.update({ id: identity.id, version: identity.version }, { customerId: command.operationKey, actorId: auth.workspaceMemberId, version: identity.version + 1 });
            if (changed.affected !== 1) throw new ConflictException('Contact mapping changed. Reload before creating a customer.');
          } else await identities.insert({ id: randomUUID(), name: `Contact ${reference.contactId}`, externalKey, connectionId: connection.id, contactId: reference.contactId, customerId: command.operationKey, actorId: auth.workspaceMemberId, version: 0 });
        }
        const actor = buildActorMetadataFromAuthContext(auth);
        await people.insert({ id: command.operationKey, name: { firstName: command.firstName, lastName: command.lastName }, lbSource: 'Chatwoot', lbImportHash: hash, createdBy: actor, updatedBy: actor });
        const changed = await references.update({ id: reference.id, version: reference.version }, { customerId: command.operationKey, version: reference.version + 1 });
        if (changed.affected !== 1) throw new ConflictException('Conversation changed. Reload before creating a customer.');
        return { customerId: command.operationKey };
      }), auth);
    } catch (failure) {
      if (isPostgresUniqueViolation(failure)) throw new ConflictException('Customer creation key raced with another request; reload the conversation links before retrying');
      throw failure;
    }
  }

  async handoff(auth: WorkspaceAuthContext, conversationId: number) {
    if (auth.type !== 'user' || auth.agentId || auth.application || auth.viaApplication) throw new ForbiddenException('Handoff requires a workspace member');
    const { connection, reference } = await this.authorizeConversation(auth, conversationId);
    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const changed = await this.workspaceOrmManager.getRepositoryWithContextPermissions('lbConversationReference').update({ id: reference.id, version: reference.version }, { handlingStatus: 'HUMAN_HANDLING', version: Number(reference.version) + 1 });
      if (changed.affected !== 1) throw new ConflictException('Conversation changed; reload it before handing off');
    }, auth);
    await this.call(connection, `/conversations/${conversationId}/toggle_status`, 'POST', { status: 'open' });
    return { status: 'HUMAN_HANDLING', message: 'Conversation opened for a person to handle in Chatwoot' };
  }
}
