export type CurrencyCode = "IRT" | "IRR" | "USD" | "EUR";

type CurrencyConfig = {
  code: CurrencyCode;
  label: string;
  symbol: string;
  decimals: number;
};

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  IRT: { code: "IRT", label: "تومان", symbol: "تومان", decimals: 0 },
  IRR: { code: "IRR", label: "ریال", symbol: "ریال", decimals: 0 },
  USD: { code: "USD", label: "دلار آمریکا", symbol: "$", decimals: 2 },
  EUR: { code: "EUR", label: "یورو", symbol: "€", decimals: 2 },
};

export function listCurrencies(): CurrencyConfig[] {
  return Object.values(CURRENCIES);
}

function pow10(exp: number): bigint {
  let result = 1n;
  for (let i = 0; i < exp; i += 1) {
    result *= 10n;
  }
  return result;
}

export function parseAmountToMinor(rawInput: string, currency: CurrencyCode): bigint {
  const decimals = CURRENCIES[currency].decimals;
  const normalized = rawInput.trim().replace(/,/g, "").replace(/٬/g, "");
  if (normalized === "" || !/^-?\d+(\.\d+)?$/.test(normalized)) {
    throw new Error("مبلغ وارد شده معتبر نیست");
  }
  const negative = normalized.startsWith("-");
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [wholePartRaw, fractionPartRaw = ""] = unsigned.split(".");
  const wholePart = wholePartRaw === "" ? "0" : wholePartRaw;
  if (fractionPartRaw.length > decimals) {
    throw new Error(`مبلغ نمی‌تواند بیش از ${decimals} رقم اعشار داشته باشد`);
  }
  const fractionPart = fractionPartRaw.padEnd(decimals, "0");
  const combined = `${wholePart}${fractionPart}`.replace(/^0+(?=\d)/, "");
  const minor = BigInt(combined === "" ? "0" : combined);
  return negative ? -minor : minor;
}

export function minorToDisplayString(minor: bigint, currency: CurrencyCode): string {
  const decimals = CURRENCIES[currency].decimals;
  const negative = minor < 0n;
  const absMinor = negative ? -minor : minor;
  const scale = pow10(decimals);
  const whole = absMinor / scale;
  const fraction = absMinor % scale;
  const wholeWithSeparators = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const sign = negative ? "-" : "";
  if (decimals === 0) {
    return `${sign}${wholeWithSeparators}`;
  }
  const fractionText = fraction.toString().padStart(decimals, "0");
  return `${sign}${wholeWithSeparators}.${fractionText}`;
}

export function formatMoney(minor: bigint, currency: CurrencyCode): string {
  return `${minorToDisplayString(minor, currency)} ${CURRENCIES[currency].symbol}`;
}

export function addMinor(a: bigint, b: bigint): bigint {
  return a + b;
}

export function subtractMinor(a: bigint, b: bigint): bigint {
  return a - b;
}

export function minorToNumberForChart(minor: bigint, currency: CurrencyCode): number {
  const decimals = CURRENCIES[currency].decimals;
  const scale = pow10(decimals);
  const whole = minor / scale;
  const fraction = minor % scale;
  return Number(whole) + Number(fraction) / Number(scale);
}

export function clampPercent(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function percentOf(numeratorMinor: bigint, denominatorMinor: bigint): number {
  if (denominatorMinor === 0n) return 0;
  const numerator = Number(numeratorMinor);
  const denominator = Number(denominatorMinor);
  return clampPercent((numerator / denominator) * 100);
}
