/* Frontend bridge: keeps GitHub Pages simple while routing live IMD calls through FastAPI when configured. */
(() => {
  const api = (window.CYCLONE_API_BASE || '').replace(/\/$/, '');
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
  const wait = setInterval(() => {
    const el = document.getElementById('cycloneMap');
    if (el && window.L && el._leaflet_id) {
      // Leaflet stores the map instance internally only through event state; this bridge
      // creates a public reference when the dashboard exposes one in future versions.
      clearInterval(wait);
    }
  }, 250);
})();
