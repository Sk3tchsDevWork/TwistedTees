export const dynamic = 'force-dynamic'

export async function POST(req: Request){
  const { carrier, code } = await req.json().catch(()=>({}))
  if(!carrier || !code) return Response.json({ error:'Missing fields' }, { status:400 })
  return Response.json({
    carrier: String(carrier).toLowerCase(),
    code,
    status: 'in_transit',
    last_update: new Date().toISOString(),
    events: [
      { ts: new Date(Date.now()-864e5*2).toISOString(), desc: 'Label created' },
      { ts: new Date(Date.now()-864e5).toISOString(), desc: 'Accepted at facility' },
      { ts: new Date().toISOString(), desc: 'In transit' }
    ]
  })
}
