'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, KeyRound, Loader2, Mail, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
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

const loginSchema = z.object({
  email: z.string().trim().min(1, { message: 'E-mail é obrigatório' }).email({ message: 'E-mail inválido' }),
  password: z.string().trim().min(8, { message: 'A senha deve ter pelo menos 8 caracteres' }),
});

const LoginForm = () => {
  const router = useRouter();
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleSubmit = async (values: z.infer<typeof loginSchema>) => {
    await authClient.signIn.email(
      {
        email: values.email,
        password: values.password,
      },
      {
        onSuccess: () => {
          router.push('/pos-login');
          router.refresh();
        },
        onError: (ctx) => {
          switch (ctx.error.code) {
            case 'INVALID_CREDENTIALS':
              toast.error('E-mail ou senha inválidos.');
              return;
            case 'SESSION_LOGIN_FAILED':
              toast.error('Seu acesso foi validado, mas a sessão do sistema falhou. Tente novamente.', {
                duration: 10000,
              });
              return;
            default:
              toast.error(ctx.error.message || 'Não foi possível entrar.', {
                duration: 8000,
              });
          }
        },
      },
    );
  };

  return (
    <Card className="overflow-hidden border-sky-100 bg-white shadow-[0_24px_80px_rgba(14,165,233,0.10)]">
      <div className="h-1.5 w-full bg-[linear-gradient(90deg,#38bdf8_0%,#60a5fa_50%,#93c5fd_100%)]" />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <CardHeader className="space-y-3 pb-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
              <ShieldCheck className="h-4 w-4" />
              Área do cliente
            </div>
            <div className="space-y-1.5">
              <CardTitle className="text-2xl font-semibold tracking-[-0.02em] text-slate-950">
                Fazer login
              </CardTitle>
              <CardDescription className="text-sm leading-6 text-slate-600">
                Entre com seus dados para continuar usando o Dr. Agenda com praticidade e segurança.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">E-mail</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-sky-600" />
                      <Input
                        className="h-12 rounded-xl border-slate-200 pl-11 text-[15px] placeholder:text-slate-400"
                        placeholder="voce@clinica.com"
                        {...field}
                      />
                    </div>
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
                  <FormLabel className="text-slate-700">Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-sky-600" />
                      <Input
                        className="h-12 rounded-xl border-slate-200 pl-11 text-[15px] placeholder:text-slate-400"
                        placeholder="Digite sua senha"
                        type="password"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
              Use o e-mail cadastrado pela clínica para acessar sua conta.
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button type="submit" className="h-12 w-full rounded-xl" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              Entrar no sistema
            </Button>
            <div className="grid w-full gap-3 sm:grid-cols-2">
              <Button asChild type="button" variant="outline" className="h-11 rounded-xl border-sky-200 text-sky-700 hover:bg-sky-50">
                <Link href="/autenticacao">Ver assinatura</Link>
              </Button>
              <Button asChild type="button" variant="ghost" className="h-11 rounded-xl text-slate-600 hover:bg-slate-50">
                <Link href="/primeiro-acesso">Fazer primeiro acesso</Link>
              </Button>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default LoginForm;
