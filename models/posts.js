const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// קודם מגדירים את סכמת התגובה:
const commentSchema = new mongoose.Schema({
  content: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// סכמת הפוסט:
const PostSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  author: {
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  mediaUrl: {
    type: String,
    default: null
  },
  mediaType: {
    type: String,
    enum: ['text', 'image', 'video'],
    default: 'text'
  },
  groupId: {  // ✅ הוספה חדשה
    type: Schema.Types.ObjectId,
    ref: 'Group'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  likedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema]
});


const Post = mongoose.model('Post', PostSchema);
module.exports = Post;
