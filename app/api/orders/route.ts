import { sql } from '@vercel/postgres'
import { ensureSchema } from '@/lib/db'
import { createIntent } from '@/lib/payments'

export const dynamic = 'force-dynamic'

export async function POST(req: Request){
  await ensureSchema()
  const body = await req.json().catch(()=>({}))
  const { items = [], email = '', shippingAddress = {}, paymentMode = 'manual' } = body
  if(!Array.isArray(items) || items.length === 0){
    return Response.json({ error: 'No items' }, { status: 400 })
  }

  // compute server-side total
  let total = 0
  const details:any[] = []
  for(const it of items){
    const { rows } = await sql`SELECT id, title, price, stock FROM products WHERE id=${it.id} LIMIT 1`
    const p = rows[0]
    if(!p) return Response.json({ error: `Product ${it.id} not found` }, { status: 400 })
    if(Number(p.stock) < Number(it.qty)) return Response.json({ error: `Insufficient stock for ${p.title}` }, { status: 400 })
    total += Number(p.price) * Number(it.qty)
    details.push({ ...p, qty: it.qty })
  }

  let status = 'awaiting_manual_payment'
  let clientSecret: string | null = null

  if(paymentMode === 'stripe' && process.env.STRIPE_SECRET){
    clientSecret = await createIntent(Math.round(total*100), email)
    status = 'pending_payment'
  }

  const { rows } = await sql`
    INSERT INTO orders (email, details, total, status, shippingAddress)
    VALUES (${email}, ${JSON.stringify(details)}::jsonb, ${total}, ${status}, ${JSON.stringify(shippingAddress)}::jsonb)
    RETURNING id
  `
  const orderId = rows[0].id
  return Response.json({ orderId, total, status, clientSecret, stripeEnabled: !!process.env.STRIPE_SECRET })
}
