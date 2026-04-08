import { MessageCircle } from 'lucide-react';

export default function SupportFloatButton({ clinicName }: { clinicName?: string | null }) {
  const message = clinicName
    ? `Olá, preciso de suporte para a clínica ${clinicName}. Podem me ajudar?`
    : 'Olá, preciso de suporte na clínica. Podem me ajudar?';
  const defaultMessage = encodeURIComponent(message);

  return (
    <a
      href={`https://wa.me/5533999675619?text=${defaultMessage}`}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-green-500 px-4 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-green-600"
    >
      <MessageCircle className="size-5" />
      <span className="hidden sm:inline">Suporte</span>
    </a>
  );
}
