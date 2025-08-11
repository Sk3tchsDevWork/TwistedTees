import { sql } from '@vercel/postgres'
import { ensureSchema } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: Request){
  await ensureSchema()
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  if(q){
    const { rows } = await sql`SELECT * FROM products WHERE title ILIKE ${'%'+q+'%'} OR description ILIKE ${'%'+q+'%'} OR tags ILIKE ${'%'+q+'%'} ORDER BY createdAt DESC`
    return Response.json(rows)
  }
  const { rows } = await sql`SELECT * FROM products ORDER BY createdAt DESC`
  return Response.json(rows)
}
