// Fully functional radar with LibreWXR (RainViewer-compatible) tiles
(function () {
  const CINCINNATI = [39.1031, -84.5120];
  const API = 'https://api.librewxr.net/public/weather-maps.json';

  let map, radarLayer, frames = [], currentFrame = 0, playing = true, playTimer = null;
  let host = 'https://api.librewxr.net';

  // Initialize map
  function initMap() {
    map = L.map('radar-map', {
      center: CINCINNATI,
      zoom: 8,
      zoomControl: true,
      attributionControl: true
    });

    // Dark base map
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 18
    }).addTo(map);

    // City markers
    const cities = [
      { name: 'Cincinnati', lat: 39.1031, lon: -84.5120 },
      { name: 'Hamilton', lat: 39.3995, lon: -84.5613 },
      { name: 'Dayton', lat: 39.7589, lon: -84.1916 },
      { name: 'Florence', lat: 38.9989, lon: -84.6266 }
    ];
    cities.forEach(c => {
      L.circleMarker([c.lat, c.lon], {
        radius: 4,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.9,
        weight: 1
      }).bindTooltip(c.name, { permanent: false }).addTo(map);
    });

    window.radarMap = map;
    loadRadarFrames();
  }

  async function loadRadarFrames() {
    try {
      const res = await fetch(API);
      const data = await res.json();
      host = data.host || host;

      frames = [];
      if (data.radar && data.radar.past) {
        frames = frames.concat(data.radar.past);
      }
      if (data.radar && data.radar.nowcast) {
        frames = frames.concat(data.radar.nowcast);
      }

      if (frames.length === 0) {
        console.warn('No radar frames available');
        return;
      }

      // Start near the latest observed frame
      currentFrame = Math.max(0, (data.radar.past ? data.radar.past.length : frames.length) - 1);

      const slider = document.getElementById('timeline');
      slider.max = frames.length - 1;
      slider.value = currentFrame;

      showFrame(currentFrame);
      startPlayback();

      // Refresh metadata every 5 minutes
      setInterval(loadRadarFrames, 5 * 60 * 1000);
    } catch (err) {
      console.error('Radar load failed', err);
      document.getElementById('frame-time').textContent = 'Radar offline';
    }
  }

  function showFrame(idx) {
    if (!frames[idx]) return;
    currentFrame = idx;

    const frame = frames[idx];
    // color scheme 6 = NEXRAD-ish, smooth=1, snow=0
    const tileUrl = `${host}${frame.path}/256/{z}/{x}/{y}/6/1_0.png`;

    if (radarLayer) {
      map.removeLayer(radarLayer);
    }

    radarLayer = L.tileLayer(tileUrl, {
      opacity: 0.75,
      zIndex: 10,
      maxZoom: 12
    }).addTo(map);

    // Update UI
    const isNowcast = frame.time > Math.floor(Date.now() / 1000);
    const timeStr = window.L12.formatTime(frame.time);
    document.getElementById('frame-time').textContent = isNowcast ? `+${timeStr}` : timeStr;
    document.getElementById('frame-time').className = isNowcast ? 'live-badge' : 'live-badge';
    document.getElementById('timeline').value = idx;
  }

  function startPlayback() {
    if (playTimer) clearInterval(playTimer);
    playing = true;
    document.getElementById('play-pause').textContent = '⏸';
    playTimer = setInterval(() => {
      let next = currentFrame + 1;
      if (next >= frames.length) next = 0;
      showFrame(next);
    }, 700);
  }

  function stopPlayback() {
    playing = false;
    document.getElementById('play-pause').textContent = '▶';
    if (playTimer) clearInterval(playTimer);
  }

  // Controls
  document.getElementById('play-pause').addEventListener('click', () => {
    if (playing) stopPlayback();
    else startPlayback();
  });

  document.getElementById('timeline').addEventListener('input', (e) => {
    stopPlayback();
    showFrame(parseInt(e.target.value, 10));
  });

  // Layer switching (simplified – radar is primary)
  window.setRadarLayer = function (layer) {
    // For demo: only radar tiles are fully implemented.
    // Satellite / lightning / warnings can be extended with LibreWXR endpoints.
    if (layer === 'radar' && radarLayer) {
      radarLayer.setOpacity(0.75);
    }
  };

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMap);
  } else {
    initMap();
  }
})();
