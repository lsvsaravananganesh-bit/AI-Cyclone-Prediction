(() => {
  const STYLE_ID = 'stride-confidence-gauge-style';
  const GAUGE_ID = 'stride-confidence-gauge';

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .stride-confidence{margin-top:12px;padding:14px;border:1px solid #ffffff12;border-radius:14px;background:#041326;display:flex;align-items:center;gap:16px}
      .stride-confidence-ring{width:82px;height:82px;flex:0 0 82px;position:relative}
      .stride-confidence-ring svg{width:82px;height:82px;display:block;transform:rotate(-90deg)}
      .stride-confidence-track{fill:none;stroke:#ffffff12;stroke-width:8}
      .stride-confidence-progress{fill:none;stroke:#5cf0ad;stroke-width:8;stroke-linecap:round;transition:stroke-dashoffset .7s ease,stroke .3s ease}
      .stride-confidence-value{position:absolute;inset:0;display:grid;place-items:center;font-size:16px;font-weight:900;color:#e8f4ff}
      .stride-confidence-copy{min-width:0}.stride-confidence-kicker{font-size:9px;letter-spacing:.13em;font-weight:900;color:#6f8fae}.stride-confidence-copy h4{margin:3px 0 4px;font-size:14px;color:#e8f4ff}.stride-confidence-copy p{margin:0;color:#829db8;font-size:11px;line-height:1.45}
      .stride-confidence.low .stride-confidence-progress{stroke:#e7d99b}.stride-confidence.medium .stride-confidence-progress{stroke:#8dc8ff}.stride-confidence.high .stride-confidence-progress{stroke:#5cf0ad}.stride-confidence.very-high .stride-confidence-progress{stroke:#63f1b0}
      @media(max-width:520px){.stride-confidence{align-items:flex-start}.stride-confidence-ring{width:72px;height:72px;flex-basis:72px}.stride-confidence-ring svg{width:72px;height:72px}.stride-confidence-value{font-size:14px}}
    `;
    document.head.appendChild(style);
  }

  function getNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : null;
  }

  function findConfidence(data) {
    const candidates = [
      data?.three_stage?.classification?.confidence_percent,
      data?.three_stage?.classification?.confidence,
      data?.three_stage?.classification?.probability_percent,
      data?.stage2?.confidence_percent,
      data?.stage2?.confidence,
      data?.stage2?.probability_percent,
      data?.classification?.confidence_percent,
      data?.classification?.confidence,
      data?.classification_confidence_percent
    ];
    for (const value of candidates) {
      const n = getNumber(value);
      if (n !== null) return n;
    }
    return null;
  }

  function findLabel(data) {
    return data?.three_stage?.classification?.label || data?.stage2?.label || data?.classification?.label || 'Current classification';
  }

  function render(data) {
    const classification = document.getElementById('strideClassification');
    if (!classification || !data) return;
    installStyle();

    let card = document.getElementById(GAUGE_ID);
    if (!card) {
      card = document.createElement('div');
      card.id = GAUGE_ID;
      card.className = 'stride-confidence';
      classification.parentNode.appendChild(card);
    }

    const confidence = findConfidence(data);
    const label = findLabel(data);
    if (confidence === null) {
      card.className = 'stride-confidence';
      card.innerHTML = `<div class="stride-confidence-ring"><svg viewBox="0 0 100 100"><circle class="stride-confidence-track" cx="50" cy="50" r="40"/><circle class="stride-confidence-progress" cx="50" cy="50" r="40" stroke-dasharray="251.33" stroke-dashoffset="251.33"/></svg><div class="stride-confidence-value">—</div></div><div class="stride-confidence-copy"><div class="stride-confidence-kicker">AI CERTAINTY</div><h4>Confidence unavailable</h4><p>The classification response did not provide a confidence score, so STRIDE does not invent one.</p></div>`;
      return;
    }

    const level = confidence >= 90 ? 'very-high' : confidence >= 75 ? 'high' : confidence >= 50 ? 'medium' : 'low';
    const text = confidence >= 90 ? 'Very high confidence' : confidence >= 75 ? 'High confidence' : confidence >= 50 ? 'Moderate confidence' : 'Low confidence';
    const circumference = 251.33;
    const offset = circumference * (1 - confidence / 100);
    card.className = `stride-confidence ${level}`;
    card.innerHTML = `<div class="stride-confidence-ring"><svg viewBox="0 0 100 100"><circle class="stride-confidence-track" cx="50" cy="50" r="40"/><circle class="stride-confidence-progress" cx="50" cy="50" r="40" stroke-dasharray="${circumference}" stroke-dashoffset="${offset.toFixed(2)}"/></svg><div class="stride-confidence-value">${confidence.toFixed(0)}%</div></div><div class="stride-confidence-copy"><div class="stride-confidence-kicker">AI CLASSIFICATION CONFIDENCE</div><h4>${String(label)}</h4><p>${text}. This is the model's reported certainty for the current classification, not a guarantee of real-world accuracy.</p></div>`;
  }

  function hookFetch() {
    if (window.__strideConfidenceFetchHook) return;
    window.__strideConfidenceFetchHook = true;
    const nativeFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const response = await nativeFetch(...args);
      const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
      if (url.includes('/api/ml/analyze-image')) {
        try { render(await response.clone().json()); } catch (_) {}
      }
      return response;
    };
  }

  function boot() {
    hookFetch();
    let tries = 0;
    const timer = setInterval(() => {
      if (document.getElementById('strideClassification')) installStyle();
      if (++tries > 30) clearInterval(timer);
    }, 500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
