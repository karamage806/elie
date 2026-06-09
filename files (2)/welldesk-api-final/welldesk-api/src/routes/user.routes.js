const express = require('express');
const { body } = require('express-validator');
const { protect, ownerOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { uploadAvatar: multerAvatar } = require('../config/multer');
const { getMe, getTeam, updateUser, uploadAvatar, deleteUser } = require('../controllers/user.controller');

const router = express.Router();

router.use(protect);

router.get('/me', getMe);
router.get('/', ownerOnly, getTeam);

router.patch(
  '/:id',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  ],
  validate,
  updateUser
);

router.patch('/:id/avatar', multerAvatar.single('avatar'), uploadAvatar);
router.delete('/:id', ownerOnly, deleteUser);

module.exports = router;
