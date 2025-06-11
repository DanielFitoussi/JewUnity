const mongoose = require('mongoose');

const Schema = mongoose.Schema

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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Post = mongoose.model('Post', PostSchema);

module.exports = Post;
