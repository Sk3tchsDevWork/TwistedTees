import { sql } from '@vercel/postgres'
import { ensureSchema } from '@/lib/db'
import { isAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: Request){
  await ensureSchema()
  if(!isAdmin(req.headers)) return Response.json({ error:'Unauthorized' }, { status:401 })
  const { title, price, description='', stock=0, tags=[], imageUrl='' } = await req.json().catch(()=>({}))
  if(!title || price == null) return Response.json({ error:'Missing title/price' }, { status:400 })
  const { rows } = await sql`INSERT INTO products (title,price,description,stock,tags,imageUrl) VALUES (${title},${price},${description},${stock},${JSON.stringify(tags)},${imageUrl}) RETURNING id`
  return Response.json({ id: rows[0].id })
}
