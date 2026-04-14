'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { PatternFormat } from 'react-number-format';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';

const registerSchema = z.object({
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

const SignUpForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
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

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    await authClient.signUp.email(
      {
        email: values.email,
        password: values.password,
        name: values.name,
        clinicName: values.clinicName,
        clinicCnpj: values.clinicCnpj,
        clinicPhoneNumber: values.clinicPhoneNumber,
        clinicAddress: values.clinicAddress,
        clinicAddressNumber: values.clinicAddressNumber,
        clinicAddressComplement: values.clinicAddressComplement,
        clinicPostalCode: values.clinicPostalCode,
        clinicProvince: values.clinicProvince,
      },
      {
        onSuccess: () => {
          const intent = searchParams.get('intent');
          const next = searchParams.get('next');
          const shouldStartCheckout = intent === 'checkout' || next === 'assinatura';

          router.push(shouldStartCheckout ? '/assinatura?firstAccess=1&startCheckout=1' : '/pos-login');
          router.refresh();
        },
        onError: (ctx) => {
          switch (ctx.error.code) {
            case 'USER_ALREADY_EXISTS':
              toast.error('E-mail já cadastrado.');
              return;
            case 'WEAK_PASSWORD':
              toast.error('A senha não atende à política do Firebase.');
              return;
            case 'INVALID_API_KEY':
              toast.error('Configuração Firebase inválida. Verifique as variáveis NEXT_PUBLIC_FIREBASE_*.');
              return;
            case 'NETWORK_ERROR':
              toast.error('Falha de rede ao falar com o Firebase.');
              return;
            case 'REGISTER_FAILED':
              toast.error('Não foi possível concluir o primeiro acesso no servidor.', { duration: 10000 });
              return;
            case 'ACCOUNT_CREATED_BUT_SESSION_FAILED':
              toast.error(
                'Usuário criado, mas a sessão do servidor falhou. Tente fazer login novamente.',
                { duration: 10000 },
              );
              return;
            default:
              toast.error(ctx.error.message || 'Erro ao concluir o primeiro acesso.', {
                duration: 8000,
              });
          }
        },
      },
    );
  }

  return (
    <Card className="w-full border-sky-100 bg-white shadow-[0_20px_70px_rgba(14,165,233,0.10)]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CardHeader className="space-y-2 pb-4">
            <CardTitle className="text-2xl font-semibold tracking-[-0.02em] text-slate-900 sm:text-[2rem]">Cadastro da clínica</CardTitle>
            <CardDescription className="text-[15px] leading-6 text-slate-600">
              Informe os dados do responsável e da clínica para continuar.
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
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite a senha" type="password" {...field} />
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
                          <Input placeholder="123" {...field} />
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
                          <Input placeholder="Centro" {...field} />
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
                          <Input placeholder="Sala, bloco, conjunto (opcional)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Continuar'
              )}
            </Button>
            <p className="text-muted-foreground text-center text-sm">
              Já tem acesso?{' '}
              <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                Entrar na área do cliente
              </Link>
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default SignUpForm;
