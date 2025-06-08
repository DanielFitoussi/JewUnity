const posts= []

function addPost(post){
  posts.push(post)
}

function getAllPosts(){
  return posts
}

module.exports={
    addPost,
  getAllPosts
}