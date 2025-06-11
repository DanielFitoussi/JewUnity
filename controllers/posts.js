const Post = require('../models/posts');

// שליפת כל הפוסטים
const getPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).populate('author','username firstNmae lastName'); // שליפה לפי תאריך חדש קודם
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// יצירת פוסט חדש
const createPost = async (req, res) => {
  const { content, author, mediaUrl, mediaType } = req.body;

   console.log('Request Body:', req.body);  // 🚀 נעקוב אחרי מה שנשלח

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

     console.log('New Post to Save:', newPost);  // 🚀 נראה מה נוצר

    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    console.error('Error while creating post:', err);  // 🚀 נדפיס את השגיאה המלאה
    // console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const clearPosts = async (req, res) => {
  try {
    await Post.deleteMany({});
    res.status(200).json({ message: 'All posts have been deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};


module.exports = {
  getPosts,
  createPost,
  clearPosts
};
