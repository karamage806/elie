const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// GET /api/company
const getCompany = async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, name, slug, logo_url, invite_token, created_at FROM companies WHERE id = ?',
      [req.user.company_id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Company not found.' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// GET /api/company/invite/:token — validate invite token (public)
const validateInvite = async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, name FROM companies WHERE invite_token = ?',
      [req.params.token]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Invalid invite link.' });
    }
    res.json({ company: rows[0] });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/company — update company name/logo
const updateCompany = async (req, res, next) => {
  try {
    const { name } = req.body;
    const logoUrl = req.file ? `/uploads/avatars/${req.file.filename}` : undefined;

    let sql = 'UPDATE companies SET name = ?';
    const params = [name];

    if (logoUrl) { sql += ', logo_url = ?'; params.push(logoUrl); }
    sql += ' WHERE id = ?';
    params.push(req.user.company_id);

    await db.execute(sql, params);

    const [updated] = await db.execute('SELECT * FROM companies WHERE id = ?', [req.user.company_id]);
    res.json(updated[0]);
  } catch (err) {
    next(err);
  }
};

// POST /api/company/regenerate-invite — generate a new invite token
const regenerateInvite = async (req, res, next) => {
  try {
    const newToken = uuidv4();
    await db.execute('UPDATE companies SET invite_token = ? WHERE id = ?', [newToken, req.user.company_id]);
    res.json({ invite_token: newToken });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCompany, validateInvite, updateCompany, regenerateInvite };
