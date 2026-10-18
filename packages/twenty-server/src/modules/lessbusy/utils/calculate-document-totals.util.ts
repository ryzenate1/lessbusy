import { z } from 'zod';

export const salesDocumentInputSchema = z.object({
  customerId: z.string().uuid(),
  opportunityId: z.string().uuid().optional(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  discountBasisPoints: z.number().int().min(0).max(10000).default(0),
  lines: z.array(z.object({
    description: z.string().trim().min(1).max(500),
    variantId: z.string().uuid().optional(),
    quantity: z.number().int().min(1).max(1000000),
    unitAmountMinor: z.string().regex(/^\d{1,18}$/),
    discountBasisPoints: z.number().int().min(0).max(10000).default(0),
    taxBasisPoints: z.number().int().min(0).max(10000).default(0),
  }).strict()).min(1).max(200),
  dueAt: z.string().datetime({ offset: true }).optional(),
}).strict();

export const calculateDocumentTotals = (input: unknown) => {
  const document = salesDocumentInputSchema.parse(input);
  const round = (value: bigint, denominator = BigInt(10000)) => (value + denominator / BigInt(2)) / denominator;
  const prepared = document.lines.map((line) => {
    const gross = BigInt(line.unitAmountMinor) * BigInt(line.quantity);
    const lineDiscount = round(gross * BigInt(line.discountBasisPoints));
    return { ...line, gross, lineDiscount, net: gross - lineDiscount };
  });
  const netSubtotal = prepared.reduce((sum, line) => sum + line.net, BigInt(0));
  const documentDiscount = round(netSubtotal * BigInt(document.discountBasisPoints));
  let remainingDiscount = documentDiscount;
  let remainingNet = netSubtotal;
  const lines = prepared.map(({ gross, lineDiscount, net, ...line }, index) => {
    const allocated = remainingNet === BigInt(0) ? BigInt(0) : index === prepared.length - 1
      ? remainingDiscount : round(net * remainingDiscount, remainingNet);
    remainingDiscount -= allocated;
    remainingNet -= net;
    const taxable = net - allocated;
    const tax = round(taxable * BigInt(line.taxBasisPoints));
    return {
      ...line,
      grossMinor: gross.toString(),
      discountMinor: (lineDiscount + allocated).toString(),
      taxableMinor: taxable.toString(),
      taxMinor: tax.toString(),
      totalMinor: (taxable + tax).toString(),
    };
  });
  const sum = (field: 'grossMinor' | 'discountMinor' | 'taxMinor' | 'totalMinor') =>
    lines.reduce((total, line) => total + BigInt(line[field]), BigInt(0)).toString();
  return {
    ...document,
    lines,
    totals: { subtotalMinor: sum('grossMinor'), discountMinor: sum('discountMinor'), taxMinor: sum('taxMinor'), totalMinor: sum('totalMinor') },
  };
};
