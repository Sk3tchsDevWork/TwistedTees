import Stripe from 'stripe'
export function stripe(){
  const key = process.env.STRIPE_SECRET
  if(!key) return null
  return new Stripe(key, { apiVersion: '2024-06-20' as any })
}
export async function createIntent(amountCents:number, email?:string){
  const s = stripe()
  if(!s) throw new Error('Stripe disabled')
  const intent = await s.paymentIntents.create({
    amount: amountCents, currency: 'usd', receipt_email: email,
    automatic_payment_methods: { enabled: true }
  })
  return intent.client_secret
}
