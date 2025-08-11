import nodemailer from 'nodemailer'

export async function sendContact({ name, email, message }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SMTP_TO) {
    return
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE||'false') === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  })
  await transporter.sendMail({
    from: `"Shop Contact" <${process.env.SMTP_USER}>`,
    to: process.env.SMTP_TO,
    subject: `New contact from ${name}`,
    text: `From: ${name} <${email}>\n\n${message}`
  })
}
