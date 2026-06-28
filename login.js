import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import { ensureSchema, signToken } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  try {
    await ensureSchema();
    const { email, password } = req.body || {};
    const e = String(email || '').toLowerCase().trim();
    if (!e || !password) return res.status(400).json({ error: 'Completá email y contraseña' });

    const r = await sql`SELECT id, email, password_hash, name FROM users WHERE email = ${e}`;
    const row = r.rows[0];
    if (!row) return res.status(401).json({ error: 'Email o contraseña incorrectos' });

    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(401).json({ error: 'Email o contraseña incorrectos' });

    const user = { id: row.id, email: row.email, name: row.name || '' };
    return res.json({ token: signToken(user), user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
}
