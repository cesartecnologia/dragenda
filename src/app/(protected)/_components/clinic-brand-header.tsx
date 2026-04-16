'use client';

import { Building2, MapPin, Phone } from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

import { formatClinicAddress, formatCnpj, formatPhoneNumber } from '@/helpers/format';

interface Props {
  clinic: {
    name: string;
    cnpj?: string | null;
    phoneNumber?: string | null;
    address?: string | null;
    addressNumber?: string | null;
    addressComplement?: string | null;
    province?: string | null;
    postalCode?: string | null;
    logoUrl?: string | null;
  } | null;
}

const hiddenRoutes = ['/configuracoes', '/comprovantes', '/relatorios/pdf'];

export default function ClinicBrandHeader({ clinic }: Props) {
  const pathname = usePathname();

  if (!clinic) return null;
  if (hiddenRoutes.some((route) => pathname.startsWith(route))) return null;

  const clinicAddress = formatClinicAddress(clinic);

  return (
    <div className="animate-panel-fade-up px-4 pt-4 md:px-6 md:pt-5">
      <div className="rounded-[28px] border border-slate-200/80 bg-[#f7fbfa] px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)] md:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[22px] border border-white bg-white shadow-[0_10px_18px_rgba(15,23,42,0.06)]">
              {clinic.logoUrl ? (
                <div className="relative h-10 w-10 overflow-hidden">
                  <Image src={clinic.logoUrl} alt={clinic.name} fill className="object-contain" sizes="40px" />
                </div>
              ) : (
                <Building2 className="size-7 text-primary" />
              )}
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">Visão geral da clínica</p>
              <h1 className="truncate text-xl font-semibold tracking-[-0.03em] text-slate-900 md:text-2xl">{clinic.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                {clinic.cnpj ? <span>CNPJ: {formatCnpj(clinic.cnpj)}</span> : null}
                {clinic.phoneNumber ? <span>Telefone: {formatPhoneNumber(clinic.phoneNumber)}</span> : null}
              </div>
            </div>
          </div>

          <div className="grid gap-2 text-sm text-slate-600">
            {clinicAddress ? (
              <div className="flex items-start gap-2 rounded-2xl border border-white bg-white/80 px-3 py-2 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{clinicAddress}</span>
              </div>
            ) : null}
            {clinic.phoneNumber ? (
              <div className="flex items-center gap-2 rounded-2xl border border-white bg-white/80 px-3 py-2 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
                <Phone className="size-4 shrink-0 text-primary" />
                <span>{formatPhoneNumber(clinic.phoneNumber)}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
