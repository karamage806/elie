const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// GET /api/goals
const getGoals = async (req, res, next) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM wellness_goals WHERE company_id = ?';
    const params = [req.user.company_id];

    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY created_at DESC';

    const [rows] = await db.execute(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// GET /api/goals/:id
const getGoal = async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM wellness_goals WHERE id = ? AND company_id = ?',
      [req.params.id, req.user.company_id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Goal not found.' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// POST /api/goals — owner only
const createGoal = async (req, res, next) => {
  try {
    const { title, description, target_value, metric, start_date, end_date } = req.body;
    const id = uuidv4();

    await db.execute(
      'INSERT INTO wellness_goals (id, company_id, title, description, target_value, metric, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, req.user.company_id, title, description || null, target_value, metric, start_date, end_date]
    );

    const [created] = await db.execute('SELECT * FROM wellness_goals WHERE id = ?', [id]);
    res.status(201).json(created[0]);
  } catch (err) {
    next(err);
  }
};

// PUT /api/goals/:id — owner only
const updateGoal = async (req, res, next) => {
  try {
    const { title, description, target_value, metric, start_date, end_date, status } = req.body;

    const [rows] = await db.execute(
      'SELECT id FROM wellness_goals WHERE id = ? AND company_id = ?',
      [req.params.id, req.user.company_id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Goal not found.' });

    await db.execute(
      'UPDATE wellness_goals SET title=?, description=?, target_value=?, metric=?, start_date=?, end_date=?, status=? WHERE id=?',
      [title, description || null, target_value, metric, start_date, end_date, status, req.params.id]
    );

    const [updated] = await db.execute('SELECT * FROM wellness_goals WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/goals/:id — owner only
const deleteGoal = async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      'SELECT id FROM wellness_goals WHERE id = ? AND company_id = ?',
      [req.params.id, req.user.company_id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Goal not found.' });

    await db.execute('DELETE FROM wellness_goals WHERE id = ?', [req.params.id]);
    res.json({ message: 'Goal deleted.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/goals/:id/progress
const logProgress = async (req, res, next) => {
  try {
    const { value, note } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const id = uuidv4();

    await db.execute(
      'INSERT INTO goal_progress (id, goal_id, user_id, value, logged_date, note) VALUES (?, ?, ?, ?, ?, ?)',
      [id, req.params.id, req.user.id, value, today, note || null]
    );

    const [created] = await db.execute('SELECT * FROM goal_progress WHERE id = ?', [id]);
    res.status(201).json(created[0]);
  } catch (err) {
    next(err);
  }
};

// GET /api/goals/:id/progress
const getProgress = async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT gp.*, u.name AS user_name
       FROM goal_progress gp
       JOIN users u ON u.id = gp.user_id
       WHERE gp.goal_id = ?
       ORDER BY gp.logged_date DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

module.exports = { getGoals, getGoal, createGoal, updateGoal, deleteGoal, logProgress, getProgress };
