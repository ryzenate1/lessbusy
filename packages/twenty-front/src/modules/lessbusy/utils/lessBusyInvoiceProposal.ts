import { z } from 'zod';

export const lessBusyInvoiceProposalSchema = z.object({
  workspaceId: z.string().uuid(),
  document: z.object({
    customerId: z.string().uuid(), opportunityId: z.string().uuid().optional(), currency: z.string().regex(/^[A-Z]{3}$/),
    discountBasisPoints: z.number().int().min(0).max(10000).default(0),
    dueAt: z.string().datetime({ offset: true }).optional(),
    lines: z.array(z.object({ description: z.string().min(1).max(500), variantId: z.string().uuid().optional(), quantity: z.number().int().min(1).max(1000000), unitAmountMinor: z.string().regex(/^\d{1,18}$/), taxBasisPoints: z.number().int().min(0).max(10000).default(0), discountBasisPoints: z.number().int().min(0).max(10000).default(0) })).min(1).max(200),
  }),
});
