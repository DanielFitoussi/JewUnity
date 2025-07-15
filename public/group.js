// group.js

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    alert('עליך להתחבר כדי לגשת לעמוד');
    window.location.href = 'login.html';
    return;
  }

  const groupId = new URLSearchParams(window.location.search).get('groupId');
  const API_BASE = 'http://localhost:3005/api/groups';

  if (!groupId) {
    alert('לא נבחרה קבוצה');
    window.location.href = 'feed.html';
    return;
  }

  const groupTitle = document.getElementById('groupTitle');
  const groupDescription = document.getElementById('groupDescription');
  const groupAddress = document.getElementById('groupAddress');
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
    
    const userId = parseJwt(token).userId;
    

console.log('🧪 USER ID:', userId);                      // המשתמש המחובר
console.log('🧪 GROUP MEMBERS:', group.members);          // כל חברי הקבוצה שהשרת החזיר
console.log('🧪 isMember:', group.members.some(m => String(m._id) === String(userId)));


    console.log('🔍 group.members:', group.members);
    console.log('👤 current userId:', userId);

const isMember = group.members.some(m => String(m.userId) === String(userId));
    console.log('👀 isMember:', isMember);

    const isAdmin = String(group.adminId) === String(userId);


    groupTitle.textContent = group.name;
    groupDescription.textContent = group.description;
    groupAddress.textContent = group.address || 'כתובת לא זמינה';

    if (group.location?.coordinates?.length === 2) {
      const [lng, lat] = group.location.coordinates;
      const map = L.map('map').setView([lat, lng], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`<strong>${group.name}</strong><br>${group.address || ''}<br><a href="group.html?groupId=${group._id}">👀 צפה בקבוצה</a>`);
    }

    if (!isMember) {
      const joinBtn = document.createElement('button');
      joinBtn.textContent = 'הצטרף לקבוצה';
      joinBtn.classList.add('btn', 'btn-sm', 'btn-outline-primary');

      joinBtn.addEventListener('click', async () => {
        try {
          const res = await fetch(`${API_BASE}/add-member`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ groupId, userId })
          });

          const result = await res.json();
          if (res.ok) {
            alert('הצטרפת לקבוצה בהצלחה!');
            window.location.reload();
          } else {
            alert(result.error || 'שגיאה בהצטרפות');
          }
        } catch (err) {
          console.error('שגיאה בהצטרפות לקבוצה:', err);
          alert('שגיאה בהצטרפות לקבוצה');
        }
      });

      const actionsContainer = document.getElementById('actions-container');
      if (actionsContainer) {
        actionsContainer.appendChild(joinBtn);
      }
    }

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

      const newAddress = prompt('כתובת חדשה (עיר, מדינה):', group.address || '');
      if (!newAddress) return;

      try {
        const response = await fetch(`${API_BASE}/${groupId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name: newName, description: newDescription, address: newAddress })
        });

        const result = await response.json();
        if (!response.ok) {
          alert(result.error || 'שגיאה בעדכון');
          return;
        }

        groupTitle.textContent = result.group.name;
        groupDescription.textContent = result.group.description;
        groupAddress.textContent = result.group.address;
        alert('✅ פרטי הקבוצה עודכנו בהצלחה');
      } catch (err) {
        console.error('שגיאה בעדכון קבוצה:', err);
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

  postForm?.addEventListener('submit', async (e) => {
  const content = postContent.value.trim();
  const media = mediaUpload.files[0];

  // אם אין מדיה – דרוש מלל
  if (!media) {
    postContent.setAttribute('required', 'required');
  } else {
    postContent.removeAttribute('required');
  }

  // עצור שליחה אם הטופס לא תקין (ייתן את הודעת ברירת המחדל של הדפדפן)
  if (!postForm.checkValidity()) {
    return;
  }

  e.preventDefault();

  const formData = new FormData();
  formData.append('content', content);
  formData.append('groupId', groupId);
  if (media) formData.append('media', media);

  try {
    const res = await fetch('http://localhost:3005/api/posts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
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


  searchInput?.addEventListener('input', () => {
    const keyword = searchInput.value.toLowerCase();
    const filtered = allPosts.filter(post =>
      post.content.toLowerCase().includes(keyword)
    );
    renderPosts(filtered);
  });

  document.getElementById('backToFeed')?.addEventListener('click', () => {
    window.location.href = 'feed.html';
  });

  leaveGroupBtn?.addEventListener('click', async () => {
    if (!confirm('האם אתה בטוח שברצונך לעזוב את הקבוצה?')) return;

    try {
      const res = await fetch(`${API_BASE}/leave`, {
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
      window.location.reload();
    } catch (err) {
      console.error('שגיאה בעזיבת קבוצה:', err);
      alert('שגיאה בעזיבה');
    }
  });

 function renderPost(post) {
  const userId = parseJwt(localStorage.getItem('token')).userId;
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

   const actionsWrapper = document.createElement('div');
  actionsWrapper.classList.add('d-flex', 'align-items-center', 'gap-3', 'mt-2');

  const actions = document.createElement('div');
actions.className = 'd-flex align-items-center gap-3 mt-2';


  // Like Button
  const likeBtn = document.createElement('button');
  likeBtn.classList.add('btn-icon', 'like-button');
  const likeIcon = document.createElement('i');
  likeIcon.classList.add('bi', post.likedBy.includes(userId) ? 'bi-heart-fill' : 'bi-heart');
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

  // Comment Button
  const commentBtn = document.createElement('button');
  commentBtn.classList.add('btn-icon');
  const commentIcon = document.createElement('i');
  commentIcon.classList.add('bi', 'bi-chat');
  commentBtn.appendChild(commentIcon);

  const commentCount = document.createElement('span');
  commentCount.textContent = post.comments?.length || 0;

    const commentSection = document.createElement('div');
  commentSection.className = 'comment-section mt-2';
  commentSection.style.display = 'none';

// תגובות קיימות
const commentList = document.createElement('div');
commentList.className = 'comment-list';

post.comments?.forEach(comment => {
  const commentEl = document.createElement('div');
  commentEl.className = 'comment mb-1 p-2 bg-light rounded';
  const username = comment.author?.username || 'משתמש';
  commentEl.innerHTML = `<strong>${username}</strong>: ${comment.content}`;
  commentList.appendChild(commentEl);
});

// צרף את כל התגובות לאזור התגובות
commentSection.appendChild(commentList);



  // טופס תגובה
  const commentForm = document.createElement('form');
  commentForm.className = 'd-flex mt-2';
  const commentInput = document.createElement('input');
  commentInput.className = 'form-control me-2';
  commentInput.placeholder = 'כתוב תגובה...';
  const commentSubmit = document.createElement('button');
  commentSubmit.className = 'btn btn-primary btn-sm';
  commentSubmit.textContent = 'שלח';

  commentForm.appendChild(commentInput);
  commentForm.appendChild(commentSubmit);
  commentSection.appendChild(commentList);
  commentSection.appendChild(commentForm);

  // לחצן הצגת/הסתרת תגובות
  commentBtn.addEventListener('click', () => {
    commentSection.style.display = commentSection.style.display === 'none' ? 'block' : 'none';
  });

  // שליחת תגובה
  commentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = commentInput.value.trim();
    if (!text) return;

    try {
      const res = await fetch(`http://localhost:3005/api/posts/${post._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
body: JSON.stringify({ content: text })
      });

      if (!res.ok) throw new Error('שגיאה בהוספת תגובה');
      commentInput.value = '';
    // במקום לטעון הכל מחדש – נוסיף תגובה ידנית לרשימה
const newComment = await res.json();
const commentEl = document.createElement('div');
commentEl.className = 'comment mb-1 p-2 bg-light rounded';
const username = newComment[newComment.length - 1]?.author?.username || 'משתמש';
commentEl.innerHTML = `<strong>${username}</strong>: ${text}`;
commentList.appendChild(commentEl);

commentCount.textContent = newComment.length;
commentInput.value = '';

    } catch (err) {
      console.error('שגיאה בתגובה:', err);
      alert('שגיאה בשליחת תגובה');
    }
  });

  // Edit & Delete (אם המשתמש הוא המחבר)
  if (post.author && post.author._id === userId) {
    const editBtn = document.createElement('button');
    editBtn.classList.add('btn-icon');
    editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
    editBtn.addEventListener('click', () => {
      showEditForm(post, postElement);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('btn-icon');
    deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
    deleteBtn.addEventListener('click', async () => {
      const confirmDelete = confirm('האם אתה בטוח שברצונך למחוק את הפוסט?');
      if (!confirmDelete) return;
      try {
        const res = await fetch(`http://localhost:3005/api/posts/${post._id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          postElement.remove();
        } else {
          const error = await res.json();
          alert(error.error || 'שגיאה במחיקה');
        }
      } catch (err) {
        console.error('שגיאה במחיקה:', err);
      }
    });

    actionsWrapper.appendChild(editBtn);
actionsWrapper.appendChild(deleteBtn);

  }

  actionsWrapper.appendChild(likeBtn);
actionsWrapper.appendChild(likeCount);
actionsWrapper.appendChild(commentBtn);
actionsWrapper.appendChild(commentCount);

  postElement.appendChild(actionsWrapper);
    postElement.appendChild(commentSection);


  postsContainer.insertBefore(postElement, postsContainer.firstChild);

    // כפתורי עריכה ומחיקה - רק אם המשתמש הוא מחבר הפוסט
  if (post.author && post.author._id === userId) {
    // כפתור עריכה
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-sm btn-outline-secondary';
    editBtn.textContent = 'ערוך';
    editBtn.addEventListener('click', async () => {
      const newContent = prompt('ערוך את תוכן הפוסט:', post.content);
      if (newContent && newContent !== post.content) {
        try {
          const res = await fetch(`http://localhost:3005/api/posts/${post._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ content: newContent })
          });

          const updated = await res.json();
          if (res.ok) {
            post.content = updated.content;
            loadGroupPosts();
          } else {
            alert(updated.error || 'שגיאה בעריכת הפוסט');
          }
        } catch (err) {
          console.error('❌ שגיאה בעריכה:', err);
        }
      }
    });

    // כפתור מחיקה
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-sm btn-outline-danger';
    deleteBtn.textContent = 'מחק';
    deleteBtn.addEventListener('click', async () => {
      if (!confirm('האם אתה בטוח שברצונך למחוק את הפוסט?')) return;
      try {
        const res = await fetch(`http://localhost:3005/api/posts/${post._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (res.ok) {
          loadGroupPosts();
        } else {
          const result = await res.json();
          alert(result.error || 'שגיאה במחיקת הפוסט');
        }
      } catch (err) {
        console.error('❌ שגיאה במחיקה:', err);
      }
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
  }

}


  function renderPosts(posts) {
    postsContainer.innerHTML = '';
    posts.forEach(post => renderPost(post));
  }

  function showEditForm(post, postElement) {
  const oldContent = postElement.querySelector('p');
  if (!oldContent) return;

  const input = document.createElement('input');
  input.type = 'text';
  input.value = post.content;
  input.className = 'form-control mb-2';

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'שמור';
  saveBtn.className = 'btn btn-sm btn-success me-2';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'ביטול';
  cancelBtn.className = 'btn btn-sm btn-secondary';

  const editForm = document.createElement('div');
  editForm.className = 'edit-form mt-2';
  editForm.appendChild(input);
  editForm.appendChild(saveBtn);
  editForm.appendChild(cancelBtn);

  oldContent.style.display = 'none';
  postElement.appendChild(editForm);

  cancelBtn.addEventListener('click', () => {
    editForm.remove();
    oldContent.style.display = '';
  });

  saveBtn.addEventListener('click', async () => {
    const newContent = input.value.trim();
    if (!newContent || newContent === post.content) return;

    try {
      const res = await fetch(`http://localhost:3005/api/posts/${post._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content: newContent })
      });

      const updated = await res.json();
      if (res.ok) {
        oldContent.textContent = updated.content;
        oldContent.style.display = '';
        editForm.remove();
      } else {
        alert(updated.error || 'שגיאה בעדכון הפוסט');
      }
    } catch (err) {
      console.error('שגיאה בעדכון:', err);
    }
  });
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
