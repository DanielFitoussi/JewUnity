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
        if (group.location && group.location.lat && group.location.lng) {
          L.marker([group.location.lat, group.location.lng])
            .addTo(map)
            .bindPopup(`<strong>${group.name}</strong>`);
        }
      });
    })
    .catch(err => {
      console.error('שגיאה בטעינת מיקום קבוצות:', err);
    });
});
