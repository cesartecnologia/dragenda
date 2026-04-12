export type ClinicAddressLike = {
  address?: string | null;
  addressNumber?: string | null;
  addressComplement?: string | null;
  province?: string | null;
  postalCode?: string | null;
};

const onlyDigits = (value?: string | null) => (value ?? '').replace(/\D/g, '');

export const formatPostalCode = (value?: string | null) => {
  const digits = onlyDigits(value);
  if (digits.length !== 8) return value?.trim() ?? '';
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

export const formatClinicAddress = (clinic?: ClinicAddressLike | null) => {
  if (!clinic) return '';

  const parts = [
    clinic.address?.trim(),
    clinic.addressNumber?.trim(),
    clinic.addressComplement?.trim(),
    clinic.province?.trim(),
    formatPostalCode(clinic.postalCode),
  ].filter((value): value is string => Boolean(value));

  return parts.join(', ');
};

export const parseLegacyClinicAddress = (value?: string | null) => {
  const raw = value?.trim() ?? '';
  if (!raw) {
    return {
      address: null,
      addressNumber: null,
      addressComplement: null,
      province: null,
      postalCode: null,
    };
  }

  const postalCodeMatch = raw.match(/(\d{5}-?\d{3})/);
  const postalCode = postalCodeMatch ? onlyDigits(postalCodeMatch[1]) : null;
  const withoutPostalCode = postalCodeMatch ? raw.replace(postalCodeMatch[0], '').replace(/\s{2,}/g, ' ').trim().replace(/[,-]\s*$/, '') : raw;
  const parts = withoutPostalCode.split(',').map((part) => part.trim()).filter(Boolean);

  let address = parts[0] ?? raw;
  let addressNumber: string | null = null;
  let addressComplement: string | null = null;
  let province: string | null = null;

  if (parts.length >= 2) {
    const numberCandidate = parts[1];
    const numberMatch = numberCandidate.match(/\d+[A-Za-z-]*/);
    if (numberMatch) {
      addressNumber = numberMatch[0];
      const rest = numberCandidate.replace(numberMatch[0], '').trim().replace(/^[-–,\s]+/, '').trim();
      if (rest) addressComplement = rest;
    } else {
      addressNumber = numberCandidate || null;
    }
  } else {
    const inlineMatch = raw.match(/^(.*?)(?:,\s*|\s+)(\d+[A-Za-z-]*)(?:\s*[,-]\s*(.*))?$/);
    if (inlineMatch) {
      address = inlineMatch[1].trim() || address;
      addressNumber = inlineMatch[2].trim() || null;
      const rest = inlineMatch[3]?.trim();
      if (rest) addressComplement = rest;
    }
  }

  const tail = parts.slice(2);
  if (tail.length >= 1) province = tail[0] || null;
  if (tail.length >= 2) {
    const extra = tail.slice(1).join(', ');
    addressComplement = [addressComplement, extra].filter(Boolean).join(', ') || null;
  }

  return {
    address: address || null,
    addressNumber,
    addressComplement,
    province,
    postalCode,
  };
};
