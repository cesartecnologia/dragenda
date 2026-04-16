import { ChevronRight, Stethoscope } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  return (
    <Card className="w-full rounded-[1.85rem] border border-slate-200/80 bg-white shadow-[0_20px_38px_-30px_rgba(15,23,42,0.24)]">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Equipe</p>
            <CardTitle className="mt-2 text-lg font-semibold tracking-tight text-slate-950">Médicos em destaque</CardTitle>
            <p className="mt-1 text-sm text-slate-500">Quem mais atendeu no período escolhido.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-slate-500">
            <Stethoscope className="size-4" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-4">
        {doctors.length ? doctors.map((doctor, index) => (
          <div key={doctor.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/75 px-3 py-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-500 shadow-sm">
                {index + 1}
              </div>
              <Avatar className="h-11 w-11 border border-slate-200 bg-white">
                <AvatarFallback className="bg-white text-sm font-semibold text-slate-700">
                  {doctor.name
                    .split(' ')
                    .map((name) => name[0])
                    .join('')
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-slate-900">{doctor.name}</h3>
                <p className="truncate text-sm text-slate-500">{doctor.specialty}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700">
              {doctor.appointments}
              <ChevronRight className="size-4 text-slate-400" />
            </div>
          </div>
        )) : <p className="text-sm text-slate-500">Ainda não há atendimentos suficientes para exibir este ranking.</p>}
      </CardContent>
    </Card>
  );
}
