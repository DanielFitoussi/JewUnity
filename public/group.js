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

  const actions = document.createElement('div');
  actions.className = 'd-flex gap-3 align-items-center mt-2';

  const likeBtn = document.createElement('button');
  likeBtn.className = 'btn-icon';

  const likeIcon = document.createElement('i');
  likeIcon.classList.add('bi');
  if (post.likedBy.includes(userId)) {
    likeIcon.classList.add('bi-heart-fill', 'liked');
  } else {
    likeIcon.classList.add('bi-heart');
  }

  likeBtn.appendChild(likeIcon);

  const likeCount = document.createElement('span');
  likeCount.textContent = post.likedBy.length;

  likeBtn.addEventListener('click', async () => {
    try {
      const res = await fetch(`http://localhost:3005/api/posts/${post._id}/like`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      likeCount.textContent = data.likes;
      likeIcon.className = data.likedBy.includes(userId) ? 'bi bi-heart-fill liked' : 'bi bi-heart';
    } catch (err) {
      console.error('שגיאה בלייק:', err);
    }
  });

  actions.appendChild(likeBtn);
  actions.appendChild(likeCount);
  postElement.appendChild(actions);
  postsContainer.insertBefore(postElement, postsContainer.firstChild);
}


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
