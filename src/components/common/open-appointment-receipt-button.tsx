'use client';

import { Printer } from 'lucide-react';
import { type VariantProps } from 'class-variance-authority';

import { Button, buttonVariants } from '@/components/ui/button';
import { openAppointmentPrintPopup } from '@/helpers/open-appointment-print-popup';

type Props = {
  appointmentId: string;
  label?: string;
  className?: string;
} & VariantProps<typeof buttonVariants>;

export default function OpenAppointmentReceiptButton({
  appointmentId,
  label = 'Abrir comprovante',
  variant = 'outline',
  size = 'default',
  className,
}: Props) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={() => openAppointmentPrintPopup(appointmentId)}
    >
      <Printer className="size-4" />
      {label}
    </Button>
  );
}
