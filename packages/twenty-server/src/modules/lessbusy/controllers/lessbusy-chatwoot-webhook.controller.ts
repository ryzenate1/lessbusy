import { BadRequestException, Controller, Headers, HttpCode, Param, ParseUUIDPipe, Post, type RawBodyRequest, Req, UnauthorizedException, UseFilters, UseGuards } from '@nestjs/common';
import { type Request } from 'express';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { LessBusyChatwootService } from 'src/modules/lessbusy/chatwoot/lessbusy-chatwoot.service';
import { BusinessInputFilter } from 'src/modules/lessbusy/filters/business-input.filter';

const webhookSchema = z.object({ event: z.string(), account: z.object({ id: z.number().int().positive().safe() }), id: z.number().int().positive().safe(), conversation: z.object({ id: z.number().int().positive().safe(), inbox_id: z.number().int().positive().safe().optional() }).passthrough().optional(), inbox: z.object({ id: z.number().int().positive().safe() }).passthrough().optional(), inbox_id: z.number().int().positive().safe().optional() }).passthrough();

@Controller('webhooks/lessbusy/chatwoot')
@UseGuards(PublicEndpointGuard, NoPermissionGuard)
@UseFilters(BusinessInputFilter)
export class LessBusyChatwootWebhookController {
  constructor(private readonly chatwoot: LessBusyChatwootService, @InjectMessageQueue(MessageQueue.webhookQueue) private readonly queue: MessageQueueService) {}

  @Post(':connectionId')
  @HttpCode(202)
  async receive(@Param('connectionId', ParseUUIDPipe) connectionId: string, @Req() request: RawBodyRequest<Request>, @Headers('x-chatwoot-timestamp') timestamp?: string, @Headers('x-chatwoot-signature') signature?: string) {
    if (!timestamp || !/^\d{10}$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300 || !signature || !/^sha256=[a-f0-9]{64}$/.test(signature)) throw new UnauthorizedException('Webhook signature or timestamp invalid');
    const raw = request.rawBody;
    if (!raw || raw.length > 262144) throw new BadRequestException('Webhook body unavailable or too large');
    const connection = await this.chatwoot.getConnectionById(connectionId);
    const expected = createHmac('sha256', connection.webhookSecret).update(timestamp).update('.').update(raw).digest();
    if (!timingSafeEqual(expected, Buffer.from(signature.slice(7), 'hex'))) throw new UnauthorizedException('Webhook signature invalid');
    const payload = webhookSchema.parse(request.body);
    if (payload.account.id !== connection.accountId) throw new UnauthorizedException('Webhook account does not match this connection');
    if (!['message_created', 'message_updated', 'conversation_created', 'conversation_updated', 'conversation_status_changed'].includes(payload.event)) return { accepted: true, ignored: true };
    const inboxId = payload.inbox?.id ?? payload.inbox_id ?? payload.conversation?.inbox_id;
    if (!inboxId || !connection.inboxIds.includes(inboxId)) throw new UnauthorizedException('Webhook inbox is not enabled');
    const conversationId = payload.event.startsWith('message_') ? payload.conversation?.id : payload.id;
    if (!conversationId) throw new BadRequestException('Conversation reference missing');
    const digest = createHash('sha256').update(connectionId).update(raw).digest('hex');
    await this.queue.add('LessBusyChatwootReferenceJob', { connectionId, workspaceId: connection.workspaceId, conversationId, inboxId, event: payload.event, eventKey: digest }, { id: `lessbusy-chatwoot-${digest}`, retryLimit: 5, backoff: { strategy: 'exponential', initialDelayMilliseconds: 2000, jitter: 0.2 } });
    return { accepted: true };
  }
}
