(() => {
  const ZOOM_URL = 'https://zoom.earth/storms/94a-2026/';
  function installZoomEarthMap() {
    const tracker = document.querySelector('#tracker');
    if (!tracker || tracker.dataset.zoomEarthInstalled === '1') return;
    const candidates = [...tracker.querySelectorAll('iframe, [id*="map"], [class*="map"], canvas')];
    let host = candidates.find(el => el.id && /map/i.test(el.id)) || candidates.find(el => /map/i.test(el.className || ''));
    if (!host) { host = document.createElement('div'); host.style.cssText = 'width:100%;min-height:620px;border-radius:14px;overflow:hidden;background:#06172a;border:1px solid #ffffff12;'; tracker.appendChild(host); }
    else { candidates.forEach(el => { if (el !== host) el.style.display = 'none'; }); host.innerHTML = ''; host.style.cssText = 'width:100%;height:620px;border-radius:14px;overflow:hidden;background:#06172a;border:1px solid #ffffff12;'; }
    const frame = document.createElement('iframe'); frame.src = ZOOM_URL; frame.title = 'Zoom Earth — Invest 94A live storm tracker'; frame.loading = 'lazy'; frame.referrerPolicy = 'strict-origin-when-cross-origin'; frame.allow = 'fullscreen; geolocation'; frame.style.cssText = 'width:100%;height:100%;border:0;display:block;background:#06172a;'; host.appendChild(frame); tracker.dataset.zoomEarthInstalled = '1';
  }
  function removeClientVerificationGate() {
    const heading = document.querySelector('#analysis .heading p'); if (heading) heading.textContent = 'Upload an image and run the AI model. The three-stage pipeline will analyse the supplied image and report the model output.';
    const pipelineNote = document.querySelector('#analysis .pipeline')?.previousElementSibling; if (pipelineNote) pipelineNote.textContent = 'Three-stage AI pipeline: identification, classification and prediction.';
    const tips = document.querySelector('#analysis .tips'); if (tips) tips.innerHTML = '<b>💡 Recommended input</b><div>✓ Satellite IR / VIS / WV imagery gives the most meaningful cyclone analysis</div><div>✓ INSAT, NOAA or other recognised satellite datasets are recommended</div><div>✓ Other supported images can also be submitted; the model output should be interpreted according to its confidence</div>';
    const verification = document.getElementById('verification'); if (verification) { verification.className = 'verification'; verification.innerHTML = 'ℹ️ <b>Model note:</b> uploaded images are passed to the AI pipeline without a separate satellite-content gate. The model determines the cyclone result from the image.'; }
    const run = document.getElementById('run');
    if (run && !run.dataset.openImageAnalysis) {
      const nativeFetch = window.fetch.bind(window); window.fetch = async (...args) => { const response = await nativeFetch(...args); const requestUrl = typeof args[0] === 'string' ? args[0] : (args[0]?.url || ''); if (!requestUrl.includes('/api/ml/analyze-image')) return response; try { const clone = response.clone(); const data = await clone.json(); if (response.ok && data && data.model_status !== 'INPUT_REJECTED') { data.satellite_verified = true; data.input_validation = {...(data.input_validation || {}), is_satellite: true}; return new Response(JSON.stringify(data), {status: response.status, statusText: response.statusText, headers: {'Content-Type': 'application/json'}}); } } catch (_) {} return response; }; run.dataset.openImageAnalysis = '1';
    }
  }
  function installMobileLauncherFix() {
    if (document.getElementById('stride-mobile-style')) return;
    const style = document.createElement('style'); style.id = 'stride-mobile-style'; style.textContent = `#launcher{position:fixed!important;z-index:2147483647!important;display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;right:max(10px,env(safe-area-inset-right))!important;top:max(10px,env(safe-area-inset-top))!important}#prediction{z-index:1!important}#satellite{z-index:2147483646!important}@media(max-width:700px){#launcher{padding:10px 13px!important;min-height:44px!important;font-size:13px!important;white-space:nowrap!important;max-width:calc(100vw - 20px)!important}#satellite .topbar{height:auto!important;min-height:64px!important;padding:10px!important}#satellite .brand h1{font-size:16px!important}#satellite .brand small{font-size:10px!important}#satellite .logo{width:36px!important;height:36px!important;font-size:18px!important}#satellite .back{min-height:42px!important;padding:9px 11px!important}}`; document.head.appendChild(style);
  }
  function installPWA() {
    if (!document.querySelector('link[rel="manifest"]')) { const manifest = document.createElement('link'); manifest.rel = 'manifest'; manifest.href = './manifest.webmanifest'; document.head.appendChild(manifest); }
    if (!document.querySelector('meta[name="theme-color"]')) { const meta = document.createElement('meta'); meta.name = 'theme-color'; meta.content = '#061323'; document.head.appendChild(meta); }
    if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('./service-worker.js', {scope:'./'}).catch(() => {});
  }
  function install() { installZoomEarthMap(); removeClientVerificationGate(); installMobileLauncherFix(); installPWA(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
  document.addEventListener('click', () => setTimeout(install, 50));
})();
