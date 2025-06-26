let token = null;

document.addEventListener('DOMContentLoaded', () => {
  token = localStorage.getItem('token');
  if (!token) {
    alert('You must be logged in to access the feed');
    window.location.href = 'login.html';
    return;
  }

    loadGroups();

  renderPostsPerGroupChart(token);

  renderMediaTypeChart(token);


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
      loadGroups(); // רענון הרשימה

    } catch (err) {
      console.error('שגיאה ביצירת קבוצה:', err);
      alert('שגיאה בשרת');
    }
  });




  postForm.addEventListener('submit', async (e) => {
    e.preventDefault();


    const content = document.getElementById('postContent').value;
    const fileInput = document.getElementById('postImage');
    const file = fileInput.files[0];

    const formData = new FormData();
    formData.append('content', content);
    if (file) {
      formData.append('media', file);
    }

    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const savedPost = await response.json();
      renderPost(savedPost);
      postForm.reset();
    } catch (err) {
      console.error('Failed to create post:', err);
    }
  });

  document.querySelectorAll('.filter-option').forEach(option => {
    option.addEventListener('click', (e) => {
      e.preventDefault();
      const filter = option.getAttribute('data-filter');
      filterPosts(filter);
    });

  });

  const searchInput = document.getElementById('searchInput');

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    if (query.length === 0) {
      loadPosts(); // מציג את כל הפוסטים מחדש
    } else {
      searchPosts(query);
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

function renderPost(post) {
  const postsContainer = document.getElementById('postsContainer');
  const token = localStorage.getItem('token');
  const userId = parseJwt(token).userId;

  console.log("📩 מציג פוסט:", post);

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
  username.textContent = post?.author?.username || 'User';
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

  if (post.mediaUrl && post.mediaType !== 'text') {
    const mediaElement = document.createElement(post.mediaType === 'image' ? 'img' : 'video');
    mediaElement.src = post.mediaUrl;
    mediaElement.classList.add('post-media');
    if (post.mediaType === 'video') mediaElement.controls = true;
    cardBody.appendChild(mediaElement);
  }

  const actionsWrapper = document.createElement('div');
  actionsWrapper.classList.add('d-flex', 'align-items-center', 'gap-3', 'mt-2');

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
      const response = await fetch(`http://localhost:3005/api/posts/${post._id}/like`, {
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
  if (post.author?._id === userId) {
    const editBtn = document.createElement('button');
    editBtn.textContent = 'ערוך';
    editBtn.classList.add('btn', 'btn-sm', 'btn-outline-secondary');

    editBtn.addEventListener('click', () => {
      showEditForm(post, postElement);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'מחק';
    deleteBtn.classList.add('btn', 'btn-sm', 'btn-outline-danger');

    deleteBtn.addEventListener('click', async () => {
      const confirmed = confirm('האם אתה בטוח שברצונך למחוק את הפוסט?');
      if (!confirmed) return;

      try {
        const response = await fetch(`http://localhost:3005/api/posts/${post._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          postElement.remove();
          console.log('פוסט נמחק בהצלחה');
        } else {
          const err = await response.json();
          console.error('שגיאה במחיקה:', err);
        }
      } catch (err) {
        console.error('שגיאה במחיקת הפוסט:', err);
      }
    });

    actionsWrapper.appendChild(editBtn);
    actionsWrapper.appendChild(deleteBtn);
  }


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
          const response = await fetch(`http://localhost:3005/api/posts/${post._id}/comments`, {
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
  postElement.setAttribute('data-type', post.mediaType || 'text');
  postsContainer.prepend(postElement);
}


function showEditForm(post, postElement) {
  if (postElement.querySelector('.edit-form')) return;

  const oldTextElement = postElement.querySelector('.card-text');
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
    console.log('🟢 נלחץ שמור:', newContent);

    if (newContent && newContent !== post.content) {
      await updatePostContent(post._id, newContent, postElement);
    } else {
      console.log('⚠️ אין שינוי או טקסט ריק');
    }
  });

  cancelBtn.addEventListener('click', () => {
    formWrapper.remove();
    oldTextElement.style.display = '';
  });
}

async function updatePostContent(postId, newContent, postElement) {
  try {
    console.log('🚀 שולח עדכון לשרת:', postId, newContent);

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
      console.log('✅ הפוסט עודכן בהצלחה:', updatedPost);

      const textElement = postElement.querySelector('.card-text');
      if (textElement) {
        textElement.textContent = updatedPost.content;
        textElement.style.display = '';
      }

      const editForm = postElement.querySelector('.edit-form');
      if (editForm) {
        editForm.remove();
      }
    } else {
      const error = await response.json();
      console.error('❌ שגיאה מהשרת:', error);
    }
  } catch (err) {
    console.error('🛑 שגיאה בבקשת עדכון:', err);
  }
}

const toggleGroupListBtn = document.getElementById('toggleGroupListBtn');
const groupList = document.getElementById('groupList');

toggleGroupListBtn.addEventListener('click', () => {
  groupList.classList.toggle('d-none');
  toggleGroupListBtn.textContent = groupList.classList.contains('d-none') ? 'הצג קבוצות' : 'הסתר קבוצות';
});







async function renderPostsPerGroupChart(token) {
  try {
    const response = await fetch('http://localhost:3005/api/posts/stats-per-group', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();

    console.log("📊 נתוני הגרף:", data);


    const svg = d3.select("#postsPerGroupChart");
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    svg.selectAll("*").remove(); // ניקוי קודם

    const margin = { top: 20, right: 30, bottom: 50, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const x = d3.scaleBand()
      .domain(data.map(d => d.groupName))
      .range([0, chartWidth])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.postsCount)])
      .nice()
      .range([chartHeight, 0]);

    const chart = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    chart.append("g").call(d3.axisLeft(y));

    chart.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-30)")
      .style("text-anchor", "end");

    chart.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", d => x(d.groupName))
      .attr("y", d => y(d.postsCount))
      .attr("width", x.bandwidth())
      .attr("height", d => chartHeight - y(d.postsCount))
      .attr("fill", (d, i) => d3.schemeCategory10[i % 10]);

    chart.selectAll("text.labels")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "chart-label")
      .attr("x", d => x(d.groupName) + x.bandwidth() / 2)
      .attr("y", d => y(d.postsCount) - 5)
      .text(d => d.postsCount);

  } catch (err) {
    console.error("Failed to load chart:", err);
  }
}

async function renderMediaTypeChart(token) {
  try {
    const response = await fetch('http://localhost:3005/api/posts/stats-media-type', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    const svg = d3.select("#postMediaTypeChart")
      .attr("width", 600)
      .attr("height", 400);

    const width = +svg.attr("width");
    const height = +svg.attr("height");

    svg.selectAll("*").remove(); // ניקוי קודם

    const radius = Math.min(width, height) / 2;
    const chart = svg.append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.mediaType))
      .range(d3.schemeSet2);

    const pie = d3.pie().value(d => d.count);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    chart.selectAll("path")
      .data(pie(data))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("class", d => `pie-slice ${d.data.mediaType}`);

    chart.selectAll("text")
      .data(pie(data))
      .enter()
      .append("text")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .attr("class", "pie-label")
      .text(d => `${d.data.mediaType}: ${d.data.count}`);

  } catch (err) {
    console.error("Failed to load media type chart:", err);
  }
}

function filterPosts(type) {
  const posts = document.querySelectorAll('#postsContainer .card');

  posts.forEach(post => {
    const mediaType = post.getAttribute('data-type') || 'text';

    if (type === 'all' || mediaType === type) {
      post.style.display = '';
    } else {
      post.style.display = 'none';
    }
  });
}

async function searchPosts(query) {
  try {
    const response = await fetch(`http://localhost:3005/api/posts/search?query=${encodeURIComponent(query)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const posts = await response.json();
    const postsContainer = document.getElementById('postsContainer');
    postsContainer.innerHTML = '';

    console.log('🔍 תוצאות חיפוש:', posts);

    posts.reverse().forEach(post => {
      renderPost(post);
    });

  } catch (err) {
    console.error('Failed to search posts:', err);
  }
}

async function loadGroups() {
  try {
    const response = await fetch('http://localhost:3005/api/groups', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const groups = await response.json();
    const userId = parseJwt(token).userId;

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

  // אם המשתמש הוא הבעלים
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
    // אם המשתמש לא הבעלים ולא חבר בקבוצה → מציע להצטרף
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

  } catch (err) {
    console.error('❌ שגיאה בטעינת קבוצות:', err);
  }
}


document.getElementById('groupSearchInput').addEventListener('input', async function () {
  const query = this.value.trim();

  if (query === '') {
    loadGroups(); // טען את כל הקבוצות מחדש אם אין חיפוש
    return;
  }

  try {
    const response = await fetch(`http://localhost:3005/api/groups/search?query=${encodeURIComponent(query)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const groups = await response.json();
    const listContainer = document.getElementById('groupList');
    listContainer.innerHTML = '';

    const userId = parseJwt(token).userId;

    groups.forEach(group => {
      const li = document.createElement('li');
      li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');

      const link = document.createElement('a');
link.href = `group.html?groupId=${group._id}`;
link.textContent = group.name;
link.style.textDecoration = 'none';
link.style.fontWeight = 'bold';
link.style.color = 'inherit';

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

  } catch (err) {
    console.error('❌ שגיאה בחיפוש קבוצות:', err);
  }
});


async function deleteGroup(groupId) {
  if (!confirm('האם אתה בטוח שברצונך למחוק את הקבוצה?')) return;

  try {
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

function showEditGroupForm(group) {
  const name = prompt('שם חדש לקבוצה:', group.name);
  if (!name) return;

  const description = prompt('תיאור חדש:', group.description || '');
  if (description === null) return;

  updateGroup(group._id, name, description);
}

async function updateGroup(groupId, name, description) {
  try {
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

async function joinGroup(groupId) {
  try {
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










