import { Command, CommandRunner } from 'nest-commander';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { LessBusyStockExpiryDispatchJob } from 'src/modules/lessbusy/jobs/lessbusy-stock-expiry-dispatch.job';

@Command({ name: 'cron:lessbusy:stock-expiry', description: 'Register bounded LessBusy reservation expiry sweeps when explicitly enabled in server configuration' })
export class LessBusyStockExpiryCronCommand extends CommandRunner {
  constructor(@InjectMessageQueue(MessageQueue.cronQueue) private readonly queue: MessageQueueService, private readonly configuration: TwentyConfigService) { super(); }
  async run(): Promise<void> {
    if (!this.configuration.get('LESSBUSY_STOCK_EXPIRY_ENABLED')) return;
    await this.queue.addCron<undefined>({ jobName: LessBusyStockExpiryDispatchJob.name, data: undefined, options: { repeat: { pattern: '*/5 * * * *' } } });
  }
}
