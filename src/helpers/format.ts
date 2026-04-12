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

export const normalizeSearchText = (value?: string | null) =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();


type ClinicAddressParts = {
  address?: string | null;
  addressNumber?: string | null;
  addressComplement?: string | null;
};

export const formatClinicAddress = (clinic?: ClinicAddressParts | null) => {
  const address = clinic?.address?.trim() ?? '';
  const addressNumber = clinic?.addressNumber?.trim() ?? '';
  const addressComplement = clinic?.addressComplement?.trim() ?? '';

  const base = [address, addressNumber].filter(Boolean).join(', ');
  if (base && addressComplement) return `${base} - ${addressComplement}`;
  return base || addressComplement;
};
