// seed.js
const mongoose = require('mongoose');
const Group = require('./models/groups');
const Post = require('./models/posts');

const userId = '6859340a4f2fc75ea782fe12'; // ה-userId שלך מתוך הטוקן

async function seed() {
  await mongoose.connect('mongodb://localhost:27017/jewunity');
  console.log('📡 Connected to MongoDB');

  // ננקה קבוצות ופוסטים (לא מוחקים משתמשים)
  await Group.deleteMany({});
  await Post.deleteMany({});

  // ניצור קבוצות חדשות
  const group1 = new Group({
    name: 'חדשות',
    description: 'קבוצת חדשות',
    owner: userId,
    members: [{ userId }]
  });

  const group2 = new Group({
    name: 'טכנולוגיה',
    description: 'קבוצת טכנולוגיה',
    owner: userId,
    members: [{ userId }]
  });

  await group1.save();
  await group2.save();
  console.log('👥 Groups created');

  // ניצור פוסטים עם groupId תקף
  const posts = [
    {
      content: 'פוסט אקטואלי',
      author: userId,
      groupId: group1._id,
      mediaType: 'text'
    },
    {
      content: 'עדכון חשוב בחדשות',
      author: userId,
      groupId: group1._id,
      mediaType: 'text'
    },
    {
      content: 'חידוש טכנולוגי!',
      author: userId,
      groupId: group2._id,
      mediaType: 'text'
    }
  ];

  await Post.insertMany(posts);
  console.log('📝 Posts created with groupId');

  await mongoose.disconnect();
  console.log('✅ Done!');
}

seed();
