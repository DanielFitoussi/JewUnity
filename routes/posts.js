const express = require('express');
const router = express.Router();
const postsController = require('../controllers/posts')
const authenticateToken = require('../middleware/auth')

router.get('/posts', postsController.getPosts);
router.post('/posts', authenticateToken, postsController.createPost)

module.exports = router;
