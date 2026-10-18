import { t } from '@lingui/core/macro';

export const moneyToMinorUnits = (amount: string, currency: string) => {
  const decimals = new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2;
  const value = amount.trim();
  if (!/^\d+(\.\d+)?$/.test(value)) throw new Error(t`Enter a positive price using a decimal point.`);
  const [whole, fraction = ''] = value.split('.');
  if (fraction.length > decimals) throw new Error(t`This currency allows ${decimals} decimal places.`);
  return BigInt(`${whole}${fraction.padEnd(decimals, '0')}`).toString();
};
