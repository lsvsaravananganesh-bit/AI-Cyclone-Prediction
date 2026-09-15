(() => {
  'use strict';

  const API_HINT = '/api/ml/analyze-image';
  const q = (s) => document.querySelector(s);

  function number(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function confidence(data) {
    const c = data?.three_stage?.classification?.confidence_percent ??
      data?.classification?.confidence_percent ?? data?.confidence;
    const n = number(c);
    if (n == null) return null;
    return n <= 1 ? n * 100 : n;
  }

  function provenance(data) {
    if (!data) return {label: 'NO RESULT', tone: 'warn'};
    if (data.model_status === 'INPUT_REJECTED') return {label: 'INPUT REJECTED', tone: 'danger'};
    if (data.demo === true || data.isDemoMode === true) return {label: 'DEMO DATA', tone: 'warn'};
    if (data.source === 'AI MODEL OUTPUT' && data.trained_weights_available === true) {
      return {label: 'TRAINED MODEL OUTPUT', tone: 'safe'};
    }
    return {label: 'UNVERIFIED OUTPUT', tone: 'warn'};
  }

  function injectStyles() {
    if (document.getElementById('stride-production-hardening-css')) return;
    const style = document.createElement('style');
    style.id = 'stride-production-hardening-css';
    style.textContent = `
      .stride-trustbar{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}
      .stride-trust{display:inline-flex;align-items:center;gap:7px;border:1px solid #ffffff18;border-radius:999px;padding:7px 11px;font:700 11px/1.1 system-ui;color:#cfe5f8;background:#07182a}
      .stride-trust.safe{border-color:#1c7a5b99;color:#9df0cc;background:#06251d}
      .stride-trust.warn{border-color:#806c2d99;color:#eadb9d;background:#201c0b}
      .stride-trust.danger{border-color:#a9344f99;color:#ffc8d3;background:#30111a}
      .stride-stage-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}
      .stride-stage{padding:14px;border:1px solid #ffffff10;border-radius:12px;background:#06172a}
      .stride-stage small{display:block;color:#7895b2;text-transform:uppercase;font-size:10px;letter-spacing:.06em}
      .stride-stage strong{display:block;margin-top:7px;color:#e8f6ff;font-size:14px;line-height:1.35}
      .stride-note{margin-top:10px;padding:12px;border-radius:10px;border:1px solid #2167a666;background:#061c31;color:#a7c9e6;font-size:12px;line-height:1.55}
      @media(max-width:800px){.stride-stage-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function ensureTrustbar() {
    const analysis = q('#analysis');
    if (!analysis || q('#strideTrustbar')) return;
    const heading = analysis.querySelector('.heading');
    if (!heading) return;
    const bar = document.createElement('div');
    bar.id = 'strideTrustbar';
    bar.className = 'stride-trustbar';
    bar.innerHTML = `
      <span id="strideInputTrust" class="stride-trust">◉ INPUT: WAITING</span>
      <span id="strideModelTrust" class="stride-trust">◉ MODEL: WAITING</span>
      <span id="strideDataTrust" class="stride-trust">◉ DATA: NO RESULT</span>`;
    heading.appendChild(bar);
  }

  function setTrust(id, text, tone='') {
    const el = q('#' + id);
    if (!el) return;
    el.className = 'stride-trust' + (tone ? ' ' + tone : '');
    el.textContent = text;
  }

  function render(data) {
    injectStyles();
    ensureTrustbar();
    if (!data) return;

    const rejected = data.model_status === 'INPUT_REJECTED';
    if (rejected) {
      setTrust('strideInputTrust', '✕ INPUT: REJECTED', 'danger');
      setTrust('strideModelTrust', '⏭ MODEL: NOT RUN', 'warn');
      setTrust('strideDataTrust', '⚠ DATA: INVALID INPUT', 'danger');
      return;
    }

    const p = provenance(data);
    setTrust('strideInputTrust', data.satellite_verified ? '✓ INPUT: SATELLITE VERIFIED' : '⚠ INPUT: UNVERIFIED', data.satellite_verified ? 'safe' : 'warn');
    setTrust('strideModelTrust', p.label, p.tone);
    setTrust('strideDataTrust', data.demo ? '⚠ DATA: DEMONSTRATION' : '✓ DATA: MODEL OUTPUT', data.demo ? 'warn' : 'safe');

    const existing = q('#strideProductionStages');
    if (existing) existing.remove();
    const host = q('#analysis .intel');
    if (!host) return;
    const three = data.three_stage || {};
    const i = three.identification || {};
    const c = three.classification || {};
    const pr = three.prediction || {};
    const section = document.createElement('section');
    section.id = 'strideProductionStages';
    section.innerHTML = `
      <div class="heading" style="margin-top:22px"><h2 style="font-size:21px">🧠 STRIDE 3-Stage AI Result</h2><p>Only values returned by the trained inference service are displayed.</p></div>
      <div class="stride-stage-grid">
        <div class="stride-stage"><small>01 · Identification</small><strong>${i.cyclone_detected === true ? 'CYCLONE DETECTED' : i.cyclone_detected === false ? 'NO CYCLONE DETECTED' : 'NOT AVAILABLE'}</strong></div>
        <div class="stride-stage"><small>02 · Classification</small><strong>${c.label || c.status || 'NOT AVAILABLE'}${confidence(data) != null ? ' · ' + confidence(data).toFixed(1) + '%' : ''}</strong></div>
        <div class="stride-stage"><small>03 · Prediction</small><strong>${pr.status === 'AVAILABLE' ? 'TEMPORAL PREDICTION AVAILABLE' : 'NOT AVAILABLE — NEED TIME SERIES'}</strong></div>
      </div>
      <div class="stride-note"><b>Scientific guardrail:</b> one image can support current identification/classification/intensity only when the trained model provides those outputs. Movement speed and future track require multiple timestamped, geolocated observations.</div>`;
    host.appendChild(section);
  }

  function hookFetch() {
    if (window.__strideProductionFetchHook) return;
    window.__strideProductionFetchHook = true;
    const original = window.fetch;
    window.fetch = async function(...args) {
      const response = await original.apply(this, args);
      try {
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
        if (url.includes(API_HINT)) {
          const clone = response.clone();
          clone.json().then(render).catch(() => {});
        }
      } catch (_) {}
      return response;
    };
  }

  function boot() {
    injectStyles();
    ensureTrustbar();
    hookFetch();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
