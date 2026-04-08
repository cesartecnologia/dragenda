export const formatCurrencyInCents = (amount: number | null | undefined) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format((amount ?? 0) / 100);
};

export const formatCurrency = (amount: number | null | undefined) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(amount ?? 0);
};
