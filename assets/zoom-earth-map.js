(() => {
  const ZOOM_URL = 'https://zoom.earth/storms/94a-2026/';

  function installZoomEarthMap() {
    const tracker = document.querySelector('#tracker');
    if (!tracker || tracker.dataset.zoomEarthInstalled === '1') return;

    // Preserve the existing tracker page structure, but replace its map area.
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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installZoomEarthMap);
  else installZoomEarthMap();
  document.addEventListener('click', () => setTimeout(installZoomEarthMap, 50));
})();
