import { Stethoscope } from 'lucide-react';

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
    <Card className="w-full rounded-3xl border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-100 p-2.5 text-slate-700">
            <Stethoscope className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base text-slate-900">Médicos em destaque</CardTitle>
            <p className="mt-1 text-sm text-slate-500">Profissionais com mais atendimentos no período.</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {doctors.length ? doctors.map((doctor) => (
          <div key={doctor.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-3">
            <div className="flex min-w-0 items-center gap-3">
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
            <div className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700 shadow-sm">
              {doctor.appointments}
            </div>
          </div>
        )) : <p className="text-sm text-slate-500">Ainda não há atendimentos suficientes para exibir este ranking.</p>}
      </CardContent>
    </Card>
  );
}
