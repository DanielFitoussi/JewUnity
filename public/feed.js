document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('You must be logged in to access the feed');
    window.location.href = 'login.html';
    return;
  }

  const API_BASE_URL = 'http://localhost:3005/api/posts';
  const postForm = document.getElementById('postForm');
  const postsContainer = document.getElementById('postsContainer');
  const userId = parseJwt(token).userId;

  async function loadPosts() {
    try {
      const response = await fetch(API_BASE_URL, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const posts = await response.json();
      postsContainer.innerHTML = '';
      posts.reverse().forEach(post => renderPost(post));
    } catch (err) {
      console.error('Failed to load posts:', err);
    }
  }

  function renderPost(post) {
    const postElement = document.createElement('div');
    postElement.classList.add('card', 'mb-3');
    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');

    const postHeader = document.createElement('div');
    postHeader.classList.add('d-flex', 'justify-content-between', 'align-items-center', 'mb-2');
    const userInfo = document.createElement('div');
    userInfo.classList.add('d-flex', 'align-items-center', 'gap-2');
    const avatarIcon = document.createElement('i');
    avatarIcon.classList.add('bi', 'bi-person-circle', 'fs-4', 'text-secondary');
    const username = document.createElement('strong');
    username.textContent = post.author?.username || 'User';
    userInfo.appendChild(avatarIcon);
    userInfo.appendChild(username);
    const date = document.createElement('small');
    date.classList.add('text-muted');
    date.textContent = new Date(post.createdAt).toLocaleDateString();
    postHeader.appendChild(userInfo);
    postHeader.appendChild(date);
    cardBody.appendChild(postHeader);

    const textElement = document.createElement('p');
    textElement.classList.add('card-text');
    textElement.textContent = post.content;
    cardBody.appendChild(textElement);

    const actionsWrapper = document.createElement('div');
    actionsWrapper.classList.add('d-flex', 'align-items-center', 'gap-3', 'mt-2');

    // כפתור לייק
    const likeBtn = document.createElement('button');
    likeBtn.classList.add('btn-icon', 'like-button');
    const likeIcon = document.createElement('i');
    likeIcon.classList.add('bi');
    likeIcon.classList.add(post.likedBy.includes(userId) ? 'bi-heart-fill' : 'bi-heart');
    if (post.likedBy.includes(userId)) likeIcon.classList.add('liked');
    likeBtn.appendChild(likeIcon);

    const likeCountSpan = document.createElement('span');
    likeCountSpan.textContent = post.likedBy.length;

    likeBtn.addEventListener('click', async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/${post._id}/like`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const updated = await response.json();
        likeCountSpan.textContent = updated.likes;
        if (updated.likedBy.includes(userId)) {
          likeIcon.classList.add('bi-heart-fill', 'liked');
          likeIcon.classList.remove('bi-heart');
        } else {
          likeIcon.classList.remove('bi-heart-fill', 'liked');
          likeIcon.classList.add('bi-heart');
        }
      } catch (err) {
        console.error('Failed to like post:', err);
      }
    });

    // כפתור תגובה
    const commentBtn = document.createElement('button');
    commentBtn.classList.add('btn-icon');
    const commentIcon = document.createElement('i');
    commentIcon.classList.add('bi', 'bi-chat');
    commentBtn.appendChild(commentIcon);

    const commentCountSpan = document.createElement('span');
    commentCountSpan.textContent = post.comments.length;

    actionsWrapper.appendChild(likeBtn);
    actionsWrapper.appendChild(likeCountSpan);
    actionsWrapper.appendChild(commentBtn);
    actionsWrapper.appendChild(commentCountSpan);
    cardBody.appendChild(actionsWrapper);

    const commentSection = document.createElement('div');
    commentSection.classList.add('comment-section');
    commentSection.style.display = 'none';

    commentBtn.addEventListener('click', () => {
      commentSection.style.display = commentSection.style.display === 'none' ? 'block' : 'none';
    });

    const commentInput = document.createElement('input');
    commentInput.type = 'text';
    commentInput.placeholder = 'כתוב תגובה...';
    commentInput.classList.add('form-control', 'form-control-sm', 'mb-2');

    const commentList = document.createElement('div');
    commentList.classList.add('comment-list');

    post.comments.forEach(comment => {
      const commentItem = document.createElement('div');
      commentItem.classList.add('comment');
      commentItem.textContent = `${comment.author?.username || 'User'}: ${comment.content}`;
      commentList.appendChild(commentItem);
    });

    commentInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const text = commentInput.value.trim();
        if (text !== '') {
          try {
            const response = await fetch(`${API_BASE_URL}/${post._id}/comments`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ content: text })
            });

            const updatedComments = await response.json();
            commentList.innerHTML = '';

            updatedComments.forEach(comment => {
              const commentItem = document.createElement('div');
              commentItem.classList.add('comment');
              commentItem.textContent = `${comment.author?.username || 'User'}: ${comment.content}`;
              commentList.appendChild(commentItem);
            });

            commentCountSpan.textContent = updatedComments.length;
            commentInput.value = '';
          } catch (err) {
            console.error('Failed to add comment:', err);
          }
        }
      }
    });

    commentSection.appendChild(commentInput);
    commentSection.appendChild(commentList);
    cardBody.appendChild(commentSection);
    postElement.appendChild(cardBody);
    postsContainer.prepend(postElement);
  }

  postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = document.getElementById('postContent').value;
    const newPost = { content };

    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newPost)
      });

      const savedPost = await response.json();
      renderPost(savedPost);
      postForm.reset();
    } catch (err) {
      console.error('Failed to create post:', err);
    }
  });

  loadPosts();
});

function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}
