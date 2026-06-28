import { getUser } from '../lib/db.js';

export default async function handler(req, res) {
  const u = getUser(req);
  if (!u) return res.status(401).json({ error: 'No autorizado' });
  return res.json({ user: { id: u.uid, email: u.email, name: u.name || '' } });
}
