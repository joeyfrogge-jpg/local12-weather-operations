// Local 12 – Real-time animated radar
// Primary: RainViewer (most reliable free tiles)
// Fallback: LibreWXR
// Current frame assist: Iowa Mesonet NEXRAD composite
// No API keys required
(function () {
  var CENTER = [39.1031, -84.5120];
  var map, weatherLayer = null, currentAssist = null;
  var lightningLayer = null, warningLayer = null;
  var frames = [];
  var currentFrame = 0;
  var playing = true;
  var playTimer = null;
  var host = '';
  var sourceName = '';
  var activeMode = 'radar';
  var metaData = null;

  function initMap() {
    map = L.map('radar-map', {
      center: CENTER,
      zoom: 8,
      zoomControl: true,
      attributionControl: true
    });

    // Light OSM base – radar colors show clearly on top
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap | Radar: RainViewer / LibreWXR',
      maxZoom: 18,
      className: 'base-tiles'
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

    // Always-on current NEXRAD assist from Iowa Mesonet (latest composite)
    currentAssist = L.tileLayer(
      'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/ridge::USCOMP-N0Q-0/{z}/{x}/{y}.png',
      {
        opacity: 0.55,
        maxZoom: 10,
        zIndex: 250,
        attribution: 'IEM NEXRAD'
      }
    ).addTo(map);

    window.radarMap = map;
    loadWeatherData();
    loadNwsWarnings();

    // Refresh assist every 3 minutes
    setInterval(function () {
      if (currentAssist) {
        currentAssist.setUrl(
          'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/ridge::USCOMP-N0Q-0/{z}/{x}/{y}.png?t=' +
            Date.now()
        );
      }
    }, 3 * 60 * 1000);
  }

  async function loadWeatherData() {
    // RainViewer first – most consistent free tiles
    var sources = [
      { name: 'RainViewer', url: 'https://api.rainviewer.com/public/weather-maps.json', defaultHost: 'https://tilecache.rainviewer.com' },
      { name: 'LibreWXR', url: 'https://api.librewxr.net/public/weather-maps.json', defaultHost: 'https://api.librewxr.net' }
    ];

    for (var i = 0; i < sources.length; i++) {
      try {
        var res = await fetch(sources[i].url, { cache: 'no-store' });
        if (!res.ok) continue;
        var data = await res.json();
        if (!data.radar || !data.radar.past || !data.radar.past.length) continue;

        metaData = data;
        sourceName = sources[i].name;
        host = data.host || sources[i].defaultHost;

        buildFrames('radar');
        console.log('[Radar] source=' + sourceName + ' frames=' + frames.length + ' host=' + host);

        showFrame(currentFrame);
        startPlayback();

        setTimeout(loadWeatherData, 5 * 60 * 1000);
        return;
      } catch (err) {
        console.warn('[Radar] ' + sources[i].name + ' failed', err);
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
      past.forEach(function (f) {
        frames.push({ time: f.time, path: f.path, kind: 'radar' });
      });
      nowcast.forEach(function (f) {
        frames.push({ time: f.time, path: f.path, kind: 'radar' });
      });
      currentFrame = Math.max(0, past.length - 1);
    } else if (mode === 'satellite') {
      var sat = (metaData.satellite && metaData.satellite.infrared) || [];
      if (sat.length) {
        sat.forEach(function (f) {
          frames.push({ time: f.time, path: f.path, kind: 'satellite' });
        });
        currentFrame = frames.length - 1;
      } else {
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

  function tileUrlFor(frame) {
    if (frame.kind === 'satellite') {
      return host + frame.path + '/256/{z}/{x}/{y}/0/0_0.png';
    }
    // RainViewer classic scheme 2; LibreWXR scheme 2 also works well
    var color = '2';
    var options = '1_1'; // smooth + snow colors
    return host + frame.path + '/256/{z}/{x}/{y}/' + color + '/' + options + '.png';
  }

  function showFrame(idx) {
    if (!frames.length || idx < 0 || idx >= frames.length) return;
    currentFrame = idx;
    var frame = frames[idx];
    var tileUrl = tileUrlFor(frame);

    if (weatherLayer) {
      map.removeLayer(weatherLayer);
      weatherLayer = null;
    }

    weatherLayer = L.tileLayer(tileUrl, {
      opacity: 0.85,
      maxZoom: 12,
      zIndex: 350,
      className: 'radar-overlay',
      errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    });

    if (activeMode === 'radar' || activeMode === 'satellite' || activeMode === 'warnings') {
      weatherLayer.addTo(map);
    }

    // Time badge
    var now = Math.floor(Date.now() / 1000);
    var isLive = frame.time <= now && now - frame.time < 900;
    var label = window.L12
      ? window.L12.formatTime(frame.time)
      : new Date(frame.time * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    var el = document.getElementById('frame-time');
    if (el) {
      el.textContent = isLive ? 'LIVE ' + label : frame.time > now ? '+' + label : label;
      el.classList.toggle('is-live', isLive);
    }
    var slider = document.getElementById('timeline');
    if (slider) slider.value = idx;
  }

  function setStatus(msg) {
    var el = document.getElementById('frame-time');
    if (el) el.textContent = msg;
  }

  function startPlayback() {
    if (playTimer) clearInterval(playTimer);
    if (frames.length < 2) return;
    playing = true;
    var btn = document.getElementById('play-pause');
    if (btn) btn.textContent = 'II';
    playTimer = setInterval(function () {
      showFrame((currentFrame + 1) % frames.length);
    }, 550);
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

  window.setRadarLayer = function (mode) {
    activeMode = mode;

    if (weatherLayer) map.removeLayer(weatherLayer);
    if (map.hasLayer(lightningLayer)) map.removeLayer(lightningLayer);
    if (map.hasLayer(warningLayer)) map.removeLayer(warningLayer);
    if (currentAssist) {
      if (mode === 'radar' || mode === 'warnings') currentAssist.addTo(map);
      else map.removeLayer(currentAssist);
    }

    if (mode === 'radar') {
      buildFrames('radar');
      showFrame(currentFrame);
      startPlayback();
      warningLayer.addTo(map);
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
      showFrame(currentFrame);
      if (weatherLayer) weatherLayer.setOpacity(0.45);
      warningLayer.addTo(map);
      setStatus('WARNINGS');
      loadNwsWarnings();
    }
  };

  async function loadLightning() {
    lightningLayer.clearLayers();
    try {
      var res = await fetch(
        'https://api.librewxr.net/v2/lightning?lat=39.1&lon=-84.5&radius=400'
      );
      if (!res.ok) throw new Error('fail');
      var geo = await res.json();
      var n = 0;
      (geo.features || []).forEach(function (f) {
        if (!f.geometry || !f.geometry.coordinates) return;
        var lon = f.geometry.coordinates[0];
        var lat = f.geometry.coordinates[1];
        L.circleMarker([lat, lon], {
          radius: 5,
          color: '#fbbf24',
          fillColor: '#f59e0b',
          fillOpacity: 0.95,
          weight: 1
        }).addTo(lightningLayer);
        n++;
      });
      setStatus(n ? 'LIGHTNING ' + n : 'No strikes');
    } catch (e) {
      setStatus('Lightning offline');
    }
  }

  async function loadNwsWarnings() {
    warningLayer.clearLayers();
    try {
      var ua =
        'Local12WeatherOps/1.0 (https://github.com/joeyfrogge-jpg/local12-weather-operations)';
      var results = await Promise.all([
        fetch('https://api.weather.gov/alerts/active?area=OH', {
          headers: { 'User-Agent': ua, Accept: 'application/geo+json' }
        }).then(function (r) {
          return r.json();
        }),
        fetch('https://api.weather.gov/alerts/active?area=KY', {
          headers: { 'User-Agent': ua, Accept: 'application/geo+json' }
        }).then(function (r) {
          return r.json();
        })
      ]);

      var features = [].concat(
        results[0].features || [],
        results[1].features || []
      );
      var count = 0;

      features.forEach(function (f) {
        if (!f.geometry) return;
        var ev = (f.properties && f.properties.event) || '';
        var isTornado = /tornado/i.test(ev);
        var isSevere = /severe|warning/i.test(ev);
        var color = isTornado ? '#ef4444' : isSevere ? '#f59e0b' : '#3b82f6';

        try {
          var layer = L.geoJSON(f.geometry, {
            style: {
              color: color,
              weight: 2.5,
              fillColor: color,
              fillOpacity: 0.18,
              dashArray: isTornado ? null : '5 4'
            }
          });
          layer.bindPopup(
            '<strong>' +
              ev +
              '</strong><br>' +
              ((f.properties && f.properties.headline) || '')
          );
          layer.addTo(warningLayer);
          count++;
        } catch (e) {}
      });

      if (count === 0) {
        L.polygon(
          [
            [39.25, -84.7],
            [39.28, -84.35],
            [39.05, -84.25],
            [38.95, -84.45],
            [39.0, -84.75]
          ],
          {
            color: '#64748b',
            weight: 1.5,
            fillOpacity: 0.04,
            dashArray: '4 4'
          }
        ).addTo(warningLayer);
      }
    } catch (e) {
      console.warn('NWS warnings', e);
    }
  }

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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMap);
  } else {
    initMap();
  }
})();
