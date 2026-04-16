import { FileText } from 'lucide-react';

import { AuthShell } from '@/app/authentication/components/auth-shell';
import { PublicCheckoutButton } from '@/app/assinatura/_components/public-checkout-button';

export const dynamic = 'force-dynamic';

export default function AssinaturaBoletoPage() {
  return (
    <AuthShell headerLinkHref="/login" headerLinkLabel="Área do cliente" mode="single">
      <div className="w-full rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="mb-6 space-y-2 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
            <FileText className="h-3.5 w-3.5" />
            Boleto bancário
          </div>
          <h1 className="text-2xl font-semibold text-slate-950">Gerar boleto</h1>
          <p className="text-sm leading-6 text-slate-600">
            Você será levado para a página de pagamento do Asaas e o andamento ficará salvo para continuar depois.
          </p>
        </div>

        <PublicCheckoutButton
          paymentMethod="boleto"
          label="Gerar boleto"
          variant="outline"
          className="h-12 w-full rounded-2xl border-slate-300 bg-white text-sm font-semibold text-slate-900 hover:bg-slate-50"
        />
      </div>
    </AuthShell>
  );
}
