import { NextResponse } from 'next/server';

import { formatCurrencyInCents } from '@/helpers/currency';
import { formatClinicAddress } from '@/helpers/clinic-address';
import { formatCnpj, formatPhoneNumber } from '@/helpers/format';
import { getAppointmentPaymentMethodLabel, getAppointmentStatusLabel } from '@/helpers/appointments';
import { formatDateTimeBr } from '@/helpers/time';
import { getServerSession } from '@/lib/auth';
import { getAppointmentByIdWithRelations, getClinicById, getUserProfileById } from '@/server/clinic-data';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');

const renderLine = (label: string, value: string) => `
  <div class="row">
    <div class="label">${escapeHtml(label)}</div>
    <div class="value">${escapeHtml(value)}</div>
  </div>
`;

export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerSession();
  if (!session?.user) {
    return new NextResponse('Não autorizado.', { status: 401 });
  }

  const { id } = await context.params;
  const appointment = await getAppointmentByIdWithRelations(id);

  if (!appointment) {
    return new NextResponse('Agendamento não encontrado.', { status: 404 });
  }

  if (session.user.clinic?.id && appointment.clinicId !== session.user.clinic.id) {
    return new NextResponse('Acesso negado.', { status: 403 });
  }

  const [clinic, attendant, cancelledBy] = await Promise.all([
    getClinicById(appointment.clinicId),
    appointment.createdByUserId ? getUserProfileById(appointment.createdByUserId) : Promise.resolve(null),
    appointment.cancelledByUserId ? getUserProfileById(appointment.cancelledByUserId) : Promise.resolve(null),
  ]);

  if (!clinic) {
    return new NextResponse('Clínica não encontrada.', { status: 404 });
  }

  const formattedClinicAddress = formatClinicAddress(clinic);

  const logoMarkup = clinic.logoUrl
    ? `
        <div class="logo-box">
          <img src="${escapeHtml(clinic.logoUrl)}" alt="Logo da clínica" class="logo" />
        </div>
      `
    : '';

  const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Comprovante de agendamento</title>
    <style>
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        color: #0f172a;
        font-family: Arial, Helvetica, sans-serif;
      }
      body { padding: 12px; }
      .sheet {
        width: 148mm;
        margin: 0 auto;
        padding: 10mm;
        border: 1px solid #cbd5e1;
        background: #ffffff;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #cbd5e1;
      }
      .header-main {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        flex: 1;
        min-width: 0;
      }
      .logo-box {
        width: 56px;
        min-width: 56px;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .logo {
        max-width: 100%;
        max-height: 56px;
        object-fit: contain;
        display: block;
      }
      .clinic-name {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
        line-height: 1.2;
      }
      .muted {
        margin: 3px 0 0;
        font-size: 12px;
        line-height: 1.5;
        color: #475569;
      }
      .stamp { text-align: right; }
      .stamp-title {
        margin: 0;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: #64748b;
      }
      .stamp-date {
        margin: 8px 0 0;
        font-size: 12px;
        color: #334155;
      }
      .section {
        margin-top: 16px;
        page-break-inside: avoid;
      }
      .section-title {
        margin: 0 0 8px;
        font-size: 14px;
        font-weight: 700;
      }
      .box {
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        overflow: hidden;
      }
      .row {
        display: grid;
        grid-template-columns: 130px 1fr;
        gap: 12px;
        padding: 8px 12px;
        border-bottom: 1px solid #e2e8f0;
      }
      .row:last-child { border-bottom: none; }
      .label {
        font-size: 12px;
        font-weight: 700;
        color: #64748b;
      }
      .value {
        font-size: 13px;
        font-weight: 600;
        color: #0f172a;
      }
      .two-cols {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .card {
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 12px;
      }
      .card p {
        margin: 0;
        font-size: 12px;
        line-height: 1.55;
        color: #334155;
      }
      .screen-actions {
        display: flex;
        justify-content: center;
        gap: 8px;
        width: 148mm;
        margin: 0 auto 12px;
      }
      .screen-actions button {
        border: 1px solid #cbd5e1;
        background: #ffffff;
        border-radius: 8px;
        padding: 8px 12px;
        font-size: 13px;
        cursor: pointer;
      }
      @page {
        size: A5 portrait;
        margin: 8mm;
      }
      @media print {
        html, body { background: #ffffff; }
        body { padding: 0; }
        .screen-actions { display: none !important; }
        .sheet {
          width: auto;
          margin: 0;
          border: none;
          padding: 0;
        }
      }
    </style>
  </head>
  <body>
    <div class="screen-actions">
      <button type="button" onclick="window.print()">Imprimir</button>
      <button type="button" onclick="window.close()">Fechar</button>
    </div>

    <main class="sheet">
      <header class="header">
        <div class="header-main">
          ${logoMarkup}
          <div>
            <h1 class="clinic-name">${escapeHtml(clinic.name)}</h1>
            ${clinic.cnpj ? `<p class="muted">CNPJ: ${escapeHtml(formatCnpj(clinic.cnpj))}</p>` : ''}
            ${clinic.phoneNumber ? `<p class="muted">Telefone: ${escapeHtml(formatPhoneNumber(clinic.phoneNumber))}</p>` : ''}
            ${formattedClinicAddress ? `<p class="muted">${escapeHtml(formattedClinicAddress)}</p>` : ''}
          </div>
        </div>
        <div class="stamp">
          <p class="stamp-title">Comprovante</p>
          <p class="stamp-date">Emitido em ${escapeHtml(formatDateTimeBr(new Date()))}</p>
        </div>
      </header>

      <section class="section">
        <h2 class="section-title">Dados do atendimento</h2>
        <div class="box">
          ${renderLine('Paciente', appointment.patient.name)}
          ${renderLine('Médico', appointment.doctor.name)}
          ${renderLine('Especialidade', appointment.doctor.specialty)}
          ${renderLine('Data e horário', formatDateTimeBr(appointment.date))}
          ${renderLine('Valor', formatCurrencyInCents(appointment.appointmentPriceInCents))}
          ${renderLine('Situação', getAppointmentStatusLabel(appointment.status))}
          ${renderLine('Pagamento', appointment.paymentConfirmed ? `Confirmado - ${getAppointmentPaymentMethodLabel(appointment.paymentMethod)}` : 'Pendente')}
          ${renderLine('Atendente', attendant?.name ?? session.user.name)}
          ${renderLine('Código', appointment.id.slice(0, 8).toUpperCase())}
        </div>
      </section>

      <section class="section two-cols">
        <div class="card">
          <h2 class="section-title">Observações</h2>
          <p>${escapeHtml(appointment.notes?.trim() || 'Sem observações registradas para este atendimento.')}</p>
        </div>
        <div class="card">
          <h2 class="section-title">Orientações</h2>
          <p>Favor comparecer com 15 minutos de antecedência e apresentar documento com foto, quando necessário.</p>
          ${appointment.status === 'cancelled' ? `<p style="margin-top: 8px;">Agendamento cancelado${cancelledBy?.name ? ` por ${escapeHtml(cancelledBy.name)}` : ''}${appointment.cancelledAt ? ` em ${escapeHtml(formatDateTimeBr(appointment.cancelledAt))}` : ''}.</p>` : ''}
        </div>
      </section>
    </main>

    <script>
      function waitForImages() {
        const images = Array.from(document.images);
        if (!images.length) return Promise.resolve();

        return Promise.all(images.map(function (img) {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve();

          return new Promise(function (resolve) {
            function done() {
              img.removeEventListener('load', done);
              img.removeEventListener('error', done);
              resolve();
            }
            img.addEventListener('load', done, { once: true });
            img.addEventListener('error', done, { once: true });
          });
        }));
      }

      window.addEventListener('load', function () {
        waitForImages().finally(function () {
          setTimeout(function () {
            window.focus();
            window.print();
          }, 180);
        });
      }, { once: true });
    </script>
  </body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  });
}
