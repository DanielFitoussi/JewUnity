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

    let allPosts = [];

    // שלב 1 - טען מידע על הקבוצה
    try {
        const res = await fetch(`${API_BASE}/${groupId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const group = await res.json();
        console.log("📛 שם הקבוצה שהגיע מהשרת:", group.name);  // הוסף את זה


        groupTitle.textContent = group.name;
        groupDescription.textContent = group.description;

        // בדיקת הרשאות
        const userId = parseJwt(token).userId;
        const isMember = group.members.some(m => m.userId === userId);
        const isAdmin = group.adminId?.toString() === userId;
        console.log("🧪 בדיקת מנהל — group.adminId:", group.adminId, "| userId:", userId, "| isAdmin:", isAdmin);



        if (isMember) {
            postFormSection.classList.remove('hidden');
        }

        if (isAdmin) {
            editGroupBtn.classList.remove('hidden');
        }

        if (isAdmin) {
    editGroupBtn.classList.remove('hidden');

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
}


    } catch (err) {
        console.error('שגיאה בטעינת הקבוצה:', err);
    }

    // שלב 2 - טען פוסטים של הקבוצה
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

            // רענן את הפיד
            await loadGroupPosts();

        } catch (err) {
            console.error('שגיאה בשליחת פוסט:', err);
            alert('רק חברי הקבוצה רשאים לפרסם');
        }
    });


    // שלב 3 - הצגת הפוסטים
    function renderPosts(posts) {
    postsContainer.innerHTML = '';
    posts.forEach(post => {
        const card = document.createElement('div');
        card.className = 'post-card';

        const fullName = post.author?.firstName && post.author?.lastName
            ? `${post.author.firstName} ${post.author.lastName}`
            : post.author?.username || 'משתמש לא ידוע';

        card.innerHTML = `
            <h4>${fullName}</h4>
            <p>${post.content}</p>
            ${post.mediaUrl ? `<img class="post-media" src="${post.mediaUrl}" />` : ''}
        `;

        postsContainer.prepend(card);
    });
}


    // שלב 4 - חיפוש
    searchInput.addEventListener('input', () => {
        const keyword = searchInput.value.toLowerCase();
        const filtered = allPosts.filter(post =>
            post.content.toLowerCase().includes(keyword)
        );
        renderPosts(filtered);
    });

    const backToFeedBtn = document.getElementById('backToFeed');
    backToFeedBtn.addEventListener('click', () => {
        window.location.href = 'feed.html'; // או index.html אם זה הדף הראשי שלך
    });


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
