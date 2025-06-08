const express = require('express')
const router = express.Router()
const authController = require('../controllers/auth');

// נתיב רישום משתמש חדש
router.post('/register', authController.registerUser);

// נתיב התחברות משתמש קיים
router.post('/login', authController.loginUser);

router.delete('/clear', authController.clearUsers);



module.exports = router;