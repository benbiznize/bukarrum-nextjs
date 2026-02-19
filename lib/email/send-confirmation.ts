import { Resend } from 'resend';
import { formatInTimeZone } from 'date-fns-tz';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export type ConfirmationParams = {
  tenantName: string;
  timezone: string;
  customerEmail: string;
  customerName: string;
  roomName: string;
  serviceName: string;
  startAt: string;
  endAt: string;
};

export type SendConfirmationResult = { sent: boolean; error?: string };

export async function sendConfirmation(params: ConfirmationParams): Promise<SendConfirmationResult> {
  const resend = getResend();
  if (!resend) {
    return { sent: false, error: 'RESEND_API_KEY not configured' };
  }
  const start = formatInTimeZone(new Date(params.startAt), params.timezone, 'PPp');
  const end = formatInTimeZone(new Date(params.endAt), params.timezone, 'p');
  const html = `
    <p>Hi ${params.customerName},</p>
    <p>Your booking at ${params.tenantName} is confirmed.</p>
    <p><strong>${params.roomName}</strong> — ${params.serviceName}</p>
    <p>${start} – ${end}</p>
  `;
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
    to: params.customerEmail,
    subject: `Booking confirmed – ${params.tenantName}`,
    html,
  });
  if (error) {
    return { sent: false, error: error.message };
  }
  return { sent: true };
}
