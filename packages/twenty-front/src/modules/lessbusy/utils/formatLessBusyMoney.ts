export const formatLessBusyMoney = (minor: string, currency: string) => {
  const decimals = new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2;
  const amount = BigInt(minor);
  const digits = (amount < 0n ? -amount : amount).toString().padStart(decimals + 1, '0');
  return `${currency} ${amount < 0n ? '-' : ''}${decimals ? `${digits.slice(0, -decimals)}.${digits.slice(-decimals)}` : digits}`;
};
