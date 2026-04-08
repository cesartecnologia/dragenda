'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { doctorsTable, patientsTable } from '@/db/schema';

import AddAppointmentForm from './add-appointment-form';

interface AddAppointmentButtonProps {
  patients: (typeof patientsTable.$inferSelect)[];
  doctors: (typeof doctorsTable.$inferSelect)[];
}

const AddAppointmentButton = ({ patients, doctors }: AddAppointmentButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}><Plus className="mr-2 h-4 w-4" />Novo agendamento</Button>
      <AddAppointmentForm isOpen={isOpen} patients={patients} doctors={doctors} onSuccess={() => setIsOpen(false)} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default AddAppointmentButton;
