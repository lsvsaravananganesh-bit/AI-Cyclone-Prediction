/* Frontend bridge: connects the dashboard to the deployed FastAPI backend and exposes the existing Leaflet map to optional SIH layers. */
(() => {
  const configured = (window.CYCLONE_API_BASE || '').trim();
  const api = (configured || 'https://ai-cyclone-prediction-api.onrender.com').replace(/\/$/, '');
  window.CYCLONE_API_BASE = api;
  const originalFetch = window.fetch.bind(window);
  if (api) {
    window.fetch = (input, init) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      if (url.includes('api.imd.gov.in/api/v1/cyclone_track')) {
        return originalFetch(`${api}/api/cyclones/active`, init).then(async r => {
          const payload = await r.clone().json().catch(() => ({}));
          if (payload.status === 'LIVE' && payload.systems?.[0]) {
            const s = payload.systems[0];
            return new Response(JSON.stringify({data:{observed:s.observed||[],forecast:s.forecast||[]}}), {status:200,headers:{'Content-Type':'application/json'}});
          }
          return new Response(JSON.stringify({data:{observed:[],forecast:[]}}), {status:200,headers:{'Content-Type':'application/json'}});
        });
      }
      return originalFetch(input, init);
    };
  }
  function installMapCapture(){
    if (!window.L || window.__cycloneMapCaptureInstalled) return;
    window.__cycloneMapCaptureInstalled = true;
    const originalMap = window.L.map;
    window.L.map = function(){
      const instance = originalMap.apply(this, arguments);
      window.cycloneMapInstance = instance;
      window.dispatchEvent(new CustomEvent('cyclone-map-ready', {detail: instance}));
      return instance;
    };
  }
  function loadAILayer(){
    if (window.__aiMapLayerLoaded) return;
    window.__aiMapLayerLoaded = true;
    const s = document.createElement('script');
    s.src = 'ai-map-layer.js';
    s.defer = true;
    document.head.appendChild(s);
  }
  const boot = () => {
    installMapCapture();
    if (window.cycloneMapInstance) loadAILayer();
  };
  if (window.L) boot(); else window.addEventListener('load', boot, {once:true});
  window.addEventListener('cyclone-map-ready', loadAILayer);
})();
