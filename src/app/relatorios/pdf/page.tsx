import { redirect } from 'next/navigation';

interface Props { searchParams: Promise<{ from?: string; to?: string; payment?: string; doctor?: string }> }

export default async function RelatoriosPdfPage({ searchParams }: Props) {
  const { from = '', to = '', payment = 'all', doctor = 'all' } = await searchParams;
  const query = new URLSearchParams();
  if (from) query.set('from', from);
  if (to) query.set('to', to);
  query.set('payment', payment);
  query.set('doctor', doctor);
  redirect(`/impressao/relatorio?${query.toString()}`);
}
