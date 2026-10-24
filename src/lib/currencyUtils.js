const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatInrCurrency = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  const amount = Number(value);
  return Number.isFinite(amount) ? INR_FORMATTER.format(amount) : '—';
};

export const parseQuotationValue = (value) => {
  const normalized = String(value ?? '').trim();
  if (!normalized) return null;
  if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(normalized)) return undefined;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : undefined;
};
