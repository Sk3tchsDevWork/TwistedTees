import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import multer from 'multer'
import { fileURLToPath } from 'url'
import { initDb, db } from './store.js'
import { createPaymentIntent, isStripeEnabled } from './stripe.js'
import { trackCarrier } from './services/tracking.js'
import { sendContact } from './services/contact.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

// Serve uploads directly (when not behind nginx)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Health
app.get('/api/health', (req, res) => res.json({ ok: true }))

// Public: list products + search
app.get('/api/products', (req, res) => {
  const q = (req.query.q || '').trim()
  let rows
  if (q) {
    rows = db.prepare(
      `SELECT * FROM products 
       WHERE title LIKE ? OR description LIKE ? OR tags LIKE ?
       ORDER BY createdAt DESC`
    ).all(`%${q}%`, `%${q}%`, `%${q}%`)
  } else {
    rows = db.prepare(`SELECT * FROM products ORDER BY createdAt DESC`).all()
  }
  res.json(rows)
})

// Public: create order (manual or stripe)
app.post('/api/orders', async (req, res) => {
  try {
    const { items, email, shippingAddress, paymentMode } = req.body
    if (!items?.length) return res.status(400).json({ error: 'No items' })

    // compute total from DB (server-trust)
    let total = 0
    const details = []
    for (const it of items) {
      const p = db.prepare('SELECT id,title,price,stock FROM products WHERE id=?').get(it.id)
      if (!p) return res.status(400).json({ error: `Product ${it.id} not found` })
      if (p.stock < it.qty) return res.status(400).json({ error: `Insufficient stock for ${p.title}` })
      total += p.price * it.qty
      details.push({ ...p, qty: it.qty })
    }

    let status = 'awaiting_manual_payment'
    let clientSecret = null

    if (paymentMode === 'stripe' && isStripeEnabled()) {
      const intent = await createPaymentIntent(Math.round(total * 100), email)
      clientSecret = intent.client_secret
      status = 'pending_payment'
    }

    const result = db.prepare(
      `INSERT INTO orders (email, details, total, status, shippingAddress) VALUES (?, ?, ?, ?, ?)`
    ).run(email || '', JSON.stringify(details), total, status, JSON.stringify(shippingAddress || {}))

    const orderId = result.lastInsertRowid

    res.json({ orderId, total, status, clientSecret, stripeEnabled: isStripeEnabled() })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to create order' })
  }
})

// Public: contact
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body || {}
  if (!name || !email || !message) return res.status(400).json({ error: 'Missing fields' })
  const r = db.prepare(`INSERT INTO contacts (name,email,message) VALUES (?,?,?)`).run(name, email, message)
  // Try SMTP (non-blocking)
  sendContact({ name, email, message }).catch(() => {})
  res.json({ ok: true, id: r.lastInsertRowid })
})

// Public: tracking
app.post('/api/track', async (req, res) => {
  const { carrier, code } = req.body || {}
  if (!carrier || !code) return res.status(400).json({ error: 'Missing fields' })
  const data = await trackCarrier(carrier, code)
  res.json(data)
})

// ---- Admin endpoints ----
const requireAdmin = (req, res, next) => {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token || token !== process.env.ADMIN_TOKEN) return res.status(401).json({ error: 'Unauthorized' })
  next()
}

app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const pCount = db.prepare('SELECT COUNT(*) as c FROM products').get().c
  const oCount = db.prepare('SELECT COUNT(*) as c FROM orders').get().c
  const cCount = db.prepare('SELECT COUNT(*) as c FROM contacts').get().c
  res.json({ products: pCount, orders: oCount, contacts: cCount })
})

app.post('/api/admin/products', requireAdmin, (req, res) => {
  const { title, price, description='', stock=0, tags=[], imageUrl='' } = req.body || {}
  if (!title || price == null) return res.status(400).json({ error: 'Missing title/price' })
  const r = db.prepare(
    `INSERT INTO products (title,price,description,stock,tags,imageUrl) VALUES (?,?,?,?,?,?)`
  ).run(title, price, description, stock, JSON.stringify(tags), imageUrl)
  res.json({ id: r.lastInsertRowid })
})

app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  const id = req.params.id
  const existing = db.prepare('SELECT * FROM products WHERE id=?').get(id)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  const { title=existing.title, price=existing.price, description=existing.description, stock=existing.stock, tags=JSON.parse(existing.tags||'[]'), imageUrl=existing.imageUrl } = req.body || {}
  db.prepare(
    `UPDATE products SET title=?,price=?,description=?,stock=?,tags=?,imageUrl=? WHERE id=?`
  ).run(title, price, description, stock, JSON.stringify(tags), imageUrl, id)
  res.json({ ok: true })
})

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const id = req.params.id
  db.prepare('DELETE FROM products WHERE id=?').run(id)
  res.json({ ok: true })
})

// Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random()*1e9)
    const ext = path.extname(file.originalname)
    cb(null, unique + ext)
  }
})
const upload = multer({ storage })

app.post('/api/admin/upload', requireAdmin, upload.single('file'), (req, res) => {
  const url = `/uploads/${req.file.filename}`
  res.json({ url })
})

// Init DB and start
await initDb()
const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`API running on :${PORT}`))
