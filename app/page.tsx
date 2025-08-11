'use client'
import React, { useEffect, useMemo, useState } from 'react'
import './globals.css'
import { BRAND, SOCIALS } from './config'

type Product = { id:number; title:string; price:number; description:string; stock:number; imageurl?:string; imageUrl?:string }

export default function Page(){
  const [q, setQ] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [cart, setCart] = useState<{id:number; title:string; price:number; qty:number}[]>([])
  const [email, setEmail] = useState('')
  const [addr, setAddr] = useState({ line1:'', city:'', state:'', zip:'', country:'US' })
  const [contact, setContact] = useState({ name:'', email:'', message:'' })
  const [track, setTrack] = useState({ carrier:'', code:'' })
  const [stripeEnabled, setStripeEnabled] = useState(false)

  const total = useMemo(()=>cart.reduce((s,c)=>s + c.price*c.qty, 0),[cart])

  useEffect(()=>{
    setLoading(true)
    fetch('/api/products'+(q?`?q=${encodeURIComponent(q)}`:''))
      .then(r=>r.json()).then(setProducts).finally(()=>setLoading(false))
  },[q])

  function add(p:Product){
    setCart(prev=>{
      const i = prev.findIndex(x=>x.id===p.id)
      if(i>=0){ const n=[...prev]; n[i]={...n[i], qty:n[i].qty+1}; return n }
      return [...prev, { id:p.id, title:p.title, price:Number(p.price), qty:1 }]
    })
  }

  async function checkout(mode:'auto'|'manual'|'stripe'='auto'){
    if(cart.length===0) return alert('Cart empty')
    const paymentMode = (mode==='stripe' || (mode==='auto' && stripeEnabled)) ? 'stripe':'manual'
    const r = await fetch('/api/orders',{ method:'POST', headers:{'content-type':'application/json'},
      body: JSON.stringify({ items:cart, email, shippingAddress:addr, paymentMode })
    })
    const data = await r.json()
    if(data.stripeEnabled && data.clientSecret){
      setStripeEnabled(true)
      alert('Stripe intent created. Present Stripe Elements here. Order #'+data.orderId)
    } else if(data.orderId){
      alert('Order created (manual). Order #'+data.orderId)
    } else {
      alert(data.error || 'Checkout error')
    }
    setCart([])
  }

  async function sendContact(){
    const r = await fetch('/api/contact',{ method:'POST', headers:{'content-type':'application/json'},
      body: JSON.stringify(contact)
    })
    const data = await r.json()
    if(data.ok) { alert('Message sent'); setContact({name:'',email:'',message:''}) } else { alert(data.error) }
  }

  async function doTrack(){
    const r = await fetch('/api/track',{ method:'POST', headers:{'content-type':'application/json'},
      body: JSON.stringify(track)
    })
    const data = await r.json()
    if(data.error) return alert(data.error)
    alert(`Status: ${data.status}\nLast update: ${data.last_update}`)
  }

  return (
    <div className="container">
      <header className="header">
        <div>
          <div className="brand">{BRAND.name}</div>
          <div className="tag">{BRAND.tagline}</div>
        </div>
        <div className="row wrap">
          <div className="badge">Serverless</div>
          <div className="badge">One‑Page</div>
          <div className="badge">Mobile‑First</div>
        </div>
      </header>

      <section className="hero">
        <div>
          <h1>Vibrant, fast, and fully yours.</h1>
          <p>Browse, search, and purchase in one fluid page. Hosted on Vercel.</p>
          <div className="cta">
            <button className="button primary" onClick={()=>document.getElementById('shop')?.scrollIntoView({behavior:'smooth'})}>Shop Now</button>
            <button className="button" onClick={()=>document.getElementById('contact')?.scrollIntoView({behavior:'smooth'})}>Contact</button>
          </div>
        </div>
        <div className="section">
          <div className="row">
            <input className="input search" placeholder="Search products..." value={q} onChange={e=>setQ(e.target.value)} />
            <div className="badge">Cart: ${total.toFixed(2)}</div>
          </div>
          <div className="hr"></div>
          <div className="row wrap">
            <input className="input" placeholder="Email for checkout" value={email} onChange={e=>setEmail(e.target.value)} />
            <input className="input" placeholder="Address line 1" value={addr.line1} onChange={e=>setAddr(a=>({...a,line1:e.target.value}))} />
            <input className="input" placeholder="City" value={addr.city} onChange={e=>setAddr(a=>({...a,city:e.target.value}))} />
            <input className="input" placeholder="State" value={addr.state} onChange={e=>setAddr(a=>({...a,state:e.target.value}))} />
            <input className="input" placeholder="ZIP" value={addr.zip} onChange={e=>setAddr(a=>({...a,zip:e.target.value}))} />
            <button className="button primary" onClick={()=>checkout('auto')}>Checkout</button>
            <button className="button" onClick={()=>checkout('manual')}>Manual Payment</button>
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
              <img src={(p.imageUrl||p.imageurl) || '/placeholder.png'} alt={p.title} />
              <div className="body">
                <div className="title">{p.title}</div>
                <p className="desc">{p.description}</p>
                <div className="row">
                  <div className="price">${Number(p.price).toFixed(2)}</div>
                  <div className="qty">
                    <div className="iconbtn" onClick={()=>add(p)}>+</div>
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
        <p className="tag">Server adapters are pluggable; wire your carrier APIs when ready.</p>
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
