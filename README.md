# Vercel Self-Hosted Shop (One Page)

Deployable on **Vercel** with persistent storage via **Vercel Postgres** and image uploads via **Vercel Blob**.
- One-page shop (Next.js App Router)
- Products: view, search
- Cart + Checkout (Stripe optional; falls back to Manual)
- Contact (stored; optional SMTP forward)
- Tracking (pluggable stub)
- Admin API with token + image uploads to Blob
- Fully serverless — no custom servers needed

## Deploy (Vercel)
1. Create a new project in Vercel and import this repo/zip.
2. Add integrations:
   - **Vercel Postgres** (auto-provisions `POSTGRES_URL`)
   - (Optional) **Stripe** keys
3. Set **Environment Variables** (Project → Settings → Environment Variables):
   - `ADMIN_TOKEN=your-strong-token`
   - `POSTGRES_URL` (from Vercel Postgres)
   - Optional: `STRIPE_SECRET`, `STRIPE_PUBLISHABLE`
   - Optional SMTP: `SMTP_HOST`, `SMTP_PORT=587`, `SMTP_SECURE=false`, `SMTP_USER`, `SMTP_PASS`, `SMTP_TO`
4. Deploy. The home page is `/` and APIs live under `/api/*`.

## Local Dev
```bash
npm install
npm run dev
```

> Note: Vercel doesn't provide a persistent local filesystem; that's why uploads use **Vercel Blob** and data uses **Vercel Postgres**.
