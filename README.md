# Self-Hosted One-Page Shop

A complete, self-hosted shop front:
- Purchase (optional Stripe integration) — falls back to "Manual/Invoice" if Stripe not configured
- Contact the owner (stored in DB; optional SMTP forward)
- View & search products
- Track shipment (extensible adapters; demo echoes code)
- Upload images & manage products (admin API with token)
- Social links
- Mobile-first one-page layout
- No external SaaS required to run (Stripe optional)

## Tech
- **Frontend**: React + Vite (one-page layout)
- **Backend**: Node.js + Express + SQLite (file DB), Multer for uploads
- **Auth**: Simple admin bearer token
- **Payments**: Stripe adapter (optional). If not configured, checkout uses Manual mode.
- **Tracking**: pluggable adapter (UPS/FedEx/USPS stubs to extend).

## Quick Start (Local)
```bash
# 1) Backend
cd backend
cp .env.example .env   # set ADMIN_TOKEN and (optionally) STRIPE keys
npm install
npm run dev            # http://localhost:4000

# 2) Frontend
cd ../frontend
npm install
npm run dev            # http://localhost:5173 (proxy to backend for API)
```

## Production (Docker)
```bash
cp backend/.env.example backend/.env
# set values in backend/.env
docker compose up -d --build
# Site available at http://localhost (nginx reverse proxy to frontend & backend)
```

## Admin API (secure with ADMIN_TOKEN)
- Create product: `POST /api/admin/products` JSON: { title, price, description, stock, tags[], imageUrl? }
- Upload image: `POST /api/admin/upload` (form-data: file)
- Update product: `PUT /api/admin/products/:id`
- Delete product: `DELETE /api/admin/products/:id`

All admin endpoints require header `Authorization: Bearer <ADMIN_TOKEN>`.

## Payments
- If `STRIPE_SECRET` and `STRIPE_PUBLISHABLE` are set, checkout uses Stripe Payment Intents.
- Otherwise, checkout switches to Manual mode and creates an order with status `awaiting_manual_payment`.

## Tracking
- Endpoint: `POST /api/track` with { carrier, code }
- Returns demo response; replace stubs in `backend/services/tracking.js` with real carrier API calls.

## SMTP (optional)
- Configure SMTP in `.env` to forward contact form messages to your email.
- If not set, messages are only stored in DB.

## Social Links
- Edit in `frontend/src/config.ts`.

## Notes
- SQLite file lives at `backend/data/store.db`.
- File uploads saved to `backend/uploads/` and served at `/uploads/<filename>`.
- This is intentionally minimal and modular to be easy to own and extend.
