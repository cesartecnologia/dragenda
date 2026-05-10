'use client';

import { CalendarRange, EditIcon, MoreVerticalIcon, TrashIcon } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

import { deleteDoctor } from '@/actions/delete-doctor';
import { canDeleteRecords } from '@/lib/access';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { doctorsTable, type UserRole } from '@/db/schema';

import UpsertDoctorForm from './upsert-doctor-form';

export default function DoctorsTableActions({ doctor, role, specialties = [] }: { doctor: typeof doctorsTable.$inferSelect; role?: UserRole | null; specialties?: string[] }) {
  const [upsertDialogIsOpen, setUpsertDialogIsOpen] = useState(false);
  const canDelete = canDeleteRecords(role);
  const deleteDoctorAction = useAction(deleteDoctor, { onSuccess: () => toast.success('Médico excluído com sucesso.'), onError: () => toast.error('Erro ao excluir médico.') });
  return (
    <Dialog open={upsertDialogIsOpen} onOpenChange={setUpsertDialogIsOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVerticalIcon className="size-4" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{doctor.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/medicos/${doctor.id}/agenda`}>
              <CalendarRange className="mr-2 size-4" />Agenda / Impressão
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(event) => { event.preventDefault(); setUpsertDialogIsOpen(true); }}><EditIcon className="mr-2 size-4" />Editar</DropdownMenuItem>
          {canDelete ? (
            <AlertDialog>
              <AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()}><TrashIcon className="mr-2 size-4" />Excluir</DropdownMenuItem></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Excluir médico?</AlertDialogTitle><AlertDialogDescription>Essa ação também remove os agendamentos vinculados.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteDoctorAction.execute({ id: doctor.id })}>Excluir</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <UpsertDoctorForm doctor={doctor} specialties={specialties} onSuccess={() => setUpsertDialogIsOpen(false)} />
    </Dialog>
  );
}
