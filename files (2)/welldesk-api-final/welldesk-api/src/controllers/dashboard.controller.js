const db = require('../config/db');

// GET /api/dashboard/stats
const getDashboardStats = async (req, res, next) => {
  try {
    const companyId = req.user.company_id;
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Total employees
    const [[{ total_employees }]] = await db.execute(
      'SELECT COUNT(*) AS total_employees FROM users WHERE company_id = ? AND role = "employee"',
      [companyId]
    );

    // Checked in today
    const [[{ checked_in_today }]] = await db.execute(
      `SELECT COUNT(*) AS checked_in_today
       FROM checkins c JOIN users u ON u.id = c.user_id
       WHERE u.company_id = ? AND c.checkin_date = ?`,
      [companyId, today]
    );

    // Average mood this week
    const [[{ avg_mood_week }]] = await db.execute(
      `SELECT ROUND(AVG(c.mood_score), 1) AS avg_mood_week
       FROM checkins c JOIN users u ON u.id = c.user_id
       WHERE u.company_id = ? AND c.checkin_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      [companyId]
    );

    // Flagged employees (mood <= 2 in last 3 days)
    const [flagged] = await db.execute(
      `SELECT u.id, u.name, u.avatar_url, ROUND(AVG(c.mood_score), 1) AS avg_mood
       FROM checkins c JOIN users u ON u.id = c.user_id
       WHERE u.company_id = ? AND c.checkin_date >= DATE_SUB(CURDATE(), INTERVAL 3 DAY)
       GROUP BY u.id
       HAVING avg_mood <= 2`,
      [companyId]
    );

    // Mood trend — daily average over last 30 days
    const [moodTrend] = await db.execute(
      `SELECT c.checkin_date AS date, ROUND(AVG(c.mood_score), 2) AS avg_mood, ROUND(AVG(c.energy_score), 2) AS avg_energy
       FROM checkins c JOIN users u ON u.id = c.user_id
       WHERE u.company_id = ? AND c.checkin_date >= ?
       GROUP BY c.checkin_date
       ORDER BY c.checkin_date ASC`,
      [companyId, thirtyDaysAgo]
    );

    // Check-in rate per employee over last 7 days
    const [checkinRate] = await db.execute(
      `SELECT u.name, COUNT(c.id) AS checkins_count
       FROM users u
       LEFT JOIN checkins c ON c.user_id = u.id AND c.checkin_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       WHERE u.company_id = ? AND u.role = 'employee'
       GROUP BY u.id
       ORDER BY checkins_count DESC`,
      [companyId]
    );

    // Employees who haven't checked in today
    const [notCheckedIn] = await db.execute(
      `SELECT u.id, u.name, u.avatar_url
       FROM users u
       WHERE u.company_id = ? AND u.role = 'employee'
       AND u.id NOT IN (
         SELECT c.user_id FROM checkins c WHERE c.checkin_date = ?
       )`,
      [companyId, today]
    );

    res.json({
      stats: {
        total_employees,
        checked_in_today,
        not_checked_in: total_employees - checked_in_today,
        avg_mood_week: avg_mood_week || 0,
        flagged_count: flagged.length,
      },
      mood_trend: moodTrend,
      checkin_rate: checkinRate,
      flagged_employees: flagged,
      not_checked_in_today: notCheckedIn,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/employee — personal stats for employee dashboard
const getEmployeeStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Personal mood trend
    const [moodTrend] = await db.execute(
      `SELECT checkin_date AS date, mood_score, energy_score, notes
       FROM checkins WHERE user_id = ? AND checkin_date >= ?
       ORDER BY checkin_date ASC`,
      [userId, thirtyDaysAgo]
    );

    // Streak — consecutive days checked in
    const [allCheckins] = await db.execute(
      'SELECT checkin_date FROM checkins WHERE user_id = ? ORDER BY checkin_date DESC',
      [userId]
    );

    let streak = 0;
    const today = new Date();
    for (let i = 0; i < allCheckins.length; i++) {
      const expected = new Date(today);
      expected.setDate(today.getDate() - i);
      const expectedStr = expected.toISOString().split('T')[0];
      if (allCheckins[i].checkin_date.toISOString().split('T')[0] === expectedStr) {
        streak++;
      } else break;
    }

    // Averages
    const [[avgs]] = await db.execute(
      `SELECT ROUND(AVG(mood_score), 1) AS avg_mood, ROUND(AVG(energy_score), 1) AS avg_energy, COUNT(*) AS total_checkins
       FROM checkins WHERE user_id = ? AND checkin_date >= ?`,
      [userId, thirtyDaysAgo]
    );

    res.json({ mood_trend: moodTrend, streak, ...avgs });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboardStats, getEmployeeStats };
