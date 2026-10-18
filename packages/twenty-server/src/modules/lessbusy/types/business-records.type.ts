export type StockBalance = {
  id: string;
  name: string;
  balanceKey: string;
  variantId: string;
  warehouseId: string;
  onHandUnits: number;
  reservedUnits: number;
  version: number;
};

export type StockReservation = {
  salesOrderId?: string | null;
  id: string;
  balanceId: string;
  quantityUnits: number;
  status: 'ACTIVE' | 'COMMITTED' | 'RELEASED';
  expiresAt: string | null;
  version: number;
};

export type BusinessInvoice = {
  id: string;
  name: string;
  operationKey: string;
  requestHash: string;
  auditEvents: Array<Record<string, unknown>>;
  customerId: string;
  opportunityId: string | null;
  currency: string;
  discountBasisPoints: number;
  lines: unknown;
  totals: { totalMinor: string; subtotalMinor: string; discountMinor: string; taxMinor: string };
  businessIdentity: unknown;
  customerSnapshot: unknown;
  status: 'DRAFT' | 'FINALIZED' | 'PART_PAID' | 'PAID' | 'CREDITED' | 'CANCELLED';
  amountPaidMinor: string;
  amountCreditedMinor?: string | null;
  amountRefundedMinor?: string | null;
  dueAt: string | null;
  finalizedAt: string | null;
  version: number;
};
