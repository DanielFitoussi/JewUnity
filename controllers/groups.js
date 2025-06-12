const Group = require('../models/groups');
const User = require('../models/user');
const mongoose = require('mongoose');


const createGroup = async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Group name is required' });
  }

  try {
    const existingGroup = await Group.findOne({ name });

    if (existingGroup) {
      return res.status(409).json({ error: 'Group name already exists' });
    }

    const newGroup = new Group({
      name,
      description,
      members: [req.user.userId] // היוצר של הקבוצה נכנס אוטומטית כחבר ראשון
    });

    await newGroup.save();

    res.status(201).json(newGroup);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const addMemberToGroup = async (req, res) => {
  const { groupId, userId, status = 'active' } = req.body;  // ברירת מחדל 'active'

  try {
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // אם המשתמש כבר חבר בקבוצה, לא נוסיף אותו שוב
    const existingMember = group.members.find(member => member.userId.toString() === userId);
    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    group.members.push({ userId, status });
    await group.save();

    res.status(200).json({ message: 'User added to group successfully', group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};


const searchGroups = async (req, res) => {
  const { query } = req.query;  // מקבלים את ה-query מתוך פרמטרי ה־URL

  try {
    // אם לא נשלח שום פרמטר חיפוש, נחזיר את כל הקבוצות
    const groups = query 
      ? await Group.find({
          $or: [
            { name: { $regex: query, $options: 'i' } },  // חיפוש שם הקבוצה
            { description: { $regex: query, $options: 'i' } }  // חיפוש תיאור הקבוצה
          ]
        })
      : await Group.find();

    res.status(200).json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getGroupStats = async (req, res) => {
  const { groupId } = req.params;

  try {
    console.log('Searching for group with ID:', groupId);  // לדפוק את ה־groupId

    const group = await Group.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(groupId) } },  // הוספנו את new כאן
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'groupId',
          as: 'posts'
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          membersCount: { $size: '$members' },
          postsCount: { $size: '$posts' }
        }
      }
    ]);

    console.log('Group found:', group);  // לדפוק את התוצאה שהתקבלה

    if (!group || group.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.status(200).json(group[0]);
  } catch (err) {
    console.error('Error during aggregation:', err);  // לראות את השגיאה המלאה
    res.status(500).json({ error: 'Server error' });
  }
};

const getAdvancedGroupStats = async (req, res) => {
  const { groupId } = req.params;

  try {
    console.log('Searching for group with ID:', groupId);  // לדפוק את ה־groupId

    const group = await Group.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(groupId) } },  // הוספנו את new כאן
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'groupId',
          as: 'posts'
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          membersCount: { $size: '$members' },
          postsCount: { $size: '$posts' },
          latestPost: { $arrayElemAt: ['$posts', 0] }, // הפוסט האחרון
          activeMembersCount: { $size: { $filter: { input: '$members', as: 'member', cond: { $eq: ['$$member.status', 'active'] } } } }, // חברים פעילים
        }
      }
    ]);

    console.log('Group found:', group);  // לדפוק את התוצאה שהתקבלה

    if (!group || group.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.status(200).json(group[0]);
  } catch (err) {
    console.error('Error during aggregation:', err);  // לראות את השגיאה המלאה
    res.status(500).json({ error: 'Server error' });
  }
};

const updateGroup = async (req, res) => {
  const { groupId } = req.params;
  const { name, description } = req.body;

  try {
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (name) group.name = name;
    if (description) group.description = description;

    await group.save();

    res.status(200).json({ message: 'Group updated successfully', group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteGroup = async (req, res) => {
  const { groupId } = req.params;

  try {
    const group = await Group.findByIdAndDelete(groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.status(200).json({ message: 'Group deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};





// ייצוא
module.exports = {
  createGroup,
  addMemberToGroup,
  searchGroups,
  getGroupStats,
  getAdvancedGroupStats,
  deleteGroup,
  updateGroup
};
