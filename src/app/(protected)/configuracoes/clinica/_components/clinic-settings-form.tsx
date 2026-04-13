'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PatternFormat } from 'react-number-format';
import { toast } from 'sonner';
import { z } from 'zod';

import { createClinic } from '@/actions/create-clinic';
import { updateClinicSettingsAction } from '@/actions/update-clinic-settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { clinicsTable } from '@/db/schema';
import { formatClinicAddress, formatPostalCode } from '@/helpers/format';

const optionalTextField = z.string().optional();
const optionalUrlField = z
  .string()
  .optional()
  .refine((value) => {
    const normalized = value?.trim() ?? '';
    return normalized === '' || z.string().url().safeParse(normalized).success;
  }, 'Informe uma URL válida.');

const formSchema = z.object({
  name: z.string().trim().min(1, { message: 'Nome é obrigatório.' }),
  cnpj: optionalTextField,
  address: optionalTextField,
  addressNumber: optionalTextField,
  addressComplement: optionalTextField,
  postalCode: optionalTextField,
  province: optionalTextField,
  phoneNumber: optionalTextField,
  logoUrl: optionalUrlField,
  cloudinaryPublicId: optionalTextField,
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

export default function ClinicSettingsForm({ clinic }: { clinic: typeof clinicsTable.$inferSelect | null }) {
  const [uploading, setUploading] = useState(false);
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const form = useForm<ClinicSettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: clinic?.name ?? '',
      cnpj: clinic?.cnpj ?? '',
      address: clinic?.address ?? '',
      addressNumber: clinic?.addressNumber ?? '',
      addressComplement: clinic?.addressComplement ?? '',
      postalCode: clinic?.postalCode ?? '',
      province: clinic?.province ?? '',
      phoneNumber: clinic?.phoneNumber ?? '',
      logoUrl: clinic?.logoUrl ?? '',
      cloudinaryPublicId: clinic?.cloudinaryPublicId ?? '',
    },
  });

  const action = useAction(updateClinicSettingsAction, {
    onSuccess: () => toast.success('Configurações salvas com sucesso.'),
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

  const normalizePayload = (values: ClinicSettingsFormValues) => ({
    name: values.name.trim(),
    cnpj: normalizeOptionalText(values.cnpj),
    address: normalizeOptionalText(values.address),
    addressNumber: normalizeOptionalText(values.addressNumber),
    addressComplement: normalizeOptionalText(values.addressComplement),
    postalCode: normalizeOptionalText(values.postalCode),
    province: normalizeOptionalText(values.province),
    phoneNumber: normalizeOptionalText(values.phoneNumber),
    logoUrl: normalizeOptionalUrl(values.logoUrl),
    cloudinaryPublicId: normalizeOptionalText(values.cloudinaryPublicId),
  });

  const handleSubmit = (values: ClinicSettingsFormValues) => {
    const payload = normalizePayload(values);

    if (clinic) {
      action.execute(payload);
      return;
    }

    createClinic(payload);
  };

  const logoUrl = form.watch('logoUrl');
  const previewName = form.watch('name');
  const previewCnpj = form.watch('cnpj');
  const previewPhone = form.watch('phoneNumber');
  const previewAddress = formatClinicAddress({
    address: form.watch('address'),
    addressNumber: form.watch('addressNumber'),
    addressComplement: form.watch('addressComplement'),
    province: form.watch('province'),
    postalCode: form.watch('postalCode'),
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{clinic ? 'Dados da clínica' : 'Primeiro acesso da clínica'}</CardTitle>
          <CardDescription>
            {clinic
              ? 'Atualize os dados principais e a identidade visual.'
              : 'Cadastre os dados completos da empresa para liberar a integração com o Asaas.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
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
                      <FormLabel>Telefone</FormLabel>
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
                  name="address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Logradouro</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} placeholder="Rua, avenida, praça..." />
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
                        <Input {...field} value={field.value ?? ''} placeholder="123" />
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
                        <Input {...field} value={field.value ?? ''} placeholder="Centro" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="addressComplement"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Complemento</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} placeholder="Sala, bloco, conjunto" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2 md:col-span-2">
                  <FormLabel>Logo da clínica</FormLabel>
                  <Input type="file" accept="image/*" onChange={(event) => handleUpload(event.target.files?.[0])} />
                  {uploading ? <p className="text-sm text-muted-foreground">Enviando logo...</p> : null}
                  {!logoUrl ? (
                    <p className="text-sm text-muted-foreground">
                      Use uma imagem nítida para a identidade visual da clínica.
                    </p>
                  ) : null}
                </div>
              </div>

              <input type="hidden" {...form.register('logoUrl')} />
              <input type="hidden" {...form.register('cloudinaryPublicId')} />

              <div className="flex justify-end">
                <Button type="submit" disabled={action.isExecuting || uploading}>
                  {action.isExecuting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  {clinic ? 'Salvar configurações' : 'Concluir cadastro da clínica'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-4" /> Pré-visualização de identidade
          </CardTitle>
          <CardDescription>Pré-visualização do cabeçalho utilizado em documentos.</CardDescription>
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
            {previewAddress ? (
              <p className="text-sm text-muted-foreground">Endereço: {previewAddress}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Endereço ainda não informado.</p>
            )}
            {form.watch('postalCode') ? (
              <p className="text-sm text-muted-foreground">CEP: {formatPostalCode(form.watch('postalCode'))}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
