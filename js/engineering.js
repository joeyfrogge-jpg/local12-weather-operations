// Engineering & System Health
(function () {
  function updateMetrics() {
    // Simulate realistic fluctuating metrics
    const cpu = 25 + Math.floor(Math.random() * 20);
    const mem = 40 + Math.floor(Math.random() * 25);
    const disk = 24 + Math.floor(Math.random() * 8);
    const latency = 28 + Math.floor(Math.random() * 40);

    document.getElementById('cpu-bar').style.width = cpu + '%';
    document.getElementById('cpu-val').textContent = cpu + '%';
    document.getElementById('mem-bar').style.width = mem + '%';
    document.getElementById('mem-val').textContent = mem + '%';
    document.getElementById('disk-bar').style.width = disk + '%';
    document.getElementById('disk-val').textContent = disk + '%';

    document.getElementById('eng-grid').innerHTML = `
      <div class="eng-card">
        <div class="title">Ingest Servers</div>
        <div class="value healthy">3/3 Online</div>
      </div>
      <div class="eng-card">
        <div class="title">Radar Ingest</div>
        <div class="value healthy">Healthy</div>
      </div>
      <div class="eng-card">
        <div class="title">Telemetry</div>
        <div class="value healthy">Normal</div>
      </div>
      <div class="eng-card">
        <div class="title">Network</div>
        <div class="value healthy">Stable</div>
      </div>
      <div class="eng-card">
        <div class="title">Latency</div>
        <div class="value healthy">${latency} ms</div>
      </div>
      <div class="eng-card">
        <div class="title">Backup</div>
        <div class="value healthy">Completed</div>
      </div>
    `;
  }

  function addLog(msg) {
    const list = document.getElementById('log-list');
    const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const li = document.createElement('li');
    li.innerHTML = `<span>${time}</span> ${msg}`;
    list.insertBefore(li, list.firstChild);
    while (list.children.length > 8) list.removeChild(list.lastChild);
  }

  // Initial
  updateMetrics();
  addLog('Radar ingest healthy');
  addLog('Camera matrix online');
  addLog('Model data refreshed');
  addLog('EAS system online');
  addLog('NWS alert feed connected');

  // Periodic updates
  setInterval(updateMetrics, 4000);
  setInterval(() => {
    const msgs = [
      'Radar frame cache updated',
      'Telemetry heartbeat OK',
      'Model run ingested',
      'Alert poll complete',
      'Backup snapshot taken',
      'Network latency nominal'
    ];
    addLog(msgs[Math.floor(Math.random() * msgs.length)]);
  }, 12000);
})();
