'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { PatternFormat } from 'react-number-format';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  name: z.string().trim().min(1, { message: 'Informe o nome do responsável.' }),
  email: z.string().trim().email({ message: 'Informe um e-mail válido.' }),
  cpfCnpj: z.string().trim().min(11, { message: 'Informe um CPF ou CNPJ válido.' }),
  phone: z.string().trim().min(10, { message: 'Informe um telefone válido.' }),
});

type FormValues = z.infer<typeof formSchema>;

type PublicBoletoCheckoutFormProps = {
  variant?: 'dialog' | 'page';
  triggerClassName?: string;
};

const defaultValues: FormValues = {
  name: '',
  email: '',
  cpfCnpj: '',
  phone: '',
};

function BoletoCheckoutFields({ form, isSubmitting }: { form: UseFormReturn<FormValues>; isSubmitting: boolean }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
        Informe apenas os dados do responsável pelo pagamento. Os dados da clínica ficam para depois da confirmação.
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Nome do responsável</FormLabel>
              <FormControl>
                <Input placeholder="Digite o nome completo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input placeholder="voce@exemplo.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cpfCnpj"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPF ou CNPJ</FormLabel>
              <FormControl>
                <PatternFormat
                  customInput={Input}
                  format={field.value.replace(/\D/g, '').length > 11 ? '##.###.###/####-##' : '###.###.###-##'}
                  value={field.value ?? ''}
                  onValueChange={(value) => field.onChange(value.value)}
                  placeholder="Digite o documento"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <PatternFormat
                  customInput={Input}
                  format="(##) #####-####"
                  value={field.value ?? ''}
                  onValueChange={(value) => field.onChange(value.value)}
                  placeholder="(00) 00000-0000"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Button type="submit" className="h-12 w-full rounded-2xl bg-slate-950 text-sm font-semibold hover:bg-slate-800" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
        Gerar boleto
      </Button>
    </div>
  );
}

export function PublicBoletoCheckoutForm({ variant = 'dialog', triggerClassName }: PublicBoletoCheckoutFormProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const response = await fetch('/api/asaas/public-boleto-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string; checkoutUrl?: string } | null;

      if (!response.ok || !payload?.checkoutUrl) {
        throw new Error(payload?.error || 'Não foi possível gerar o boleto agora.');
      }

      window.location.assign(payload.checkoutUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível gerar o boleto agora.';
      toast.error(message);
    }
  };

  if (variant === 'page') {
    return (
      <div className="w-full rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="mb-6 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
            <FileText className="h-3.5 w-3.5" />
            Boleto bancário
          </div>
          <h1 className="text-2xl font-semibold text-slate-950">Gerar boleto</h1>
          <p className="text-sm leading-6 text-slate-600">
            Faça o pagamento primeiro. O cadastro da clínica é liberado depois da confirmação.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <BoletoCheckoutFields form={form} isSubmitting={form.formState.isSubmitting} />
            <Button asChild variant="outline" className="h-11 w-full rounded-2xl border-slate-300">
              <Link href="/assinatura">Voltar</Link>
            </Button>
          </form>
        </Form>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className={triggerClassName}>
          Gerar boleto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl rounded-[28px] border-slate-200 bg-white p-0">
        <div className="p-6 sm:p-7">
          <DialogHeader className="space-y-2 text-left">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
              <FileText className="h-3.5 w-3.5" />
              Boleto bancário
            </div>
            <DialogTitle className="text-2xl font-semibold tracking-[-0.02em] text-slate-950">Gerar boleto</DialogTitle>
            <DialogDescription className="text-sm leading-6 text-slate-600">
              Informe os dados do responsável para abrir o pagamento. O cadastro da clínica fica para depois.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <BoletoCheckoutFields form={form} isSubmitting={form.formState.isSubmitting} />
            </form>
          </Form>
        </div>
        <DialogFooter className="border-t border-slate-200 px-6 py-4 sm:px-7">
          <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
