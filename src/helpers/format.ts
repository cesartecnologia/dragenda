export const formatPhoneNumber = (value?: string | null) => {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  return value;
};

export const formatCnpj = (value?: string | null) => {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length !== 14) return value;
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

export const formatClinicAddress = (clinic?: {
  address?: string | null;
  addressNumber?: string | null;
  addressComplement?: string | null;
} | null) => {
  if (!clinic) return '';

  const address = clinic.address?.trim() ?? '';
  const number = clinic.addressNumber?.trim() ?? '';
  const complement = clinic.addressComplement?.trim() ?? '';

  if (!address && !number && !complement) return '';

  return [
    [address, number].filter(Boolean).join(', '),
    complement,
  ]
    .filter(Boolean)
    .join(' - ');
};

export const normalizeSearchText = (value?: string | null) =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
