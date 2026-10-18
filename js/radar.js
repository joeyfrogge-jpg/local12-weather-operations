// Local 12 Radar – interactive animated radar + satellite + lightning + warnings
// No API keys required
(function () {
  const CENTER = [39.1031, -84.5120];
  let map, baseLayer, weatherLayer = null, lightningLayer = null, warningLayer = null;
  let frames = [];          // {time, path, type: 'radar'|'satellite'}
  let currentFrame = 0;
  let playing = true;
  let playTimer = null;
  let host = '';
  let activeMode = 'radar'; // radar | satellite | lightning | warnings
  let metaData = null;

  function initMap() {
    map = L.map('radar-map', {
      center: CENTER,
      zoom: 8,
      zoomControl: true,
      attributionControl: true
    });

    baseLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18
    }).addTo(map);

    // City labels
    [
      { name: 'Hamilton', lat: 39.3995, lon: -84.5613 },
      { name: 'Dayton', lat: 39.7589, lon: -84.1916 },
      { name: 'Cincinnati', lat: 39.1031, lon: -84.5120 },
      { name: 'Florence', lat: 38.9989, lon: -84.6266 }
    ].forEach(function (c) {
      L.marker([c.lat, c.lon], {
        icon: L.divIcon({
          className: 'city-label',
          html: '<span>' + c.name + '</span>',
          iconSize: [90, 22],
          iconAnchor: [45, 11]
        })
      }).addTo(map);
    });

    warningLayer = L.layerGroup().addTo(map);
    lightningLayer = L.layerGroup();

    window.radarMap = map;
    loadWeatherData();
    loadNwsWarnings();
  }

  // ---------- Data loading ----------
  async function loadWeatherData() {
    // Try LibreWXR first, then RainViewer
    const sources = [
      { name: 'LibreWXR', url: 'https://api.librewxr.net/public/weather-maps.json' },
      { name: 'RainViewer', url: 'https://api.rainviewer.com/public/weather-maps.json' }
    ];

    for (var i = 0; i < sources.length; i++) {
      try {
        var res = await fetch(sources[i].url, { cache: 'no-store' });
        if (!res.ok) continue;
        var data = await res.json();
        if (!data.radar || !data.radar.past || !data.radar.past.length) continue;

        metaData = data;
        host = data.host || (sources[i].name === 'LibreWXR'
          ? 'https://api.librewxr.net'
          : 'https://tilecache.rainviewer.com');

        buildFrames('radar');
        console.log('Weather source:', sources[i].name, '| frames:', frames.length);

        showFrame(currentFrame);
        startPlayback();

        // Refresh every 5 min
        setTimeout(loadWeatherData, 5 * 60 * 1000);
        return;
      } catch (err) {
        console.warn(sources[i].name + ' failed', err);
      }
    }
    setStatus('Radar offline');
  }

  function buildFrames(mode) {
    frames = [];
    if (!metaData) return;

    if (mode === 'radar' || mode === 'warnings') {
      var past = metaData.radar.past || [];
      var nowcast = metaData.radar.nowcast || [];
      past.forEach(function (f) { frames.push({ time: f.time, path: f.path, kind: 'radar' }); });
      nowcast.forEach(function (f) { frames.push({ time: f.time, path: f.path, kind: 'radar' }); });
      currentFrame = Math.max(0, past.length - 1);
    } else if (mode === 'satellite') {
      // LibreWXR satellite or fall back to radar frames
      var sat = (metaData.satellite && metaData.satellite.infrared) || [];
      if (sat.length) {
        sat.forEach(function (f) { frames.push({ time: f.time, path: f.path, kind: 'satellite' }); });
        currentFrame = frames.length - 1;
      } else {
        // No satellite – reuse radar frames so UI still animates
        buildFrames('radar');
        return;
      }
    }

    var slider = document.getElementById('timeline');
    if (slider) {
      slider.max = Math.max(0, frames.length - 1);
      slider.value = currentFrame;
    }
  }

  // ---------- Frame display ----------
  function showFrame(idx) {
    if (!frames.length || idx < 0 || idx >= frames.length) return;
    currentFrame = idx;
    var frame = frames[idx];

    // Build tile URL
    var tileUrl;
    if (frame.kind === 'satellite') {
      tileUrl = host + frame.path + '/256/{z}/{x}/{y}/0/0_0.png';
    } else {
      // color scheme: LibreWXR 6 = NEXRAD-ish, RainViewer 2 = classic
      var color = host.indexOf('librewxr') !== -1 ? '6' : '2';
      tileUrl = host + frame.path + '/256/{z}/{x}/{y}/' + color + '/1_1.png';
    }

    if (weatherLayer) {
      map.removeLayer(weatherLayer);
    }

    weatherLayer = L.tileLayer(tileUrl, {
      opacity: activeMode === 'radar' || activeMode === 'satellite' ? 0.78 : 0.35,
      maxZoom: 12,
      zIndex: 300,
      errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    });

    if (activeMode === 'radar' || activeMode === 'satellite' || activeMode === 'warnings') {
      weatherLayer.addTo(map);
    }

    // Time label
    var now = Math.floor(Date.now() / 1000);
    var isLive = frame.time <= now && (now - frame.time) < 900;
    var label = window.L12 ? window.L12.formatTime(frame.time) : new Date(frame.time * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    var el = document.getElementById('frame-time');
    if (el) {
      el.textContent = isLive ? 'LIVE ' + label : (frame.time > now ? '+' + label : label);
      el.classList.toggle('is-live', isLive);
    }
    var slider = document.getElementById('timeline');
    if (slider) slider.value = idx;
  }

  function setStatus(msg) {
    var el = document.getElementById('frame-time');
    if (el) el.textContent = msg;
  }

  // ---------- Playback ----------
  function startPlayback() {
    if (playTimer) clearInterval(playTimer);
    if (frames.length < 2) return;
    playing = true;
    var btn = document.getElementById('play-pause');
    if (btn) btn.textContent = 'II';
    playTimer = setInterval(function () {
      var next = (currentFrame + 1) % frames.length;
      showFrame(next);
    }, 600);
  }

  function stopPlayback() {
    playing = false;
    var btn = document.getElementById('play-pause');
    if (btn) btn.textContent = '>';
    if (playTimer) {
      clearInterval(playTimer);
      playTimer = null;
    }
  }

  // ---------- Layer mode switching ----------
  window.setRadarLayer = function (mode) {
    activeMode = mode;

    // Clear previous weather / lightning
    if (weatherLayer) map.removeLayer(weatherLayer);
    if (map.hasLayer(lightningLayer)) map.removeLayer(lightningLayer);
    if (map.hasLayer(warningLayer)) map.removeLayer(warningLayer);

    if (mode === 'radar') {
      buildFrames('radar');
      showFrame(currentFrame);
      startPlayback();
      warningLayer.addTo(map); // keep warning outline visible
    } else if (mode === 'satellite') {
      buildFrames('satellite');
      showFrame(currentFrame);
      startPlayback();
    } else if (mode === 'lightning') {
      stopPlayback();
      setStatus('LIGHTNING');
      loadLightning();
      lightningLayer.addTo(map);
    } else if (mode === 'warnings') {
      stopPlayback();
      buildFrames('radar');
      showFrame(currentFrame); // still show radar under warnings
      if (weatherLayer) weatherLayer.setOpacity(0.4);
      warningLayer.addTo(map);
      setStatus('WARNINGS');
      loadNwsWarnings();
    }
  };

  // ---------- Lightning (LibreWXR GeoJSON) ----------
  async function loadLightning() {
    lightningLayer.clearLayers();
    try {
      var res = await fetch('https://api.librewxr.net/v2/lightning?lat=39.1&lon=-84.5&radius=300');
      if (!res.ok) throw new Error('lightning fetch failed');
      var geo = await res.json();
      if (geo.features && geo.features.length) {
        geo.features.forEach(function (f) {
          if (f.geometry && f.geometry.coordinates) {
            var lon = f.geometry.coordinates[0];
            var lat = f.geometry.coordinates[1];
            L.circleMarker([lat, lon], {
              radius: 4,
              color: '#fbbf24',
              fillColor: '#f59e0b',
              fillOpacity: 0.9,
              weight: 1
            }).addTo(lightningLayer);
          }
        });
        setStatus('LIGHTNING ' + geo.features.length);
      } else {
        setStatus('No strikes');
      }
    } catch (e) {
      console.warn('Lightning error', e);
      setStatus('Lightning offline');
    }
  }

  // ---------- NWS Warning polygons ----------
  async function loadNwsWarnings() {
    warningLayer.clearLayers();
    try {
      var ua = 'Local12WeatherOps/1.0 (https://github.com/joeyfrogge-jpg/local12-weather-operations)';
      var [oh, ky] = await Promise.all([
        fetch('https://api.weather.gov/alerts/active?area=OH', { headers: { 'User-Agent': ua, 'Accept': 'application/geo+json' } }).then(function (r) { return r.json(); }),
        fetch('https://api.weather.gov/alerts/active?area=KY', { headers: { 'User-Agent': ua, 'Accept': 'application/geo+json' } }).then(function (r) { return r.json(); })
      ]);

      var features = [].concat(oh.features || [], ky.features || []);
      var count = 0;

      features.forEach(function (f) {
        if (!f.geometry) return;
        var ev = (f.properties && f.properties.event) || '';
        var isTornado = /tornado/i.test(ev);
        var isSevere = /severe|warning/i.test(ev);
        var color = isTornado ? '#ef4444' : (isSevere ? '#f59e0b' : '#3b82f6');

        try {
          var layer = L.geoJSON(f.geometry, {
            style: {
              color: color,
              weight: 2,
              fillColor: color,
              fillOpacity: 0.15,
              dashArray: isTornado ? null : '4 4'
            }
          });
          layer.bindPopup('<strong>' + ev + '</strong><br>' + ((f.properties && f.properties.headline) || ''));
          layer.addTo(warningLayer);
          count++;
        } catch (err) { /* skip bad geometry */ }
      });

      // Always keep a soft focus polygon around Cincinnati if none nearby
      if (count === 0) {
        L.polygon([
          [39.25, -84.70], [39.28, -84.35], [39.05, -84.25],
          [38.95, -84.45], [39.00, -84.75]
        ], {
          color: '#64748b', weight: 1.5, fillOpacity: 0.05, dashArray: '4 4'
        }).addTo(warningLayer);
      }
    } catch (e) {
      console.warn('NWS warnings error', e);
    }
  }

  // ---------- Controls ----------
  var playBtn = document.getElementById('play-pause');
  if (playBtn) {
    playBtn.addEventListener('click', function () {
      if (playing) stopPlayback();
      else startPlayback();
    });
  }

  var timeline = document.getElementById('timeline');
  if (timeline) {
    timeline.addEventListener('input', function (e) {
      stopPlayback();
      showFrame(parseInt(e.target.value, 10));
    });
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMap);
  } else {
    initMap();
  }
})();
