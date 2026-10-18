export const getLessBusyInvoiceBalance = ({ totalMinor, paidMinor, creditedMinor, refundedMinor }: { totalMinor: string; paidMinor: string; creditedMinor?: string | null; refundedMinor?: string | null }) => {
  const outstanding = BigInt(totalMinor) - BigInt(creditedMinor ?? '0') - BigInt(paidMinor) + BigInt(refundedMinor ?? '0');
  return { outstandingMinor: outstanding.toString(), refundDueMinor: (outstanding < 0n ? -outstanding : 0n).toString() };
};
