import { z } from 'zod';

export const lessBusyTaskProposalSchema = z.object({ workspaceId: z.string().uuid(), task: z.object({ title: z.string().min(1).max(250), description: z.string().max(10000).default(''), priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).default('NORMAL'), dueAt: z.string().datetime({ offset: true }).optional(), customerId: z.string().uuid().optional(), opportunityId: z.string().uuid().optional() }) });
