'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';

import SpecialtyForm from './specialty-form';

export default function AddSpecialtyButton() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          Adicionar especialidade
        </Button>
      </DialogTrigger>
      <SpecialtyForm onSuccess={() => setOpen(false)} />
    </Dialog>
  );
}
