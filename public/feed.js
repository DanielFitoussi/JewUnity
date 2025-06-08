document.addEventListener('DOMContentLoaded', () => {
  const postForm = document.getElementById('postForm');
  const postsContainer = document.getElementById('postsContainer');

  postForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const content = document.getElementById('postContent').value;

    const postElement = document.createElement('div');
    postElement.classList.add('card', 'mb-3');

    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');

    // === כותרת עם שם משתמש + תאריך ===
    const postHeader = document.createElement('div');
    postHeader.classList.add('d-flex', 'justify-content-between', 'align-items-center', 'mb-2');

    const userInfo = document.createElement('div');
    userInfo.classList.add('d-flex', 'align-items-center', 'gap-2');

    const avatarIcon = document.createElement('i');
    avatarIcon.classList.add('bi', 'bi-person-circle', 'fs-4', 'text-secondary');

    const username = document.createElement('strong');
    username.textContent = 'User123';

    userInfo.appendChild(avatarIcon);
    userInfo.appendChild(username);

    const date = document.createElement('small');
    date.classList.add('text-muted');
    date.textContent = new Date().toLocaleDateString();

    postHeader.appendChild(userInfo);
    postHeader.appendChild(date);
    cardBody.appendChild(postHeader);

    // === תוכן הפוסט (פסקה רגילה) ===
    const textElement = document.createElement('p');
    textElement.classList.add('card-text');
    textElement.textContent = content;
    cardBody.appendChild(textElement);

    // === שורת כפתורים: לייק, תגובה, מחיקה, עריכה ===
    const actionsWrapper = document.createElement('div');
    actionsWrapper.classList.add('d-flex', 'align-items-center', 'gap-3', 'mt-2');

    // לייק
    const likeBtn = document.createElement('button');
    likeBtn.classList.add('btn-icon');
    likeBtn.innerHTML = '<i class="bi bi-heart"></i>';
    let liked = false;
    let likeCount = 0;
    const likeCountSpan = document.createElement('span');
    likeCountSpan.textContent = likeCount;

    likeBtn.addEventListener('click', () => {
      const icon = likeBtn.querySelector('i');
      liked = !liked;
      likeCount += liked ? 1 : -1;
      icon.className = liked ? 'bi bi-heart-fill text-danger' : 'bi bi-heart';
      likeCountSpan.textContent = likeCount;
    });

    // תגובה
    const commentBtn = document.createElement('button');
    commentBtn.classList.add('btn-icon');
    commentBtn.innerHTML = '<i class="bi bi-chat"></i>';
    let commentCount = 0;
    const commentCountSpan = document.createElement('span');
    commentCountSpan.textContent = commentCount;

    // מחיקה
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('btn-icon');
    deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
    deleteBtn.addEventListener('click', () => {
      if (confirm('האם אתה בטוח שברצונך למחוק את הפוסט?')) {
        postElement.remove();
      }
    });

    // עריכה
    const editBtn = document.createElement('button');
    editBtn.classList.add('btn-icon');
    editBtn.innerHTML = '<i class="bi bi-pencil"></i>';

    editBtn.addEventListener('click', () => {
      const originalText = textElement.textContent;

      const editInput = document.createElement('textarea');
      editInput.classList.add('form-control', 'mb-2');
      editInput.value = originalText;

      const saveBtn = document.createElement('button');
      saveBtn.textContent = 'שמור';
      saveBtn.classList.add('btn', 'btn-sm', 'btn-primary', 'me-2');

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'ביטול';
      cancelBtn.classList.add('btn', 'btn-sm', 'btn-secondary');

      cardBody.replaceChild(editInput, textElement);
      actionsWrapper.appendChild(saveBtn);
      actionsWrapper.appendChild(cancelBtn);

      saveBtn.addEventListener('click', () => {
        const newText = editInput.value.trim();
        textElement.textContent = newText || originalText;
        cardBody.replaceChild(textElement, editInput);
        saveBtn.remove();
        cancelBtn.remove();
      });

      cancelBtn.addEventListener('click', () => {
        cardBody.replaceChild(textElement, editInput);
        saveBtn.remove();
        cancelBtn.remove();
      });
    });

    // הוספת כפתורים לשורה
    actionsWrapper.appendChild(likeBtn);
    actionsWrapper.appendChild(likeCountSpan);
    actionsWrapper.appendChild(commentBtn);
    actionsWrapper.appendChild(commentCountSpan);
    actionsWrapper.appendChild(editBtn);
    actionsWrapper.appendChild(deleteBtn);
    cardBody.appendChild(actionsWrapper);

    // === תגובות ===
    const commentSection = document.createElement('div');
    commentSection.style.display = 'none';
    commentSection.classList.add('mt-2');

    const commentInput = document.createElement('input');
    commentInput.type = 'text';
    commentInput.placeholder = 'כתוב תגובה...';
    commentInput.classList.add('form-control', 'form-control-sm', 'mb-2');

    const commentList = document.createElement('div');
    commentList.classList.add('comment-list');

    commentSection.appendChild(commentInput);
    commentSection.appendChild(commentList);
    cardBody.appendChild(commentSection);

    commentBtn.addEventListener('click', () => {
      commentSection.style.display = commentSection.style.display === 'none' ? 'block' : 'none';
    });

    commentInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const text = commentInput.value.trim();
        if (text !== '') {
          const comment = document.createElement('div');
          comment.classList.add('comment');
          comment.textContent = text;
          commentList.appendChild(comment);
          commentInput.value = '';
          commentCount++;
          commentCountSpan.textContent = commentCount;
        }
      }
    });

    // === מדיה (אם קיימת) ===
    const fileInput = document.getElementById('postImage');
    const file = fileInput.files[0];

    if (file) {
      const mediaURL = URL.createObjectURL(file);

      if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = mediaURL;
        img.alt = 'Post Image';
        img.classList.add('img-fluid', 'mt-2');
        cardBody.appendChild(img);
      } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = mediaURL;
        video.controls = true;
        video.classList.add('w-100', 'mt-2');
        cardBody.appendChild(video);
      }
    }

    postElement.appendChild(cardBody);
    postsContainer.prepend(postElement);
    postForm.reset();
  });
});
