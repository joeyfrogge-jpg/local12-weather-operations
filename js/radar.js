// Fully functional radar – NO API KEY REQUIRED
// Primary: LibreWXR public instance (best free option in 2026)
// Fallback: RainViewer free tier
(function () {
  const CINCINNATI = [39.1031, -84.5120];
  const SOURCES = [
    {
      name: 'LibreWXR',
      meta: 'https://api.librewxr.net/public/weather-maps.json',
      // color 6 = NEXRAD-style reflectivity that closely matches the mockup
      tile: (host, path) => `${host}${path}/256/{z}/{x}/{y}/6/1_0.png`
    },
    {
      name: 'RainViewer',
      meta: 'https://api.rainviewer.com/public/weather-maps.json',
      tile: (host, path) => `${host}${path}/256/{z}/{x}/{y}/2/1_1.png`
    }
  ];

  let map, radarLayer, frames = [], currentFrame = 0, playing = true, playTimer = null;
  let host = '', activeSource = null;

  function initMap() {
    map = L.map('radar-map', {
      center: CINCINNATI,
      zoom: 8,
      zoomControl: false,
      attributionControl: true
    });

    // Terrain-style base closer to the mockup
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OSM &copy; CARTO',
      maxZoom: 18
    }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      opacity: 0.65
    }).addTo(map);

    // City labels matching mockup
    const cities = [
      { name: 'Hamilton', lat: 39.3995, lon: -84.5613 },
      { name: 'Dayton', lat: 39.7589, lon: -84.1916 },
      { name: 'Cincinnati', lat: 39.1031, lon: -84.5120 },
      { name: 'Florence', lat: 38.9989, lon: -84.6266 }
    ];
    cities.forEach(c => {
      L.marker([c.lat, c.lon], {
        icon: L.divIcon({
          className: 'city-label',
          html: `<span>${c.name}</span>`,
          iconSize: [90, 22],
          iconAnchor: [45, 11]
        })
      }).addTo(map);
    });

    // Red warning polygon like the mockup
    L.polygon([
      [39.25, -84.70], [39.28, -84.35], [39.05, -84.25],
      [38.95, -84.45], [39.00, -84.75]
    ], {
      color: '#ef4444', weight: 2.5, fillColor: '#ef4444',
      fillOpacity: 0.18, dashArray: '5 4'
    }).addTo(map);

    window.radarMap = map;
    tryLoadSources();
  }

  async function tryLoadSources() {
    for (const src of SOURCES) {
      try {
        const res = await fetch(src.meta, { cache: 'no-store' });
        if (!res.ok) continue;
        const data = await res.json();
        if (!data.radar?.past?.length) continue;

        activeSource = src;
        host = data.host || (src.name === 'LibreWXR'
          ? 'https://api.librewxr.net'
          : 'https://tilecache.rainviewer.com');

        frames = [...data.radar.past];
        if (data.radar.nowcast?.length) frames = frames.concat(data.radar.nowcast);

        currentFrame = Math.max(0, data.radar.past.length - 1);
        const slider = document.getElementById('timeline');
        if (slider) {
          slider.max = frames.length - 1;
          slider.value = currentFrame;
        }

        showFrame(currentFrame);
        startPlayback();
        console.log(`Radar online via ${src.name} (${frames.length} frames)`);
        setInterval(tryLoadSources, 4 * 60 * 1000);
        return;
      } catch (e) {
        console.warn(src.name + ' failed', e);
      }
    }
    const el = document.getElementById('frame-time');
    if (el) el.textContent = 'Radar offline';
  }

  function showFrame(idx) {
    if (!frames[idx] || !activeSource) return;
    currentFrame = idx;
    const frame = frames[idx];
    const tileUrl = activeSource.tile(host, frame.path);

    if (radarLayer) map.removeLayer(radarLayer);
    radarLayer = L.tileLayer(tileUrl, {
      opacity: 0.75, zIndex: 200, maxZoom: 12
    }).addTo(map);

    const now = Math.floor(Date.now() / 1000);
    const isLive = ! (frame.time > now) && Math.abs(now - frame.time) < 700;
    const label = window.L12.formatTime(frame.time);
    const el = document.getElementById('frame-time');
    if (el) {
      el.textContent = isLive ? 'LIVE  ' + label : (frame.time > now ? '+' + label : label);
      el.classList.toggle('is-live', isLive);
    }
    const slider = document.getElementById('timeline');
    if (slider) slider.value = idx;
  }

  function startPlayback() {
    if (playTimer) clearInterval(playTimer);
    playing = true;
    const btn = document.getElementById('play-pause');
    if (btn) btn.textContent = '⏸';
    playTimer = setInterval(() => {
      showFrame((currentFrame + 1) % frames.length);
    }, 650);
  }

  function stopPlayback() {
    playing = false;
    const btn = document.getElementById('play-pause');
    if (btn) btn.textContent = '▶';
    if (playTimer) clearInterval(playTimer);
  }

  document.getElementById('play-pause')?.addEventListener('click', () => {
    playing ? stopPlayback() : startPlayback();
  });
  document.getElementById('timeline')?.addEventListener('input', e => {
    stopPlayback();
    showFrame(+e.target.value);
  });

  window.setRadarLayer = function (layer) {
    if (radarLayer) radarLayer.setOpacity(layer === 'radar' ? 0.75 : 0.3);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMap);
  } else {
    initMap();
  }
})();
