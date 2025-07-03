const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groups');
const authenticateToken = require('../middleware/auth');
const Group = require('../models/groups');

// יצירת קבוצה
router.post('/', authenticateToken, groupController.createGroup);

// הוספת חבר לקבוצה
router.post('/add-member', authenticateToken, groupController.addMemberToGroup);

// עזיבת קבוצה
router.post('/leave', authenticateToken, groupController.leaveGroup);

// חיפוש קבוצות לפי שם/תיאור
router.get('/search', authenticateToken, groupController.searchGroups);

// שליפת קבוצות עם מיקומים (עבור המפה) ← ✨ הועבר למעלה לפני groupId
router.get('/locations', async (req, res) => {
  try {
    const groups = await Group.find({ location: { $exists: true } }, { name: 1, location: 1 });
    res.json(groups);
  } catch (err) {
    console.error('❌ שגיאה בשליפת מיקומי קבוצות:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// שליפת פוסטים של קבוצה
router.get('/:groupId/posts', authenticateToken, groupController.getGroupPosts);

// שליפת קבוצה לפי מזהה
router.get('/:groupId', authenticateToken, groupController.getGroupById);

// סטטיסטיקות לקבוצה
router.get('/:groupId/stats', authenticateToken, groupController.getGroupStats);

// סטטיסטיקות מתקדמות לקבוצה
router.get('/:groupId/advanced-stats', authenticateToken, groupController.getAdvancedGroupStats);

// מחיקת קבוצה
router.delete('/:groupId', authenticateToken, groupController.deleteGroup);

// עדכון קבוצה
router.patch('/:groupId', authenticateToken, groupController.updateGroup);

// שליפת כל הקבוצות
router.get('/', authenticateToken, groupController.getAllGroups);

module.exports = router;
