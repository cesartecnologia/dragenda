import { getDashboardData } from '@/server/clinic-data';

interface Params {
  from: string;
  to: string;
  session: {
    user: {
      clinic: {
        id: string;
      };
    };
  };
}

export const getDashboard = async ({ from, to, session }: Params) => {
  return getDashboardData({
    clinicId: session.user.clinic.id,
    from,
    to,
  });
};
