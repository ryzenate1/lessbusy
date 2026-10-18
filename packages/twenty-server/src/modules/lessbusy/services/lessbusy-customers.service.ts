import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { buildActorMetadataFromAuthContext } from 'src/engine/core-modules/actor/utils/build-actor-metadata-from-auth-context.util';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { isPostgresUniqueViolation } from 'src/modules/lessbusy/utils/is-postgres-unique-violation.util';

const customerSchema = z.object({ firstName: z.string().trim().max(150), lastName: z.string().trim().max(150).default(''), email: z.union([z.literal(''), z.string().email().max(254)]).default(''), source: z.string().trim().max(250).default(''), tags: z.array(z.string().trim().min(1).max(80)).max(30).default([]), instagramIdentity: z.string().trim().max(250).default(''), whatsappIdentity: z.string().trim().max(250).default('') }).strict().refine((customer) => Boolean(customer.firstName || customer.lastName || customer.instagramIdentity || customer.whatsappIdentity), 'Supply a name or social identity');

@Injectable()
export class LessBusyCustomersService {
  constructor(private readonly orm: WorkspaceOrmManager) {}

  private assertHuman(auth: WorkspaceAuthContext) {
    if (auth.type !== 'user' || auth.agentId || auth.application || auth.viaApplication) throw new ForbiddenException('Customer changes require a workspace member');
    return auth.workspaceMemberId;
  }

  async importOne(auth: WorkspaceAuthContext, input: unknown) {
    const actorId = this.assertHuman(auth);
    const command = z.object({ confirmed: z.literal(true), operationKey: z.string().uuid(), allowDuplicate: z.boolean().default(false), customer: customerSchema }).strict().parse(input);
    const hash = createHash('sha256').update(JSON.stringify({ customer: command.customer, actorId })).digest('hex');
    try {
      return await this.orm.executeInWorkspaceContext(() => this.orm.runInWorkspaceTransaction(async (scope) => {
        const people = this.orm.getRepositoryWithContextPermissions('person', scope);
        const previous = await people.findOne({ where: { id: command.operationKey }, select: { id: true, lbImportHash: true } });
        if (previous) {
          if (previous.lbImportHash !== hash) throw new ConflictException('Import key already used for another customer');
          return { id: previous.id, duplicateWarning: false };
        }
        const customer = command.customer;
        const identities = [ ...(customer.email ? [{ emails: { primaryEmail: customer.email } }] : []), ...(customer.instagramIdentity ? [{ lbInstagramIdentity: customer.instagramIdentity }] : []), ...(customer.whatsappIdentity ? [{ lbWhatsappIdentity: customer.whatsappIdentity }] : []) ];
        if (!command.allowDuplicate && identities.length && await people.findOne({ where: identities, select: { id: true } })) throw new ConflictException('A readable customer already uses this email or social identity. Review existing customers, or explicitly allow a duplicate for this row.');
        const actor = buildActorMetadataFromAuthContext(auth);
        await people.insert({ id: command.operationKey, name: { firstName: customer.firstName || customer.instagramIdentity || customer.whatsappIdentity, lastName: customer.lastName }, ...(customer.email ? { emails: { primaryEmail: customer.email, additionalEmails: [] } } : {}), lbSource: customer.source || null, lbTags: [...new Set(customer.tags)], lbInstagramIdentity: customer.instagramIdentity || null, lbWhatsappIdentity: customer.whatsappIdentity || null, lbImportHash: hash, lbArchivedAt: null, createdBy: actor, updatedBy: actor });
        return { id: command.operationKey, duplicateWarning: command.allowDuplicate };
      }), auth);
    } catch (failure) {
      if (isPostgresUniqueViolation(failure)) throw new ConflictException('Import key raced with another request; retry with the same key to review the recorded customer');
      throw failure;
    }
  }

  async bulk(auth: WorkspaceAuthContext, input: unknown) {
    this.assertHuman(auth);
    const record = z.object({ id: z.string().uuid(), updatedAt: z.string().datetime({ offset: true }) }).strict();
    const command = z.object({ confirmed: z.literal(true), records: z.array(record).min(1).max(50), action: z.discriminatedUnion('kind', [z.object({ kind: z.literal('archive') }).strict(), z.object({ kind: z.literal('restore') }).strict(), z.object({ kind: z.literal('assign'), employeeId: z.string().uuid().nullable() }).strict(), z.object({ kind: z.literal('addTags'), tags: z.array(z.string().trim().min(1).max(80)).min(1).max(30) }).strict()]) }).strict().parse(input);
    if (new Set(command.records.map((item) => item.id)).size !== command.records.length) throw new BadRequestException('Choose each customer once');
    return this.orm.executeInWorkspaceContext(() => this.orm.runInWorkspaceTransaction(async (scope) => {
      const people = this.orm.getRepositoryWithContextPermissions('person', scope);
      const action = command.action;
      if (action.kind === 'assign' && action.employeeId && !await this.orm.getRepositoryWithContextPermissions('workspaceMember', scope).findOne({ where: { id: action.employeeId }, select: { id: true } })) throw new NotFoundException('Employee unavailable in this workspace');
      const at = new Date();
      const actor = buildActorMetadataFromAuthContext(auth);
      for (const selected of [...command.records].sort((a, b) => a.id.localeCompare(b.id))) {
        const customer = await people.findOne({ where: { id: selected.id }, select: { id: true, updatedAt: true, ...(action.kind === 'addTags' ? { lbTags: true } : {}) } });
        if (!customer) throw new NotFoundException('A selected customer is unavailable');
        if (new Date(customer.updatedAt).getTime() !== new Date(selected.updatedAt).getTime()) throw new ConflictException('A selected customer changed. Reload the directory and review your selection.');
        const tags = action.kind === 'addTags' ? [...new Set([...(Array.isArray(customer.lbTags) ? customer.lbTags.filter((tag: unknown): tag is string => typeof tag === 'string') : []), ...action.tags])] : [];
        if (tags.length > 30) throw new BadRequestException('A customer cannot have more than 30 tags');
        const patch = action.kind === 'archive' ? { lbArchivedAt: at } : action.kind === 'restore' ? { lbArchivedAt: null } : action.kind === 'assign' ? { lbAssignedEmployeeId: action.employeeId } : { lbTags: tags };
        const changed = await people.update({ id: selected.id, updatedAt: new Date(selected.updatedAt) }, { ...patch, updatedBy: actor });
        if (changed.affected !== 1) throw new ConflictException('A selected customer changed. Reload before trying again.');
      }
      return { changed: command.records.length, action: action.kind };
    }), auth);
  }
}
