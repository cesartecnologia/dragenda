'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, KeyRound, Loader2, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
  const [isSendingReset, setIsSendingReset] = useState(false);
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleForgotPassword = async () => {
    const isEmailValid = await form.trigger('email');
    if (!isEmailValid) {
      toast.error('Informe um e-mail válido para redefinir sua senha.');
      return;
    }

    const email = form.getValues('email').trim().toLowerCase();
    setIsSendingReset(true);
    await authClient.forgotPassword.email(
      { email },
      {
        onSuccess: () => {
          toast.success('Enviamos o link de redefinição para o seu e-mail.');
        },
        onError: (ctx) => {
          switch (ctx.error.code) {
            case 'INVALID_CREDENTIALS':
              toast.error('Não encontramos uma conta com este e-mail.');
              return;
            case 'auth/too-many-requests':
              toast.error('Muitas tentativas. Aguarde um instante e tente novamente.');
              return;
            default:
              toast.error(ctx.error.message || 'Não foi possível enviar o link de redefinição.');
          }
        },
      },
    );
    setIsSendingReset(false);
  };

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
    <Card className="flex h-full min-h-[540px] w-full overflow-hidden border-sky-100 bg-white shadow-[0_24px_80px_rgba(14,165,233,0.10)]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex h-full w-full flex-col">
          <CardHeader className="space-y-2 pb-4">
            <div className="space-y-1.5">
              <CardTitle className="text-2xl font-semibold tracking-[-0.02em] text-slate-950">
                Entrar
              </CardTitle>
              <CardDescription className="text-sm leading-6 text-slate-600">
                Use seu e-mail e senha para entrar na sua conta.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
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
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isSendingReset}
                className="text-sm font-medium text-sky-700 transition hover:text-sky-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSendingReset ? 'Enviando...' : 'Esqueceu sua senha?'}
              </button>
            </div>

          </CardContent>
          <CardFooter className="pt-2">
            <Button type="submit" className="h-12 w-full rounded-xl" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              Entrar
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default LoginForm;
