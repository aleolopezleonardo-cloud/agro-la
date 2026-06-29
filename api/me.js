const { getUser } = require('../lib/db.js');

module.exports = async (req, res) => {
  const u = getUser(req);
  if (!u) return res.status(401).json({ error: 'No autorizado' });
  return res.status(200).json({ user: { id: u.uid, email: u.email, name: u.name || '' } });
};
