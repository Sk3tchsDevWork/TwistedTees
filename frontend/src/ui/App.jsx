import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { SOCIALS, BRAND } from '../config.ts'

const API = import.meta.env.VITE_API_BASE || '/api'

function useProducts(query) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  useEffect(() => {
    setLoading(true)
    axios.get(`${API}/products`, { params: { q: query || '' } })
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [query])
  return { loading, data }
}

export default function App(){
  const [query, setQuery] = useState('')
  const { loading, data: products } = useProducts(query)
  const [cart, setCart] = useState([])
  const [contact, setContact] = useState({name:'',email:'',message:''})
  const [track, setTrack] = useState({carrier:'', code:''})
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState({ line1:'', city:'', state:'', zip:'', country:'US' })
  const [stripeEnabled, setStripeEnabled] = useState(false)

  const total = useMemo(() => cart.reduce((s, c) => s + c.price * c.qty, 0), [cart])

  function addToCart(p){
    setCart(prev => {
      const i = prev.findIndex(x => x.id === p.id)
      if (i >= 0) {
        const next = [...prev]
        next[i] = { ...next[i], qty: next[i].qty + 1 }
        return next
      }
      return [...prev, { id: p.id, title: p.title, price: p.price, qty: 1 }]
    })
  }

  async function checkout(mode='auto'){
    if (cart.length === 0) return alert('Cart is empty')
    const paymentMode = (mode === 'stripe' || (mode==='auto' && stripeEnabled)) ? 'stripe' : 'manual'
    const res = await axios.post(`${API}/orders`, {
      items: cart, email, shippingAddress: address, paymentMode
    })
    if (res.data.stripeEnabled && res.data.clientSecret) {
      setStripeEnabled(true)
      alert('Stripe intent created. In a real deployment, present Stripe Elements here.\nOrder #' + res.data.orderId)
    } else {
      alert('Order created. Please follow up for manual payment.\nOrder #' + res.data.orderId)
    }
    setCart([])
  }

  async function sendContact(){
    if (!contact.name || !contact.email || !contact.message) return alert('Fill all fields')
    await axios.post(`${API}/contact`, contact)
    alert('Message sent!')
    setContact({name:'',email:'',message:''})
  }

  async function doTrack(){
    if (!track.carrier || !track.code) return alert('Enter carrier & code')
    const r = await axios.post(`${API}/track`, track)
    alert(`Status: ${r.data.status}\nLast update: ${r.data.last_update}`)
  }

  useEffect(() => {
    // quick probe to know if stripe is enabled
    axios.post(`${API}/orders`, { items: [], paymentMode: 'stripe' }).catch(()=>{})
    // We can't probe safely without creating; instead, infer only after first checkout.
  }, [])

  return (
    <div className="container">
      <header className="header">
        <div>
          <div className="brand">{BRAND.name}</div>
          <div className="tag">{BRAND.tagline}</div>
        </div>
        <div className="row wrap">
          <div className="badge">Self‑Hosted</div>
          <div className="badge">One‑Page</div>
          <div className="badge">Mobile‑First</div>
        </div>
      </header>

      <section className="hero">
        <div>
          <h1>Vibrant, fast, and fully yours.</h1>
          <p>Browse, search, and purchase in one fluid page. Your data, your server.</p>
          <div className="cta">
            <button className="button primary" onClick={() => document.getElementById('shop')?.scrollIntoView({behavior:'smooth'})}>Shop Now</button>
            <button className="button" onClick={() => document.getElementById('contact')?.scrollIntoView({behavior:'smooth'})}>Contact</button>
          </div>
        </div>
        <div className="section">
          <div className="row">
            <input className="input search" placeholder="Search products..." value={query} onChange={e=>setQuery(e.target.value)} />
            <div className="badge">Cart: ${total.toFixed(2)}</div>
          </div>
          <div className="hr"></div>
          <div className="row wrap">
            <input className="input" placeholder="Email for checkout" value={email} onChange={e=>setEmail(e.target.value)} />
            <input className="input" placeholder="Address line 1" value={address.line1} onChange={e=>setAddress(a=>({...a,line1:e.target.value}))} />
            <input className="input" placeholder="City" value={address.city} onChange={e=>setAddress(a=>({...a,city:e.target.value}))} />
            <input className="input" placeholder="State" value={address.state} onChange={e=>setAddress(a=>({...a,state:e.target.value}))} />
            <input className="input" placeholder="ZIP" value={address.zip} onChange={e=>setAddress(a=>({...a,zip:e.target.value}))} />
            <button className="button primary" onClick={() => checkout('auto')}>Checkout</button>
            <button className="button" onClick={() => checkout('manual')}>Manual Payment</button>
          </div>
        </div>
      </section>

      <section id="shop" className="section">
        <div className="row" style={{justifyContent:'space-between'}}>
          <h2>Products</h2>
          {loading && <div className="badge">Loading...</div>}
        </div>
        <div className="grid">
          {products.map(p => (
            <div key={p.id} className="card">
              <img src={p.imageUrl || '/placeholder.png'} alt={p.title} />
              <div className="body">
                <div className="title">{p.title}</div>
                <p className="desc">{p.description}</p>
                <div className="row">
                  <div className="price">${p.price.toFixed(2)}</div>
                  <div className="qty">
                    <div className="iconbtn" onClick={()=>addToCart(p)}>+</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="track" className="section">
        <h2>Track Shipment</h2>
        <div className="row wrap">
          <input className="input" placeholder="Carrier (e.g., UPS, FedEx, USPS)" value={track.carrier} onChange={e=>setTrack(t=>({...t,carrier:e.target.value}))} />
          <input className="input" placeholder="Tracking code" value={track.code} onChange={e=>setTrack(t=>({...t,code:e.target.value}))} />
          <button className="button" onClick={doTrack}>Track</button>
        </div>
        <p className="tag">Adapters are pluggable server-side; wire your carrier API keys when ready.</p>
      </section>

      <section id="contact" className="section">
        <h2>Contact</h2>
        <div className="inputs">
          <input className="input" placeholder="Your name" value={contact.name} onChange={e=>setContact(c=>({...c,name:e.target.value}))} />
          <input className="input" placeholder="Your email" value={contact.email} onChange={e=>setContact(c=>({...c,email:e.target.value}))} />
          <textarea rows={4} placeholder="Message..." value={contact.message} onChange={e=>setContact(c=>({...c,message:e.target.value}))}></textarea>
        </div>
        <div style={{marginTop:10}}>
          <button className="button primary" onClick={sendContact}>Send</button>
        </div>
      </section>

      <section className="section">
        <h2>Follow us</h2>
        <div className="socials">
          {SOCIALS.map(s => <a key={s.name} className="badge" href={s.url} target="_blank" rel="noreferrer">{s.name}</a>)}
        </div>
      </section>

      <footer className="footer">
        © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
      </footer>
    </div>
  )
}
