import Stripe from 'stripe'

let stripe = null
if (process.env.STRIPE_SECRET) {
  stripe = new Stripe(process.env.STRIPE_SECRET)
}

export function isStripeEnabled() {
  return !!stripe
}

export async function createPaymentIntent(amountCents, email) {
  if (!stripe) throw new Error('Stripe not configured')
  return await stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    receipt_email: email || undefined,
    automatic_payment_methods: { enabled: true }
  })
}
