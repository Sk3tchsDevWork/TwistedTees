import { sql } from '@vercel/postgres'

export async function ensureSchema(){
  await sql`CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    price NUMERIC NOT NULL,
    description TEXT DEFAULT '',
    stock INT DEFAULT 0,
    tags TEXT DEFAULT '[]',
    imageUrl TEXT DEFAULT '',
    createdAt TIMESTAMP DEFAULT NOW()
  );`
  await sql`CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    email TEXT,
    details JSONB,
    total NUMERIC,
    status TEXT,
    shippingAddress JSONB,
    createdAt TIMESTAMP DEFAULT NOW()
  );`
  await sql`CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    name TEXT, email TEXT, message TEXT,
    createdAt TIMESTAMP DEFAULT NOW()
  );`
}
