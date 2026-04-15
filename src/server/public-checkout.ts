export const PLAN_ID = 'essential';
export const PLAN_LABEL = 'Plano Premium';
export const PLAN_VALUE = Number(process.env.ASAAS_PLAN_VALUE ?? '99.90');
export const PLAN_DESCRIPTION = 'Assinatura mensal para liberar o acesso completo da clínica.';

export type PublicCheckoutInput = {
  responsibleName: string;
  email: string;
  clinicName: string;
  clinicCnpj: string;
  clinicPhoneNumber: string;
  clinicAddress: string;
  clinicAddressNumber: string;
  clinicAddressComplement: string | null;
  clinicPostalCode: string;
  clinicProvince: string;
};

export const onlyDigits = (value?: string | null) => (value ?? '').replace(/\D/g, '');

export const normalizePublicCheckoutInput = (body: Record<string, unknown>): PublicCheckoutInput => ({
  responsibleName: String(body.responsibleName ?? '').trim(),
  email: String(body.email ?? '').trim().toLowerCase(),
  clinicName: String(body.clinicName ?? '').trim(),
  clinicCnpj: onlyDigits(String(body.clinicCnpj ?? '')),
  clinicPhoneNumber: onlyDigits(String(body.clinicPhoneNumber ?? '')),
  clinicAddress: String(body.clinicAddress ?? '').trim(),
  clinicAddressNumber: String(body.clinicAddressNumber ?? '').trim(),
  clinicAddressComplement: String(body.clinicAddressComplement ?? '').trim() || null,
  clinicPostalCode: onlyDigits(String(body.clinicPostalCode ?? '')),
  clinicProvince: String(body.clinicProvince ?? '').trim(),
});

export const validatePublicCheckoutInput = (input: PublicCheckoutInput) => {
  if (!input.responsibleName || !input.email || !input.clinicName) {
    return 'Preencha nome, e-mail e nome da clínica para continuar.';
  }

  if (input.clinicCnpj.length !== 14) {
    return 'Informe um CNPJ válido para continuar.';
  }

  if (input.clinicPhoneNumber.length < 10) {
    return 'Informe um telefone válido para continuar.';
  }

  if (!input.clinicAddress || !input.clinicAddressNumber || input.clinicPostalCode.length !== 8 || !input.clinicProvince) {
    return 'Preencha endereço, número, CEP e bairro para continuar.';
  }

  return null;
};
