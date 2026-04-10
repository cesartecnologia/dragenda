'use client';

import Image from 'next/image';
import { Mars, Venus } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { DoctorSex } from '@/db/schema';
import { cn } from '@/lib/utils';

export default function DoctorAvatar({
  name,
  imageUrl,
  sex,
  className,
}: {
  name: string;
  imageUrl?: string | null;
  sex?: DoctorSex | null;
  className?: string;
}) {
  const isFemale = sex === 'female';

  return (
    <Avatar className={cn('border border-slate-200 bg-white', className)}>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          width={120}
          height={160}
          className="h-full w-full object-cover"
        />
      ) : (
        <AvatarFallback className={cn(
          'text-slate-700',
          isFemale ? 'bg-rose-50 text-rose-600' : 'bg-sky-50 text-sky-600',
        )}>
          {isFemale ? <Venus className="size-5" /> : <Mars className="size-5" />}
        </AvatarFallback>
      )}
    </Avatar>
  );
}
