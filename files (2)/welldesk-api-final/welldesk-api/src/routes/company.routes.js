const express = require('express');
const { body } = require('express-validator');
const { protect, ownerOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { uploadAvatar } = require('../config/multer');
const { getCompany, validateInvite, updateCompany, regenerateInvite } = require('../controllers/company.controller');

const router = express.Router();

// Public route — validate invite before showing register form
router.get('/invite/:token', validateInvite);

router.use(protect);

router.get('/', getCompany);
router.patch(
  '/',
  ownerOnly,
  uploadAvatar.single('logo'),
  [body('name').trim().notEmpty().withMessage('Company name is required')],
  validate,
  updateCompany
);
router.post('/regenerate-invite', ownerOnly, regenerateInvite);

module.exports = router;
