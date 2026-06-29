const { sql } = require('@vercel/postgres');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const { ensureSchema, signToken } = require('../lib/db.js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  try {
    await ensureSchema();
    const { email, password, name } = req.body || {};
    const e = String(email || '').toLowerCase().trim();
    if (!e || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return res.status(400).json({ error: 'Email inválido' });
    if (!password || password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

    const exists = await sql`SELECT id FROM users WHERE email = ${e}`;
    if (exists.rows.length) return res.status(409).json({ error: 'Ese email ya está registrado' });

    const id = randomUUID();
    const hash = await bcrypt.hash(password, 10);
    const nm = String(name || '').trim() || null;
    await sql`INSERT INTO users (id, email, password_hash, name) VALUES (${id}, ${e}, ${hash}, ${nm})`;

    const user = { id, email: e, name: nm || '' };
    return res.status(200).json({ token: signToken(user), user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
};
