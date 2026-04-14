import { redirect } from 'next/navigation';

export default async function IniciarAssinaturaPage() {
  redirect('/assinatura/cartao');
}
