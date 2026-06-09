const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// GET /api/checkins
const getCheckins = async (req, res, next) => {
  try {
    const { from, to, user_id, mood_min, mood_max } = req.query;

    let sql, params;

    if (req.user.role === 'owner') {
      sql = `
        SELECT c.*, u.name AS user_name, u.avatar_url
        FROM checkins c
        JOIN users u ON u.id = c.user_id
        WHERE u.company_id = ?
      `;
      params = [req.user.company_id];

      if (user_id) { sql += ' AND c.user_id = ?'; params.push(user_id); }
    } else {
      sql = 'SELECT * FROM checkins WHERE user_id = ?';
      params = [req.user.id];
    }

    if (from) { sql += ' AND checkin_date >= ?'; params.push(from); }
    if (to)   { sql += ' AND checkin_date <= ?'; params.push(to); }
    if (mood_min) { sql += ' AND mood_score >= ?'; params.push(mood_min); }
    if (mood_max) { sql += ' AND mood_score <= ?'; params.push(mood_max); }

    sql += ' ORDER BY checkin_date DESC';

    const [rows] = await db.execute(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// GET /api/checkins/:id
const getCheckin = async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT * FROM checkins WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Check-in not found.' });

    const checkin = rows[0];
    if (req.user.role !== 'owner' && checkin.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json(checkin);
  } catch (err) {
    next(err);
  }
};

// POST /api/checkins
const createCheckin = async (req, res, next) => {
  try {
    const { mood_score, energy_score, notes } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const [existing] = await db.execute(
      'SELECT id FROM checkins WHERE user_id = ? AND checkin_date = ?',
      [req.user.id, today]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'You have already checked in today.' });
    }

    const id = uuidv4();
    const sickNoteUrl = req.file ? `/uploads/sick-notes/${req.file.filename}` : null;

    await db.execute(
      'INSERT INTO checkins (id, user_id, mood_score, energy_score, notes, sick_note_url, checkin_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, req.user.id, mood_score, energy_score, notes || null, sickNoteUrl, today]
    );

    const [created] = await db.execute('SELECT * FROM checkins WHERE id = ?', [id]);
    res.status(201).json(created[0]);
  } catch (err) {
    next(err);
  }
};

// PUT /api/checkins/:id
const updateCheckin = async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT * FROM checkins WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Check-in not found.' });

    const checkin = rows[0];
    if (checkin.user_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own check-ins.' });
    }

    const { mood_score, energy_score, notes } = req.body;
    await db.execute(
      'UPDATE checkins SET mood_score = ?, energy_score = ?, notes = ? WHERE id = ?',
      [mood_score, energy_score, notes || null, req.params.id]
    );

    const [updated] = await db.execute('SELECT * FROM checkins WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/checkins/:id
const deleteCheckin = async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT * FROM checkins WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Check-in not found.' });

    const checkin = rows[0];
    const isOwner = req.user.role === 'owner';
    const isOwn = checkin.user_id === req.user.id;

    if (!isOwner && !isOwn) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    await db.execute('DELETE FROM checkins WHERE id = ?', [req.params.id]);
    res.json({ message: 'Check-in deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCheckins, getCheckin, createCheckin, updateCheckin, deleteCheckin };
