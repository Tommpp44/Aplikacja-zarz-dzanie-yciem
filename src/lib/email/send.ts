import 'server-only'
import nodemailer, { type Transporter } from 'nodemailer'
import { serverEnv } from '@/lib/env.server'
import type { Email } from './templates'

let transport: Transporter | null = null

export function emailConfigured() {
  return Boolean(serverEnv.SMTP_URL)
}

export async function sendEmail(to: string, email: Email) {
  if (!serverEnv.SMTP_URL) throw new Error('SMTP is not configured')
  transport ??= nodemailer.createTransport(serverEnv.SMTP_URL)
  await transport.sendMail({
    from: serverEnv.EMAIL_FROM,
    to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  })
}
