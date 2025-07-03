document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
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
      alert('רק חברי קבוצה יכולים לגשת לעמוד זה');
      window.location.href = 'groups.html';
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
