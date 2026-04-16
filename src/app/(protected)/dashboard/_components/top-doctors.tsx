import { Activity, Stethoscope } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TopDoctorsProps {
  doctors: {
    id: string;
    name: string;
    avatarImageUrl: string | null;
    specialty: string;
    appointments: number;
  }[];
}

export default function TopDoctors({ doctors }: TopDoctorsProps) {
  const maxAppointments = Math.max(...doctors.map((doctor) => doctor.appointments), 1);
  const totalAppointments = doctors.reduce((sum, doctor) => sum + doctor.appointments, 0);

  return (
    <Card className="animate-panel-fade-up overflow-hidden">
      <CardHeader className="space-y-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-slate-500">
              <Stethoscope className="size-4 text-primary" />
              <span className="text-sm font-medium">Equipe em destaque</span>
            </div>
            <CardTitle className="text-xl text-slate-900">Médicos do período</CardTitle>
            <CardDescription>Quem mais concentrou atendimentos no intervalo selecionado.</CardDescription>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef5f5] text-primary">
            <Activity className="size-5" />
          </div>
        </div>

        <div className="rounded-[22px] border border-slate-200/80 bg-[#f7fbfa] p-4">
          <p className="text-sm text-slate-500">Agendamentos considerados</p>
          <p className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-slate-900">{totalAppointments}</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-5 py-5">
        {doctors.length ? (
          doctors.map((doctor) => {
            const progress = Math.max(12, Math.round((doctor.appointments / maxAppointments) * 100));
            return (
              <div key={doctor.id} className="rounded-[22px] border border-slate-200/70 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_22px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-11 w-11 rounded-2xl border border-white shadow-[0_8px_16px_rgba(15,23,42,0.08)]">
                      <AvatarFallback className="rounded-2xl bg-[#eef5f5] text-sm font-semibold text-slate-700">
                        {doctor.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-slate-900">{doctor.name}</h3>
                      <p className="truncate text-sm text-slate-500">{doctor.specialty}</p>
                    </div>
                  </div>
                  <div className="rounded-full bg-[#eef5f5] px-3 py-1 text-xs font-semibold text-slate-700">
                    {doctor.appointments} agend.
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-[linear-gradient(90deg,#18a999,#4568d7)]" style={{ width: `${progress}%` }} />
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-[22px] border border-dashed border-slate-200 bg-[#f7fbfa] px-4 py-6 text-center text-sm text-slate-500">
            Ainda não há médicos com atendimentos no período.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
