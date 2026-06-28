import { sql } from '@vercel/postgres';
import { ensureSchema, getUser } from '../lib/db.js';

// CRUD genérico de registros. Cada usuario sólo accede a SUS datos.
// Stores: cultivos, plantines, maquinaria, stock, tareas, infocultivos,
//         aplicaciones, anotaciones, cosechas, mantenimientos, movimientos, fotos
export default async function handler(req, res) {
  try {
    await ensureSchema();
    const u = getUser(req);
    if (!u) return res.status(401).json({ error: 'No autorizado' });
    const uid = u.uid;

    if (req.method === 'GET') {
      const { store, id } = req.query;
      if (!store) return res.status(400).json({ error: 'Falta store' });
      if (id) {
        const r = await sql`SELECT data FROM records WHERE user_id = ${uid} AND store = ${store} AND id = ${id}`;
        return res.json(r.rows[0] ? r.rows[0].data : null);
      }
      const r = await sql`SELECT data FROM records WHERE user_id = ${uid} AND store = ${store} ORDER BY updated_at DESC`;
      return res.json(r.rows.map(x => x.data));
    }

    if (req.method === 'POST') {
      const { store, record } = req.body || {};
      if (!store || !record || !record.id) return res.status(400).json({ error: 'Datos inválidos' });
      const json = JSON.stringify(record);
      await sql`INSERT INTO records (user_id, store, id, data, updated_at)
        VALUES (${uid}, ${store}, ${record.id}, ${json}::jsonb, now())
        ON CONFLICT (user_id, store, id)
        DO UPDATE SET data = ${json}::jsonb, updated_at = now()`;
      return res.json(record);
    }

    if (req.method === 'DELETE') {
      const { store, id } = req.query;
      if (!store || !id) return res.status(400).json({ error: 'Falta store o id' });
      await sql`DELETE FROM records WHERE user_id = ${uid} AND store = ${store} AND id = ${id}`;
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
}
