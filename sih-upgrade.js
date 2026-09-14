/* SIH 2026 product layer: search + upload + data + history. Frontend only. */
(() => {
  const API=(window.CYCLONE_API_BASE||'https://ai-cyclone-prediction-api.onrender.com').replace(/\/$/,'');
  window.CYCLONE_API_BASE=API;
  const q=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const css=document.createElement('link');css.rel='stylesheet';css.href='sih-upgrade.css';document.head.appendChild(css);

  /* Frontend-only visual gate.
     This is deliberately conservative: it rejects obvious photographs/posters/screenshots
     before the ML service is called, but does not claim that a browser heuristic can prove
     a meteorological cyclone. The trained model remains the final AI analysis layer. */
  async function verifyCycloneImage(file){
    return new Promise(resolve=>{
      const img=new Image();
      const url=URL.createObjectURL(file);
      img.onload=()=>{
        try{
          const max=320, scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
          const w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale));
          const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});
          ctx.drawImage(img,0,0,w,h);const p=ctx.getImageData(0,0,w,h).data;let n=0,skin=0,sat=0,bright=0,edge=0,gray=0;
          const lum=new Float32Array(w*h);
          for(let y=0;y<h;y++)for(let x=0;x<w;x++){
            const i=(y*w+x)*4,r=p[i],g=p[i+1],b=p[i+2];
            const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;
            const l=(0.299*r+0.587*g+0.114*b)/255;lum[y*w+x]=l;n++;if(d>38)sat++;if(l>.88)bright++;if(Math.abs(r-g)<35&&r>95&&g>55&&b<g*1.15&&r>g*1.12)skin++;if(Math.abs(r-g)<12&&Math.abs(g-b)<12)gray++;
            if(x>0&&y>0){const prev=lum[y*w+x-1],up=lum[(y-1)*w+x];if(Math.abs(l-prev)>.22||Math.abs(l-up)>.22)edge++;}
          }
          const skinPct=skin/n, satPct=sat/n, brightPct=bright/n, edgePct=edge/Math.max(1,n), grayPct=gray/n;
          const aspect=Math.max(w,h)/Math.max(1,Math.min(w,h));
          let reasons=[],score=0;
          if(skinPct>.075){score+=3;reasons.push('human/skin-like regions');}
          if(edgePct>.20&&brightPct>.30){score+=2;reasons.push('poster/text-like high-contrast structure');}
          if(satPct>.62){score+=1;reasons.push('strong photographic colour distribution');}
          if(aspect>2.2){score+=1;reasons.push('poster/banner-like aspect ratio');}
          const meteorologyLike=(grayPct>.32||satPct<.50)&&edgePct<.24;
          if(meteorologyLike)score-=1;
          const obviousNonSatellite=score>=3;
          URL.revokeObjectURL(url);
          resolve({pass:!obviousNonSatellite,score,reasons,metrics:{skinPct,satPct,brightPct,edgePct,grayPct,aspect}});
        }catch{URL.revokeObjectURL(url);resolve({pass:true,score:0,reasons:[],metrics:{}})}
      };
      img.onerror=()=>{URL.revokeObjectURL(url);resolve({pass:false,score:99,reasons:['image could not be decoded'],metrics:{}})};
      img.src=url;
    });
  }

  function ensureIdentificationCard(){
    if(document.getElementById('sihIdentificationCard'))return;
    const anchor=q('#uploadClass')?.closest('.card, .panel, .glass, section')||q('#uploadClass')?.parentElement?.parentElement;
    const card=document.createElement('div');card.id='sihIdentificationCard';
    card.style.cssText='margin:16px 0;padding:20px 22px;border:1px solid rgba(255,255,255,.14);border-radius:18px;background:rgba(10,15,22,.82);box-shadow:0 12px 35px rgba(0,0,0,.22);display:flex;align-items:center;justify-content:space-between;gap:18px;';
    card.innerHTML='<div><div style="font-size:11px;letter-spacing:2px;opacity:.65;font-weight:700">STAGE 0 • IMAGE VERIFICATION</div><div style="font-size:20px;font-weight:800;margin-top:5px">General Cyclone Image Check</div><div id="sihIdentificationHint" style="font-size:12px;opacity:.68;margin-top:5px">The browser first screens obvious human photos, posters and unrelated images before AI analysis.</div></div><div id="sihIdentificationResult" style="font-size:24px;font-weight:900;min-width:220px;text-align:right">WAITING</div>';
    if(anchor&&anchor.parentElement)anchor.parentElement.insertBefore(card,anchor);else document.body.appendChild(card);
  }
  function updateIdentification(d){
    ensureIdentificationCard();const result=q('#sihIdentificationResult'),hint=q('#sihIdentificationHint');if(!result)return;
    if(!d){result.textContent='WAITING';return;}
    if(d.frontend_verification?.status==='REJECTED'){result.textContent='❌ NOT A CYCLONE IMAGE';if(hint)hint.textContent=d.frontend_verification.reason||'Image rejected before AI analysis.';return;}
    if(d.frontend_verification?.status==='PASSED'){result.textContent='✓ IMAGE CHECK PASSED';if(hint)hint.textContent='Visual pre-check passed. Sending image to the trained cyclone model.';return;}
    if(d.model_status==='MODEL_NOT_READY'){result.textContent='MODEL NOT READY';if(hint)hint.textContent='Required model artifacts are not ready.';return;}
    const detected=Boolean(d.stage1?.detected);result.textContent=detected?'YES — CYCLONE DETECTED':'INVALID IMAGE';
    if(hint)hint.textContent=detected?`Detection probability: ${d.stage1?.probability!=null?Number(d.stage1.probability).toFixed(2)+'%':'—'} • Continuing to Stage 2/3`:'No cyclone detected. Classification, intensity and track prediction have been blocked.';
  }
  ensureIdentificationCard();

  const fab=document.createElement('button');fab.className='sih-fab';fab.textContent='⚡ SIH AI Console';document.body.appendChild(fab);
  const drawer=document.createElement('div');drawer.className='sih-drawer';drawer.innerHTML=`<div class="sih-panel"><div class="sih-panel-head"><div><span class="sih-badge">SIH 2026 • RESEARCH MODE</span><h2>AI Cyclone Intelligence Console</h2></div><button class="sih-close">Close</button></div><div class="sih-grid"><div class="sih-box"><h3>🔎 Cyclone Search Engine</h3><div class="sih-search"><input id="sihSearch" placeholder="Search cyclone name, year, region or category…"><button class="sih-btn primary" id="sihSearchBtn">Search</button></div><div id="sihResults" class="sih-results"><div class="sih-status">Search uses the project API when configured. Otherwise it searches the local reference catalogue.</div></div></div><div class="sih-box"><h3>🛰️ Satellite / IR Image Analysis</h3><label class="sih-upload" for="sihImage"><input id="sihImage" type="file" accept="image/png,image/jpeg,image/webp,image/tiff"><b>Drop or choose satellite image</b><br><small>IR • Visible • Water Vapour • Cloud-Top BT</small></label><img id="sihPreview" class="sih-preview" alt="Satellite preview"><div id="sihImageStatus" class="sih-status">No image analysed.</div><div class="sih-kpis"><div class="sih-kpi">IDENTIFICATION<b id="sihDetection">WAITING</b></div><div class="sih-kpi">CLASS<b id="sihClass">—</b></div><div class="sih-kpi">CONFIDENCE<b id="sihConf">—</b></div></div></div><div class="sih-box"><h3>📊 Environmental Data Upload</h3><div class="sih-data-row"><input id="sihData" type="file" accept=".csv,.json,application/json,text/csv"><button class="sih-btn" id="sihDataBtn">Validate Data</button></div><div id="sihDataStatus" class="sih-status">Expected fields: timestamp, latitude, longitude, wind, pressure, sst, humidity. NetCDF support is reserved for the training pipeline.</div></div><div class="sih-box"><h3>🧠 Model Transparency</h3><div class="sih-status"><b>Pipeline</b><br>Visual pre-check → multi-source preprocessing → detection → pattern classification → intensity → track prediction → uncertainty → GIS/XAI.<br><br><b>Safety</b><br>Outputs are decision-support/research results. Official warnings remain with IMD/RSMC.</div></div></div><div class="sih-box" style="margin-top:16px"><h3>🗂️ Analysis History</h3><div id="sihHistory"><div class="sih-status">No browser-saved analyses yet.</div></div></div></div>`;document.body.appendChild(drawer);
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
    if(statusEl)statusEl.textContent='Running general image verification…';if(modelEl)modelEl.textContent='VERIFYING';updateIdentification({frontend_verification:{status:'CHECKING'}});

    const verification=await verifyCycloneImage(file);
    if(!verification.pass){
      const reason=`Image rejected before AI analysis: ${verification.reasons.join(', ')||'visual content is inconsistent with a satellite/weather image'}.`;
      const blocked={frontend_verification:{status:'REJECTED',reason},model_status:'FRONTEND_REJECTED',stage1:{detected:false,probability:0}};
      updateIdentification(blocked);
      if(q('#sihDetection'))q('#sihDetection').textContent='❌ NOT A CYCLONE IMAGE';
      if(modelEl)modelEl.textContent='BLOCKED';if(classEl)classEl.textContent='NOT A CYCLONE IMAGE';if(confEl)confEl.textContent='—';if(statusEl)statusEl.textContent='⚠ '+reason;
      saveHistory({time:new Date().toLocaleString('en-IN'),file:file.name,result:'NOT A CYCLONE IMAGE — FRONTEND BLOCKED',status:'REJECTED',demo:false});
      window.dispatchEvent(new CustomEvent('ai-model-result',{detail:blocked}));
      return blocked;
    }
    const verificationPassed={frontend_verification:{status:'PASSED'}};updateIdentification(verificationPassed);
    if(statusEl)statusEl.textContent='Visual check passed. Connecting to Render AI service…';if(modelEl)modelEl.textContent='RUNNING';
    const fd=new FormData();fd.append('file',file);
    try{
      const r=await fetch(`${API}/api/ml/analyze-image`,{method:'POST',body:fd,cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.detail||`HTTP ${r.status}`);
      d.frontend_verification={status:'PASSED'};updateIdentification(d);const detected=Boolean(d.stage1?.detected);const detectionText=detected?'YES — CYCLONE DETECTED':'INVALID IMAGE';
      if(q('#sihDetection'))q('#sihDetection').textContent=detected?detectionText:'INVALID IMAGE';if(modelEl)modelEl.textContent=d.model_status||'AI MODEL';
      if(!detected){
        if(classEl)classEl.textContent='INVALID IMAGE';if(confEl)confEl.textContent='—';if(statusEl)statusEl.textContent='⚠ Visual check passed, but the trained cyclone detector rejected the image. No classification or prediction generated.';
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
      const file=input.files?.[0];if(!file)return;q('#fileName').textContent=file.name;q('#uploadClass').textContent='Verifying image…';q('#uploadPattern').textContent='VERIFYING';q('#uploadWind').textContent='—';q('#uploadPressure').textContent='—';q('#uploadConfidence').textContent='—';q('#uploadRisk').textContent='—';
      const result=await analyseFile(file,null,null,null,null,null);if(!result){q('#uploadClass').textContent='AI ERROR';q('#uploadPattern').textContent='Backend unavailable';return;}
      if(result.frontend_verification?.status==='REJECTED'){
        q('#uploadClass').textContent='NOT A CYCLONE IMAGE';q('#uploadPattern').textContent='Frontend verification failed';q('#uploadWind').textContent='BLOCKED';q('#uploadPressure').textContent='BLOCKED';q('#uploadConfidence').textContent='—';q('#uploadRisk').textContent='REJECTED';q('#modelForecastStatus').textContent='Analysis blocked — image failed visual verification';q('#analysisClass').textContent='NOT A CYCLONE IMAGE';q('#snapshotPattern').textContent='Visual verification failed';q('#snapshotConfidence').textContent='—';updateIdentification(result);return;
      }
      const detected=Boolean(result.stage1?.detected);
      if(!detected){
        q('#uploadClass').textContent='INVALID IMAGE';q('#uploadPattern').textContent='No cyclone detected';q('#uploadWind').textContent='BLOCKED';q('#uploadPressure').textContent='BLOCKED';q('#uploadConfidence').textContent='—';q('#uploadRisk').textContent='REJECTED';q('#modelForecastStatus').textContent='Analysis blocked — invalid image';q('#analysisClass').textContent='INVALID IMAGE';q('#snapshotPattern').textContent='No cyclone detected';q('#snapshotConfidence').textContent='—';updateIdentification(result);return;
      }
      q('#uploadClass').textContent=result.classification||'CYCLONE DETECTED';q('#uploadPattern').textContent=result.classification||'Cyclonic pattern';q('#uploadWind').textContent=result.stage3?.wind_change_kt!=null?`${Number(result.stage3.wind_change_kt).toFixed(2)} kt Δ`:'Not estimated';q('#uploadPressure').textContent=result.stage3?.mslp_change_hpa!=null?`${Number(result.stage3.mslp_change_hpa).toFixed(2)} hPa Δ`:'Not estimated';q('#uploadConfidence').textContent=result.confidence!=null?`${Number(result.confidence).toFixed(2)}%`:'—';q('#uploadRisk').textContent=`${Number(result.stage1?.probability||0).toFixed(2)}% detection`;q('#modelForecastStatus').textContent=result.model_status==='MODEL_OUTPUT'?'Real 3-stage Keras model output received':(result.model_status||'Backend response received');q('#analysisClass').textContent=result.classification||'Waiting';q('#snapshotPattern').textContent=result.classification||'—';q('#snapshotConfidence').textContent=result.confidence!=null?`${result.confidence}%`:'—';updateIdentification(result);
    });
  }
  bindMainDashboardUpload();new MutationObserver(()=>{bindMainDashboardUpload();ensureIdentificationCard()}).observe(document.body,{childList:true,subtree:true});renderHistory();window.SIHUpgrade={open:()=>drawer.classList.add('open'),search};const proto=document.createElement('script');proto.defer=true;proto.src='prototype-upgrade.js';document.head.appendChild(proto);
})();
