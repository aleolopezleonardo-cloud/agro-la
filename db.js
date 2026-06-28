import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'cambia-esta-clave-en-vercel';

let _ensured = false;
// Crea las tablas la primera vez que se usan (sin pasos manuales).
export async function ensureSchema() {
  if (_ensured) return;
  await sql`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS records (
    user_id TEXT NOT NULL,
    store TEXT NOT NULL,
    id TEXT NOT NULL,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, store, id)
  )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_records_user_store ON records (user_id, store)`;
  _ensured = true;
}

export function signToken(user) {
  return jwt.sign({ uid: user.id, email: user.email, name: user.name || '' }, SECRET, { expiresIn: '90d' });
}

// Devuelve el payload del usuario autenticado, o null.
export function getUser(req) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!t) return null;
  try { return jwt.verify(t, SECRET); } catch { return null; }
}
