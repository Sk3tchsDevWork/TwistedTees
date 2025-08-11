export function isAdmin(headers: Headers){
  const auth = headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  return token && process.env.ADMIN_TOKEN && token === process.env.ADMIN_TOKEN
}
