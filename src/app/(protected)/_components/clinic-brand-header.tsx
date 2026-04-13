'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';

import { formatCnpj, formatPhoneNumber } from '@/helpers/format';

interface Props {
  clinic: {
    name: string;
    cnpj?: string | null;
    phoneNumber?: string | null;
    address?: string | null;
    logoUrl?: string | null;
  } | null;
}

const hiddenRoutes = ['/configuracoes', '/comprovantes', '/relatorios/pdf'];

export default function ClinicBrandHeader({ clinic }: Props) {
  const pathname = usePathname();

  if (!clinic) return null;
  if (hiddenRoutes.some((route) => pathname.startsWith(route))) return null;

  return (
    <div className="mx-auto mb-2 max-w-5xl px-6 pt-1">
      <div className="flex items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          {clinic.logoUrl ? (
            <div className="relative h-[56px] w-24 shrink-0 overflow-hidden bg-transparent">
              <Image src={clinic.logoUrl} alt={clinic.name} fill className="object-contain" sizes="112px" />
            </div>
          ) : null}
          <div className="space-y-1">
            <h1 className="text-[1.42rem] font-semibold leading-tight text-slate-800 md:text-[1.6rem]">{clinic.name}</h1>
            <div className="space-y-0.5 text-[0.72rem] font-normal leading-tight text-slate-500 md:text-[0.78rem]">
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5">
                {clinic.cnpj ? <span>CNPJ: {formatCnpj(clinic.cnpj)}</span> : null}
                {clinic.phoneNumber ? <span>Telefone: {formatPhoneNumber(clinic.phoneNumber)}</span> : null}
              </div>
              {clinic.address ? <div>{clinic.address}</div> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
