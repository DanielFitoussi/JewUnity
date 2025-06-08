document.addEventListener('DOMContentLoaded', () => {

  const postForm = document.getElementById('postForm');
  const postsContainer = document.getElementById('postsContainer');

  postForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const content = document.getElementById('postContent').value;

    // יצירת כרטיס Bootstrap
    const postElement = document.createElement('div');
    postElement.classList.add('card', 'mb-3');

    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');

    const textElement = document.createElement('p');
    textElement.classList.add('card-text');
    textElement.textContent = content;

    cardBody.appendChild(textElement);

    // הוספת מדיה (אם קיימת)
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
