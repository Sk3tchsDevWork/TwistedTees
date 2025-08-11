import { put } from '@vercel/blob'
import { isAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: Request){
  if(!isAdmin(req.headers)) return Response.json({ error:'Unauthorized' }, { status:401 })
  const form = await req.formData()
  const file = form.get('file') as File | null
  if(!file) return Response.json({ error:'No file' }, { status:400 })
  const blob = await put(`products/${Date.now()}-${file.name}`, file, { access: 'public' })
  return Response.json({ url: blob.url })
}
