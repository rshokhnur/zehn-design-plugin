// Pure formatters for zehn apps. Same output on server and client (no Intl, no time zone surprises beyond local time).
export type ZehnLocale = 'en' | 'ru' | 'uz';

const NBSP = ' ';

type DateInput = Date | string | number;

const toDate = (d: DateInput) => (d instanceof Date ? d : new Date(d));
const pad = (n: number) => String(n).padStart(2, '0');

/** 30.06.2026 (every locale). Uses local time. */
export function formatDate(d: DateInput, _locale: ZehnLocale = 'en'): string {
  const x = toDate(d);
  return `${pad(x.getDate())}.${pad(x.getMonth() + 1)}.${x.getFullYear()}`;
}

/** 30.06.2026 14:27 (24-hour, every locale). Uses local time. */
export function formatDateTime(d: DateInput, locale: ZehnLocale = 'en'): string {
  const x = toDate(d);
  return `${formatDate(x, locale)} ${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

/**
 * Groups thousands: en 24,000,000.5 · ru/uz 24 000 000,5 (non-breaking space U+00A0, decimal comma).
 * `fractionDigits` fixes the decimals; by default up to 2, trailing zeros dropped.
 */
export function formatNumber(n: number, locale: ZehnLocale = 'en', fractionDigits?: number): string {
  if (!Number.isFinite(n)) return String(n);
  const fixed = Math.abs(n).toFixed(fractionDigits ?? 2);
  let [int, frac = ''] = fixed.split('.');
  if (fractionDigits === undefined) frac = frac.replace(/0+$/, '');
  const group = locale === 'en' ? ',' : NBSP;
  const decimal = locale === 'en' ? '.' : ',';
  int = int.replace(/\B(?=(\d{3})+(?!\d))/g, group);
  const negative = n < 0 && /[1-9]/.test(int + frac);
  return `${negative ? '-' : ''}${int}${frac ? decimal + frac : ''}`;
}

/** en 24,000,000 UZS · ru/uz 24 000 000 UZS (U+00A0 between thousands). */
export function formatMoney(n: number, locale: ZehnLocale = 'en', currency = 'UZS', fractionDigits?: number): string {
  return `${formatNumber(n, locale, fractionDigits)} ${currency}`;
}

const durationUnits: Record<ZehnLocale, [string, string, string]> = {
  en: ['d', 'h', 'm'],
  ru: ['д', 'ч', 'м'],
  uz: ['k', 's', 'd'],
};

/** 14d 3h 22m. Zero parts are skipped; under a minute → "0m". Rounds down to the minute. */
export function formatDuration(ms: number, locale: ZehnLocale = 'en'): string {
  const [dU, hU, mU] = durationUnits[locale];
  const total = Math.floor(Math.max(0, ms) / 60000);
  const days = Math.floor(total / 1440);
  const hours = Math.floor((total % 1440) / 60);
  const mins = total % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days}${dU}`);
  if (hours) parts.push(`${hours}${hU}`);
  if (mins || parts.length === 0) parts.push(`${mins}${mU}`);
  return parts.join(' ');
}
