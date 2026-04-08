'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';

import UpsertDoctorForm from './upsert-doctor-form';

export default function AddDoctorButton({ specialties = [] }: { specialties?: string[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          Adicionar médico
        </Button>
      </DialogTrigger>
      <UpsertDoctorForm specialties={specialties} onSuccess={() => setIsOpen(false)} />
    </Dialog>
  );
}
