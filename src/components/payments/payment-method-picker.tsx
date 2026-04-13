'use client';

import { Banknote, CreditCard, MoreHorizontal, QrCode, ShieldCheck } from 'lucide-react';

import type { AppointmentPaymentMethod } from '@/db/schema';
import { cn } from '@/lib/utils';

const paymentMethodOptions: Array<{
  value: AppointmentPaymentMethod;
  label: string;
  icon: typeof QrCode;
}> = [
  { value: 'pix', label: 'Pix', icon: QrCode },
  { value: 'cash', label: 'Dinheiro', icon: Banknote },
  { value: 'card', label: 'Cartão', icon: CreditCard },
  { value: 'insurance', label: 'Convênio', icon: ShieldCheck },
  { value: 'other', label: 'Outro', icon: MoreHorizontal },
];

export function PaymentMethodPicker({
  value,
  onChange,
  disabled,
  className,
}: {
  value: AppointmentPaymentMethod;
  onChange: (value: AppointmentPaymentMethod) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-2 gap-2 sm:grid-cols-3', className)}>
      {paymentMethodOptions.map((option) => {
        const Icon = option.icon;
        const selected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={cn(
              'flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium transition',
              selected
                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            <Icon className="size-4" />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
