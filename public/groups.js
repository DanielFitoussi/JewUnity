document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('You must be logged in to access this page');
    window.location.href = 'login.html';
    return;
  }

  loadGroups();

  document.getElementById('createGroupForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('groupName').value.trim();
    const description = document.getElementById('groupDescription').value.trim();

    if (!name) return alert('יש למלא שם קבוצה');

    try {
      const response = await fetch('http://localhost:3005/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description })
      });

      const result = await response.json();

      if (!response.ok) {
        return alert(result.error || 'שגיאה ביצירת קבוצה');
      }

      alert('✅ הקבוצה נוצרה בהצלחה');
      document.getElementById('createGroupForm').reset();
      loadGroups();
    } catch (err) {
      console.error('שגיאה ביצירת קבוצה:', err);
      alert('שגיאה בשרת');
    }
  });

  document.getElementById('groupSearchInput').addEventListener('input', async function () {
    const query = this.value.trim();

    if (query === '') {
      loadGroups();
      return;
    }

    try {
      const response = await fetch(`http://localhost:3005/api/groups/search?query=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const groups = await response.json();
      renderGroupList(groups);
    } catch (err) {
      console.error('❌ שגיאה בחיפוש קבוצות:', err);
    }
  });

  document.getElementById('toggleGroupListBtn').addEventListener('click', () => {
    const groupList = document.getElementById('groupList');
    groupList.classList.toggle('d-none');
    document.getElementById('toggleGroupListBtn').textContent = groupList.classList.contains('d-none') ? 'הצג קבוצות' : 'הסתר קבוצות';
  });
});

function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}

async function loadGroups() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3005/api/groups', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const groups = await response.json();
    renderGroupList(groups);
  } catch (err) {
    console.error('❌ שגיאה בטעינת קבוצות:', err);
  }
}

function renderGroupList(groups) {
  const userId = parseJwt(localStorage.getItem('token')).userId;
  const listContainer = document.getElementById('groupList');
  listContainer.innerHTML = '';

  groups.forEach(group => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');

    const link = document.createElement('a');
    link.href = `group.html?groupId=${group._id}`;
    link.textContent = group.name;
    link.style.textDecoration = 'none';
    link.style.fontWeight = 'bold';

    const desc = document.createElement('span');
    desc.textContent = ` - ${group.description || 'ללא תיאור'}`;

    const text = document.createElement('span');
    text.appendChild(link);
    text.appendChild(desc);

    li.appendChild(text);

    const actions = document.createElement('div');
    if (group.owner === userId) {
      const editBtn = document.createElement('button');
      editBtn.textContent = 'ערוך';
      editBtn.classList.add('btn', 'btn-sm', 'btn-warning', 'ms-2');
      editBtn.addEventListener('click', () => showEditGroupForm(group));

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'מחק';
      deleteBtn.classList.add('btn', 'btn-sm', 'btn-danger');
      deleteBtn.addEventListener('click', () => deleteGroup(group._id));

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);
    } else {
      const isMember = group.members.some(m => m.userId === userId);
      if (!isMember) {
        const joinBtn = document.createElement('button');
        joinBtn.textContent = 'הצטרף';
        joinBtn.classList.add('btn', 'btn-sm', 'btn-outline-primary');
        joinBtn.addEventListener('click', () => joinGroup(group._id));
        actions.appendChild(joinBtn);
      }
    }

    li.appendChild(actions);
    listContainer.appendChild(li);
  });
}

async function joinGroup(groupId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3005/api/groups/add-member', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ groupId, userId: parseJwt(token).userId })
    });

    const result = await response.json();

    if (response.ok) {
      alert('✅ הצטרפת לקבוצה בהצלחה');
      loadGroups();
    } else {
      alert(result.error || 'שגיאה בהצטרפות');
    }
  } catch (err) {
    console.error('❌ שגיאה בהצטרפות לקבוצה:', err);
  }
}

function showEditGroupForm(group) {
  const name = prompt('שם חדש לקבוצה:', group.name);
  if (!name) return;

  const description = prompt('תיאור חדש:', group.description || '');
  if (description === null) return;

  updateGroup(group._id, name, description);
}

async function updateGroup(groupId, name, description) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3005/api/groups/${groupId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, description })
    });

    const result = await response.json();

    if (response.ok) {
      alert('✅ הקבוצה עודכנה בהצלחה');
      loadGroups();
    } else {
      alert(result.error || 'שגיאה בעדכון');
    }
  } catch (err) {
    console.error('❌ שגיאה בעדכון קבוצה:', err);
  }
}

async function deleteGroup(groupId) {
  if (!confirm('האם אתה בטוח שברצונך למחוק את הקבוצה?')) return;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3005/api/groups/${groupId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (response.ok) {
      alert('✅ הקבוצה נמחקה');
      loadGroups();
    } else {
      alert(result.error || 'שגיאה במחיקה');
    }
  } catch (err) {
    console.error('❌ שגיאה במחיקת קבוצה:', err);
  }
}
