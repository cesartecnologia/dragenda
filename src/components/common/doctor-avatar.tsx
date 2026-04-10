'use client';

import Image from 'next/image';

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
  const fallbackIcon = sex === 'female' ? '/icons/doctor-female.svg' : '/icons/doctor-male.svg';

  return (
    <Avatar className={cn('overflow-hidden bg-transparent shadow-none ring-0', className)}>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          width={160}
          height={200}
          className="h-full w-full object-cover"
        />
      ) : (
        <AvatarFallback className="bg-transparent p-0 text-transparent">
          <Image
            src={fallbackIcon}
            alt={sex === 'female' ? 'Ícone médica' : 'Ícone médico'}
            width={160}
            height={200}
            className="h-full w-full object-contain"
          />
        </AvatarFallback>
      )}
    </Avatar>
  );
}
