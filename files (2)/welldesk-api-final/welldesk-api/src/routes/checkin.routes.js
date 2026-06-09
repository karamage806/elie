const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { uploadSickNote } = require('../config/multer');
const {
  getCheckins,
  getCheckin,
  createCheckin,
  updateCheckin,
  deleteCheckin,
} = require('../controllers/checkin.controller');

const router = express.Router();

router.use(protect);

const checkinValidation = [
  body('mood_score').isInt({ min: 1, max: 5 }).withMessage('Mood score must be between 1 and 5'),
  body('energy_score').isInt({ min: 1, max: 5 }).withMessage('Energy score must be between 1 and 5'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes must be under 1000 characters'),
];

router.get('/', getCheckins);
router.get('/:id', getCheckin);
router.post('/', uploadSickNote.single('sick_note'), checkinValidation, validate, createCheckin);
router.put('/:id', checkinValidation, validate, updateCheckin);
router.delete('/:id', deleteCheckin);

module.exports = router;
