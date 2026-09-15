(() => {
  const LIVE_MAP_URL = 'https://zoom.earth/storms/94a-2026/';

  function installSatelliteModes() {
    const analysis = document.getElementById('analysis');
    if (!analysis || analysis.dataset.satelliteModes === '1') return;

    const cards = analysis.querySelector('.cards');
    if (!cards) return;

    const switcher = document.createElement('div');
    switcher.className = 'stride-satellite-modes';
    switcher.innerHTML = `
      <div class="stride-mode-head">
        <div><span>STRIDE SATELLITE AI</span><h2>🛰️ Choose Analysis Mode</h2><p>Analyze an uploaded satellite image or monitor the live cyclone map.</p></div>
      </div>
      <div class="stride-mode-tabs" role="tablist">
        <button type="button" class="stride-mode active" data-mode="upload" role="tab">📤 Upload Satellite Image</button>
        <button type="button" class="stride-mode" data-mode="live" role="tab">🌐 Live Satellite Map</button>
      </div>
      <div class="stride-live-panel" hidden>
        <div class="stride-live-toolbar">
          <div><b>Live Satellite Monitoring</b><small>Open the live map and inspect India + surrounding ocean regions for active systems.</small></div>
          <a href="${LIVE_MAP_URL}" target="_blank" rel="noopener noreferrer">Open Live Map ↗</a>
        </div>
        <div class="stride-live-map"><iframe src="${LIVE_MAP_URL}" title="Zoom Earth live cyclone map" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="fullscreen"></iframe></div>
        <div class="stride-live-note">ℹ️ The live map is the monitoring view. AI detection should use an approved live satellite/data feed rather than treating the map webpage itself as model input.</div>
      </div>`;

    cards.parentNode.insertBefore(switcher, cards);

    const uploadPanel = cards;
    const livePanel = switcher.querySelector('.stride-live-panel');
    const buttons = [...switcher.querySelectorAll('.stride-mode')];

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const mode = button.dataset.mode;
        buttons.forEach(b => b.classList.toggle('active', b === button));
        const upload = mode === 'upload';
        uploadPanel.style.display = upload ? '' : 'none';
        livePanel.hidden = upload;
        switcher.dataset.activeMode = mode;
        if (!upload) {
          const iframe = livePanel.querySelector('iframe');
          if (iframe && !iframe.src) iframe.src = LIVE_MAP_URL;
        }
      });
    });

    const style = document.createElement('style');
    style.id = 'stride-satellite-modes-style';
    style.textContent = `
      .stride-satellite-modes{margin-bottom:18px;padding:20px;border:1px solid #ffffff12;border-radius:18px;background:linear-gradient(180deg,#071b30,#041222);box-shadow:0 18px 50px #0004}.stride-mode-head span{font-size:10px;font-weight:900;letter-spacing:.14em;color:#5cf0ad}.stride-mode-head h2{margin:5px 0 4px;font-size:22px}.stride-mode-head p{margin:0;color:#8fa8c1;font-size:13px}.stride-mode-tabs{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}.stride-mode{border:1px solid #ffffff12;border-radius:12px;padding:13px 14px;background:#06172a;color:#9bb6ce;font:inherit;font-size:12px;font-weight:900;cursor:pointer;transition:.2s}.stride-mode:hover{border-color:#245dcc77;color:#dceeff}.stride-mode.active{border-color:#5cf0ad88;background:#09251e;color:#63f1b0;box-shadow:0 0 0 1px #5cf0ad22 inset}.stride-live-panel{margin-top:15px}.stride-live-toolbar{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px 15px;border:1px solid #ffffff10;border-radius:12px;background:#06172a}.stride-live-toolbar b{display:block;font-size:13px}.stride-live-toolbar small{display:block;margin-top:4px;color:#718da8;font-size:11px}.stride-live-toolbar a{flex:0 0 auto;padding:9px 12px;border-radius:9px;background:#123d87;color:#e8f4ff;text-decoration:none;font-size:11px;font-weight:900}.stride-live-map{height:620px;margin-top:10px;border:1px solid #ffffff12;border-radius:14px;overflow:hidden;background:#06172a}.stride-live-map iframe{width:100%;height:100%;border:0;display:block}.stride-live-note{margin-top:9px;padding:10px 12px;border-radius:9px;background:#041326;color:#8da8c0;font-size:11px;line-height:1.5}@media(max-width:700px){.stride-mode-tabs{grid-template-columns:1fr}.stride-live-toolbar{align-items:stretch;flex-direction:column}.stride-live-toolbar a{text-align:center}.stride-live-map{height:520px}}
    `;
    document.head.appendChild(style);
    analysis.dataset.satelliteModes = '1';
  }

  function boot() {
    installSatelliteModes();
    let tries = 0;
    const timer = setInterval(() => { installSatelliteModes(); if (++tries > 20) clearInterval(timer); }, 500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
