const { verifyToken } = require('../utils/jwt');
const db = require('../config/db');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authenticated. Please log in.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const [rows] = await db.execute(
      'SELECT id, company_id, name, email, role, avatar_url FROM users WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

// Only owners can access this route
const ownerOnly = (req, res, next) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ message: 'Access denied. Owners only.' });
  }
  next();
};

// Only the same company
const sameCompany = (req, res, next) => {
  const targetCompanyId = req.params.companyId || req.body.company_id;
  if (targetCompanyId && targetCompanyId !== req.user.company_id) {
    return res.status(403).json({ message: 'Access denied.' });
  }
  next();
};

module.exports = { protect, ownerOnly, sameCompany };
