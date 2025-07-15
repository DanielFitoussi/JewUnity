const Post = require('../models/posts');
const mongoose = require('mongoose');
const Group = require('../models/groups');
const User = require('../models/user');

// שליפת כל הפוסטים
const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('author', 'username firstName lastName')
      .populate('comments.author', 'username');
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// יצירת פוסט חדש עם populate
const createPost = async (req, res) => {
  try {
    const { content, groupId } = req.body;
    const author = req.user.userId;

    if (groupId) {
      const group = await Group.findById(groupId);
      const isMember = group.members.some(m => m.userId.toString() === author.toString());
      if (!isMember) return res.status(403).json({ error: 'Only group members can post in this group' });
    }

    let mediaUrl = null;
    let mediaType = 'text';
    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;
      mediaType = req.file.mimetype.startsWith('image/') ? 'image' : req.file.mimetype.startsWith('video/') ? 'video' : 'text';
    }

    const newPost = new Post({
      content,
      author,
      mediaUrl,
      mediaType,
      groupId: groupId ? new mongoose.Types.ObjectId(groupId) : null
    });

    await newPost.save();

    const populatedPost = await Post.findById(newPost._id)
      .populate('author', 'username firstName lastName')
      .populate('comments.author', 'username');
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

const deletePost = async (req, res) => {
  const postId = req.params.id;
  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.author.toString() !== req.user.userId)
      return res.status(403).json({ error: 'You are not authorized to delete this post' });
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
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.author.toString() !== req.user.userId)
      return res.status(403).json({ error: 'You are not authorized to update this post' });
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
      { $group: { _id: "$groupId", postsCount: { $sum: 1 } } },
      { $lookup: { from: "groups", localField: "_id", foreignField: "_id", as: "group" } },
      { $unwind: "$group" },
      { $project: { _id: 0, groupName: "$group.name", postsCount: 1 } }
    ]);
    res.status(200).json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
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
    const posts = await Post.find({ author: req.user.userId })
      .sort({ createdAt: -1 })
      .populate('author', 'username firstName lastName')
      .populate('comments.author', 'username');
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
    const posts = await Post.find({ groupId: { $in: groupIds } })
      .sort({ createdAt: -1 })
      .populate('author', 'username firstName lastName')
      .populate('comments.author', 'username');
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
    if (hasLiked) post.likedBy.pull(userId);
    else post.likedBy.push(userId);
    await post.save();
    res.status(200).json({ likes: post.likedBy.length, likedBy: post.likedBy });
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
    post.comments.push({ content, author: userId });
    await post.save();
    const populatedPost = await Post.findById(postId).populate('comments.author', 'username');
    res.status(201).json(populatedPost.comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getPostCountsByMediaType = async (req, res) => {
  try {
    const stats = await Post.aggregate([
      { $group: { _id: "$mediaType", count: { $sum: 1 } } },
      { $project: { _id: 0, mediaType: "$_id", count: 1 } }
    ]);
    res.status(200).json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const searchPosts = async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Missing search query' });
  try {
    const posts = await Post.aggregate([
      { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'author' } },
      { $unwind: '$author' },
      {
        $match: {
          $or: [
            { content: { $regex: query, $options: 'i' } },
            { 'author.username': { $regex: query, $options: 'i' } }
          ]
        }
      },
      {
        $project: {
          content: 1,
          createdAt: 1,
          mediaUrl: 1,
          mediaType: 1,
          likedBy: 1,
          comments: 1,
          author: {
            _id: '$author._id',
            username: '$author.username'
          }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);
    res.status(200).json(posts);
  } catch (err) {
    console.error('Error in searchPosts:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getFriendsFeed = async (req, res) => {
  try {
    const userId = req.user.userId;

    // שליפת רשימת חברים
    const user = await User.findById(userId).populate('friends');
    const friendIds = user.friends.map(friend => friend._id);

    // הוספת המשתמש עצמו
    friendIds.push(userId);

    // שליפת הפוסטים של המשתמש והחברים
    const posts = await Post.find({ 'author': { $in: friendIds } })
  .sort({ createdAt: -1 })
  .populate('author', 'username firstName lastName')
  .populate('comments.author', 'username'); // ✅ יפתור את הבעיה


    res.json(posts);
  } catch (err) {
    console.error('❌ שגיאה בטעינת פיד החברים:', err);
    res.status(500).json({ error: 'שגיאה בטעינת הפיד' });
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
  addComment,
  getPostCountsByMediaType,
  searchPosts,
  getFriendsFeed
};
