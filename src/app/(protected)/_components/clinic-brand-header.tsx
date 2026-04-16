'use client';

import Image from 'next/image';
import { Building2, MapPin, Phone } from 'lucide-react';
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
    <div className="mx-auto w-full px-3 pt-3 sm:px-4 md:px-6 md:pt-4">
      <div className="rounded-[1.75rem] border border-slate-200/80 bg-slate-50/85 px-4 py-4 shadow-[0_16px_35px_-28px_rgba(15,23,42,0.22)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            {clinic.logoUrl ? (
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <Image src={clinic.logoUrl} alt={clinic.name} fill className="object-contain p-2" sizes="48px" />
              </div>
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600">
                <Building2 className="size-5" />
              </div>
            )}

            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Visão da clínica</p>
              <h1 className="mt-1 truncate text-lg font-semibold tracking-tight text-slate-900 md:text-xl">{clinic.name}</h1>
              {clinic.cnpj ? <p className="mt-1 text-sm text-slate-500">CNPJ {formatCnpj(clinic.cnpj)}</p> : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-slate-600">
            {clinic.phoneNumber ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                <Phone className="size-4 text-slate-400" />
                {formatPhoneNumber(clinic.phoneNumber)}
              </span>
            ) : null}
            {clinicAddress ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                <MapPin className="size-4 shrink-0 text-slate-400" />
                <span className="max-w-[440px] truncate">{clinicAddress}</span>
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
