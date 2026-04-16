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
    <div className="mx-auto w-full max-w-7xl px-3 pt-2 sm:px-4 md:px-6">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            {clinic.logoUrl ? (
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <Image src={clinic.logoUrl} alt={clinic.name} fill className="object-contain p-2" sizes="56px" />
              </div>
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                <Building2 className="size-5" />
              </div>
            )}

            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-slate-900 md:text-xl">{clinic.name}</h1>
              {clinic.cnpj ? <p className="mt-1 text-sm text-slate-500">CNPJ: {formatCnpj(clinic.cnpj)}</p> : null}
            </div>
          </div>

          <div className="flex flex-col gap-2 text-sm text-slate-500 md:items-end">
            {clinic.phoneNumber ? (
              <span className="inline-flex items-center gap-2">
                <Phone className="size-4" />
                {formatPhoneNumber(clinic.phoneNumber)}
              </span>
            ) : null}
            {clinicAddress ? (
              <span className="inline-flex items-center gap-2 md:text-right">
                <MapPin className="size-4 shrink-0" />
                {clinicAddress}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
