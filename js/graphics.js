// Graphics & Rundown – fully interactive
(function () {
  let segments = [
    { id: 1, name: 'Weather Intro', duration: '0:45', status: 'complete' },
    { id: 2, name: 'Current Conditions', duration: '2:30', status: 'complete' },
    { id: 3, name: 'Severe Storms', duration: '3:00', status: 'onair' },
    { id: 4, name: '7 Day Forecast', duration: '2:00', status: 'next' },
    { id: 5, name: 'Closing', duration: '0:30', status: 'pending' }
  ];

  function renderRundown() {
    const tbody = document.querySelector('#rundown-table tbody');
    tbody.innerHTML = segments.map((s, i) => {
      const statusClass = {
        complete: 'status-complete',
        onair: 'status-onair',
        next: 'status-next',
        pending: 'status-pending'
      }[s.status] || '';
      const statusLabel = {
        complete: '✓ Complete',
        onair: '▶ On Air',
        next: 'Next',
        pending: 'Pending'
      }[s.status] || s.status;

      return `
        <tr data-id="${s.id}" style="${s.status === 'onair' ? 'background:rgba(6,182,212,0.1)' : ''}">
          <td>${i + 1}</td>
          <td>${s.name}</td>
          <td>${s.duration}</td>
          <td class="${statusClass}">${statusLabel}</td>
        </tr>
      `;
    }).join('');

    // Click a segment to advance it to On Air
    tbody.querySelectorAll('tr').forEach(tr => {
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', () => {
        const id = parseInt(tr.dataset.id, 10);
        segments = segments.map(s => {
          if (s.status === 'onair') return { ...s, status: 'complete' };
          if (s.id === id) return { ...s, status: 'onair' };
          return s;
        });
        // Mark the next pending as next
        const onAirIdx = segments.findIndex(s => s.status === 'onair');
        if (onAirIdx >= 0 && onAirIdx + 1 < segments.length) {
          segments[onAirIdx + 1].status = 'next';
        }
        renderRundown();
      });
    });
  }

  // Add segment
  document.getElementById('add-segment').addEventListener('click', () => {
    const name = prompt('Segment name:', 'New Segment');
    if (!name) return;
    segments.push({
      id: Date.now(),
      name,
      duration: '1:00',
      status: 'pending'
    });
    renderRundown();
  });

  // Lower third styles
  document.querySelectorAll('.lt-style').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lt-style').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Preview buttons
  document.querySelectorAll('.preview-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.style.background = 'var(--accent)';
      setTimeout(() => btn.style.background = '', 300);
    });
  });

  renderRundown();
})();
