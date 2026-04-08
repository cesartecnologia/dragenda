'use client';

import Link from 'next/link';

import { Filter, SlidersHorizontal } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { doctorsTable } from '@/db/schema';

interface AppointmentsFiltersSheetProps {
  doctors: (typeof doctorsTable.$inferSelect)[];
  q: string;
  doctor: string;
  payment: string;
  from: string;
  to: string;
}

export default function AppointmentsFiltersSheet({
  doctors,
  q,
  doctor,
  payment,
  from,
  to,
}: AppointmentsFiltersSheetProps) {
  const activeFiltersCount = [doctor !== 'all', payment !== 'all', Boolean(from), Boolean(to)].filter(Boolean).length;
  const clearHref = q ? `/agendamentos?q=${encodeURIComponent(q)}` : '/agendamentos';

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" className="h-11 rounded-xl px-4">
          <Filter className="size-4" />
          Filtros
          {activeFiltersCount ? <Badge variant="secondary" className="ml-1 rounded-full px-2">{activeFiltersCount}</Badge> : null}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="border-b px-6 pb-4">
          <SheetTitle className="flex items-center gap-2">
            <SlidersHorizontal className="size-4" /> Filtros de agendamento
          </SheetTitle>
          <SheetDescription>
            Ajuste médico, pagamento e período sem precisar poluir a tela principal.
          </SheetDescription>
        </SheetHeader>

        <form method="get" className="flex h-full flex-col">
          <input type="hidden" name="q" value={q} />

          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="space-y-2">
              <Label htmlFor="doctor">Médico</Label>
              <select
                id="doctor"
                name="doctor"
                defaultValue={doctor}
                className="flex h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
              >
                <option value="all">Todos os médicos</option>
                {doctors.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment">Pagamento</Label>
              <select
                id="payment"
                name="payment"
                defaultValue={payment}
                className="flex h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
              >
                <option value="all">Todos os status</option>
                <option value="confirmed">Pagamento confirmado</option>
                <option value="pending">Pagamento pendente</option>
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="from">Data inicial</Label>
                <Input id="from" type="date" name="from" defaultValue={from} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="to">Data final</Label>
                <Input id="to" type="date" name="to" defaultValue={to} className="h-11 rounded-xl" />
              </div>
            </div>
          </div>

          <SheetFooter className="border-t px-6 py-4 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" className="rounded-xl" asChild>
              <Link href={clearHref}>Limpar filtros</Link>
            </Button>
            <Button type="submit" className="rounded-xl">Aplicar filtros</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
