require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const Group = require('../models/groups');
const Post = require('../models/posts');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jewunity';

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('📦 מחובר ל־MongoDB');

    await User.deleteMany();
    await Group.deleteMany();
    await Post.deleteMany();
    console.log('🧹 נמחקו משתמשים, קבוצות ופוסטים ישנים');

    const users = await createUsers();
    const groups = await createGroups(users);
    await createPosts(users, groups);

    mongoose.disconnect();
    console.log('🎉 הסתיים בהצלחה');
  } catch (err) {
    console.error('❌ שגיאה:', err);
    process.exit(1);
  }
}

async function createUsers() {
  const usersData = [
    { username: 'david123', password: '123456', gender: 'Male', birthDate: '1995-01-01', firstName: 'David', lastName: 'Cohen' },
    { username: 'miriam88', password: '123456', gender: 'Female', birthDate: '1992-07-12', firstName: 'Miriam', lastName: 'Levi' },
    { username: 'yoav_dev', password: '123456', gender: 'Male', birthDate: '1990-04-20', firstName: 'Yoav', lastName: 'Ben-Tal' },
    { username: 'sara_k', password: '123456', gender: 'Female', birthDate: '1998-11-05', firstName: 'Sara', lastName: 'Kaplan' },
    { username: 'admin1', password: 'admin123', gender: 'Male', birthDate: '1985-09-09', firstName: 'Admin', lastName: 'Root' },
  ];

  const saltRounds = 10;
  const userDocs = [];

  for (const userData of usersData) {
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
    const user = new User({ ...userData, password: hashedPassword });
    await user.save();
    userDocs.push(user);
    console.log(`✅ משתמש נוצר: ${user.username}`);
  }

  return userDocs;
}

async function getCoordinates(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'jewunity-seed-script'
    }
  });

  const data = await response.json();

  if (data && data.length > 0) {
    return {
      type: 'Point',
      coordinates: [parseFloat(data[0].lon), parseFloat(data[0].lat)]
    };
  }

  return null;
}

async function createGroups(users) {
  const groupData = [
    { name: 'חובבי תנ"ך', description: 'קבוצת דיון בפרשת השבוע', address: 'Jerusalem, Israel' },
    { name: 'מתכנתים צעירים', description: 'שיתוף קוד ולמידה ביחד', address: 'Tel Aviv, Israel' },
    { name: 'אהבת ישראל', description: 'קבוצה לאחדות עם ישראל', address: 'Safed, Israel' },
    { name: 'מוזיקה יהודית', description: 'שירים, ניגונים, והמלצות', address: 'Bnei Brak, Israel' },
    { name: 'טכנולוגיה ותורה', description: 'חיבור בין הלכה להייטק', address: 'Haifa, Israel' },
  ];

  const groupDocs = [];

  for (let i = 0; i < groupData.length; i++) {
    const user = users[i % users.length];
    const groupInfo = groupData[i];

    const location = await getCoordinates(groupInfo.address);
    if (!location) {
      console.warn(`⚠️ לא נמצאה כתובת: ${groupInfo.address}`);
      continue;
    }

    const members = [];
    members.push({ userId: user._id, status: 'active' });

    for (let j = 1; j <= 3; j++) {
      const idx = (i + j) % users.length;
      if (users[idx]._id.toString() !== user._id.toString()) {
        members.push({ userId: users[idx]._id, status: 'active' });
      }
    }

    const group = new Group({
      name: groupInfo.name,
      description: groupInfo.description,
      address: groupInfo.address,
      location,
      owner: user._id,
      members
    });

    await group.save();
    groupDocs.push(group);
    console.log(`🏘️ קבוצה נוצרה: ${group.name}`);
  }

  return groupDocs;
}

async function createPosts(users, groups) {
  const sampleContents = [
    'שלום לכולם! שמח להצטרף לקבוצה.',
    'פוסט ראשון שלי כאן 🤗',
    'מה דעתכם על הנושא השבועי?',
    'ממליץ לקרוא את פרשת השבוע!',
    'יש כאן מישהו מחיפה?',
    'מי בא להרצאה שלנו ביום שלישי?',
    'בדקתי את זה בקוד – וזה עובד 🔥',
    'מחשבה מהתפילה של הבוקר...',
    'המלצה על ספר: רמח"ל - דרך ה׳',
    'איך משלבים הלכה עם קריירה?'
  ];

  for (const group of groups) {
    const numPosts = 3;
    const memberIds = group.members.map(m => m.userId.toString());
    const eligibleAuthors = users.filter(u => memberIds.includes(u._id.toString()));

    for (let i = 0; i < numPosts; i++) {
      const author = eligibleAuthors[i % eligibleAuthors.length];
      const content = sampleContents[(i * 3 + group.name.length) % sampleContents.length];

      const post = new Post({
        content,
        author: author._id,
        groupId: group._id,
        mediaType: 'text',
        createdAt: new Date()
      });

      await post.save();
      console.log(`✏️ פוסט נוצר בקבוצה "${group.name}" מאת ${author.username}`);
    }
  }
}

seedDatabase();
