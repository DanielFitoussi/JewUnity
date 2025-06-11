const express = require('express');
const router = express.Router();
const postsController = require('../controllers/posts')
const authenticateToken = require('../middleware/auth')

router.get('/', postsController.getPosts);
router.post('/', authenticateToken, postsController.createPost);
router.delete('/clear', authenticateToken, postsController.clearPosts);
router.delete('/:id', authenticateToken, postsController.deletePost);
router.put('/:id', authenticateToken, postsController.updatePost);




module.exports = router;
