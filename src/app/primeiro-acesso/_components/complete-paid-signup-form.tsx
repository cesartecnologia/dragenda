
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { PatternFormat } from 'react-number-format';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';

const formSchema = z.object({
  sessionId: z.string().trim().min(1),
  name: z.string().trim().min(1, { message: 'Nome do responsável é obrigatório' }),
  email: z.string().trim().min(1, { message: 'E-mail é obrigatório' }).email({ message: 'E-mail inválido' }),
  password: z.string().trim().min(8, { message: 'A senha deve ter pelo menos 8 caracteres' }),
  clinicName: z.string().trim().min(1, { message: 'Nome da clínica é obrigatório' }),
  clinicCnpj: z.string().trim().min(14, { message: 'CNPJ é obrigatório' }),
  clinicPhoneNumber: z.string().trim().min(10, { message: 'Telefone é obrigatório' }),
  clinicAddress: z.string().trim().min(1, { message: 'Logradouro é obrigatório' }),
  clinicAddressNumber: z.string().trim().min(1, { message: 'Número é obrigatório' }),
  clinicAddressComplement: z.string().trim().optional(),
  clinicPostalCode: z.string().trim().min(8, { message: 'CEP é obrigatório' }),
  clinicProvince: z.string().trim().min(1, { message: 'Bairro é obrigatório' }),
});

type CompletePaidSignupFormProps = {
  sessionId: string;
  defaults: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    clinicName?: string | null;
    clinicCnpj?: string | null;
    address?: string | null;
    addressNumber?: string | null;
    complement?: string | null;
    postalCode?: string | null;
    province?: string | null;
  };
};

export function CompletePaidSignupForm({ sessionId, defaults }: CompletePaidSignupFormProps) {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sessionId,
      name: defaults.name ?? '',
      email: defaults.email ?? '',
      password: '',
      clinicName: defaults.clinicName ?? '',
      clinicCnpj: defaults.clinicCnpj ?? '',
      clinicPhoneNumber: defaults.phone ?? '',
      clinicAddress: defaults.address ?? '',
      clinicAddressNumber: defaults.addressNumber ?? '',
      clinicAddressComplement: defaults.complement ?? '',
      clinicPostalCode: defaults.postalCode ?? '',
      clinicProvince: defaults.province ?? '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await authClient.completePaidSignup(values, {
      onSuccess: () => {
        router.push('/pos-login');
        router.refresh();
      },
      onError: ({ error }) => {
        switch (error.code) {
          case 'USER_ALREADY_EXISTS':
            toast.error('Já existe uma conta com este e-mail.');
            return;
          case 'CHECKOUT_SESSION_NOT_READY':
            toast.error('O pagamento ainda não foi confirmado. Aguarde a liberação do cadastro.');
            return;
          case 'CHECKOUT_SESSION_NOT_FOUND':
            toast.error('Não encontramos essa contratação. Gere um novo pagamento.');
            return;
          case 'ONBOARDING_IN_PROGRESS':
            toast.error('Seu cadastro já está sendo finalizado em outra tentativa. Aguarde alguns instantes.');
            return;
          default:
            toast.error(error.message || 'Não foi possível concluir o cadastro agora.');
        }
      },
    });
  }

  return (
    <Card className="w-full border-sky-100 bg-white shadow-[0_20px_70px_rgba(14,165,233,0.10)]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...form.register('sessionId')} />
          <CardHeader className="space-y-2 pb-4">
            <CardTitle className="text-2xl font-semibold tracking-[-0.02em] text-slate-900 sm:text-[2rem]">Cadastro da clínica</CardTitle>
            <CardDescription className="text-[15px] leading-6 text-slate-600">
              Finalize seus dados para liberar o acesso da clínica.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Responsável</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do responsável</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o nome" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o e-mail" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Senha de acesso</FormLabel>
                      <FormControl>
                        <Input placeholder="Crie sua senha" type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Empresa</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="clinicName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da clínica</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome fantasia da clínica" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="clinicCnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <PatternFormat
                          customInput={Input}
                          format="##.###.###/####-##"
                          value={field.value ?? ''}
                          onValueChange={(value) => field.onChange(value.value)}
                          placeholder="00.000.000/0000-00"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="clinicPhoneNumber"
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
                <FormField
                  control={form.control}
                  name="clinicPostalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <PatternFormat
                          customInput={Input}
                          format="#####-###"
                          value={field.value ?? ''}
                          onValueChange={(value) => field.onChange(value.value)}
                          placeholder="00000-000"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="clinicAddress"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Logradouro</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua, avenida, praça..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 md:col-span-2 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="clinicAddressNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex.: 123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clinicProvince"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bairro</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex.: Centro" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clinicAddressComplement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complemento</FormLabel>
                        <FormControl>
                          <Input placeholder="Sala, bloco, conjunto..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar acesso da clínica'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
