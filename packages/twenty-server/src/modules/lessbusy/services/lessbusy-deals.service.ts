import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import { buildActorMetadataFromAuthContext } from 'src/engine/core-modules/actor/utils/build-actor-metadata-from-auth-context.util';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';

@Injectable()
export class LessBusyDealsService {
  constructor(private readonly orm: WorkspaceOrmManager) {}
  async updatePipeline(auth: WorkspaceAuthContext, id: string, input: unknown) {
    if (auth.type !== 'user' || auth.agentId || auth.application || auth.viaApplication) throw new ForbiddenException('Pipeline changes require a workspace member');
    const command = z.object({ confirmed: z.literal(true), expectedUpdatedAt: z.string().datetime({ offset: true }), stage: z.string().trim().min(1).max(250), closeDate: z.string().datetime({ offset: true }).nullable() }).strict().parse(input);
    return this.orm.executeInWorkspaceContext(() => this.orm.runInWorkspaceTransaction(async (scope) => {
      const deals = this.orm.getRepositoryWithContextPermissions('opportunity', scope);
      const deal = await deals.findOne({ where: { id }, select: { id: true, stage: true, closeDate: true, updatedAt: true } });
      if (!deal) throw new NotFoundException('Deal unavailable in your workspace access');
      const closeDate = command.closeDate ? new Date(command.closeDate) : null;
      if (deal.stage === command.stage && (deal.closeDate ? new Date(deal.closeDate).getTime() : null) === (closeDate?.getTime() ?? null) ) return { id };
      const changed = await deals.update({ id, updatedAt: new Date(command.expectedUpdatedAt) }, { stage: command.stage, closeDate, updatedBy: buildActorMetadataFromAuthContext(auth) });
      if (changed.affected !== 1) throw new ConflictException('Deal changed; reload the pipeline and review the new stage before saving');
      return { id };
    }), auth);
  }
}
