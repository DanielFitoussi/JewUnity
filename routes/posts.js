const express = require('express');
const router = express.Router();
const postsController = require('../controllers/posts')
const authenticateToken = require('../middleware/auth')

router.get('/', postsController.getPosts);
router.post('/', authenticateToken, postsController.createPost);
router.delete('/clear', authenticateToken, postsController.clearPosts);
router.delete('/:id', authenticateToken, postsController.deletePost);
router.put('/:id', authenticateToken, postsController.updatePost);
router.get('/stats-per-group', authenticateToken, postsController.getPostsCountPerGroup);
router.get('/stats-per-user', authenticateToken, postsController.getPostsCountPerUser);
router.get('/my-posts', authenticateToken, postsController.getMyPosts);
router.get('/group-feed', authenticateToken, postsController.getGroupFeed);





module.exports = router;
