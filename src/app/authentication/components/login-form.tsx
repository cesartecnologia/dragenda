'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
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
              toast.error(
                'O login no Firebase funcionou, mas a sessão do servidor falhou. Verifique o Firebase Admin e o Firestore.',
                { duration: 10000 },
              );
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
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Entre com e-mail e senha.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite seu e-mail" {...field} />
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
                    <Input placeholder="Digite sua senha" type="password" {...field} />
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
                'Entrar'
              )}
            </Button>
            <p className="text-muted-foreground text-center text-sm">
              Não tem acesso ainda?{' '}
              <Link href="/autenticacao/cadastro" className="font-medium text-primary underline-offset-4 hover:underline">
                Criar usuário
              </Link>
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default LoginForm;
