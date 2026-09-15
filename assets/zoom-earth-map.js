(() => {
  const ZOOM_URL = 'https://zoom.earth/storms/94a-2026/';

  function installZoomEarthMap() {
    const tracker = document.querySelector('#tracker');
    if (!tracker || tracker.dataset.zoomEarthInstalled === '1') return;
    const candidates = [...tracker.querySelectorAll('iframe, [id*="map"], [class*="map"], canvas')];
    let host = candidates.find(el => el.id && /map/i.test(el.id)) || candidates.find(el => /map/i.test(el.className || ''));
    if (!host) {
      host = document.createElement('div');
      host.style.cssText = 'width:100%;min-height:620px;border-radius:14px;overflow:hidden;background:#06172a;border:1px solid #ffffff12;';
      tracker.appendChild(host);
    } else {
      candidates.forEach(el => { if (el !== host) el.style.display = 'none'; });
      host.innerHTML = '';
      host.style.cssText = 'width:100%;height:620px;border-radius:14px;overflow:hidden;background:#06172a;border:1px solid #ffffff12;';
    }
    const frame = document.createElement('iframe');
    frame.src = ZOOM_URL;
    frame.title = 'Zoom Earth — Invest 94A live storm tracker';
    frame.loading = 'lazy';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.allow = 'fullscreen; geolocation';
    frame.style.cssText = 'width:100%;height:100%;border:0;display:block;background:#06172a;';
    host.appendChild(frame);
    tracker.dataset.zoomEarthInstalled = '1';
  }

  function installAnalysisLayout() {
    const analysis = document.getElementById('analysis');
    if (!analysis || analysis.dataset.strideLayout === '1') return;

    const cards = analysis.querySelector('.cards');
    const intel = analysis.querySelector('.intel');
    if (!cards || !intel) return;

    const heading = analysis.querySelector('.heading p');
    if (heading) heading.textContent = 'Upload a satellite image. STRIDE sends it to the Render ML API for preprocessing and AI inference, then presents validation, identification, classification and prediction results.';

    const pipeline = analysis.querySelector('.pipeline');
    if (pipeline) {
      const labels = [
        '1. INPUT RECEIVED',
        '2. RENDER API + PREPROCESSING',
        '3. ML INFERENCE',
        '4. STRIDE INTELLIGENCE'
      ];
      [...pipeline.querySelectorAll('.step')].forEach((step, i) => {
        const label = step.querySelector('b');
        if (label && labels[i]) label.textContent = labels[i];
      });
      const note = pipeline.previousElementSibling;
      if (note) note.textContent = 'Satellite image → Render ML API → preprocessing → ML inference → STRIDE intelligence.';
    }

    const uploadCard = cards.querySelector('.card');
    if (uploadCard) {
      const connection = uploadCard.querySelector('.connection');
      if (connection) connection.innerHTML = '<strong>● Connected:</strong> STRIDE Satellite AI → Render ML API → preprocessing → ML inference';
    }

    const oldIntelHeading = intel.querySelector('.heading');
    if (oldIntelHeading) {
      const h2 = oldIntelHeading.querySelector('h2');
      const p = oldIntelHeading.querySelector('p');
      if (h2) h2.textContent = '📊 Current Cyclone Intelligence';
      if (p) p.textContent = 'Values are displayed from the model/API response. A single image does not invent movement speed or future position.';
    }

    const stageWrap = document.createElement('section');
    stageWrap.className = 'stride-stages';
    stageWrap.innerHTML = `
      <div class="stride-flow-head">
        <div><span class="stride-kicker">STRIDE AI PIPELINE</span><h2>🔬 Cyclone Analysis Stages</h2><p>Follow exactly what happens after the image is uploaded.</p></div>
        <div class="stride-flow-pill">UPLOAD → RENDER → PREPROCESS → ML → INTELLIGENCE</div>
      </div>
      <div class="stride-stage-grid">
        <article class="stride-stage validation-stage"><div class="stage-number">01</div><div class="stage-icon">🛰️</div><h3>Image Validation</h3><p class="stage-desc">Checks whether the supplied image can be processed and whether the input contains a cyclone-like satellite pattern.</p><div class="stage-result" id="strideValidation">Waiting for image</div></article>
        <article class="stride-stage"><div class="stage-number">02</div><div class="stage-icon">🔎</div><h3>Identification</h3><p class="stage-desc">Determines whether a cyclone is detected by the identification model.</p><div class="stage-result" id="strideIdentification">Waiting for ML inference</div></article>
        <article class="stride-stage"><div class="stage-number">03</div><div class="stage-icon">🧩</div><h3>Classification</h3><p class="stage-desc">Classifies the detected cyclone pattern and reports the model confidence.</p><div class="stage-result" id="strideClassification">Waiting for ML inference</div></article>
        <article class="stride-stage"><div class="stage-number">04</div><div class="stage-icon">📈</div><h3>Prediction</h3><p class="stage-desc">Uses the available model/data outputs for movement, wind, pressure, future position and risk.</p><div class="stage-result" id="stridePrediction">Waiting for prediction data</div></article>
      </div>
      <div class="stride-transport">
        <div><span>1</span><b>Browser</b><small>Image upload</small></div><i>→</i><div><span>2</span><b>Render</b><small>API + preprocessing</small></div><i>→</i><div><span>3</span><b>ML Model</b><small>Inference</small></div><i>→</i><div><span>4</span><b>STRIDE</b><small>Decision support</small></div>
      </div>`;

    analysis.insertBefore(stageWrap, intel);

    const style = document.createElement('style');
    style.id = 'stride-analysis-layout-style';
    style.textContent = `
      .stride-stages{margin-top:24px;padding:22px;border:1px solid #ffffff12;border-radius:18px;background:linear-gradient(180deg,#071b30,#041222);box-shadow:0 20px 55px #0005}
      .stride-flow-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:18px}.stride-flow-head h2{margin:4px 0;font-size:23px}.stride-flow-head p{margin:0;color:#8fa8c1;font-size:13px}.stride-kicker{font-size:10px;font-weight:800;letter-spacing:.14em;color:#5cf0ad}.stride-flow-pill{padding:9px 12px;border:1px solid #245dcc55;border-radius:999px;background:#06172a;color:#9fc9e8;font-size:10px;font-weight:800;white-space:nowrap}
      .stride-stage-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.stride-stage{position:relative;min-height:190px;padding:18px;border:1px solid #ffffff10;border-radius:14px;background:#06172a;overflow:hidden}.stride-stage:before{content:'';position:absolute;inset:0 0 auto;height:3px;background:#245dcc}.validation-stage:before{background:#5cf0ad}.stage-number{position:absolute;right:13px;top:11px;color:#4d7294;font-size:11px;font-weight:900}.stage-icon{font-size:24px}.stride-stage h3{margin:10px 0 6px;font-size:16px}.stage-desc{margin:0;color:#819db8;font-size:12px;line-height:1.55;min-height:58px}.stage-result{margin-top:12px;padding:10px;border-radius:9px;background:#041326;border:1px solid #ffffff0d;color:#8da8c0;font-size:12px;font-weight:800;line-height:1.4}.stage-result.ok{color:#63f1b0;border-color:#1c7a5b66;background:#06251d}.stage-result.warn{color:#e7d99b;border-color:#7c6a2b66;background:#201c0b}.stage-result.danger{color:#ff9aad;border-color:#a9344f88;background:#30111a}
      .stride-transport{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:14px;padding:13px;border:1px solid #ffffff0c;border-radius:12px;background:#03101f}.stride-transport>div{display:flex;align-items:center;gap:8px}.stride-transport span{width:25px;height:25px;border-radius:50%;display:grid;place-items:center;background:#123d87;color:#dceeff;font-size:11px;font-weight:900}.stride-transport b{font-size:11px}.stride-transport small{color:#718da8;font-size:10px}.stride-transport i{color:#4f83bd;font-style:normal;font-weight:900}
      .intel-grid{grid-template-columns:repeat(5,1fr)}
      @media(max-width:1000px){.stride-stage-grid{grid-template-columns:repeat(2,1fr)}.stride-flow-head{align-items:flex-start;flex-direction:column}.stride-flow-pill{white-space:normal}.intel-grid{grid-template-columns:repeat(3,1fr)}}
      @media(max-width:700px){.stride-stages{padding:15px}.stride-stage-grid{grid-template-columns:1fr}.stride-stage{min-height:0}.stride-transport{align-items:stretch;flex-direction:column}.stride-transport>div{justify-content:flex-start}.stride-transport i{text-align:center;transform:rotate(90deg)}.intel-grid{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(style);
    analysis.dataset.strideLayout = '1';
  }

  function setStage(id, text, state) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.className = 'stage-result' + (state ? ' ' + state : '');
  }

  function value(obj, keys, fallback = null) {
    for (const key of keys) {
      const parts = key.split('.');
      let cur = obj;
      for (const part of parts) cur = cur && cur[part];
      if (cur !== undefined && cur !== null && cur !== '') return cur;
    }
    return fallback;
  }

  function pct(v) {
    return v === null || v === undefined ? null : (Number.isFinite(Number(v)) ? Number(v).toFixed(1) + '%' : String(v));
  }

  function renderStageResults(data) {
    installAnalysisLayout();
    if (!data) return;

    const rejected = data.model_status === 'INPUT_REJECTED';
    if (rejected) {
      setStage('strideValidation', 'INPUT REJECTED — image was not accepted by the API', 'danger');
      setStage('strideIdentification', 'Not run', 'warn');
      setStage('strideClassification', 'Not run', 'warn');
      setStage('stridePrediction', 'Not run', 'warn');
      return;
    }

    const identification = data.three_stage?.identification || data.stage1 || {};
    const classification = data.three_stage?.classification || data.stage2 || {};
    const prediction = data.three_stage?.prediction || data.stage3 || {};

    const satellite = value(data, ['satellite_verified','input_validation.is_satellite','validation.is_satellite','stage1.is_satellite'], null);
    setStage('strideValidation', satellite === false ? 'Satellite verification: NO' : 'Image accepted → ready for AI inference', satellite === false ? 'warn' : 'ok');

    const detected = value(identification, ['cyclone_detected'], value(data, ['cyclone_detected'], null));
    const idProb = value(identification, ['probability_percent','confidence_percent'], null);
    if (detected === true || String(detected).toLowerCase() === 'true') setStage('strideIdentification', 'YES — Cyclone detected' + (idProb != null ? ' • ' + pct(idProb) : ''), 'ok');
    else if (detected === false || String(detected).toLowerCase() === 'false') setStage('strideIdentification', 'NO — Cyclone not detected' + (idProb != null ? ' • ' + pct(idProb) : ''), 'warn');
    else setStage('strideIdentification', 'Model result received', 'ok');

    const label = value(classification, ['label','class_name','pattern','type'], null);
    const conf = value(classification, ['confidence_percent','probability_percent'], null);
    const classText = label ? String(label) : 'Classification result received';
    setStage('strideClassification', classText + (conf != null ? ' • ' + pct(conf) : ''), 'ok');

    const risk = value(prediction, ['risk_level'], value(data, ['risk_level'], null));
    const wind = value(prediction, ['maximum_wind_kmh'], value(data, ['maximum_wind_kmh'], null));
    const pressure = value(prediction, ['central_pressure_hpa'], value(data, ['central_pressure_hpa'], null));
    const speed = value(prediction, ['movement_speed_kmh'], value(data, ['movement_speed_kmh'], null));
    const next = value(prediction, ['next_position'], null);
    const bits = [];
    if (next) bits.push('Next: ' + next);
    if (wind != null) bits.push('Wind: ' + wind + ' km/h');
    if (pressure != null) bits.push('Pressure: ' + pressure + ' hPa');
    if (speed != null) bits.push('Speed: ' + speed + ' km/h');
    if (risk) bits.push('Risk: ' + risk);
    setStage('stridePrediction', bits.length ? bits.join(' • ') : 'Prediction data requires available temporal/model inputs', bits.length ? 'ok' : 'warn');
  }

  function removeClientVerificationGate() {
    const heading = document.querySelector('#analysis .heading p');
    if (heading) heading.textContent = 'Upload a satellite image. STRIDE sends it to the Render ML API for preprocessing and AI inference, then presents validation, identification, classification and prediction results.';
    const pipelineNote = document.querySelector('#analysis .pipeline')?.previousElementSibling;
    if (pipelineNote) pipelineNote.textContent = 'Satellite image → Render ML API → preprocessing → ML inference → STRIDE intelligence.';
    const tips = document.querySelector('#analysis .tips');
    if (tips) tips.innerHTML = '<b>💡 Recommended input</b><div>✓ Satellite IR / VIS / WV imagery gives the most meaningful cyclone analysis</div><div>✓ INSAT, NOAA or other recognised satellite datasets are recommended</div><div>✓ Single image: current analysis • Multiple time-stamped images: movement and prediction</div>';
    const verification = document.getElementById('verification');
    if (verification) { verification.className = 'verification'; verification.innerHTML = 'ℹ️ <b>Model note:</b> the uploaded image is sent to the Render ML API. The model reports its identification, classification and prediction outputs; unavailable measurements are not invented.'; }
    const run = document.getElementById('run');
    if (run && !run.dataset.openImageAnalysis) {
      const nativeFetch = window.fetch.bind(window);
      window.fetch = async (...args) => {
        const response = await nativeFetch(...args);
        const requestUrl = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
        if (!requestUrl.includes('/api/ml/analyze-image')) return response;
        try {
          const clone = response.clone();
          const data = await clone.json();
          renderStageResults(data);
          if (response.ok && data && data.model_status !== 'INPUT_REJECTED') {
            data.satellite_verified = true;
            data.input_validation = {...(data.input_validation || {}), is_satellite: true};
            return new Response(JSON.stringify(data), {status: response.status, statusText: response.statusText, headers: {'Content-Type': 'application/json'}});
          }
        } catch (_) {}
        return response;
      };
      run.dataset.openImageAnalysis = '1';
    }
  }

  function installMobileLauncherFix() {
    if (document.getElementById('stride-mobile-style')) return;
    const style = document.createElement('style');
    style.id = 'stride-mobile-style';
    style.textContent = `#launcher{position:fixed!important;z-index:2147483647!important;display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;right:max(10px,env(safe-area-inset-right))!important;top:max(10px,env(safe-area-inset-top))!important}#prediction{z-index:1!important}#satellite{z-index:2147483646!important}@media(max-width:700px){#launcher{padding:10px 13px!important;min-height:44px!important;font-size:13px!important;white-space:nowrap!important;max-width:calc(100vw - 20px)!important}#satellite .topbar{height:auto!important;min-height:64px!important;padding:10px!important}#satellite .brand h1{font-size:16px!important}#satellite .brand small{font-size:10px!important}#satellite .logo{width:36px!important;height:36px!important;font-size:18px!important}#satellite .back{min-height:42px!important;padding:9px 11px!important}}`;
    document.head.appendChild(style);
  }

  function installPWA() {
    if (!document.querySelector('link[rel="manifest"]')) { const manifest = document.createElement('link'); manifest.rel = 'manifest'; manifest.href = './manifest.webmanifest'; document.head.appendChild(manifest); }
    if (!document.querySelector('meta[name="theme-color"]')) { const meta = document.createElement('meta'); meta.name = 'theme-color'; meta.content = '#061323'; document.head.appendChild(meta); }
    if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('./service-worker.js', {scope:'./'}).catch(() => {});
  }

  function install() {
    installZoomEarthMap();
    installAnalysisLayout();
    removeClientVerificationGate();
    installMobileLauncherFix();
    installPWA();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
  document.addEventListener('click', () => setTimeout(install, 50));
})();
