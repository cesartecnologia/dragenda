import { Activity } from 'lucide-react';

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
  const maxAppointments = Math.max(...doctors.map((doctor) => doctor.appointments), 1);
  const totalAppointments = doctors.reduce((sum, doctor) => sum + doctor.appointments, 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-4 border-b border-[#eadfcd] pb-5">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle className="text-xl text-[#3f352b]">Equipe em destaque</CardTitle>
            <div className="text-sm text-[#7f725f]">Quem mais atendeu no período.</div>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#efe4cf] text-[#6f5730]">
            <Activity className="size-5" />
          </div>
        </div>

        <div className="rounded-[22px] bg-[linear-gradient(135deg,#f1e3c8_0%,#faf0dd_100%)] p-4">
          <p className="text-sm text-[#7f725f]">Consultas no período</p>
          <p className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-[#3f352b]">{totalAppointments}</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-5 py-5">
        {doctors.length ? (
          doctors.map((doctor) => {
            const progress = Math.max(12, Math.round((doctor.appointments / maxAppointments) * 100));
            return (
              <div key={doctor.id} className="rounded-[22px] border border-[#eadfcd] bg-[#fffef8] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_22px_rgba(90,67,36,0.12)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-11 w-11 rounded-2xl border border-white bg-white shadow-[0_8px_16px_rgba(90,67,36,0.12)]">
                      <AvatarFallback className="rounded-2xl bg-[#efe4cf] text-sm font-semibold text-[#5f5343]">
                        {doctor.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-[#3f352b]">{doctor.name}</h3>
                      <p className="truncate text-sm text-[#7f725f]">{doctor.specialty}</p>
                    </div>
                  </div>
                  <div className="rounded-full bg-[#efe4cf] px-3 py-1 text-xs font-semibold text-[#5f5343]">
                    {doctor.appointments}
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#ede2cf]">
                  <div className="h-full rounded-full bg-[linear-gradient(90deg,#d4b073,#9f7f43)]" style={{ width: `${progress}%` }} />
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-[22px] border border-dashed border-[#d8caaf] bg-[#fbf4e8] px-4 py-6 text-center text-sm text-[#7f725f]">
            Sem atendimentos registrados neste período.
          </div>
        )}
      </CardContent>
    </Card>
  );
}



