const PERSIAN_DIGITS = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];

export function persianizeNumbers(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
}

export function toPersianNumber(value, options = {}) {
  if (value === null || value === undefined || value === '') return '';

  const num = Number(value);
  if (Number.isFinite(num)) {
    return num.toLocaleString('fa-IR', options);
  }

  return persianizeNumbers(value);
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

export function formatToman(value) {
  return `${formatNumberForToman(value)} تومان`;
}

export default formatToman;
