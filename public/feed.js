document.addEventListener('DOMContentLoaded', () => {

    const postForm = document.getElementById('postForm')
    const postsContainer = document.getElementById('postsContainer');


    postForm.addEventListener('submit', (e) => {
        e.preventDefault()

        const content = document.getElementById('postContent').value;

        const postElement = document.createElement('div');
        postElement.classList.add('post');

        const textElement = document.createElement('p');
        textElement.textContent = content;
        postElement.appendChild(textElement);

        postsContainer.prepend(postElement);


        postForm.reset();

        const fileInput = document.getElementById('postImage');
const file = fileInput.files[0];

if (file) {
  const mediaURL = URL.createObjectURL(file);

  if (file.type.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = mediaURL;
    img.alt = 'Post Image';
    img.classList.add('post-media');
    postElement.appendChild(img);
  } else if (file.type.startsWith('video/')) {
    const video = document.createElement('video');
    video.src = mediaURL;
    video.controls = true;
    video.classList.add('post-media');
    postElement.appendChild(video);
  }
}



    })

})