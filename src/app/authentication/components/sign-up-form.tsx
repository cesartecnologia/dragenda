'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  name: z.string().trim().min(1, { message: 'Nome é obrigatório' }),
  email: z.string().trim().min(1, { message: 'E-mail é obrigatório' }).email({ message: 'E-mail inválido' }),
  password: z.string().trim().min(8, { message: 'A senha deve ter pelo menos 8 caracteres' }),
  clinicName: z.string().trim().min(1, { message: 'Nome da clínica é obrigatório' }),
  clinicCnpj: z.string().trim().min(14, { message: 'CNPJ é obrigatório' }),
  clinicPhoneNumber: z.string().trim().min(10, { message: 'Telefone é obrigatório' }),
  clinicAddress: z.string().trim().min(1, { message: 'Endereço é obrigatório' }),
});

const SignUpForm = () => {
  const router = useRouter();
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
      },
      {
        onSuccess: () => {
          router.push('/');
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
              toast.error('Não foi possível criar o usuário no servidor. Verifique o Firebase Admin.', { duration: 10000 });
              return;
            case 'MISSING_CLINIC_NAME':
              toast.error('Informe o nome da clínica.');
              return;
            case 'MISSING_CLINIC_CNPJ':
              toast.error('Informe o CNPJ da clínica.');
              return;
            case 'MISSING_CLINIC_PHONE':
              toast.error('Informe o telefone da clínica.');
              return;
            case 'MISSING_CLINIC_ADDRESS':
              toast.error('Informe o endereço da clínica.');
              return;
            case 'ACCOUNT_CREATED_BUT_SESSION_FAILED':
              toast.error(
                'Usuário criado, mas a sessão do servidor falhou. Tente fazer login novamente.',
                { duration: 10000 },
              );
              return;
            default:
              toast.error(ctx.error.message || 'Erro ao criar conta.', {
                duration: 8000,
              });
          }
        },
      },
    );
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CardHeader>
            <CardTitle>Criar conta da clínica</CardTitle>
            <CardDescription>Cadastre o responsável e os dados básicos da clínica para seguir direto para a assinatura.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite a senha" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clinicName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da clínica</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome da clínica" {...field} />
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
                    <FormLabel>Telefone da clínica</FormLabel>
                    <FormControl>
                      <PatternFormat
                        customInput={Input}
                        format="(##) #####-####"
                        value={field.value ?? ''}
                        onValueChange={(value) => field.onChange(value.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="clinicAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço da clínica</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, número, bairro, cidade e CEP" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Criar conta e ir para assinatura'
              )}
            </Button>
            <p className="text-muted-foreground text-center text-sm">
              Já tem acesso?{' '}
              <Link href="/autenticacao" className="font-medium text-primary underline-offset-4 hover:underline">
                Voltar para o login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default SignUpForm;
