import './globals.css';

import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Toaster } from 'sonner';

import QueryProvider from '@/components/providers/query-provider';

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
