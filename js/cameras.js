// Live Camera Matrix
(function () {
  // Public / demo camera feeds (static images that can be refreshed).
  // In production these would be real OHGO / KYTC / EarthCam endpoints.
  const cameras = [
    { id: 'downtown', name: 'Downtown Cincinnati', img: 'https://picsum.photos/seed/cincy1/400/225', lat: 39.10, lon: -84.51 },
    { id: 'i71', name: 'I-71 at Norwood', img: 'https://picsum.photos/seed/cincy2/400/225', lat: 39.16, lon: -84.45 },
    { id: 'airport', name: 'Airport', img: 'https://picsum.photos/seed/cincy3/400/225', lat: 39.05, lon: -84.66 },
    { id: 'riverside', name: 'Riverside', img: 'https://picsum.photos/seed/cincy4/400/225', lat: 39.09, lon: -84.50 },
    { id: 'mthealthy', name: 'Mt. Healthy', img: 'https://picsum.photos/seed/cincy5/400/225', lat: 39.23, lon: -84.54 },
    { id: 'eastgate', name: 'Eastgate', img: 'https://picsum.photos/seed/cincy6/400/225', lat: 39.10, lon: -84.27 }
  ];

  // Simple PGM routing state
  const routing = {
    downtown: 1,
    airport: 2,
    riverside: 3,
    i71: 4
  };

  function renderCameras() {
    const grid = document.getElementById('camera-grid');
    grid.innerHTML = cameras.map(c => `
      <div class="cam-card" data-id="${c.id}">
        <img src="${c.img}?t=${Date.now()}" alt="${c.name}" loading="lazy"
             onerror="this.src='https://via.placeholder.com/400x225/1a2332/94a3b8?text=${encodeURIComponent(c.name)}'" />
        <span class="live-tag">LIVE</span>
        <div class="cam-name">${c.name}</div>
      </div>
    `).join('');

    // Refresh images every 30s to simulate live
    setTimeout(renderCameras, 30000);
  }

  function renderRouting() {
    const tbody = document.querySelector('#routing-table tbody');
    const rows = ['downtown', 'airport', 'riverside', 'i71'].map(id => {
      const cam = cameras.find(c => c.id === id);
      const pgm = routing[id] || 0;
      return `
        <tr>
          <td>${cam ? cam.name.split(' ')[0] : id}</td>
          <td><span class="dot ${pgm === 1 ? 'on' : ''}" data-cam="${id}" data-pgm="1"></span></td>
          <td><span class="dot ${pgm === 2 ? 'on' : ''}" data-cam="${id}" data-pgm="2"></span></td>
          <td><span class="dot ${pgm === 3 ? 'on' : ''}" data-cam="${id}" data-pgm="3"></span></td>
          <td><span class="dot ${pgm === 4 ? 'on' : ''}" data-cam="${id}" data-pgm="4"></span></td>
          <td style="color:var(--green);font-weight:700">ON AIR</td>
        </tr>
      `;
    }).join('');
    tbody.innerHTML = rows;

    // Click to reassign PGM
    tbody.querySelectorAll('.dot').forEach(dot => {
      dot.style.cursor = 'pointer';
      dot.addEventListener('click', () => {
        const cam = dot.dataset.cam;
        const pgm = parseInt(dot.dataset.pgm, 10);
        routing[cam] = pgm;
        renderRouting();
      });
    });
  }

  // Camera control buttons
  document.querySelectorAll('.cam-ctrl').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cam-ctrl').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  renderCameras();
  renderRouting();
})();
