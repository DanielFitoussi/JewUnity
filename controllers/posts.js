const postsModel = require('../models/posts')

function getPosts(req, res) {
  res.json(postsModel.getAllPosts())
}

function createPost(req, res) {
  const { content, author, mediaUrl, mediaType } = req.body;

  if (!content || !author)
    return res.status(400).json({ error: 'Missing content or author' })



  const newPost = {
    id: Date.now().toString(),
    content,
    author,
    mediaUrl: mediaUrl || null,
    mediaType: mediaType || 'text',
    createdAt: new Date().toISOString()
  }

  postsModel.addPost(newPost)
  res.status(201).json(newPost)

}

module.exports={
    getPosts,
  createPost
}
