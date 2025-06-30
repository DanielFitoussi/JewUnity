document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('עליך להתחבר כדי לצפות בקבוצה');
        window.location.href = 'login.html';
        return;
    }

    const groupId = new URLSearchParams(window.location.search).get('groupId');
    if (!groupId) {
        alert('לא נבחרה קבוצה');
        window.location.href = 'feed.html';
        return;
    }

    const API_BASE = 'http://localhost:3005/api/groups';

    const groupTitle = document.getElementById('groupTitle');
    const groupDescription = document.getElementById('groupDescription');
    const postFormSection = document.getElementById('postFormSection');
    const postForm = document.getElementById('postForm');
    const mediaUpload = document.getElementById('mediaUpload');
    const postContent = document.getElementById('postContent');
    const editGroupBtn = document.getElementById('editGroupBtn');
    const postsContainer = document.getElementById('postsContainer');
    const searchInput = document.getElementById('searchInput');
    const leaveGroupBtn = document.getElementById('leaveGroupBtn');

    let allPosts = [];

    try {
        const res = await fetch(`${API_BASE}/${groupId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const group = await res.json();
        console.log("📛 שם הקבוצה שהגיע מהשרת:", group.name);

        // 🔍 הוספת לוגים לבדיקה
        console.log("🔍 group.members:", group.members);
        console.log("🔍 group.members[0]?.userId:", group.members[0]?.userId);
        console.log("🔍 typeof group.members[0]?.userId:", typeof group.members[0]?.userId);
        const userId = parseJwt(token).userId;
        console.log("🔍 typeof userId:", typeof userId, "| userId:", userId);




        // לוגים לבדיקה
        console.log("📛 קבוצה:", group.name);
        console.log("👤 userId:", userId);
        console.log("👥 חברים בקבוצה:", group.members.map(m => String(m.userId)));

        const isMember = group.members.some(id => id.toString() === userId.toString());
        const isAdmin = String(group.adminId) === String(userId);

        console.log("🧪 בדיקת isMember:", isMember);
        console.log("🧪 בדיקת isAdmin:", isAdmin);

        if (!isMember) {
            alert('רק חברי קבוצה יכולים לגשת לעמוד זה');
            window.location.href = 'feed.html';
            return;
        }

        groupTitle.textContent = group.name;
        groupDescription.textContent = group.description;

        if (isMember) {
            postFormSection.classList.remove('hidden');
            leaveGroupBtn.classList.remove('hidden');
        }

        if (isAdmin) {
            editGroupBtn.classList.remove('hidden');
        }

        
        editGroupBtn.addEventListener('click', async () => {
            const newName = prompt('שם חדש לקבוצה:', groupTitle.textContent);
            if (!newName) return;

            const newDescription = prompt('תיאור חדש לקבוצה:', groupDescription.textContent);
            if (newDescription === null) return;

            try {
                const response = await fetch(`${API_BASE}/${groupId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: newName,
                        description: newDescription
                    })
                });

                const result = await response.json();
                if (!response.ok) {
                    alert(result.error || 'שגיאה בעדכון');
                    return;
                }

                groupTitle.textContent = result.group.name;
                groupDescription.textContent = result.group.description;
                alert('✅ פרטי הקבוצה עודכנו בהצלחה');
            } catch (err) {
                console.error('❌ שגיאה בעדכון קבוצה:', err);
                alert('שגיאה בשרת');
            }
        });
    } catch (err) {
        console.error('שגיאה בטעינת הקבוצה:', err);
    }

    async function loadGroupPosts() {
        try {
            const res = await fetch(`${API_BASE}/${groupId}/posts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const posts = await res.json();
            allPosts = posts;
            renderPosts(posts);
        } catch (err) {
            console.error('שגיאה בטעינת הפוסטים:', err);
        }
    }

    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const content = postContent.value.trim();
        const media = mediaUpload.files[0];

        if (!content && !media) {
            alert('אנא כתוב משהו או צרף מדיה');
            return;
        }

        const formData = new FormData();
        formData.append('content', content);
        formData.append('groupId', groupId);
        if (media) formData.append('media', media);

        try {
            const res = await fetch('http://localhost:3005/api/posts', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) throw new Error('שגיאה בפרסום הפוסט');

            postContent.value = '';
            mediaUpload.value = '';
            await loadGroupPosts();
        } catch (err) {
            console.error('שגיאה בשליחת פוסט:', err);
            alert('רק חברי הקבוצה רשאים לפרסם');
        }
    });

   function renderPost(post) {
  const postsContainer = document.getElementById('postsContainer');
  const token = localStorage.getItem('token');
  const userId = parseJwt(token).userId;

  const postElement = document.createElement('div');
  postElement.classList.add('post-card');

  const fullName = post.author?.firstName && post.author?.lastName
    ? `${post.author.firstName} ${post.author.lastName}`
    : post.author?.username || 'משתמש לא ידוע';

  const header = document.createElement('div');
  header.className = 'd-flex justify-content-between align-items-center mb-2';
  header.innerHTML = `
    <strong>${fullName}</strong>
    <small class="text-muted">${new Date(post.createdAt).toLocaleDateString()}</small>
  `;

  const content = document.createElement('p');
  content.textContent = post.content;

  postElement.appendChild(header);
  postElement.appendChild(content);

  if (post.mediaUrl && post.mediaType !== 'text') {
    const media = document.createElement(post.mediaType === 'image' ? 'img' : 'video');
    media.src = post.mediaUrl;
    media.className = 'post-media';
    if (post.mediaType === 'video') media.controls = true;
    postElement.appendChild(media);
  }

  const actions = document.createElement('div');
  actions.className = 'd-flex gap-3 align-items-center mt-2';

  // לייק
  const likeBtn = document.createElement('button');
  likeBtn.className = 'btn-icon';
  const likeIcon = document.createElement('i');
  likeIcon.classList.add('bi');
  likeIcon.classList.add(post.likedBy.includes(userId) ? 'bi-heart-fill' : 'bi-heart');
  if (post.likedBy.includes(userId)) likeIcon.classList.add('liked');
  likeBtn.appendChild(likeIcon);

  const likeCount = document.createElement('span');
  likeCount.textContent = post.likedBy.length;

  likeBtn.addEventListener('click', async () => {
    try {
      const res = await fetch(`http://localhost:3005/api/posts/${post._id}/like`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      likeCount.textContent = data.likes;
      likeIcon.className = data.likedBy.includes(userId) ? 'bi bi-heart-fill liked' : 'bi bi-heart';
    } catch (err) {
      console.error('שגיאה בלייק:', err);
    }
  });

  // תגובה
  const commentBtn = document.createElement('button');
  commentBtn.className = 'btn-icon';
  commentBtn.innerHTML = '<i class="bi bi-chat"></i>';
  const commentCount = document.createElement('span');
  commentCount.textContent = post.comments.length;

  // עריכה ומחיקה
  if (post.author?._id === userId) {
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-icon';
    editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
    editBtn.addEventListener('click', () => showEditForm(post, postElement));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-icon';
    deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
    deleteBtn.addEventListener('click', async () => {
      if (!confirm('למחוק פוסט?')) return;
      try {
        const res = await fetch(`http://localhost:3005/api/posts/${post._id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) postElement.remove();
      } catch (err) {
        console.error('שגיאה במחיקה:', err);
      }
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
  }

  actions.appendChild(likeBtn);
  actions.appendChild(likeCount);
  actions.appendChild(commentBtn);
  actions.appendChild(commentCount);
  postElement.appendChild(actions);

  // תגובות
  const commentSection = document.createElement('div');
  commentSection.className = 'comment-section mt-2';
  commentSection.style.display = 'none';

  const commentInput = document.createElement('input');
  commentInput.type = 'text';
  commentInput.placeholder = 'כתוב תגובה...';
  commentInput.className = 'form-control form-control-sm mb-2';

  const commentList = document.createElement('div');
  post.comments.forEach(comment => {
    const commentItem = document.createElement('div');
    commentItem.className = 'comment';
    commentItem.textContent = `${comment.author?.username || 'User'}: ${comment.content}`;
    commentList.appendChild(commentItem);
  });

  commentBtn.addEventListener('click', () => {
    commentSection.style.display = commentSection.style.display === 'none' ? 'block' : 'none';
  });

  commentInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const text = commentInput.value.trim();
      if (text) {
        try {
          const res = await fetch(`http://localhost:3005/api/posts/${post._id}/comments`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ content: text })
          });
          const updatedComments = await res.json();
          commentList.innerHTML = '';
          updatedComments.forEach(comment => {
            const commentItem = document.createElement('div');
            commentItem.className = 'comment';
            commentItem.textContent = `${comment.author?.username || 'User'}: ${comment.content}`;
            commentList.appendChild(commentItem);
          });
          commentCount.textContent = updatedComments.length;
          commentInput.value = '';
        } catch (err) {
          console.error('שגיאה בהוספת תגובה:', err);
        }
      }
    }
  });

  commentSection.appendChild(commentInput);
  commentSection.appendChild(commentList);
  postElement.appendChild(commentSection);
  postsContainer.prepend(postElement);
}


    searchInput.addEventListener('input', () => {
        const keyword = searchInput.value.toLowerCase();
        const filtered = allPosts.filter(post =>
            post.content.toLowerCase().includes(keyword)
        );
        renderPosts(filtered);
    });

    const backToFeedBtn = document.getElementById('backToFeed');
    backToFeedBtn.addEventListener('click', () => {
        window.location.href = 'feed.html';
    });

    leaveGroupBtn.addEventListener('click', async () => {
        if (!confirm('האם אתה בטוח שברצונך לעזוב את הקבוצה?')) return;

        try {
            const res = await fetch('http://localhost:3005/api/groups/leave', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ groupId })
            });

            const result = await res.json();

            if (!res.ok) {
                alert(result.error || 'שגיאה בעזיבת קבוצה');
                return;
            }

            alert('✨ עזבת את הקבוצה בהצלחה');
            window.location.href = 'feed.html';
        } catch (err) {
            console.error('שגיאה בעזיבת קבוצה:', err);
            alert('שגיאה בעזיבה');
        }
    });

    function renderPosts(posts) {
  postsContainer.innerHTML = '';
  posts.forEach(post => renderPost(post));
}


    loadGroupPosts();
});

function parseJwt(token) {
    try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload));
    } catch (e) {
        return {};
    }
}

function showEditForm(post, postElement) {
  if (postElement.querySelector('.edit-form')) return;

  const oldTextElement = postElement.querySelector('p');
  if (!oldTextElement) return;

  const formWrapper = document.createElement('div');
  formWrapper.classList.add('edit-form', 'mt-2');

  const input = document.createElement('input');
  input.type = 'text';
  input.value = post.content;
  input.classList.add('form-control', 'mb-2');

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'שמור';
  saveBtn.classList.add('btn', 'btn-success', 'me-2');

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'ביטול';
  cancelBtn.classList.add('btn', 'btn-secondary');

  formWrapper.appendChild(input);
  formWrapper.appendChild(saveBtn);
  formWrapper.appendChild(cancelBtn);

  oldTextElement.style.display = 'none';
  postElement.appendChild(formWrapper);

  saveBtn.addEventListener('click', async () => {
    const newContent = input.value.trim();
    if (newContent && newContent !== post.content) {
      await updatePostContent(post._id, newContent, postElement);
    }
  });

  cancelBtn.addEventListener('click', () => {
    formWrapper.remove();
    oldTextElement.style.display = '';
  });
}

async function updatePostContent(postId, newContent, postElement) {
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`http://localhost:3005/api/posts/${postId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content: newContent })
    });

    if (response.ok) {
      const updatedPost = await response.json();
      const textElement = postElement.querySelector('p');
      if (textElement) {
        textElement.textContent = updatedPost.content;
        textElement.style.display = '';
      }
      const editForm = postElement.querySelector('.edit-form');
      if (editForm) editForm.remove();
    } else {
      const error = await response.json();
      console.error('שגיאה מהשרת:', error);
    }
  } catch (err) {
    console.error('שגיאה בבקשת עדכון:', err);
  }
}