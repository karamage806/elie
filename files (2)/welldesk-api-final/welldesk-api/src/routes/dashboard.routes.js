const express = require('express');
const { protect, ownerOnly } = require('../middleware/auth');
const { getDashboardStats, getEmployeeStats } = require('../controllers/dashboard.controller');

const router = express.Router();
router.use(protect);

router.get('/stats', ownerOnly, getDashboardStats);
router.get('/employee', getEmployeeStats);

module.exports = router;
