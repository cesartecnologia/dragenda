import './globals.css';

import dynamic from 'next/dynamic';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import QueryProvider from '@/components/providers/query-provider';

const Toaster = dynamic(() => import('sonner').then((mod) => mod.Toaster));

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body className="font-sans">
        <QueryProvider>
          <NuqsAdapter>{children}</NuqsAdapter>
          <Toaster position="bottom-center" richColors theme="light" />
        </QueryProvider>
      </body>
    </html>
  );
}
