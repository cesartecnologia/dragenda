export function openAppointmentPrintPopup(appointmentId: string) {
  const url = `/impressao/agendamento/${appointmentId}/print`;
  const features = [
    'width=780',
    'height=760',
    'left=140',
    'top=60',
    'resizable=yes',
    'scrollbars=yes',
  ].join(',');

  const popup = window.open(url, '_blank', features);

  if (!popup) {
    window.location.href = url;
    return;
  }

  popup.focus();
}
