document.addEventListener('DOMContentLoaded', () => {
  const map = L.map('map').setView([32.0853, 34.7818], 10); // תל אביב

  // טעינת האריחים
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // שליפת מיקומי קבוצות מהשרת
  fetch('/api/groups/locations')
  .then(res => res.json())
  .then(groups => {
    groups.forEach(group => {
      // אם ה־location קיים ויש לו את coordinates
      if (group.location && group.location.coordinates) {
        const lat = group.location.coordinates[1]; // קו רוחב
        const lng = group.location.coordinates[0]; // קו אורך

        // הצגת הסמן במפה
        L.marker([lat, lng])
          .addTo(map)
          .bindPopup(`<strong>${group.name}</strong>`);
      }
    });
  })
  .catch(err => {
    console.error('שגיאה בטעינת מיקום קבוצות:', err);
  });

  document.getElementById('backToFeed')?.addEventListener('click', () => {
  window.location.href = 'feed.html';
});

});
