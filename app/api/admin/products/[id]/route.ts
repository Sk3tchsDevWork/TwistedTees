import { sql } from '@vercel/postgres'
import { ensureSchema } from '@/lib/db'
import { isAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function PUT(req: Request, { params }:{ params:{ id:string } }){
  await ensureSchema()
  if(!isAdmin(req.headers)) return Response.json({ error:'Unauthorized' }, { status:401 })
  const id = Number(params.id)
  const body = await req.json().catch(()=>({}))
  const existing = await sql`SELECT * FROM products WHERE id=${id}`
  if(!existing.rows[0]) return Response.json({ error:'Not found' }, { status:404 })
  const p = existing.rows[0]
  const title = body.title ?? p.title
  const price = body.price ?? p.price
  const description = body.description ?? p.description
  const stock = body.stock ?? p.stock
  const tags = body.tags ?? p.tags
  const imageUrl = body.imageUrl ?? p.imageurl
  await sql`UPDATE products SET title=${title}, price=${price}, description=${description}, stock=${stock}, tags=${JSON.stringify(tags)}, imageUrl=${imageUrl} WHERE id=${id}`
  return Response.json({ ok:true })
}

export async function DELETE(req: Request, { params }:{ params:{ id:string } }){
  await ensureSchema()
  if(!isAdmin(req.headers)) return Response.json({ error:'Unauthorized' }, { status:401 })
  const id = Number(params.id)
  await sql`DELETE FROM products WHERE id=${id}`
  return Response.json({ ok:true })
}
