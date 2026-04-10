'use client';

import Image from 'next/image';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { DoctorSex } from '@/db/schema';
import { cn } from '@/lib/utils';

function MaleDoctorIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="size-8">
      <path d="M18 25c0-8 6-13 14-13s14 5 14 13v3H18z" fill="currentColor" opacity="0.18" />
      <circle cx="32" cy="25" r="10" fill="currentColor" opacity="0.24" />
      <path d="M20 52c1.5-8 7.5-13 12-13s10.5 5 12 13" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M22 20c2-6 6-9 10-9 4.5 0 8.5 2.6 10.7 7" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M28 46l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 50v6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function FemaleDoctorIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="size-8">
      <path d="M18 28c0-10 6-16 14-16s14 6 14 16v2H18z" fill="currentColor" opacity="0.18" />
      <circle cx="32" cy="26" r="9.5" fill="currentColor" opacity="0.24" />
      <path d="M18 31c0 6 2 10 5 13" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M46 31c0 6-2 10-5 13" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M21 52c1.5-7 7.5-12 11-12s9.5 5 11 12" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M32 46v8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M28 50h8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

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
        <AvatarFallback
          className={cn(
            'text-slate-700',
            isFemale ? 'bg-rose-50 text-rose-600' : 'bg-sky-50 text-sky-600',
          )}
        >
          {isFemale ? <FemaleDoctorIcon /> : <MaleDoctorIcon />}
        </AvatarFallback>
      )}
    </Avatar>
  );
}
