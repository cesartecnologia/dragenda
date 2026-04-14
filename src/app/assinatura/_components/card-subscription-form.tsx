'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CreditCard, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { PatternFormat } from 'react-number-format';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  responsibleName: z.string().trim().min(1, { message: 'Nome do responsável é obrigatório' }),
  email: z.string().trim().min(1, { message: 'E-mail é obrigatório' }).email({ message: 'E-mail inválido' }),
  clinicName: z.string().trim().min(1, { message: 'Nome da clínica é obrigatório' }),
  clinicCnpj: z.string().trim().min(14, { message: 'CNPJ é obrigatório' }),
  clinicPhoneNumber: z.string().trim().min(10, { message: 'Telefone é obrigatório' }),
  clinicAddress: z.string().trim().min(1, { message: 'Logradouro é obrigatório' }),
  clinicAddressNumber: z.string().trim().min(1, { message: 'Número é obrigatório' }),
  clinicAddressComplement: z.string().trim().optional(),
  clinicPostalCode: z.string().trim().min(8, { message: 'CEP é obrigatório' }),
  clinicProvince: z.string().trim().min(1, { message: 'Bairro é obrigatório' }),
});

export function CardSubscriptionForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      responsibleName: '',
      email: '',
      clinicName: '',
      clinicCnpj: '',
      clinicPhoneNumber: '',
      clinicAddress: '',
      clinicAddressNumber: '',
      clinicAddressComplement: '',
      clinicPostalCode: '',
      clinicProvince: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch('/api/asaas/public-card-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string; checkoutUrl?: string } | null;

      if (!response.ok || !payload?.checkoutUrl) {
        throw new Error(payload?.error || 'Não foi possível abrir a contratação agora.');
      }

      window.location.href = payload.checkoutUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível abrir a contratação agora.');
    }
  }

  return (
    <Card className="w-full border-slate-200 bg-white shadow-[0_20px_70px_rgba(14,165,233,0.10)]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CardHeader className="space-y-2 pb-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              <CreditCard className="h-3.5 w-3.5" />
              Assinatura por cartão
            </div>
            <CardTitle className="text-2xl font-semibold tracking-[-0.02em] text-slate-900 sm:text-[2rem]">
              Continue com cartão de crédito
            </CardTitle>
            <CardDescription className="text-[15px] leading-6 text-slate-600">
              Preencha os dados da clínica para abrir o checkout seguro da assinatura recorrente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Responsável</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField control={form.control} name="responsibleName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do responsável</FormLabel>
                    <FormControl><Input placeholder="Digite o nome" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl><Input placeholder="Digite o e-mail" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Dados da clínica</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField control={form.control} name="clinicName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da clínica</FormLabel>
                    <FormControl><Input placeholder="Nome fantasia da clínica" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="clinicCnpj" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <PatternFormat customInput={Input} format="##.###.###/####-##" value={field.value ?? ''} onValueChange={(value) => field.onChange(value.value)} placeholder="00.000.000/0000-00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="clinicPhoneNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <PatternFormat customInput={Input} format="(##) #####-####" value={field.value ?? ''} onValueChange={(value) => field.onChange(value.value)} placeholder="(00) 00000-0000" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="clinicPostalCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <PatternFormat customInput={Input} format="#####-###" value={field.value ?? ''} onValueChange={(value) => field.onChange(value.value)} placeholder="00000-000" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="clinicAddress" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Logradouro</FormLabel>
                    <FormControl><Input placeholder="Rua, avenida, praça..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid gap-4 md:col-span-2 md:grid-cols-3">
                  <FormField control={form.control} name="clinicAddressNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl><Input placeholder="Ex.: 123" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="clinicProvince" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl><Input placeholder="Ex.: Centro" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="clinicAddressComplement" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complemento</FormLabel>
                      <FormControl><Input placeholder="Sala, bloco, conjunto..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" variant="outline" className="w-full sm:flex-1" onClick={() => router.push('/assinatura')}>
              Voltar
            </Button>
            <Button type="submit" className="w-full sm:flex-1" size="lg" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ir para o checkout'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
