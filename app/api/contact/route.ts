import { sql } from '@vercel/postgres'
import { ensureSchema } from '@/lib/db'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

async function smtpSend({name,email,message}:{name:string,email:string,message:string}){
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_TO } = process.env as Record<string,string>
  if(!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_TO) return
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(process.env.SMTP_PORT||587),
    secure: String(process.env.SMTP_SECURE||'false') === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  })
  await transporter.sendMail({
    from: `"Shop Contact" <${SMTP_USER}>`,
    to: SMTP_TO,
    subject: `New contact from ${name}`,
    text: `From: ${name} <${email}>

${message}`
  })
}

export async function POST(req: Request){
  await ensureSchema()
  const { name, email, message } = await req.json().catch(()=>({}))
  if(!name || !email || !message) return Response.json({ error:'Missing fields' }, { status:400 })
  const r = await sql`INSERT INTO contacts (name,email,message) VALUES (${name},${email},${message}) RETURNING id`
  smtpSend({ name, email, message }).catch(()=>{})
  return Response.json({ ok: true, id: r.rows[0].id })
}
