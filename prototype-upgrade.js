/* SIH prototype control centre — frontend only. Backend/Render endpoints are not modified. */
(() => {
  const API=(window.CYCLONE_API_BASE||'https://ai-cyclone-prediction-api.onrender.com').replace(/\/$/,'');
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const style=document.createElement('style');
  style.textContent=`
  .proto-wrap{margin:22px 0;display:grid;gap:18px}.proto-card{background:linear-gradient(145deg,rgba(15,21,28,.98),rgba(8,12,17,.98));border:1px solid rgba(255,255,255,.09);border-radius:18px;padding:22px;box-shadow:0 18px 50px rgba(0,0,0,.18)}
  .proto-kicker{font-size:11px;letter-spacing:.16em;color:#9eea56;font-weight:800}.proto-card h2{margin:7px 0 8px;font-size:24px}.proto-muted{color:#9aa7b4;font-size:13px;line-height:1.55}.proto-problem{font-size:17px;line-height:1.55;font-weight:700;margin:14px 0}.proto-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.proto-stage{border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:16px;background:rgba(255,255,255,.025)}.proto-stage b{display:block;margin:6px 0}.proto-stage small{color:#8f9ba7}.proto-stage .num{font-size:12px;color:#9eea56;font-weight:900}.proto-status{display:flex;flex-wrap:wrap;gap:9px;margin-top:14px}.proto-pill{border:1px solid rgba(255,255,255,.1);border-radius:999px;padding:7px 11px;font-size:12px}.proto-pill.ok{border-color:rgba(158,234,86,.35);color:#baf47f}.proto-pill.warn{color:#ffd27a}.proto-infer{display:grid;grid-template-columns:1.1fr .9fr;gap:16px;margin-top:16px}.proto-drop{border:1px dashed rgba(158,234,86,.4);border-radius:14px;padding:20px;text-align:center;cursor:pointer;background:rgba(158,234,86,.03)}.proto-drop input{display:none}.proto-files{margin-top:9px;font-size:12px;color:#aab4bf}.proto-fields{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.proto-fields input{width:100%;box-sizing:border-box;background:#0b1117;color:#fff;border:1px solid rgba(255,255,255,.1);border-radius:9px;padding:10px}.proto-btn{border:0;border-radius:9px;padding:11px 15px;font-weight:800;cursor:pointer;background:#9eea56;color:#091009;margin-top:12px}.proto-result{border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:16px;min-height:180px}.proto-kpis{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;margin-top:12px}.proto-kpi{padding:11px;border-radius:10px;background:rgba(255,255,255,.035)}.proto-kpi small{display:block;color:#8f9ba7}.proto-kpi b{display:block;margin-top:4px}.proto-json{white-space:pre-wrap;word-break:break-word;font:11px/1.45 ui-monospace,SFMono-Regular,Consolas,monospace;color:#aebbc7;max-height:220px;overflow:auto;margin-top:12px}.proto-table{width:100%;border-collapse:collapse;margin-top:14px}.proto-table th,.proto-table td{padding:10px;border-bottom:1px solid rgba(255,255,255,.07);text-align:left;font-size:12px}.proto-table th{color:#9eea56}.proto-source{color:#8f9ba7;font-size:12px;margin-top:12px}.proto-source a{color:#baf47f}.proto-section-anchor{scroll-margin-top:90px}
  @media(max-width:900px){.proto-grid,.proto-infer{grid-template-columns:1fr 1fr}.proto-infer{grid-template-columns:1fr}.proto-grid{grid-template-columns:1fr 1fr}}
  @media(max-width:600px){.proto-grid,.proto-fields{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  function card(){
    const el=document.createElement('section');el.className='card proto-card proto-wrap proto-section-anchor';el.id='prototype';
    el.innerHTML=`
      <div><span class="proto-kicker">SIH PROTOTYPE / EXACT PROBLEM ALIGNMENT</span><h2>AI Cyclone Intelligence — Working Model Control Centre</h2>
      <p class="proto-problem">To develop an Artificial Intelligence (AI) / Machine Learning (ML) based system for identification, classification, and prediction of different tropical cyclone patterns using multi-source satellite data.</p>
      <p class="proto-muted">This control centre exposes the model that is actually connected to the current backend: three trained Keras stages, calibrated classification, regression-based movement/intensity deltas, and GIS hand-off. It does not create fake forecasts or alter the deployed backend.</p></div>
      <div class="proto-grid">
        <div class="proto-stage"><span class="num">01 / IDENTIFY</span><b>Stage 1 — Cyclone Detection</b><small>Image → 128×128×4 tensor → binary detection probability → cyclone / no cyclone gate.</small></div>
        <div class="proto-stage"><span class="num">02 / CLASSIFY</span><b>Stage 2 — Pattern Class</b><small>Three-frame sequence → temporal feature model → calibrated 3-class output: Weak / Moderate / Strong.</small></div>
        <div class="proto-stage"><span class="num">03 / PREDICT</span><b>Stage 3 — Movement + Intensity</b><small>Temporal model → latitude drift, longitude drift, wind change and MSLP change.</small></div>
        <div class="proto-stage"><span class="num">04 / VISUALIZE</span><b>GIS + Decision Support</b><small>Official observations stay separate; AI output can be plotted only when coordinates are supplied.</small></div>
      </div>
      <div id="protoStatus" class="proto-status"><span class="proto-pill">Checking backend…</span></div>
      <div class="proto-infer">
        <div>
          <label class="proto-drop" for="protoFrames"><input id="protoFrames" type="file" accept="image/png,image/jpeg,image/webp,image/tiff" multiple><b>Upload 1–3 satellite frames</b><div class="proto-muted">One frame = documented fallback. Three genuine consecutive frames = temporal inference mode.</div><div id="protoFiles" class="proto-files">No frames selected.</div></label>
          <div class="proto-fields"><input id="protoLat" type="number" step="0.00001" placeholder="Current latitude (optional)"><input id="protoLon" type="number" step="0.00001" placeholder="Current longitude (optional)"></div>
          <button id="protoRun" class="proto-btn">RUN REAL 3-STAGE MODEL</button>
          <div class="proto-source">Endpoint: <code>/api/ml/analyze-image</code> • Source label: AI MODEL OUTPUT • Demo flag is never changed by this frontend.</div>
        </div>
        <div class="proto-result"><b>INFERENCE RESULT</b><div id="protoKpis" class="proto-kpis"><div class="proto-kpi"><small>Status</small><b id="protoResultStatus">Waiting</b></div><div class="proto-kpi"><small>Detection</small><b id="protoDetection">—</b></div><div class="proto-kpi"><small>Pattern class</small><b id="protoClass">—</b></div><div class="proto-kpi"><small>Confidence</small><b id="protoConfidence">—</b></div><div class="proto-kpi"><small>Track drift</small><b id="protoDrift">—</b></div><div class="proto-kpi"><small>Next position</small><b id="protoNext">—</b></div></div><div id="protoJson" class="proto-json"></div></div>
      </div>
      <div style="margin-top:18px"><span class="proto-kicker">PROTOTYPE READINESS</span><table class="proto-table"><thead><tr><th>Capability</th><th>Current state</th><th>Truth label</th></tr></thead><tbody>
        <tr><td>Satellite image inference</td><td>Connected</td><td>Real 3-stage Keras model</td></tr>
        <tr><td>Three-frame temporal inference</td><td>Supported</td><td>Requires 3 genuine consecutive frames</td></tr>
        <tr><td>Official cyclone feed</td><td>Backend endpoint ready</td><td>Requires IMD API credentials</td></tr>
        <tr><td>Historical search</td><td>API route ready</td><td>Requires configured database</td></tr>
        <tr><td>Explainability heatmap</td><td>Not exposed by current API</td><td>Do not claim Grad-CAM yet</td></tr>
        <tr><td>Forecast skill metrics</td><td>Not published</td><td>Must be calculated on held-out storms</td></tr>
      </tbody></table></div>`;
    return el;
  }

  function insert(){
    if(document.getElementById('prototype'))return true;
    const anchor=document.querySelector('.statusgrid');
    if(!anchor)return false;
    anchor.insertAdjacentElement('afterend',card());
    bind();
    return true;
  }

  async function health(){
    const box=document.getElementById('protoStatus');if(!box)return;
    try{const r=await fetch(`${API}/api/health`,{cache:'no-store'});const d=await r.json();box.innerHTML=`<span class="proto-pill ok">● API ${esc(d.status||'ok')}</span><span class="proto-pill ${d.three_stage_ml?'ok':'warn'}">● 3-stage ML ${d.three_stage_ml?'READY':'NOT READY'}</span><span class="proto-pill ${d.imd_configured?'ok':'warn'}">● IMD ${d.imd_configured?'CONFIGURED':'KEY REQUIRED'}</span><span class="proto-pill ${d.database_configured?'ok':'warn'}">● DATABASE ${d.database_configured?'CONNECTED':'NOT CONFIGURED'}</span>`}catch(e){box.innerHTML='<span class="proto-pill warn">● API unavailable from browser</span>'}
  }

  function bind(){
    const input=document.getElementById('protoFrames'),filesBox=document.getElementById('protoFiles'),run=document.getElementById('protoRun');if(!input||run.__bound)return;run.__bound=true;
    input.onchange=()=>{const files=[...input.files].slice(0,3);filesBox.textContent=files.length?files.map((f,i)=>`${i+1}. ${f.name}`).join('  •  '):'No frames selected.'};
    run.onclick=async()=>{
      const files=[...input.files].slice(0,3);const status=document.getElementById('protoResultStatus');if(!files.length){status.textContent='Select 1–3 frames first.';return}
      status.textContent='Running…';document.getElementById('protoDetection').textContent='—';document.getElementById('protoClass').textContent='—';document.getElementById('protoConfidence').textContent='—';document.getElementById('protoDrift').textContent='—';document.getElementById('protoNext').textContent='—';
      const fd=new FormData();files.forEach(f=>fd.append('file',f));const lat=document.getElementById('protoLat').value,lon=document.getElementById('protoLon').value;if(lat!==''&&lon!==''){fd.append('latitude',lat);fd.append('longitude',lon)}
      try{const r=await fetch(`${API}/api/ml/analyze-image`,{method:'POST',body:fd,cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error(d.detail||`HTTP ${r.status}`);status.textContent=d.model_status||'MODEL OUTPUT';const s1=d.stage1||{};document.getElementById('protoDetection').textContent=s1.detected?`YES • ${s1.probability}%`:`NO • ${s1.probability}%`;document.getElementById('protoClass').textContent=d.classification||'—';document.getElementById('protoConfidence').textContent=d.confidence!=null?`${d.confidence}%`:'—';const s3=d.stage3||{};document.getElementById('protoDrift').textContent=s3.available?`${s3.latitude_drift_deg}°, ${s3.longitude_drift_deg}°`:'Not available';document.getElementById('protoNext').textContent=s3.next_position?`${s3.next_position.latitude}, ${s3.next_position.longitude}`:'Coordinates not supplied';document.getElementById('protoJson').textContent=JSON.stringify(d,null,2);window.dispatchEvent(new CustomEvent('ai-model-result',{detail:d}))}catch(e){status.textContent='MODEL ERROR';document.getElementById('protoJson').textContent=String(e.message||e)}
    };
    health();
  }

  function boot(){if(insert())return;new MutationObserver(()=>{if(insert())return}).observe(document.body,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
