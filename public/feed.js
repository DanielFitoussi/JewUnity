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

  // טעינת הפוסטים מהשרת
  async function loadPosts() {
    try {
      const response = await fetch(API_BASE_URL, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const posts = await response.json();
      postsContainer.innerHTML = '';

      posts.reverse().forEach(post => renderPost(post));
    } catch (err) {
      console.error('Failed to load posts:', err);
    }
  }

  // פונקציה ליצירת DOM של פוסט
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

    postElement.appendChild(cardBody);
    postsContainer.prepend(postElement);
  }

  // הוספת פוסט חדש
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

  // טוען את הפוסטים ברגע שהעמוד נטען
  loadPosts();

  // סינון פוסטים (קיים אצלך)
  document.querySelectorAll('.filter-option').forEach(option => {
    option.addEventListener('click', (e) => {
      e.preventDefault();
      const filter = option.dataset.filter;

      document.querySelectorAll('#postsContainer .card').forEach(post => {
        const type = post.dataset.type;
        if (filter === 'all' || type === filter) {
          post.style.display = 'block';
        } else {
          post.style.display = 'none';
        }
      });
    });
  });
});
