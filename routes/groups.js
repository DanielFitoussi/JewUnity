const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groups');
const authenticateToken = require('../middleware/auth');

// יצירת קבוצה
router.post('/', authenticateToken, groupController.createGroup);
// הוספת חבר לקבוצה
router.post('/add-member', authenticateToken, groupController.addMemberToGroup);

router.post('/leave', authenticateToken, groupController.leaveGroup);


// חיפוש קבוצות לפי שם/תיאור
router.get('/search', authenticateToken, groupController.searchGroups);

router.get('/:groupId/posts', authenticateToken, groupController.getGroupPosts);

router.get('/:groupId', authenticateToken, groupController.getGroupById); // ✅ חדש


// סטטיסטיקות לקבוצה
router.get('/:groupId/stats', authenticateToken, groupController.getGroupStats);
// סטטיסטיקות מתקדמות לקבוצה
router.get('/:groupId/advanced-stats', authenticateToken, groupController.getAdvancedGroupStats);







// מחיקת קבוצה
router.delete('/:groupId', authenticateToken, groupController.deleteGroup);

router.patch('/:groupId', authenticateToken, groupController.updateGroup);


router.get('/', authenticateToken, groupController.getAllGroups);








module.exports = router;
