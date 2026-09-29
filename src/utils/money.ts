/**
 * Frontend Currency & Money Formatting Utility for Evy's Projects
 * Formats monetary amounts in NGN (₦) with graceful fallback and future multi-currency readiness.
 */

export type SupportedCurrency = 'NGN' | 'USD' | 'GBP' | 'EUR';

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  decimalPlaces: number;
}

export const CURRENCIES: Record<SupportedCurrency, CurrencyConfig> = {
  NGN: {
    code: 'NGN',
    symbol: '₦',
    name: 'Nigerian Naira',
    decimalPlaces: 2,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimalPlaces: 2,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    decimalPlaces: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimalPlaces: 2,
  },
};

export const DEFAULT_CURRENCY: SupportedCurrency = 'NGN';

/**
 * Formats a monetary number into a string with the currency symbol (e.g. ₦39.99 or ₦39,990.00)
 */
export function formatMoney(
  amount: number | string | null | undefined,
  currency: SupportedCurrency = DEFAULT_CURRENCY,
  options?: { compactDecimalsIfZero?: boolean }
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (num === null || num === undefined || isNaN(num)) {
    return `${CURRENCIES[currency]?.symbol || '₦'}0.00`;
  }

  const conf = CURRENCIES[currency] || CURRENCIES[DEFAULT_CURRENCY];
  
  // Format with standard thousands separators
  const formatted = num.toLocaleString('en-NG', {
    minimumFractionDigits: options?.compactDecimalsIfZero && Number.isInteger(num) ? 0 : conf.decimalPlaces,
    maximumFractionDigits: conf.decimalPlaces,
  });

  return `${conf.symbol}${formatted}`;
}

/**
 * Shorthand helper for standard Naira display
 */
export function formatNaira(amount: number | string | null | undefined): string {
  return formatMoney(amount, 'NGN');
}
