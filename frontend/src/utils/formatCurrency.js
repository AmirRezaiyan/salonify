const PERSIAN_DIGITS = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];

function getCurrentNumberLocale() {
  if (typeof window === 'undefined') return 'fa-IR';

  const storedLanguage = window.localStorage.getItem('salonify_language');
  if (storedLanguage === 'en') return 'en-US';

  const htmlLang = document.documentElement?.lang;
  return htmlLang === 'en' ? 'en-US' : 'fa-IR';
}

export function persianizeNumbers(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
}

export function toPersianNumber(value, options = {}) {
  if (value === null || value === undefined || value === '') return '';

  const locale = getCurrentNumberLocale();
  const num = Number(value);
  if (Number.isFinite(num)) {
    return num.toLocaleString(locale, options);
  }

  return locale === 'en-US' ? String(value) : persianizeNumbers(value);
}

export function formatNumberForToman(value) {
  // Accept numbers, numeric strings, arrays (sum), or null/undefined
  if (Array.isArray(value)) {
    value = value.reduce((acc, v) => acc + (Number(v) || 0), 0);
  }
  const num = Number(value) || 0;
  // Round to nearest integer (toman, no decimals)
  const rounded = Math.round(num);
  return toPersianNumber(rounded);
}

export function formatToman(value, isEnglish) {
  const resolvedIsEnglish = typeof isEnglish === 'boolean'
    ? isEnglish
    : getCurrentNumberLocale() === 'en-US';
  const unit = resolvedIsEnglish ? 'Toman' : 'تومان';
  return `${formatNumberForToman(value)} ${unit}`;
}

export default formatToman;