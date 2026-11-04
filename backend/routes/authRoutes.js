const express = require('express');
const { getMe, login, logout, register, updateProfile } = require('../controllers/authController');
const { requireAuth } = require('../utils/auth');
const validateObjectBody = require('../middleware/validateObjectBody');

const router = express.Router();
router.post('/register', validateObjectBody, register);
router.post('/login', validateObjectBody, login);
router.get('/me', requireAuth, getMe);
router.patch('/profile', requireAuth, validateObjectBody, updateProfile);
router.post('/logout', requireAuth, logout);

module.exports = router;
