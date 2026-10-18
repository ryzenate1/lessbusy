import { z } from 'zod';

export const chatwootConnectionSchema = z.object({
  id: z.string().uuid(), workspaceId: z.string().uuid(), applicationId: z.string().uuid(),
  baseUrl: z.string().url(), accountId: z.number().int().positive().safe(),
  inboxIds: z.array(z.number().int().positive().safe()).min(1).max(100),
  apiToken: z.string().min(1), webhookSecret: z.string().min(24), enabled: z.boolean().default(false),
}).strict();
