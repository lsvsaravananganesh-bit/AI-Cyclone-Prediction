/* AI Studio -> GitHub/Render satellite-analysis adapter.
 * Keeps the AI Studio JSON upload contract and converts it to the existing
 * FastAPI multipart /api/ml/analyze-image contract. No browser object detector
 * is used because MobileNet/COCO-SSD is not a satellite classifier.
 */
(() => {
  const API = (window.CYCLONE_API_BASE || 'https://ai-cyclone-prediction-api.onrender.com').replace(/\/$/, '');
  window.CYCLONE_API_BASE = API;
  const originalFetch = window.fetch.bind(window);
  const isSatelliteEndpoint = (url) => String(url || '').includes('/api/ml/analyze-image');

  function dataUrlToBlob(dataUrl) {
    const match = String(dataUrl || '').match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
    if (!match) throw new Error('Invalid satellite image data.');
    const mime = match[1] || 'image/png';
    if (match[2]) {
      const binary = atob(match[3]);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new Blob([bytes], { type: mime });
    }
    return new Blob([decodeURIComponent(match[3])], { type: mime });
  }

  async function adapt(input, init = {}) {
    const headers = new Headers(init.headers || {});
    const body = init.body;
    let payload = null;
    if (typeof body === 'string' && headers.get('content-type')?.includes('application/json')) {
      try { payload = JSON.parse(body); } catch (_) { payload = null; }
    }
    if (!payload?.image) return originalFetch(input, init);

    let blob;
    try { blob = dataUrlToBlob(payload.image); }
    catch (e) {
      return new Response(JSON.stringify({ model_status: 'CLIENT_ERROR', message: e.message }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const form = new FormData();
    form.append('file', blob, payload.filename || 'satellite-image.png');
    if (payload.userCoordinates?.latitude != null) form.append('latitude', String(payload.userCoordinates.latitude));
    if (payload.userCoordinates?.longitude != null) form.append('longitude', String(payload.userCoordinates.longitude));

    return originalFetch(`${API}/api/ml/analyze-image`, { method: 'POST', body: form });
  }

  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (!isSatelliteEndpoint(url)) return originalFetch(input, init);
    return adapt(input, init);
  };
})();
