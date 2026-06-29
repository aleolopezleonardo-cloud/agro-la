const { sql } = require('@vercel/postgres');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'cambia-esta-clave-en-vercel';

let _ensured = false;
// Crea las tablas la primera vez que se usan (sin pasos manuales).
async function ensureSchema() {
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

function signToken(user) {
  return jwt.sign({ uid: user.id, email: user.email, name: user.name || '' }, SECRET, { expiresIn: '90d' });
}

// App sin login: todos los datos viven en una única cuenta compartida
// en la nube, sincronizada entre los dispositivos del usuario.
const DEFAULT_USER = { uid: 'agro-la', email: '', name: '' };

// Devuelve el payload del usuario. Si hay un token válido lo usa
// (compatibilidad), si no, cae en la cuenta única por defecto.
function getUser(req) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (t) { try { return jwt.verify(t, SECRET); } catch (e) {} }
  return DEFAULT_USER;
}

module.exports = { ensureSchema, signToken, getUser };
