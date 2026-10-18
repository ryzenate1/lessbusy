import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { z } from 'zod';
import { SentryCronMonitor } from 'src/engine/core-modules/cron/sentry-cron-monitor.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { ApplicationEntity } from 'src/engine/core-modules/application/application.entity';
import { ApplicationState } from 'src/engine/core-modules/application/enums/application-state.enum';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { getLessBusyOperationId } from 'src/modules/lessbusy/utils/get-lessbusy-operation-id.util';

const inputSchema = z.object({ cursor: z.string().uuid().optional(), asOf: z.string().datetime({ offset: true }).optional() }).strict();
@Processor(MessageQueue.cronQueue)
export class LessBusyStockExpiryDispatchJob {
  constructor(@InjectRepository(ApplicationEntity) private readonly applications: Repository<ApplicationEntity>, private readonly configuration: TwentyConfigService, @InjectMessageQueue(MessageQueue.cronQueue) private readonly cronQueue: MessageQueueService, @InjectMessageQueue(MessageQueue.webhookQueue) private readonly webhookQueue: MessageQueueService) {}

  @Process(LessBusyStockExpiryDispatchJob.name)
  @SentryCronMonitor(LessBusyStockExpiryDispatchJob.name, '*/5 * * * *')
  async handle(input?: unknown) {
    if (!this.configuration.get('LESSBUSY_STOCK_EXPIRY_ENABLED')) return;
    const command = inputSchema.parse(input ?? {});
    const asOf = command.asOf ?? new Date(Math.floor(Date.now() / 300000) * 300000).toISOString();
    if (new Date(asOf).getTime() > Date.now()) throw new Error('Expiry sweep cutoff cannot be in the future');
    const applications = await this.applications.find({ where: { universalIdentifier: '21ec822f-cd03-4479-a8f8-e5cdd0c0670a', state: ApplicationState.INSTALLED, ...(command.cursor ? { id: MoreThan(command.cursor) } : {}) }, order: { id: 'ASC' }, take: 51, select: { id: true, workspaceId: true } });
    for (const application of applications.slice(0, 50)) {
      const operationKey = getLessBusyOperationId(`expiry:${asOf}:${application.id}`);
      await this.webhookQueue.add('LessBusyStockExpiryJob', { workspaceId: application.workspaceId, applicationId: application.id, operationKey, asOf }, { id: `lessbusy-expiry-${operationKey}`, retryLimit: 5, backoff: { strategy: 'exponential', initialDelayMilliseconds: 2000, jitter: 0.2 } });
    }
    if (applications.length > 50) {
      const cursor = applications[49].id;
      await this.cronQueue.add(LessBusyStockExpiryDispatchJob.name, { cursor, asOf }, { id: `lessbusy-expiry-page-${getLessBusyOperationId(`${asOf}:${cursor}`)}`, retryLimit: 5 });
    }
  }
}
