/**
 * Modular Money & Currency Abstraction for Evy's Projects
 * Handles NGN (Nigerian Naira) as primary currency with extensible architecture for USD, GBP, etc.
 * Avoids floating-point precision issues with integer minor units (kobo for NGN).
 */

export type SupportedCurrency = 'NGN' | 'USD' | 'GBP' | 'EUR';

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  minorUnitMultiplier: number; // 100 for NGN (kobo), USD (cents), GBP (pence)
  decimalPlaces: number;
}

export const CURRENCIES: Record<SupportedCurrency, CurrencyConfig> = {
  NGN: {
    code: 'NGN',
    symbol: '₦',
    name: 'Nigerian Naira',
    minorUnitMultiplier: 100,
    decimalPlaces: 2,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    minorUnitMultiplier: 100,
    decimalPlaces: 2,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    minorUnitMultiplier: 100,
    decimalPlaces: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    minorUnitMultiplier: 100,
    decimalPlaces: 2,
  },
};

export const DEFAULT_CURRENCY: SupportedCurrency = 'NGN';

/**
 * Validates whether a currency code is supported
 */
export function isSupportedCurrency(code: string): code is SupportedCurrency {
  return Object.keys(CURRENCIES).includes(code?.toUpperCase());
}

/**
 * Converts major units (e.g. 5000.50 NGN) to minor units (e.g. 500050 kobo)
 */
export function toMinorUnits(amount: number, currency: SupportedCurrency = DEFAULT_CURRENCY): number {
  const conf = CURRENCIES[currency] || CURRENCIES[DEFAULT_CURRENCY];
  return Math.round(amount * conf.minorUnitMultiplier);
}

/**
 * Converts minor units (e.g. 500050 kobo) to major units (e.g. 5000.50 NGN)
 */
export function fromMinorUnits(minorAmount: number, currency: SupportedCurrency = DEFAULT_CURRENCY): number {
  const conf = CURRENCIES[currency] || CURRENCIES[DEFAULT_CURRENCY];
  return Math.round(minorAmount) / conf.minorUnitMultiplier;
}

/**
 * Safely adds amounts with decimal precision
 */
export function addMoney(a: number, b: number): number {
  return Math.round((a + b) * 100) / 100;
}

/**
 * Safely calculates line totals
 */
export function multiplyMoney(unitPrice: number, quantity: number): number {
  return Math.round(unitPrice * quantity * 100) / 100;
}

/**
 * Formats a monetary amount into a human-readable string with currency symbol (e.g. "₦39,990.00")
 */
export function formatMoney(amount: number, currency: SupportedCurrency = DEFAULT_CURRENCY): string {
  const conf = CURRENCIES[currency] || CURRENCIES[DEFAULT_CURRENCY];
  const formattedNumber = amount.toLocaleString('en-NG', {
    minimumFractionDigits: conf.decimalPlaces,
    maximumFractionDigits: conf.decimalPlaces,
  });
  return `${conf.symbol}${formattedNumber}`;
}
