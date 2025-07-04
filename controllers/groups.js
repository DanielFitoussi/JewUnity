const Group = require('../models/groups');
const User = require('../models/user');
const mongoose = require('mongoose');
const Post = require('../models/posts');





const createGroup = async (req, res) => {
  const { name, description, address, location } = req.body;
  
   // הוספת לוגים לבדוק את הכתובת והמיקום
  console.log('📍 כתובת שהתקבלה:', address);
  console.log('🌍 מיקום גיאוגרפי שהתקבל:', location);

  if (!name || !address || !location || !location.coordinates) {
    return res.status(400).json({ error: 'Missing required fields: name, address, or location' });
  }

  try {
    const existingGroup = await Group.findOne({ name });

    if (existingGroup) {
      return res.status(409).json({ error: 'Group name already exists' });
    }

    const newGroup = new Group({
      name,
      description,
      address,
      location,
      owner: req.user.userId,
      members: [{ userId: req.user.userId, status: 'active' }]
    });

    await newGroup.save();

    res.status(201).json(newGroup);
  } catch (err) {
    console.error('❌ Error creating group:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


const addMemberToGroup = async (req, res) => {
  const { groupId, userId, status = 'active' } = req.body;

  console.log('Received groupId:', groupId);
  console.log('Received userId:', userId);

  try {
    // שליפת הקבוצה
    const group = await Group.findById(groupId);
    if (!group) {
      console.log('Group not found');
      return res.status(404).json({ error: 'Group not found' });
    }

    console.log('Group found:', group);

    // בדוק אם המשתמש כבר חבר בקבוצה
    const existingMember = group.members.find(
      member => member.userId.toString() === userId
    );

    if (existingMember) {
      console.log('User is already a member');
      return res.status(400).json({ error: 'User is already a member' });
    }

    // הוספת חבר חדש לקבוצה
    group.members.push({ userId, status });
    await group.save();

    console.log('User added successfully');
    res.status(200).json({ message: 'User added to group successfully', group });
  } catch (err) {
    console.error('Error in addMemberToGroup:', err);
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

    if (group.owner.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'You are not authorized to update this group' });
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
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.owner.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this group' });
    }

    await Group.findByIdAndDelete(groupId);

    res.status(200).json({ message: 'Group deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find();
    res.status(200).json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
};

const getGroupPosts = async (req, res) => {
  const { groupId } = req.params;

  try {
    const posts = await Post.find({ groupId }).populate('author', 'username');
    res.status(200).json(posts);
  } catch (err) {
    console.error('שגיאה בשליפת פוסטים לקבוצה:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getGroupById = async (req, res) => {
  const { groupId } = req.params;

  try {
    const group = await Group.findById(groupId).populate('members.userId', 'username');


    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const groupWithAdmin = {
  _id: group._id,
  name: group.name,
  description: group.description,
  members: group.members.map(m => ({
    _id: m.userId?._id,
    username: m.userId?.username || 'משתמש לא ידוע'
  })),
  adminId: group.owner.toString()
};


    res.status(200).json(groupWithAdmin);
  } catch (err) {
    console.error('Error fetching group by ID:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


const leaveGroup = async (req, res) => {
  const { groupId } = req.body;
  const userId = req.user.userId;

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.owner.toString() === userId) {
      return res.status(400).json({ error: 'Owner cannot leave their own group' });
    }

    const initialCount = group.members.length;
    group.members = group.members.filter(m => m.userId.toString() !== userId);

    if (group.members.length === initialCount) {
      return res.status(400).json({ error: 'User is not a member of this group' });
    }

    await group.save();
    res.status(200).json({ message: 'Left group successfully' });
  } catch (err) {
    console.error('❌ Error in leaveGroup:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


const getAllGroupLocations = async (req, res) => {
  try {
    const groups = await Group.find({}, 'name address'); // מחזיר רק שם וכתובת
    res.status(200).json(groups);
  } catch (err) {
    console.error('❌ Error fetching group locations:', err);
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
  updateGroup,
  getAllGroups,
  getGroupPosts,
  getGroupById,
  leaveGroup,
  getAllGroupLocations
};
