'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { BadgeCheck, Building2, CreditCard, Loader2, UserRound } from 'lucide-react';
import Image from 'next/image';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PatternFormat } from 'react-number-format';
import { toast } from 'sonner';
import { z } from 'zod';

import { updateClinicSettingsAction } from '@/actions/update-clinic-settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { clinicsTable } from '@/db/schema';

const onlyDigits = (value?: string | null) => (value ?? '').replace(/\D/g, '');
const optionalUrlField = z
  .string()
  .optional()
  .refine((value) => {
    const normalized = value?.trim() ?? '';
    return normalized === '' || z.string().url().safeParse(normalized).success;
  }, 'Informe uma URL válida.');

const formSchema = z.object({
  name: z.string().trim().min(2, { message: 'Informe o nome da clínica.' }),
  responsibleName: z.string().trim().min(2, { message: 'Informe o nome do responsável.' }),
  responsibleEmail: z.string().trim().email({ message: 'Informe um e-mail válido.' }),
  responsibleCpf: z.string().trim().refine((value) => onlyDigits(value).length === 11, {
    message: 'Informe um CPF válido.',
  }),
  cnpj: z.string().trim().refine((value) => onlyDigits(value).length === 14, {
    message: 'Informe um CNPJ válido.',
  }),
  phoneNumber: z.string().trim().refine((value) => onlyDigits(value).length >= 10, {
    message: 'Informe um telefone válido.',
  }),
  companyType: z.enum(['MEI', 'LIMITED', 'INDIVIDUAL', 'ASSOCIATION']),
  postalCode: z.string().trim().refine((value) => onlyDigits(value).length === 8, {
    message: 'Informe um CEP válido.',
  }),
  address: z.string().trim().min(3, { message: 'Informe o logradouro.' }),
  addressNumber: z.string().trim().min(1, { message: 'Informe o número.' }),
  complement: z.string().optional(),
  province: z.string().trim().min(2, { message: 'Informe o bairro.' }),
  website: optionalUrlField,
  logoUrl: optionalUrlField,
  cloudinaryPublicId: z.string().optional(),
});

type ClinicSettingsFormValues = z.infer<typeof formSchema>;

function normalizeOptionalText(value?: string) {
  const normalized = value?.trim() ?? '';
  return normalized === '' ? null : normalized;
}

function normalizeOptionalUrl(value?: string) {
  const normalized = value?.trim() ?? '';
  return normalized === '' ? null : normalized;
}

interface ClinicSettingsFormProps {
  clinic: typeof clinicsTable.$inferSelect | null;
  defaultResponsibleName: string;
  defaultResponsibleEmail: string;
}

export default function ClinicSettingsForm({
  clinic,
  defaultResponsibleName,
  defaultResponsibleEmail,
}: ClinicSettingsFormProps) {
  const [uploading, setUploading] = useState(false);
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const form = useForm<ClinicSettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: clinic?.name ?? '',
      responsibleName: clinic?.responsibleName ?? defaultResponsibleName,
      responsibleEmail: clinic?.responsibleEmail ?? defaultResponsibleEmail,
      responsibleCpf: clinic?.responsibleCpf ?? '',
      cnpj: clinic?.cnpj ?? '',
      phoneNumber: clinic?.phoneNumber ?? '',
      companyType: clinic?.companyType ?? 'LIMITED',
      postalCode: clinic?.postalCode ?? '',
      address: clinic?.address ?? '',
      addressNumber: clinic?.addressNumber ?? '',
      complement: clinic?.complement ?? '',
      province: clinic?.province ?? '',
      website: clinic?.website ?? '',
      logoUrl: clinic?.logoUrl ?? '',
      cloudinaryPublicId: clinic?.cloudinaryPublicId ?? '',
    },
  });

  const action = useAction(updateClinicSettingsAction, {
    onSuccess: () => toast.success('Cadastro da empresa salvo com sucesso.'),
    onError: ({ error }) => toast.error(error.serverError ?? 'Erro ao salvar configurações.'),
  });

  const handleUpload = async (file?: File) => {
    if (!file) return;
    if (!cloudName || !uploadPreset) {
      toast.error('Configure o Cloudinary antes de enviar a logo.');
      return;
    }

    setUploading(true);

    try {
      const body = new FormData();
      body.append('file', file);
      body.append('upload_preset', uploadPreset);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? 'Falha no upload');

      form.setValue('logoUrl', data.secure_url ?? '', { shouldDirty: true });
      form.setValue('cloudinaryPublicId', data.public_id ?? '', { shouldDirty: true });
      toast.success('Logo enviada com sucesso.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao enviar logo.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (values: ClinicSettingsFormValues) => {
    action.execute({
      name: values.name.trim(),
      responsibleName: values.responsibleName.trim(),
      responsibleEmail: values.responsibleEmail.trim(),
      responsibleCpf: onlyDigits(values.responsibleCpf),
      cnpj: onlyDigits(values.cnpj),
      phoneNumber: onlyDigits(values.phoneNumber),
      companyType: values.companyType,
      postalCode: onlyDigits(values.postalCode),
      address: values.address.trim(),
      addressNumber: values.addressNumber.trim(),
      complement: normalizeOptionalText(values.complement),
      province: values.province.trim(),
      website: normalizeOptionalUrl(values.website),
      logoUrl: normalizeOptionalUrl(values.logoUrl),
      cloudinaryPublicId: normalizeOptionalText(values.cloudinaryPublicId),
    });
  };

  const logoUrl = form.watch('logoUrl');
  const previewName = form.watch('name');
  const previewCnpj = form.watch('cnpj');
  const previewPhone = form.watch('phoneNumber');
  const previewAddress = [form.watch('address'), form.watch('addressNumber'), form.watch('province'), form.watch('postalCode')]
    .filter(Boolean)
    .join(', ');
  const previewResponsible = form.watch('responsibleName');
  const previewResponsibleEmail = form.watch('responsibleEmail');

  return (
    <div className="space-y-6">
      <Card className="border-primary/15 bg-primary/5">
        <CardContent className="flex flex-col gap-3 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Cadastro completo para cobrança via Asaas</p>
            <p className="text-sm text-muted-foreground">
              Preencha os dados do responsável e da empresa. O checkout da assinatura usa esse cadastro para evitar o erro de
              CPF/CNPJ ausente.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background px-3 py-1 text-xs font-medium text-primary">
            <BadgeCheck className="size-4" /> Obrigatório para assinatura
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserRound className="size-4" /> Responsável pela conta
              </CardTitle>
              <CardDescription>Esses dados identificam o usuário principal da clínica no fluxo comercial.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="responsibleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do responsável</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsibleEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail do responsável</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsibleCpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF do responsável</FormLabel>
                    <FormControl>
                      <PatternFormat
                        customInput={Input}
                        format="###.###.###-##"
                        value={field.value ?? ''}
                        onValueChange={(value) => field.onChange(value.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="size-4" /> Dados da empresa
              </CardTitle>
              <CardDescription>Esses dados alimentam o cadastro da clínica e o customer usado pelo Asaas.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da clínica</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cnpj"
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
                name="phoneNumber"
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

              <FormField
                control={form.control}
                name="companyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de empresa</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MEI">MEI</SelectItem>
                          <SelectItem value="LIMITED">LTDA</SelectItem>
                          <SelectItem value="INDIVIDUAL">Empresário individual</SelectItem>
                          <SelectItem value="ASSOCIATION">Associação</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site da clínica</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} placeholder="https://sua-clinica.com.br" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="size-4" /> Endereço comercial
              </CardTitle>
              <CardDescription>Esses dados ajudam a manter o customer completo no Asaas e melhoram os documentos emitidos.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <PatternFormat
                        customInput={Input}
                        format="#####-###"
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
                name="province"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logradouro</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Rua, avenida, travessa..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="addressNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="complement"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Complemento</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} placeholder="Sala, bloco, andar..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Identidade visual</CardTitle>
              <CardDescription>Opcional, mas útil para relatórios, comprovantes e impressão.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <FormLabel>Logo da clínica</FormLabel>
                <Input type="file" accept="image/*" onChange={(event) => handleUpload(event.target.files?.[0])} />
                {uploading ? <p className="text-sm text-muted-foreground">Enviando logo...</p> : null}
                {!logoUrl ? (
                  <p className="text-sm text-muted-foreground">Use uma imagem nítida para reforçar a identidade visual da clínica.</p>
                ) : null}
              </div>

              <div className="flex h-32 items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt="Logo da clínica"
                    width={140}
                    height={90}
                    className="max-h-28 w-auto object-contain"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">Prévia da logo</span>
                )}
              </div>

              <input type="hidden" {...form.register('logoUrl')} />
              <input type="hidden" {...form.register('cloudinaryPublicId')} />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={action.isExecuting || uploading}>
              {action.isExecuting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Salvar cadastro da empresa
            </Button>
          </div>
        </form>
      </Form>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-4" /> Pré-visualização do cadastro
          </CardTitle>
          <CardDescription>Resumo do que será usado na identidade da clínica e no cadastro comercial.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[120px_1fr]">
          <div className="flex h-28 items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="Logo da clínica"
                width={110}
                height={70}
                className="max-h-24 w-auto object-contain"
              />
            ) : (
              <span className="text-xs text-muted-foreground">Sem logo</span>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold">{previewName || 'Nome da clínica'}</p>
            {previewCnpj ? <p className="text-sm text-muted-foreground">CNPJ: {previewCnpj}</p> : null}
            {previewPhone ? <p className="text-sm text-muted-foreground">Telefone: {previewPhone}</p> : null}
            {previewResponsible ? (
              <p className="text-sm text-muted-foreground">Responsável: {previewResponsible} · {previewResponsibleEmail}</p>
            ) : null}
            {previewAddress ? (
              <p className="text-sm text-muted-foreground">Endereço: {previewAddress}</p>
            ) : (
              <p className="text-sm text-muted-foreground">O endereço aparecerá no cabeçalho dos comprovantes e relatórios.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
