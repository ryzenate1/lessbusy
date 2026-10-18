import { BadRequestException, ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'node:crypto';
import { IsNull, Repository } from 'typeorm';
import { z } from 'zod';
import { PermissionFlagType } from 'twenty-shared/constants';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { ApplicationEntity } from 'src/engine/core-modules/application/application.entity';
import { KeyValuePairEntity, KeyValuePairType } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { SecretEncryptionService } from 'src/engine/core-modules/secret-encryption/secret-encryption.service';
import { plaintextStringSchema } from 'src/engine/core-modules/secret-encryption/branded-strings/plaintext-string.type';
import { type EncryptedString } from 'src/engine/core-modules/secret-encryption/branded-strings/encrypted-string.type';
import { PermissionsService } from 'src/engine/metadata-modules/permissions/permissions.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { chatwootConnectionSchema } from 'src/modules/lessbusy/chatwoot/chatwoot-connection.schema';

const CONNECTION_KEY = 'lessbusy/chatwoot/connection';
const APPLICATION_IDENTIFIER = '21ec822f-cd03-4479-a8f8-e5cdd0c0670a';
const envelopeSchema = z.object({ id: z.string().uuid(), version: z.number().int().nonnegative(), encrypted: z.string() });

@Injectable()
export class LessBusyChatwootConnectionStore {
  constructor(@InjectRepository(KeyValuePairEntity) private readonly values: Repository<KeyValuePairEntity>, @InjectRepository(ApplicationEntity) private readonly applications: Repository<ApplicationEntity>, private readonly encryption: SecretEncryptionService, private readonly permissions: PermissionsService, private readonly configuration: TwentyConfigService) {}

  private decode(record: KeyValuePairEntity) {
    const envelope = envelopeSchema.parse(record.value);
    if (!record.workspaceId) throw new BadRequestException('Connection workspace binding missing');
    const connection = chatwootConnectionSchema.parse(JSON.parse(this.encryption.decryptVersionedOrThrow(envelope.encrypted as EncryptedString, { workspaceId: record.workspaceId })));
    if (connection.workspaceId !== record.workspaceId || connection.id !== envelope.id) throw new BadRequestException('Connection workspace binding invalid');
    return { connection, version: envelope.version };
  }

  async getByWorkspace(workspaceId: string) {
    const record = await this.values.findOne({ where: { key: CONNECTION_KEY, workspaceId, userId: IsNull(), applicationId: IsNull(), type: KeyValuePairType.APPLICATION_VARIABLE } });
    return record ? this.decode(record) : null;
  }

  async getById(id: string) {
    const index = await this.values.findOne({ where: { key: `${CONNECTION_KEY}/id/${id}`, workspaceId: IsNull(), userId: IsNull(), applicationId: IsNull(), type: KeyValuePairType.APPLICATION_VARIABLE } });
    if (!index) return null;
    const binding = z.object({ workspaceId: z.string().uuid() }).parse(index.value);
    const saved = await this.getByWorkspace(binding.workspaceId);
    return saved?.connection.id === id ? saved : null;
  }

  private async authorize(auth: WorkspaceAuthContext) {
    if (auth.type !== 'user' || auth.agentId || auth.application || auth.viaApplication) throw new ForbiddenException('Connection management requires a workspace administrator');
    const allowed = await this.permissions.userHasWorkspaceSettingPermission({ workspaceId: auth.workspace.id, userWorkspaceId: auth.userWorkspaceId, setting: PermissionFlagType.APPLICATIONS, applicationId: undefined, agentId: undefined });
    if (!allowed) throw new ForbiddenException('Your role does not allow integration administration');
  }

  private environmentConnections() { return z.array(chatwootConnectionSchema).parse(this.configuration.get('LESSBUSY_CHATWOOT_CONNECTIONS')); }

  async getAdminConnection(auth: WorkspaceAuthContext) {
    await this.authorize(auth);
    return this.environmentConnections().find((connection) => connection.workspaceId === auth.workspace.id) ?? (await this.getByWorkspace(auth.workspace.id))?.connection;
  }

  async assertAccountBinding(connection: z.infer<typeof chatwootConnectionSchema>) {
    const origin = new URL(connection.baseUrl).origin;
    const key = `${CONNECTION_KEY}/account/${createHash('sha256').update(`${origin}:${connection.accountId}`).digest('hex')}`;
    const record = await this.values.findOne({ where: { key, workspaceId: IsNull(), userId: IsNull(), applicationId: IsNull(), type: KeyValuePairType.APPLICATION_VARIABLE } });
    if (record && z.object({ workspaceId: z.string().uuid() }).parse(record.value).workspaceId !== connection.workspaceId) throw new ConflictException('Chatwoot account binding does not match this workspace');
  }

  async syncActivity(auth: WorkspaceAuthContext) {
    await this.authorize(auth);
    const connection = await this.getAdminConnection(auth);
    if (!connection) return { configured: false, attempts: [] };
    const record = await this.values.findOne({ where: { key: `lessbusy/chatwoot/activity/${connection.id}`, workspaceId: auth.workspace.id, userId: IsNull(), applicationId: IsNull(), type: KeyValuePairType.APPLICATION_VARIABLE } });
    const schema = z.object({ lastSuccessAt: z.string().optional(), lastFailureAt: z.string().optional(), attempts: z.array(z.object({ eventKey: z.string(), event: z.string(), status: z.enum(['SUCCESS', 'FAILED']), at: z.string(), errorCode: z.literal('SYNC_FAILED').optional() })).max(20) });
    return { configured: true, ...(record ? schema.parse(record.value) : { attempts: [] }) };
  }

  async recordSyncAttempt(auth: WorkspaceAuthContext, connectionId: string, eventKey: string, event: string, success: boolean) {
    if (auth.type !== 'application' || auth.agentId || auth.actingAgent || auth.application.universalIdentifier !== APPLICATION_IDENTIFIER) throw new ForbiddenException('Integration activity may only be written by the installed LessBusy worker');
    const connection = this.environmentConnections().find((candidate) => candidate.workspaceId === auth.workspace.id) ?? (await this.getByWorkspace(auth.workspace.id))?.connection;
    if (!connection || connection.id !== connectionId || connection.applicationId !== auth.application.id) throw new ForbiddenException('Integration activity workspace binding is invalid');
    const key = `lessbusy/chatwoot/activity/${connectionId}`;
    const attemptSchema = z.object({ eventKey: z.string(), event: z.string(), status: z.enum(['SUCCESS', 'FAILED']), at: z.string(), errorCode: z.literal('SYNC_FAILED').optional() });
    const activitySchema = z.object({ lastSuccessAt: z.string().optional(), lastFailureAt: z.string().optional(), attempts: z.array(attemptSchema).max(20) });
    await this.values.manager.transaction(async (manager) => {
      const repository = manager.getRepository(KeyValuePairEntity);
      const previous = await repository.findOne({ where: { key, workspaceId: auth.workspace.id, userId: IsNull(), applicationId: IsNull(), type: KeyValuePairType.APPLICATION_VARIABLE }, lock: { mode: 'pessimistic_write' } });
      const activity = previous ? activitySchema.parse(previous.value) : { attempts: [] };
      const last = activity.attempts[0]; const status = success ? 'SUCCESS' : 'FAILED';
      if (last?.eventKey === eventKey && last.status === status) return;
      const at = new Date().toISOString();
      const value = { ...activity, ...(success ? { lastSuccessAt: at } : { lastFailureAt: at }), attempts: [{ eventKey, event: event.slice(0, 100), status, at, ...(!success ? { errorCode: 'SYNC_FAILED' } : {}) }, ...activity.attempts].slice(0, 20) } as unknown as JSON;
      if (previous) await repository.update({ id: previous.id }, { value });
      else await repository.insert({ id: randomUUID(), key, type: KeyValuePairType.APPLICATION_VARIABLE, workspaceId: auth.workspace.id, userId: null, applicationId: null, value });
    });
  }

  async settings(auth: WorkspaceAuthContext) {
    await this.authorize(auth);
    const environment = this.environmentConnections().find((connection) => connection.workspaceId === auth.workspace.id);
    const saved = environment ? { connection: environment, version: null } : await this.getByWorkspace(auth.workspace.id);
    if (!saved) return { configured: false, readOnly: false, version: null };
    const { connection, version } = saved;
    return { configured: true, readOnly: Boolean(environment), version, id: connection.id, baseUrl: connection.baseUrl, accountId: connection.accountId, inboxIds: connection.inboxIds, enabled: connection.enabled, hasApiToken: Boolean(connection.apiToken), hasWebhookSecret: Boolean(connection.webhookSecret), webhookPath: `/webhooks/lessbusy/chatwoot/${connection.id}` };
  }

  async save(auth: WorkspaceAuthContext, input: unknown) {
    await this.authorize(auth);
    const command = z.object({ confirmed: z.literal(true), expectedVersion: z.number().int().nonnegative().nullable(), baseUrl: z.string().url(), accountId: z.number().int().positive().safe(), inboxIds: z.array(z.number().int().positive().safe()).min(1).max(100), enabled: z.boolean(), apiToken: z.string().min(1).optional(), webhookSecret: z.string().min(24).optional() }).strict().parse(input);
    const endpoint = new URL(command.baseUrl);
    if (endpoint.username || endpoint.password || endpoint.search || endpoint.hash || !['http:', 'https:'].includes(endpoint.protocol) || (endpoint.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname))) throw new BadRequestException('Use HTTPS, or a local development endpoint, without embedded credentials');
    const environment = this.environmentConnections();
    if (environment.some((connection) => connection.workspaceId === auth.workspace.id)) throw new ConflictException('This workspace connection is managed by server environment configuration');
    if (environment.some((connection) => new URL(connection.baseUrl).origin === endpoint.origin && connection.accountId === command.accountId && connection.workspaceId !== auth.workspace.id)) throw new ConflictException('This Chatwoot account is already bound to another workspace');
    const application = await this.applications.findOneBy({ workspaceId: auth.workspace.id, universalIdentifier: APPLICATION_IDENTIFIER });
    if (!application) throw new BadRequestException('Install LessBusy Business before configuring conversation synchronization');
    await this.values.manager.transaction(async (manager) => {
      const repository = manager.getRepository(KeyValuePairEntity);
      const existing = await repository.findOne({ where: { key: CONNECTION_KEY, workspaceId: auth.workspace.id, userId: IsNull(), applicationId: IsNull(), type: KeyValuePairType.APPLICATION_VARIABLE }, lock: { mode: 'pessimistic_write' } });
      const saved = existing ? this.decode(existing) : null;
      if ((saved?.version ?? null) !== command.expectedVersion) throw new ConflictException('Connection changed; reload settings before saving');
      const id = saved?.connection.id ?? randomUUID();
      const connection = chatwootConnectionSchema.parse({ id, workspaceId: auth.workspace.id, applicationId: application.id, baseUrl: endpoint.toString().replace(/\/$/, ''), accountId: command.accountId, inboxIds: [...new Set(command.inboxIds)], enabled: command.enabled, apiToken: command.apiToken ?? saved?.connection.apiToken, webhookSecret: command.webhookSecret ?? saved?.connection.webhookSecret });
      const accountKey = `${CONNECTION_KEY}/account/${createHash('sha256').update(`${endpoint.origin}:${command.accountId}`).digest('hex')}`;
      const claim = await repository.findOne({ where: { key: accountKey, workspaceId: IsNull(), userId: IsNull(), applicationId: IsNull(), type: KeyValuePairType.APPLICATION_VARIABLE } });
      if (claim && z.object({ workspaceId: z.string().uuid() }).parse(claim.value).workspaceId !== auth.workspace.id) throw new ConflictException('This Chatwoot account belongs to another workspace');
      if (!claim) await repository.insert({ id: randomUUID(), key: accountKey, type: KeyValuePairType.APPLICATION_VARIABLE, workspaceId: null, userId: null, applicationId: null, value: { workspaceId: auth.workspace.id, connectionId: id } as unknown as JSON });
      const encrypted = this.encryption.encryptVersioned(plaintextStringSchema.parse(JSON.stringify(connection)), { workspaceId: auth.workspace.id });
      const value = { id, version: saved ? saved.version + 1 : 0, encrypted } as unknown as JSON;
      if (existing) await repository.update(existing.id, { value });
      else {
        await repository.insert({ id: randomUUID(), key: CONNECTION_KEY, type: KeyValuePairType.APPLICATION_VARIABLE, workspaceId: auth.workspace.id, userId: null, applicationId: null, value });
        await repository.insert({ id: randomUUID(), key: `${CONNECTION_KEY}/id/${id}`, type: KeyValuePairType.APPLICATION_VARIABLE, workspaceId: null, userId: null, applicationId: null, value: { workspaceId: auth.workspace.id } as unknown as JSON });
      }
    });
    return this.settings(auth);
  }
}
