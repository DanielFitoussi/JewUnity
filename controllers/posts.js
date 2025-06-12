const Post = require('../models/posts');

// שליפת כל הפוסטים
const getPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).populate('author','username firstName lastName'); // שליפה לפי תאריך חדש קודם
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// יצירת פוסט חדש
const createPost = async (req, res) => {
  const { content, mediaUrl, mediaType } = req.body;

   console.log('Request Body:', req.body);  // 🚀 נעקוב אחרי מה שנשלח

  if (!content ) {
    return res.status(400).json({ error: 'Missing content ' });
  }

  try {
    const newPost = new Post({
      content,
      author: req.user.userId,
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

// פונקציה למחיקת פוסט עם בדיקת בעלות
const deletePost = async (req, res) => {
  const postId = req.params.id;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // בדיקת בעלות
    if (post.author.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(postId);
    res.status(200).json({ message: 'Post deleted successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const updatePost = async (req, res) => {
  const postId = req.params.id;
  const { content, mediaUrl, mediaType } = req.body;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // בדיקת בעלות על הפוסט
    if (post.author.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'You are not authorized to update this post' });
    }

    // נעדכן את השדות
    post.content = content || post.content;
    post.mediaUrl = mediaUrl || post.mediaUrl;
    post.mediaType = mediaType || post.mediaType;

    await post.save();
    res.status(200).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getPostsCountPerGroup = async (req, res) => {
  try {
    const stats = await Post.aggregate([
      { $group: { _id: "$groupId", postsCount: { $sum: 1 } } }
    ]);

    res.status(200).json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
const getPostsCountPerUser = async (req, res) => {
  try {
    const stats = await Post.aggregate([
      { $group: { _id: "$author", postsCount: { $sum: 1 } } }
    ]);

    res.status(200).json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};



module.exports = {
  getPosts,
  createPost,
   deletePost,
   updatePost,
  clearPosts,
  getPostsCountPerGroup,
  getPostsCountPerUser
};
