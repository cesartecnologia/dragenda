'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Loader2, LockKeyhole, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormMessage } from '@/components/ui/form';
import { FormItem, FormLabel } from '@/components/ui/form';
import { Form, FormField } from '@/components/ui/form';
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
    <Card className="border-sky-100 bg-white shadow-[0_20px_70px_rgba(14,165,233,0.10)]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl text-slate-900">Entrar no sistema</CardTitle>
            <CardDescription className="text-sm leading-6 text-slate-600">
              Acesse sua clínica com seu e-mail e sua senha.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input className="pl-10" placeholder="Digite seu e-mail" {...field} />
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
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input className="pl-10" placeholder="Digite sua senha" type="password" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              Entrar
            </Button>
            <p className="text-center text-sm text-slate-500">
              Ainda não tem acesso?{' '}
              <Link href="/primeiro-acesso" className="font-medium text-sky-700 underline-offset-4 hover:underline">
                Fazer primeiro acesso
              </Link>
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default LoginForm;
