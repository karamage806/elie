const db = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/hashPassword');
const { signToken } = require('../utils/jwt');
const { generateToken } = require('../utils/generateToken');
const { sendMail } = require('../config/mailer');
const { v4: uuidv4 } = require('uuid');

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { companyName, name, email, password } = req.body;

    // Check if email already exists
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }

    const passwordHash = await hashPassword(password);
    const companyId = uuidv4();
    const userId = uuidv4();
    const slug = companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Create company and owner in a transaction
    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      await conn.execute(
        'INSERT INTO companies (id, name, slug) VALUES (?, ?, ?)',
        [companyId, companyName, `${slug}-${companyId.slice(0, 6)}`]
      );

      await conn.execute(
        'INSERT INTO users (id, company_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, companyId, name, email, passwordHash, 'owner']
      );

      await conn.commit();
      conn.release();
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }

    const token = signToken({ id: userId, role: 'owner', company_id: companyId });

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: { id: userId, name, email, role: 'owner', company_id: companyId },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/register-employee  (via invite token)
const registerEmployee = async (req, res, next) => {
  try {
    const { name, email, password, inviteToken } = req.body;

    // Validate invite token
    const [companies] = await db.execute(
      'SELECT id FROM companies WHERE invite_token = ?',
      [inviteToken]
    );
    if (companies.length === 0) {
      return res.status(400).json({ message: 'Invalid invite link.' });
    }
    const companyId = companies[0].id;

    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }

    const passwordHash = await hashPassword(password);
    const userId = uuidv4();

    await db.execute(
      'INSERT INTO users (id, company_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, companyId, name, email, passwordHash, 'employee']
    );

    const token = signToken({ id: userId, role: 'employee', company_id: companyId });

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: { id: userId, name, email, role: 'employee', company_id: companyId },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const [users] = await db.execute(
      'SELECT id, company_id, name, email, password_hash, role, avatar_url FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = users[0];
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signToken({ id: user.id, role: user.role, company_id: user.company_id });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
        avatar_url: user.avatar_url,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const [users] = await db.execute('SELECT id, name FROM users WHERE email = ?', [email]);

    // Always respond the same — don't reveal if email exists
    if (users.length === 0) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const user = users[0];
    const token = generateToken(32);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate any existing tokens for this user
    await db.execute('UPDATE password_resets SET used = TRUE WHERE user_id = ? AND used = FALSE', [user.id]);

    await db.execute(
      'INSERT INTO password_resets (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
      [uuidv4(), user.id, token, expiresAt]
    );

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

    await sendMail({
      to: email,
      subject: 'Reset your WellDesk password',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2>Password Reset</h2>
          <p>Hi ${user.name},</p>
          <p>Click the button below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#534AB7;color:#fff;border-radius:6px;text-decoration:none;margin:16px 0">
            Reset Password
          </a>
          <p style="color:#888;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const [resets] = await db.execute(
      'SELECT id, user_id, expires_at FROM password_resets WHERE token = ? AND used = FALSE',
      [token]
    );

    if (resets.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset link.' });
    }

    const reset = resets[0];
    if (new Date() > new Date(reset.expires_at)) {
      return res.status(400).json({ message: 'Reset link has expired. Please request a new one.' });
    }

    const passwordHash = await hashPassword(password);

    await db.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, reset.user_id]);
    await db.execute('UPDATE password_resets SET used = TRUE WHERE id = ?', [reset.id]);

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, registerEmployee, login, forgotPassword, resetPassword };
