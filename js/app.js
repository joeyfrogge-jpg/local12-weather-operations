// Local 12 Weather Operations - Main App
const panels = ['radar', 'models', 'cameras', 'graphics', 'alerts', 'engineering'];

// Tab navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.panel;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`panel-${target}`).classList.add('active');

    // Trigger map resize when returning to radar
    if (target === 'radar' && window.radarMap) {
      setTimeout(() => window.radarMap.invalidateSize(), 50);
    }
  });
});

// Layer tabs on radar
document.querySelectorAll('.layer-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.layer-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    if (window.setRadarLayer) window.setRadarLayer(tab.dataset.layer);
  });
});

// Model tabs
document.querySelectorAll('.model-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.model-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    if (window.selectModel) window.selectModel(tab.dataset.model);
  });
});

// Utility: format time
function formatTime(ts) {
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatExpires(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return 'Expires ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// Shared state
window.L12 = {
  location: { lat: 39.1031, lon: -84.5120, name: 'Cincinnati' },
  formatTime,
  formatExpires
};

console.log('Local 12 Weather Operations initialized');
