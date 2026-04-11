'use client';

import { ArrowUpDown, CalendarRange, Clock3, Filter, Pencil, Search, Stethoscope, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import DoctorAvatar from '@/components/common/doctor-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { doctorsTable } from '@/db/schema';
import { formatCurrencyInCents } from '@/helpers/currency';
import { normalizeSearchText } from '@/helpers/format';

import AddDoctorButton from '../../doctors/_components/add-doctor-button';
import UpsertDoctorForm from '../../doctors/_components/upsert-doctor-form';

const formatDate = (value?: string) => {
  if (!value) return 'Período não informado';
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
      period: 'Período não informado',
      hours: 'Horário não informado',
    };
  }

  const period = first.startDate === first.endDate
    ? formatDate(first.startDate)
    : `${formatDate(first.startDate)} até ${formatDate(first.endDate)}`;

  return {
    period,
    hours: `${formatTime(first.fromTime)} às ${formatTime(first.toTime)}`,
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Médicos</h1>
          <p className="mt-1 text-sm text-slate-500">Gerencie o corpo clínico, horários e dados de atendimento.</p>
        </div>
      </div>

      <Card className="border-slate-200/80 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" placeholder="Buscar por nome, CRM ou especialidade" />
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:flex-nowrap">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white">
                <Filter className="size-4 text-slate-500" />
                <Select value={specialty} onValueChange={setSpecialty}>
                  <SelectTrigger aria-label="Filtrar especialidade" className="absolute h-10 w-10 border-0 p-0 opacity-0 shadow-none focus:ring-0">
                    <SelectValue placeholder="Filtrar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as especialidades</SelectItem>
                    {specialties.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white">
                <ArrowUpDown className="size-4 text-slate-500" />
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'name' | 'specialty' | 'price')}>
                  <SelectTrigger aria-label="Ordenar médicos" className="absolute h-10 w-10 border-0 p-0 opacity-0 shadow-none focus:ring-0">
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Ordenar por nome</SelectItem>
                    <SelectItem value="specialty">Ordenar por especialidade</SelectItem>
                    <SelectItem value="price">Ordenar por valor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" className="h-10 rounded-lg px-4" asChild>
                <Link href="/especialidades">Especialidades</Link>
              </Button>
              <div className="[&>button]:h-10 [&>button]:rounded-lg [&>button]:px-4">
                <AddDoctorButton specialties={specialties} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {filteredDoctors.map((doctor) => {
          const summary = getDoctorSummary(doctor);

          return (
            <Card key={doctor.id} className="overflow-hidden border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader className="border-b border-slate-100 bg-slate-50/60 p-5">
                <div className="flex items-center gap-4">
                  <DoctorAvatar
                    name={doctor.name}
                    imageUrl={doctor.avatarImageUrl}
                    sex={doctor.sex}
                    className="h-28 w-24 rounded-2xl"
                  />
                  <div className="min-w-0 flex-1 self-center">
                    <h3 className="truncate text-[1.4rem] font-semibold leading-tight text-slate-800">{doctor.name}</h3>
                    <div className="mt-2.5 space-y-2">
                      <Badge variant="secondary" className="max-w-full rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-50">
                        <Stethoscope className="mr-1 size-3 shrink-0" />
                        <span className="truncate">{doctor.specialty}</span>
                      </Badge>
                      <div>
                        <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[10px] font-medium">CRM {doctor.crm}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 p-4 text-sm text-slate-600">
                <div className="flex items-center gap-2"><CalendarRange className="size-4 text-slate-400" /><span className="truncate">{summary.period}</span></div>
                <div className="flex items-center gap-2"><Clock3 className="size-4 text-slate-400" /><span>{summary.hours}</span></div>
                <div className="flex items-center gap-2"><Wallet className="size-4 text-slate-400" /><span>{formatCurrencyInCents(doctor.appointmentPriceInCents)}</span></div>
              </CardContent>
              <CardFooter className="border-t border-slate-100 p-4">
                <Dialog open={selectedDoctor?.id === doctor.id} onOpenChange={(open) => setSelectedDoctor(open ? doctor : null)}>
                  <DialogTrigger asChild>
                    <Button className="w-full rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                      <Pencil className="mr-2 size-4" />
                      Ver detalhes
                    </Button>
                  </DialogTrigger>
                  <UpsertDoctorForm doctor={doctor} specialties={specialties} onSuccess={() => setSelectedDoctor(null)} />
                </Dialog>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {!filteredDoctors.length ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Nenhum médico encontrado com os filtros selecionados.
        </div>
      ) : null}
    </div>
  );
}
