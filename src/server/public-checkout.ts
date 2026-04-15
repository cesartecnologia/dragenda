export const PLAN_ID = 'essential';
export const PLAN_LABEL = 'Plano Premium';
export const PLAN_VALUE = Number(process.env.ASAAS_PLAN_VALUE ?? '99.90');
export const PLAN_DESCRIPTION = 'Assinatura mensal para liberar o acesso completo da clínica.';

export type PublicCheckoutLeadInput = {
  responsibleName: string;
  email: string;
  cpfCnpj: string;
  phoneNumber: string;
};

export const onlyDigits = (value?: string | null) => (value ?? '').replace(/\D/g, '');

export const normalizePublicCheckoutLeadInput = (body: Record<string, unknown>): PublicCheckoutLeadInput => ({
  responsibleName: String(body.responsibleName ?? '').trim(),
  email: String(body.email ?? '').trim().toLowerCase(),
  cpfCnpj: onlyDigits(String(body.cpfCnpj ?? body.clinicCnpj ?? '')),
  phoneNumber: onlyDigits(String(body.phoneNumber ?? body.clinicPhoneNumber ?? '')),
});

const isEmail = (value: string) => /.+@.+\..+/.test(value);

export const validatePublicCheckoutLeadInput = (input: PublicCheckoutLeadInput) => {
  if (!input.responsibleName) {
    return 'Informe o nome do responsável para continuar.';
  }

  if (!input.email || !isEmail(input.email)) {
    return 'Informe um e-mail válido para continuar.';
  }

  if (input.cpfCnpj.length !== 11 && input.cpfCnpj.length !== 14) {
    return 'Informe um CPF ou CNPJ válido para continuar.';
  }

  if (input.phoneNumber.length < 10) {
    return 'Informe um telefone válido para continuar.';
  }

  return null;
};
