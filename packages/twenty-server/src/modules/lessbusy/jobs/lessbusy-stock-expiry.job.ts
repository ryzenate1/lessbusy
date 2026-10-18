import { fromWorkspaceEntityToFlat } from 'src/engine/core-modules/workspace/utils/from-workspace-entity-to-flat.util';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { LessThanOrEqual } from 'typeorm';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { ApplicationState } from 'src/engine/core-modules/application/enums/application-state.enum';
import { getLessBusyOperationId } from 'src/modules/lessbusy/utils/get-lessbusy-operation-id.util';
import { Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { z } from 'zod';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { ApplicationEntity } from 'src/engine/core-modules/application/application.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { buildApplicationAuthContext } from 'src/engine/core-modules/auth/utils/build-application-auth-context.util';
import { withWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { LessBusyStockExpiryService } from 'src/modules/lessbusy/services/lessbusy-stock-expiry.service';

@Processor({ queueName: MessageQueue.webhookQueue, scope: Scope.REQUEST })
export class LessBusyStockExpiryJob {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager, private readonly configuration: TwentyConfigService, @InjectRepository(ApplicationEntity) private readonly applications: Repository<ApplicationEntity>, @InjectRepository(WorkspaceEntity) private readonly workspaces: Repository<WorkspaceEntity>, private readonly expiry: LessBusyStockExpiryService) {}

  @Process('LessBusyStockExpiryJob')
  async handle(input: unknown) {
    if (!this.configuration.get('LESSBUSY_STOCK_EXPIRY_ENABLED')) return { disabled: true };
    const command = z.object({ workspaceId: z.string().uuid(), applicationId: z.string().uuid(), operationKey: z.string().uuid(), asOf: z.string().datetime({ offset: true }) }).strict().parse(input);
    const [workspace, application] = await Promise.all([this.workspaces.findOneBy({ id: command.workspaceId }), this.applications.findOneBy({ id: command.applicationId, workspaceId: command.workspaceId, universalIdentifier: '21ec822f-cd03-4479-a8f8-e5cdd0c0670a', state: ApplicationState.INSTALLED })]);
    if (!workspace || !application) throw new Error('LessBusy reservation expiry workspace binding is no longer valid');
    const auth = buildApplicationAuthContext({ workspace: fromWorkspaceEntityToFlat(workspace), application });
    return withWorkspaceAuthContext(auth, async () => {
      const pending = await this.workspaceOrmManager.executeInWorkspaceContext(() => this.workspaceOrmManager.getRepositoryWithContextPermissions('lbStockReservation').find({ where: { status: 'ACTIVE', expiresAt: LessThanOrEqual(command.asOf) }, take: 1, select: { id: true } }), auth);
      if (!pending.length) return { released: 0, hasMore: false, asOf: command.asOf };
      let released = 0; let hasMore = false;
      for (let batch = 0; batch < 3; batch++) {
        const result = z.object({ released: z.number(), hasMore: z.boolean() }).parse(await this.expiry.release(auth, { confirmed: true, operationKey: getLessBusyOperationId(`${command.operationKey}:${batch}`), asOf: command.asOf }));
        released += result.released; hasMore = result.hasMore;
        if (!hasMore) break;
      }
      return { released, hasMore, asOf: command.asOf };
    });
  }
}
