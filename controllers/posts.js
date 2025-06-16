const Post = require('../models/posts');
const mongoose = require('mongoose');
const Group = require('../models/groups');


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

// יצירת פוסט חדש עם populate
const createPost = async (req, res) => {
  try {
    const { content, mediaUrl, mediaType } = req.body;
    const author = req.user.userId; // לוקחים את מזהה המשתמש מתוך הטוקן

    const newPost = new Post({
      content,
      author,
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || 'text'
    });

    await newPost.save();

    // שליפה מחדש עם populate לצורך החזרת author עם username
    const populatedPost = await Post.findById(newPost._id).populate('author', 'username firstName lastName');

    res.status(201).json(populatedPost);
  } catch (err) {
    console.error('Error while creating post:', err);
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

const getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user.userId }).sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getGroupFeed = async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.user.userId);

    const groups = await Group.find({ "members.userId": userObjectId });

    const groupIds = groups.map(group => group._id);

    const posts = await Post.find({ groupId: { $in: groupIds } }).sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (err) {
    console.error('Error in getGroupFeed:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const likePost = async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.userId;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const hasLiked = post.likedBy.includes(userId);

    if (hasLiked) {
      // המשתמש כבר עשה לייק — נוריד לייק
      post.likedBy.pull(userId);
    } else {
      // מוסיף לייק
      post.likedBy.push(userId);
    }

    await post.save();

    res.status(200).json({
      likes: post.likedBy.length,
      likedBy: post.likedBy
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const addComment = async (req, res) => {
  const postId = req.params.id;
  const { content } = req.body;
  const userId = req.user.userId;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    post.comments.push({
      content,
      author: userId
    });

    await post.save();

    const populatedPost = await Post.findById(postId).populate('comments.author', 'username');
    res.status(201).json(populatedPost.comments);
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
  getPostsCountPerUser,
   getMyPosts,
   getGroupFeed,
    likePost,
    addComment
};
