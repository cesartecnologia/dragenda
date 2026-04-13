'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';

const formSchema = z
  .object({
    temporaryPassword: z.string().trim().min(8, { message: 'Informe a senha temporária.' }),
    newPassword: z.string().trim().min(8, { message: 'A nova senha precisa ter pelo menos 8 caracteres.' }),
    confirmPassword: z.string().trim().min(8, { message: 'Confirme a nova senha.' }),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem.',
  });

export function FirstLoginPasswordForm({ email }: { email: string }) {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      temporaryPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    await authClient.completeFirstLogin(
      {
        email,
        temporaryPassword: values.temporaryPassword,
        newPassword: values.newPassword,
      },
      {
        onSuccess: () => {
          toast.success('Senha atualizada com sucesso.');
          router.push('/pos-login');
          router.refresh();
        },
        onError: (ctx) => {
          if (ctx.error.code === 'INVALID_CREDENTIALS') {
            toast.error('A senha temporária informada está incorreta.');
            return;
          }

          if (ctx.error.code === 'WEAK_PASSWORD') {
            toast.error('Escolha uma senha mais forte para continuar.');
            return;
          }

          toast.error(ctx.error.message || 'Não foi possível atualizar a senha agora.');
        },
      },
    );
  };

  return (
    <Card className="border-sky-100 bg-white shadow-[0_24px_80px_rgba(14,165,233,0.12)]">
      <CardHeader className="space-y-3">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
          <ShieldCheck className="size-3.5" />
          Primeiro login
        </div>
        <CardTitle className="text-xl text-slate-900">Defina sua senha de acesso</CardTitle>
        <CardDescription className="text-sm leading-6 text-slate-600">
          Por segurança, atualize a senha temporária antes de continuar usando o sistema.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span className="font-medium text-slate-900">Login:</span> {email}
            </div>
            <FormField
              control={form.control}
              name="temporaryPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha temporária</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input className="pl-10" placeholder="Digite a senha temporária" type="password" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input className="pl-10" placeholder="Crie uma nova senha" type="password" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar nova senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input className="pl-10" placeholder="Repita a nova senha" type="password" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Atualizar senha e continuar
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
