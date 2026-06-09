const express = require('express');
const { body } = require('express-validator');
const { protect, ownerOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getGoals, getGoal, createGoal, updateGoal, deleteGoal, logProgress, getProgress,
} = require('../controllers/goal.controller');

const router = express.Router();
router.use(protect);

const goalValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('target_value').isFloat({ min: 0 }).withMessage('Target value must be a positive number'),
  body('metric').trim().notEmpty().withMessage('Metric is required'),
  body('start_date').isDate().withMessage('Valid start date is required'),
  body('end_date').isDate().withMessage('Valid end date is required'),
];

router.get('/', getGoals);
router.get('/:id', getGoal);
router.post('/', ownerOnly, goalValidation, validate, createGoal);
router.put('/:id', ownerOnly, goalValidation, validate, updateGoal);
router.delete('/:id', ownerOnly, deleteGoal);
router.get('/:id/progress', getProgress);
router.post(
  '/:id/progress',
  [body('value').isFloat({ min: 0 }).withMessage('Value must be a positive number')],
  validate,
  logProgress
);

module.exports = router;
