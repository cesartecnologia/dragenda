'use client';

import { ArrowUpDown, CalendarRange, Clock3, Filter, Pencil, Search, Stethoscope, Wallet } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import DoctorAvatar from '@/components/common/doctor-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { doctorsTable } from '@/db/schema';
import { formatCurrencyInCents } from '@/helpers/currency';
import { normalizeSearchText } from '@/helpers/format';

import AddDoctorButton from '../../doctors/_components/add-doctor-button';
const UpsertDoctorForm = dynamic(() => import('../../doctors/_components/upsert-doctor-form'), {
  ssr: false,
});

const formatDate = (value?: string) => {
  if (!value) return 'Periodo nao informado';
  const [y, m, d] = value.split('-');
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
};

const formatTime = (value?: string) => (value ?? '').slice(0, 5);

const getDoctorSummary = (doctor: typeof doctorsTable.$inferSelect) => {
  const ranges = doctor.availabilityRanges ?? [];
  const first = ranges[0];

  if (!first) {
    return {
      period: 'Periodo nao informado',
      hours: 'Horario nao informado',
    };
  }

  const period = first.startDate === first.endDate
    ? formatDate(first.startDate)
    : `${formatDate(first.startDate)} ate ${formatDate(first.endDate)}`;

  return {
    period,
    hours: `${formatTime(first.fromTime)} as ${formatTime(first.toTime)}`,
  };
};

export default function MedicosCatalogo({
  doctors,
  specialties,
}: {
  doctors: Array<typeof doctorsTable.$inferSelect>;
  specialties: string[];
}) {
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'specialty' | 'price'>('name');
  const [selectedDoctor, setSelectedDoctor] = useState<(typeof doctorsTable.$inferSelect) | null>(null);

  const filteredDoctors = useMemo(() => {
    const query = normalizeSearchText(search);

    const base = doctors.filter((doctor) => {
      const matchesSearch = !query || [doctor.name, doctor.specialty, doctor.crm]
        .map((item) => normalizeSearchText(item))
        .some((item) => item.includes(query));
      const matchesSpecialty = specialty === 'all' || doctor.specialty === specialty;
      return matchesSearch && matchesSpecialty;
    });

    return [...base].sort((left, right) => {
      if (sortBy === 'specialty') return left.specialty.localeCompare(right.specialty, 'pt-BR');
      if (sortBy === 'price') return (right.appointmentPriceInCents ?? 0) - (left.appointmentPriceInCents ?? 0);
      return left.name.localeCompare(right.name, 'pt-BR');
    });
  }, [doctors, search, specialty, sortBy]);

  return (
    <div className="space-y-6">
      <div className="page-surface px-5 py-5 md:px-6">
        <h1 className="text-[1.85rem] font-semibold text-[#3d3329] md:text-[2rem]">Medicos</h1>
        <p className="mt-1 text-sm text-[#7f725f]">Gerencie o corpo clinico, horarios, especialidades e dados de atendimento.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#ddceb1]/80 bg-[#fffdf6] px-4 py-3">
            <p className="section-title !text-[10px]">Medicos cadastrados</p>
            <p className="mt-1 text-2xl font-semibold text-[#3f352b]">{doctors.length}</p>
          </div>
          <div className="rounded-2xl border border-[#ddceb1]/80 bg-[#fffdf6] px-4 py-3">
            <p className="section-title !text-[10px]">Especialidades ativas</p>
            <p className="mt-1 text-2xl font-semibold text-[#3f352b]">{specialties.length}</p>
          </div>
        </div>
      </div>

      <Card className="border-[#dfd0b4]/85">
        <CardContent className="p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9a8d7a]" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" placeholder="Buscar por nome, CRM ou especialidade" />
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:flex-nowrap">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#d5c4a5] bg-[#fff8ea]">
                <Filter className="size-4 text-[#766955]" />
                <Select value={specialty} onValueChange={setSpecialty}>
                  <SelectTrigger aria-label="Filtrar especialidade" className="absolute h-10 w-10 border-0 p-0 opacity-0 shadow-none focus:ring-0">
                    <SelectValue placeholder="Filtrar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as especialidades</SelectItem>
                    {specialties.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#d5c4a5] bg-[#fff8ea]">
                <ArrowUpDown className="size-4 text-[#766955]" />
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'name' | 'specialty' | 'price')}>
                  <SelectTrigger aria-label="Ordenar medicos" className="absolute h-10 w-10 border-0 p-0 opacity-0 shadow-none focus:ring-0">
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Ordenar por nome</SelectItem>
                    <SelectItem value="specialty">Ordenar por especialidade</SelectItem>
                    <SelectItem value="price">Ordenar por valor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" className="h-10 rounded-xl px-4" asChild>
                <Link href="/especialidades">Especialidades</Link>
              </Button>
              <div className="[&>button]:h-10 [&>button]:rounded-xl [&>button]:px-4">
                <AddDoctorButton specialties={specialties} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {filteredDoctors.map((doctor) => {
          const summary = getDoctorSummary(doctor);

          return (
            <Card key={doctor.id} className="overflow-hidden border-[#dfd0b4]/90 bg-[#fffef8] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(87,64,33,0.14)]">
              <CardHeader className="border-b border-[#eadfcd] bg-[#faf3e6] p-5">
                <div className="flex items-center gap-4">
                  <DoctorAvatar
                    name={doctor.name}
                    imageUrl={doctor.avatarImageUrl}
                    sex={doctor.sex}
                    className="h-28 w-24 rounded-2xl"
                  />
                  <div className="min-w-0 flex-1 self-center">
                    <h3 className="line-clamp-2 break-words text-[1.12rem] font-semibold leading-tight text-[#3d3329] [overflow-wrap:anywhere]">
                      {doctor.name}
                    </h3>
                    <div className="mt-2.5 space-y-2">
                      <div className="inline-flex max-w-full items-start gap-1.5 rounded-full bg-[#e7f1dc] px-2.5 py-1 text-[11px] font-medium text-[#35633e]">
                        <Stethoscope className="mt-0.5 size-3 shrink-0" />
                        <span className="line-clamp-2 break-words leading-4">{doctor.specialty}</span>
                      </div>
                      <div>
                        <Badge variant="outline" className="rounded-full border-[#d3c4a8] px-2.5 py-1 text-[10px] font-medium text-[#6b5e4c]">
                          CRM {doctor.crm}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 p-4 text-sm text-[#665848]">
                <div className="flex items-center gap-2"><CalendarRange className="size-4 text-[#9a8d7a]" /><span className="truncate">{summary.period}</span></div>
                <div className="flex items-center gap-2"><Clock3 className="size-4 text-[#9a8d7a]" /><span>{summary.hours}</span></div>
                <div className="flex items-center gap-2"><Wallet className="size-4 text-[#9a8d7a]" /><span>{formatCurrencyInCents(doctor.appointmentPriceInCents)}</span></div>
              </CardContent>
              <CardFooter className="border-t border-[#eadfcd] p-4">
                <Button className="w-full" onClick={() => setSelectedDoctor(doctor)}>
                  <Pencil className="mr-2 size-4" />
                  Ver detalhes
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Dialog open={Boolean(selectedDoctor)} onOpenChange={(open) => !open && setSelectedDoctor(null)}>
        {selectedDoctor ? (
          <UpsertDoctorForm doctor={selectedDoctor} specialties={specialties} onSuccess={() => setSelectedDoctor(null)} />
        ) : null}
      </Dialog>

      {!filteredDoctors.length ? (
        <div className="rounded-2xl border border-dashed border-[#d7c9af] bg-[#fffdf7] p-10 text-center text-sm text-[#7f725f]">
          Nenhum medico encontrado com os filtros selecionados.
        </div>
      ) : null}
    </div>
  );
}
