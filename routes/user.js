const express = require('express')
const router = express.Router()
const userController = require('../controllers/user');

// נתיב רישום משתמש חדש
router.post('/register', userController.registerUser);

// נתיב התחברות משתמש קיים
router.post('/login', userController.loginUser);

// ניקוי משתמשים (לבדיקות)
router.delete('/clear', userController.clearUsers);

module.exports = router;
