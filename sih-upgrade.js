/* SIH 2026 product layer: search + upload + data + history. Frontend only. */
(() => {
  const API=(window.CYCLONE_API_BASE||'https://ai-cyclone-prediction-api.onrender.com').replace(/\/$/,'');
  window.CYCLONE_API_BASE=API;
  const q=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const css=document.createElement('link');css.rel='stylesheet';css.href='sih-upgrade.css';document.head.appendChild(css);

  function ensureIdentificationCard(){
    if(document.getElementById('sihIdentificationCard'))return;
    const anchor=q('#uploadClass')?.closest('.card, .panel, .glass, section')||q('#uploadClass')?.parentElement?.parentElement;
    const card=document.createElement('div');card.id='sihIdentificationCard';
    card.style.cssText='margin:16px 0;padding:20px 22px;border:1px solid rgba(255,255,255,.14);border-radius:18px;background:rgba(10,15,22,.82);box-shadow:0 12px 35px rgba(0,0,0,.22);display:flex;align-items:center;justify-content:space-between;gap:18px;';
    card.innerHTML='<div><div style="font-size:11px;letter-spacing:2px;opacity:.65;font-weight:700">STAGE 1 • IDENTIFICATION</div><div style="font-size:20px;font-weight:800;margin-top:5px">Cyclone Detection Gate</div><div id="sihIdentificationHint" style="font-size:12px;opacity:.68;margin-top:5px">Only a detected cyclone image can proceed to classification and prediction.</div></div><div id="sihIdentificationResult" style="font-size:24px;font-weight:900;min-width:220px;text-align:right">WAITING</div>';
    if(anchor&&anchor.parentElement)anchor.parentElement.insertBefore(card,anchor);else document.body.appendChild(card);
  }
  function updateIdentification(d){
    ensureIdentificationCard();const result=q('#sihIdentificationResult'),hint=q('#sihIdentificationHint');if(!result)return;
    if(!d){result.textContent='WAITING';return;}
    if(d.model_status==='MODEL_NOT_READY'){result.textContent='MODEL NOT READY';if(hint)hint.textContent='Required model artifacts are not ready.';return;}
    const detected=Boolean(d.stage1?.detected);result.textContent=detected?'YES — CYCLONE DETECTED':'INVALID IMAGE';
    if(hint)hint.textContent=detected?`Detection probability: ${d.stage1?.probability!=null?Number(d.stage1.probability).toFixed(2)+'%':'—'} • Continuing to Stage 2/3`:'No cyclone detected. Classification, intensity and track prediction have been blocked.';
  }
  ensureIdentificationCard();

  const fab=document.createElement('button');fab.className='sih-fab';fab.textContent='⚡ SIH AI Console';document.body.appendChild(fab);
  const drawer=document.createElement('div');drawer.className='sih-drawer';drawer.innerHTML=`<div class="sih-panel"><div class="sih-panel-head"><div><span class="sih-badge">SIH 2026 • RESEARCH MODE</span><h2>AI Cyclone Intelligence Console</h2></div><button class="sih-close">Close</button></div><div class="sih-grid"><div class="sih-box"><h3>🔎 Cyclone Search Engine</h3><div class="sih-search"><input id="sihSearch" placeholder="Search cyclone name, year, region or category…"><button class="sih-btn primary" id="sihSearchBtn">Search</button></div><div id="sihResults" class="sih-results"><div class="sih-status">Search uses the project API when configured. Otherwise it searches the local reference catalogue.</div></div></div><div class="sih-box"><h3>🛰️ Satellite / IR Image Analysis</h3><label class="sih-upload" for="sihImage"><input id="sihImage" type="file" accept="image/png,image/jpeg,image/webp,image/tiff"><b>Drop or choose satellite image</b><br><small>IR • Visible • Water Vapour • Cloud-Top BT</small></label><img id="sihPreview" class="sih-preview" alt="Satellite preview"><div id="sihImageStatus" class="sih-status">No image analysed.</div><div class="sih-kpis"><div class="sih-kpi">IDENTIFICATION<b id="sihDetection">WAITING</b></div><div class="sih-kpi">CLASS<b id="sihClass">—</b></div><div class="sih-kpi">CONFIDENCE<b id="sihConf">—</b></div></div></div><div class="sih-box"><h3>📊 Environmental Data Upload</h3><div class="sih-data-row"><input id="sihData" type="file" accept=".csv,.json,application/json,text/csv"><button class="sih-btn" id="sihDataBtn">Validate Data</button></div><div id="sihDataStatus" class="sih-status">Expected fields: timestamp, latitude, longitude, wind, pressure, sst, humidity. NetCDF support is reserved for the training pipeline.</div></div><div class="sih-box"><h3>🧠 Model Transparency</h3><div class="sih-status"><b>Pipeline</b><br>Multi-source data → preprocessing → detection → pattern classification → intensity → track prediction → uncertainty → GIS/XAI.<br><br><b>Safety</b><br>Outputs are decision-support/research results. Official warnings remain with IMD/RSMC.</div></div></div><div class="sih-box" style="margin-top:16px"><h3>🗂️ Analysis History</h3><div id="sihHistory"><div class="sih-status">No browser-saved analyses yet.</div></div></div></div>`;document.body.appendChild(drawer);
  fab.onclick=()=>drawer.classList.add('open');q('.sih-close').onclick=()=>drawer.classList.remove('open');drawer.onclick=e=>{if(e.target===drawer)drawer.classList.remove('open')};
  const local=[{name:'Cyclone reference catalogue',year:'—',region:'North Indian Ocean',category:'Search API ready',source:'Project database'}];
  function renderResults(items){q('#sihResults').innerHTML=items.length?items.map(x=>`<div class="sih-result" data-lat="${esc(x.lat)}" data-lon="${esc(x.lon)}"><b>${esc(x.name||x.cyclone_name||'Cyclonic System')}</b><br><small>${esc(x.year||'')} ${esc(x.region||'')} • ${esc(x.category||x.Category||'')}</small></div>`).join(''):'<div class="sih-status">No matching cyclone found.</div>';document.querySelectorAll('.sih-result').forEach(el=>el.onclick=()=>{const lat=Number(el.dataset.lat),lon=Number(el.dataset.lon);if(Number.isFinite(lat)&&Number.isFinite(lon)&&window.cycloneMapInstance?.setView)window.cycloneMapInstance.setView([lat,lon],7)});}
  async function search(){const term=q('#sihSearch').value.trim();if(!term){renderResults(local);return}q('#sihResults').innerHTML='<div class="sih-status">Searching…</div>';try{const r=await fetch(`${API}/api/cyclones/search?q=${encodeURIComponent(term)}`,{cache:'no-store'});if(!r.ok)throw 0;renderResults(await r.json())}catch{renderResults(local.filter(x=>JSON.stringify(x).toLowerCase().includes(term.toLowerCase())));}}
  q('#sihSearchBtn').onclick=search;q('#sihSearch').onkeydown=e=>{if(e.key==='Enter')search()};renderResults(local);
  function saveHistory(entry){const a=JSON.parse(localStorage.getItem('sihCycloneAnalyses')||'[]');a.unshift(entry);localStorage.setItem('sihCycloneAnalyses',JSON.stringify(a.slice(0,12)));renderHistory()}
  function renderHistory(){const a=JSON.parse(localStorage.getItem('sihCycloneAnalyses')||'[]');q('#sihHistory').innerHTML=a.length?`<table class="sih-history"><thead><tr><th>TIME</th><th>FILE</th><th>RESULT</th><th>STATUS</th></tr></thead><tbody>${a.map(x=>`<tr><td>${esc(x.time)}</td><td>${esc(x.file)}</td><td>${esc(x.result)}</td><td><span class="sih-badge ${x.demo?'demo':''}">${x.status}</span></td></tr>`).join('')}</tbody></table>`:'<div class="sih-status">No browser-saved analyses yet.</div>'}
  async function analyseFile(file, previewEl, statusEl, modelEl, classEl, confEl){
    if(!file)return;
    if(previewEl){previewEl.src=URL.createObjectURL(file);previewEl.style.display='block'}
    if(statusEl)statusEl.textContent='Connecting to Render AI service…';if(modelEl)modelEl.textContent='RUNNING';
    const fd=new FormData();fd.append('file',file);
    try{
      const r=await fetch(`${API}/api/ml/analyze-image`,{method:'POST',body:fd,cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.detail||`HTTP ${r.status}`);
      updateIdentification(d);const detected=Boolean(d.stage1?.detected);const detectionText=detected?'YES — CYCLONE DETECTED':'INVALID IMAGE';
      if(q('#sihDetection'))q('#sihDetection').textContent=detectionText;if(modelEl)modelEl.textContent=d.model_status||'AI MODEL';
      if(!detected){
        if(classEl)classEl.textContent='INVALID IMAGE';if(confEl)confEl.textContent='—';if(statusEl)statusEl.textContent='⚠ Invalid image: no cyclone detected. No classification or prediction generated.';
        saveHistory({time:new Date().toLocaleString('en-IN'),file:file.name,result:'INVALID IMAGE — NO CYCLONE',status:'REJECTED',demo:false});
        window.dispatchEvent(new CustomEvent('ai-model-result',{detail:{...d,valid_cyclone_image:false,blocked:true}}));return d;
      }
      if(classEl)classEl.textContent=d.classification||'—';if(confEl)confEl.textContent=d.confidence!=null?`${d.confidence}%`:'—';if(statusEl)statusEl.textContent=d.message||'Real AI analysis complete.';
      window.dispatchEvent(new CustomEvent('ai-model-result',{detail:d}));saveHistory({time:new Date().toLocaleString('en-IN'),file:file.name,result:detectionText,status:d.model_status||'MODEL OUTPUT',demo:Boolean(d.demo)});return d;
    }catch(e){updateIdentification(null);if(q('#sihDetection'))q('#sihDetection').textContent='ERROR';if(modelEl)modelEl.textContent='AI ERROR';if(classEl)classEl.textContent='—';if(confEl)confEl.textContent='—';if(statusEl)statusEl.textContent=`ML backend error: ${e.message}`;saveHistory({time:new Date().toLocaleString('en-IN'),file:file.name,result:'Not analysed',status:'ML ERROR',demo:false});}
  }
  q('#sihImage').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;await analyseFile(file,q('#sihPreview'),q('#sihImageStatus'),q('#sihModel'),q('#sihClass'),q('#sihConf'));};
  q('#sihDataBtn').onclick=async()=>{const file=q('#sihData').files?.[0];if(!file){q('#sihDataStatus').textContent='Choose a CSV or JSON file first.';return}const text=await file.text();let ok=false,count=0;try{if(file.name.toLowerCase().endsWith('.json')){const d=JSON.parse(text);count=Array.isArray(d)?d.length:(Array.isArray(d.data)?d.data.length:1);ok=true}else{const lines=text.split(/\r?\n/).filter(Boolean);const headers=(lines[0]||'').toLowerCase().split(',').map(x=>x.trim());const required=['timestamp','latitude','longitude'];ok=required.every(x=>headers.includes(x));count=Math.max(0,lines.length-1)}q('#sihDataStatus').textContent=ok?`✓ Validated ${count} record(s). Ready for API/training pipeline.`:'⚠ Missing required fields. Need timestamp, latitude and longitude.'}catch{q('#sihDataStatus').textContent='⚠ Invalid CSV/JSON format.'}};

  function bindMainDashboardUpload(){
    const input=q('#imageInput');if(!input||input.__mainUploadBound)return;input.__mainUploadBound=true;
    input.addEventListener('change',async()=>{
      const file=input.files?.[0];if(!file)return;q('#fileName').textContent=file.name;q('#uploadClass').textContent='Analysing…';q('#uploadPattern').textContent='RUNNING';q('#uploadWind').textContent='—';q('#uploadPressure').textContent='—';q('#uploadConfidence').textContent='—';q('#uploadRisk').textContent='—';
      const result=await analyseFile(file,null,null,null,null,null);if(!result){q('#uploadClass').textContent='AI ERROR';q('#uploadPattern').textContent='Backend unavailable';return;}
      const detected=Boolean(result.stage1?.detected);
      if(!detected){
        q('#uploadClass').textContent='INVALID IMAGE';q('#uploadPattern').textContent='No cyclone detected';q('#uploadWind').textContent='BLOCKED';q('#uploadPressure').textContent='BLOCKED';q('#uploadConfidence').textContent='—';q('#uploadRisk').textContent='REJECTED';q('#modelForecastStatus').textContent='Analysis blocked — invalid image';q('#analysisClass').textContent='INVALID IMAGE';q('#snapshotPattern').textContent='No cyclone detected';q('#snapshotConfidence').textContent='—';updateIdentification(result);return;
      }
      q('#uploadClass').textContent=result.classification||'CYCLONE DETECTED';q('#uploadPattern').textContent=result.classification||'Cyclonic pattern';q('#uploadWind').textContent=result.stage3?.wind_change_kt!=null?`${Number(result.stage3.wind_change_kt).toFixed(2)} kt Δ`:'Not estimated';q('#uploadPressure').textContent=result.stage3?.mslp_change_hpa!=null?`${Number(result.stage3.mslp_change_hpa).toFixed(2)} hPa Δ`:'Not estimated';q('#uploadConfidence').textContent=result.confidence!=null?`${Number(result.confidence).toFixed(2)}%`:'—';q('#uploadRisk').textContent=`${Number(result.stage1?.probability||0).toFixed(2)}% detection`;q('#modelForecastStatus').textContent=result.model_status==='MODEL_OUTPUT'?'Real 3-stage Keras model output received':(result.model_status||'Backend response received');q('#analysisClass').textContent=result.classification||'Waiting';q('#snapshotPattern').textContent=result.classification||'—';q('#snapshotConfidence').textContent=result.confidence!=null?`${result.confidence}%`:'—';updateIdentification(result);
    });
  }
  bindMainDashboardUpload();new MutationObserver(()=>{bindMainDashboardUpload();ensureIdentificationCard()}).observe(document.body,{childList:true,subtree:true});renderHistory();window.SIHUpgrade={open:()=>drawer.classList.add('open'),search};const proto=document.createElement('script');proto.defer=true;proto.src='prototype-upgrade.js';document.head.appendChild(proto);
})();
