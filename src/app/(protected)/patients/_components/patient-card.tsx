'use client';

import Image from 'next/image';

import { EditIcon, Mail, MapPin, MoreHorizontal, Phone, TrashIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { patientsTable, type UserRole } from '@/db/schema';
import { formatPhoneNumber } from '@/helpers/format';
import { canDeleteRecords } from '@/lib/access';

interface PatientCardProps {
  patient: typeof patientsTable.$inferSelect;
  role?: UserRole | null;
  onEdit: (patient: typeof patientsTable.$inferSelect) => void;
  onDelete: (patient: typeof patientsTable.$inferSelect) => void;
}

const getSexLabel = (sex: 'male' | 'female') => (sex === 'male' ? 'Masculino' : 'Feminino');
const getSexAvatarIcon = (sex: 'male' | 'female') => (sex === 'female' ? '/icons/patient-female.svg' : '/icons/patient-male.svg');

export default function PatientCard({ patient, role, onEdit, onDelete }: PatientCardProps) {
  const canDelete = canDeleteRecords(role);

  return (
    <Card className="h-full w-full max-w-[380px] overflow-hidden border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader className="border-b border-slate-100 bg-slate-50/70 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex h-14 w-12 shrink-0 items-center justify-center overflow-hidden">
              <Image
                src={getSexAvatarIcon(patient.sex)}
                alt={patient.sex === 'female' ? 'Paciente feminina' : 'Paciente masculino'}
                width={72}
                height={96}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0 space-y-1 pt-0.5">
              <h3 className="truncate text-base font-semibold text-slate-900">{patient.name}</h3>
              <Badge variant="outline" className="rounded-full border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                {getSexLabel(patient.sex)}
              </Badge>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52" onCloseAutoFocus={(event) => event.preventDefault()}>
              <DropdownMenuLabel className="truncate">{patient.name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={(event) => { event.preventDefault(); onEdit(patient); }}>
                <EditIcon className="mr-2 size-4" />
                Editar cadastro
              </DropdownMenuItem>
              {canDelete ? (
                <DropdownMenuItem onSelect={(event) => { event.preventDefault(); onDelete(patient); }} className="text-red-600 focus:text-red-700">
                  <TrashIcon className="mr-2 size-4" />
                  Excluir paciente
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-4 py-4 text-sm text-slate-600">
        <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
          <Phone className="size-4 shrink-0 text-slate-400" />
          <span className="truncate">{formatPhoneNumber(patient.phoneNumber)}</span>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
          <Mail className="size-4 shrink-0 text-slate-400" />
          <span className="truncate">{patient.email}</span>
        </div>
      </CardContent>

      <CardFooter className="border-t border-slate-100 px-4 py-3">
        <div className="flex w-full items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
          <MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" />
          <span className="line-clamp-2">{patient.address?.trim() || 'Endereço não informado.'}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
