'use client';

import { useState } from 'react';

import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { useAppointmentFormOptions } from './use-appointment-form-options';

const AddAppointmentForm = dynamic(() => import('./add-appointment-form'), {
  ssr: false,
});

const AddAppointmentButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { doctors, patients, isLoading, ensureLoaded } = useAppointmentFormOptions();

  const handleOpen = async () => {
    try {
      await ensureLoaded();
      setIsOpen(true);
    } catch {
      toast.error('Não foi possível carregar os dados para o novo agendamento.');
    }
  };

  return (
    <>
      <Button onClick={handleOpen} disabled={isLoading}>
        <Plus className="mr-2 h-4 w-4" />
        {isLoading ? 'Carregando...' : 'Novo agendamento'}
      </Button>
      <AddAppointmentForm
        isOpen={isOpen}
        patients={patients}
        doctors={doctors}
        onSuccess={() => setIsOpen(false)}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};

export default AddAppointmentButton;
