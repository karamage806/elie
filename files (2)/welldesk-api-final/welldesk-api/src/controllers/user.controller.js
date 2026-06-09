const db = require('../config/db');
const { hashPassword } = require('../utils/hashPassword');

// GET /api/users/me
const getMe = async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT u.id, u.name, u.email, u.role, u.avatar_url, u.created_at,
              c.name AS company_name, c.invite_token
       FROM users u
       JOIN companies c ON c.id = u.company_id
       WHERE u.id = ?`,
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// GET /api/users — owner gets full team list
const getTeam = async (req, res, next) => {
  try {
    const { search } = req.query;

    let sql = `
      SELECT u.id, u.name, u.email, u.role, u.avatar_url, u.created_at,
             MAX(c.checkin_date) AS last_checkin,
             ROUND(AVG(c.mood_score), 1) AS avg_mood
      FROM users u
      LEFT JOIN checkins c ON c.user_id = u.id
      WHERE u.company_id = ?
    `;
    const params = [req.user.company_id];

    if (search) {
      sql += ' AND (u.name LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' GROUP BY u.id ORDER BY u.name ASC';

    const [rows] = await db.execute(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/:id
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Employees can only update themselves; owners can update anyone in their company
    if (req.user.role !== 'owner' && req.user.id !== id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const { name, email } = req.body;
    await db.execute('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, id]);

    const [updated] = await db.execute(
      'SELECT id, name, email, role, avatar_url FROM users WHERE id = ?',
      [id]
    );
    res.json(updated[0]);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/:id/avatar
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await db.execute('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, req.params.id]);

    res.json({ avatar_url: avatarUrl });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/:id — owner only
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [users] = await db.execute(
      'SELECT id FROM users WHERE id = ? AND company_id = ?',
      [id, req.user.company_id]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await db.execute('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User removed from team.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMe, getTeam, updateUser, uploadAvatar, deleteUser };
