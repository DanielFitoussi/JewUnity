const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  author: {
    type: String,
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Post = mongoose.model('Post', PostSchema);

module.exports = Post;
