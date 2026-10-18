// Live National Weather Service alerts
(function () {
  const USER_AGENT = 'Local12WeatherOps/1.0 (https://github.com/joeyfrogge-jpg/local12-weather-operations)';

  async function fetchAlerts() {
    try {
      // Fetch active alerts for Ohio and Kentucky
      const [oh, ky] = await Promise.all([
        fetch('https://api.weather.gov/alerts/active?area=OH', {
          headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/geo+json' }
        }).then(r => r.json()),
        fetch('https://api.weather.gov/alerts/active?area=KY', {
          headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/geo+json' }
        }).then(r => r.json())
      ]);

      const features = [...(oh.features || []), ...(ky.features || [])];

      // Deduplicate by id
      const seen = new Set();
      const unique = features.filter(f => {
        if (seen.has(f.id)) return false;
        seen.add(f.id);
        return true;
      });

      renderAlerts(unique);
      renderRadarWarnings(unique);
    } catch (err) {
      console.error('Alerts fetch failed', err);
      document.getElementById('alert-list').innerHTML =
        '<div class="alert-item">Unable to load live alerts. Check network.</div>';
    }
  }

  function renderAlerts(features) {
    // Counters
    let severe = 0, tornado = 0, flood = 0, advisory = 0;
    features.forEach(f => {
      const ev = (f.properties.event || '').toLowerCase();
      if (ev.includes('tornado')) tornado++;
      else if (ev.includes('flood')) flood++;
      else if (ev.includes('warning') || ev.includes('severe')) severe++;
      else advisory++;
    });

    document.getElementById('alert-counters').innerHTML = `
      <div class="counter-card severe"><div class="num">${severe}</div><div class="label">Severe</div></div>
      <div class="counter-card tornado"><div class="num">${tornado}</div><div class="label">Tornado Watch</div></div>
      <div class="counter-card flood"><div class="num">${flood}</div><div class="label">Flood Watch</div></div>
      <div class="counter-card adv"><div class="num">${advisory}</div><div class="label">Advisories</div></div>
    `;

    document.getElementById('active-count').textContent = `${features.length} Active`;

    const list = document.getElementById('alert-list');
    if (features.length === 0) {
      list.innerHTML = '<div class="alert-item" style="border-color:var(--green)">No active severe weather alerts for OH/KY.</div>';
      return;
    }

    // Sort by severity
    const severityOrder = { Extreme: 0, Severe: 1, Moderate: 2, Minor: 3, Unknown: 4 };
    features.sort((a, b) =>
      (severityOrder[a.properties.severity] || 5) - (severityOrder[b.properties.severity] || 5)
    );

    list.innerHTML = features.slice(0, 12).map(f => {
      const p = f.properties;
      const isTornado = (p.event || '').toLowerCase().includes('tornado');
      return `
        <div class="alert-item ${isTornado ? '' : 'severe'}">
          <div class="event">${p.event || 'Alert'}</div>
          <div>${p.areaDesc || ''}</div>
          <div class="expires">${window.L12.formatExpires(p.expires || p.ends)}</div>
        </div>
      `;
    }).join('');
  }

  function renderRadarWarnings(features) {
    const list = document.getElementById('warning-list');
    const warnings = features.filter(f => {
      const ev = (f.properties.event || '').toLowerCase();
      return ev.includes('warning');
    }).slice(0, 5);

    if (warnings.length === 0) {
      list.innerHTML = '<div class="warning-item" style="border-color:var(--green)">No active warnings in the area.</div>';
      return;
    }

    list.innerHTML = warnings.map(f => {
      const p = f.properties;
      const isTornado = (p.event || '').toLowerCase().includes('tornado');
      return `
        <div class="warning-item ${isTornado ? '' : 'severe'}">
          <div class="event">${p.event}</div>
          <div>${(p.areaDesc || '').split(';')[0]}</div>
          <div class="expires">${window.L12.formatExpires(p.expires || p.ends)}</div>
        </div>
      `;
    }).join('');
  }

  // Initial load + refresh every 2 minutes
  fetchAlerts();
  setInterval(fetchAlerts, 2 * 60 * 1000);
})();
