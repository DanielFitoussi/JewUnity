const Post = require('../models/posts');

// שליפת כל הפוסטים
const getPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }); // שליפה לפי תאריך חדש קודם
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// יצירת פוסט חדש
const createPost = async (req, res) => {
  const { content, author, mediaUrl, mediaType } = req.body;

  if (!content || !author) {
    return res.status(400).json({ error: 'Missing content or author' });
  }

  try {
    const newPost = new Post({
      content,
      author,
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || 'text'
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getPosts,
  createPost
};
