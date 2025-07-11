document.addEventListener('DOMContentLoaded', async () => {
const token = sessionStorage.getItem('token');
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

    // ✅ הצגת פרטים בסיסיים
    groupTitle.textContent = group.name;
    groupDescription.textContent = group.description;
    groupAddress.textContent = group.address || 'כתובת לא זמינה';

    // ✅ הצגת המפה עם Leaflet
    if (group.location?.coordinates?.length === 2) {
      const [lng, lat] = group.location.coordinates;

      // יצירת המפה
      const map = L.map('map').setView([lat, lng], 12);

      // הוספת OpenStreetMap כטיילייר
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // הוספת סימן (marker) לקבוצה
      L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`<strong>${group.name}</strong><br>${group.address || ''}<br><a href="group.html?groupId=${group._id}">👀 צפה בקבוצה</a>`);
    }

    const userId = parseJwt(token).userId;
    const isMember = group.members.some(m => m._id?.toString() === userId.toString());
    const isAdmin = String(group.adminId) === String(userId);

 if (!isMember) {
  try {
    const res = await fetch('http://localhost:3005/api/groups/add-member', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ groupId, userId })
    });

    const result = await res.json();
    if (res.ok) {
      alert('המשתמש הצטרף לקבוצה בהצלחה!');
      window.location.reload(); // רענון העמוד אחרי ההצטרפות
    } else {
      alert(result.error || 'שגיאה בהצטרפות לקבוצה');
    }
  } catch (err) {
    console.error('שגיאה בהצטרפות לקבוצה:', err);
    alert('שגיאה בהצטרפות לקבוצה');
  }
  return;
}


    if (isMember) {
      postFormSection.classList.remove('hidden');
      leaveGroupBtn.classList.remove('hidden');
    }

    if (isAdmin) {
      editGroupBtn.classList.remove('hidden');
    }

 

    // ✨ עריכת קבוצה
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
          body: JSON.stringify({
            name: newName,
            description: newDescription,
            address: newAddress
          })
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

  // ✨ טעינת פוסטים
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
  
function renderPost(post) {
  const postsContainer = document.getElementById('postsContainer');
const token = sessionStorage.getItem('token');
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

  // אם יש מדיה (תמונה/וידאו), נוסיף אותה לפוסט
  if (post.mediaUrl && post.mediaType !== 'text') {
    const media = document.createElement(post.mediaType === 'image' ? 'img' : 'video');
    media.src = post.mediaUrl;
    media.className = 'post-media';
    if (post.mediaType === 'video') media.controls = true;
    postElement.appendChild(media);
  }

  const actions = document.createElement('div');
  actions.className = 'd-flex gap-3 align-items-center mt-2';

  // כפתור לייק
  const likeBtn = document.createElement('button');
  likeBtn.className = 'btn-icon';
  const likeIcon = document.createElement('i');
  likeIcon.classList.add('bi');
  likeIcon.classList.add(post.likedBy.includes(userId) ? 'bi-heart-fill' : 'bi-heart');
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

  actions.appendChild(likeBtn);
  actions.appendChild(likeCount);
  postElement.appendChild(actions);

  // הוסף את הפוסט בראש הרשימה
  postsContainer.insertBefore(postElement, postsContainer.firstChild);
}


  function renderPosts(posts) {
    postsContainer.innerHTML = '';
    posts.forEach(post => renderPost(post));
  }

  loadGroupPosts();
});

// ✨ פונקציית פענוח טוקן
function parseJwt(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch (e) {
    return {};
  }
}
