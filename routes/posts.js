const express = require('express');
const router = express.Router();
const postsController = require('../controllers/posts')
const authenticateToken = require('../middleware/auth')

router.get('/', postsController.getPosts);
router.post('/', authenticateToken, postsController.createPost);
router.delete('/clear', authenticateToken, postsController.clearPosts);



module.exports = router;
