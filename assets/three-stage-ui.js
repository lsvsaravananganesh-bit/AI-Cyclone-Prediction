(function(){
  const host=document.querySelector('#analysis .intel');
  if(!host || document.getElementById('threeStagePanel')) return;
  const panel=document.createElement('section');
  panel.id='threeStagePanel';
  panel.className='three-stage-panel';
  panel.innerHTML=`
    <div class="three-stage-head">
      <div><span class="eyebrow">AI DECISION PIPELINE</span><h2>Three-Stage Cyclone Intelligence</h2><p>Identification → Classification → Prediction</p></div>
      <span id="threeStageState" class="three-stage-state">Waiting for analysis</span>
    </div>
    <div class="three-stage-grid">
      <article class="stage-card" data-stage="1"><div class="stage-number">01</div><div><span class="stage-label">STAGE 1</span><h3>Identification</h3><p>Determines whether the verified satellite observation contains a cyclone pattern.</p><strong id="stage1Value">Awaiting satellite analysis</strong><small id="stage1Meta">Detection probability: —</small></div></article>
      <article class="stage-card" data-stage="2"><div class="stage-number">02</div><div><span class="stage-label">STAGE 2</span><h3>Classification</h3><p>Identifies the cyclone class/type and confidence from the ML model.</p><strong id="stage2Value">Awaiting identification</strong><small id="stage2Meta">Confidence: —</small></div></article>
      <article class="stage-card" data-stage="3"><div class="stage-number">03</div><div><span class="stage-label">STAGE 3</span><h3>Prediction</h3><p>Estimates storm movement/intensity information and risk from the available sequence.</p><strong id="stage3Value">Awaiting classification</strong><small id="stage3Meta">Next position: —</small></div></article>
    </div>`;
  host.parentNode.insertBefore(panel,host);
  const style=document.createElement('style');
  style.textContent=`
  .three-stage-panel{margin-top:22px;padding:20px;border:1px solid #ffffff12;border-radius:16px;background:linear-gradient(180deg,#081d32,#061425);box-shadow:0 20px 55px #0005}
  .three-stage-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:16px}.three-stage-head h2{margin:4px 0 4px;font-size:22px}.three-stage-head p{margin:0;color:#8fa8c1;font-size:13px}.eyebrow,.stage-label{font-size:10px;letter-spacing:.12em;color:#5cf0ad;font-weight:800}.three-stage-state{padding:8px 11px;border:1px solid #ffffff12;border-radius:9px;color:#8fa8c1;font-size:12px;white-space:nowrap}.three-stage-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.stage-card{display:grid;grid-template-columns:auto 1fr;gap:13px;padding:17px;border:1px solid #ffffff10;border-radius:13px;background:#06172a;min-height:180px}.stage-number{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:#0c3151;color:#52b8ff;font-weight:900}.stage-card h3{margin:4px 0 6px;font-size:17px}.stage-card p{margin:0 0 13px;color:#829db7;font-size:12px;line-height:1.55}.stage-card strong{display:block;color:#eaf7ff;font-size:15px}.stage-card small{display:block;color:#7894ae;margin-top:6px;font-size:11px}.stage-card.ready{border-color:#1c7a5b66;box-shadow:inset 0 0 0 1px #1c7a5b33}.stage-card.rejected{border-color:#a9344f88}.stage-card.detected{border-color:#52b8ff66}
  @media(max-width:900px){.three-stage-grid{grid-template-columns:1fr}.three-stage-head{flex-direction:column}.three-stage-state{white-space:normal}}
  `;
  document.head.appendChild(style);
  function pick(...v){return v.find(x=>x!==undefined&&x!==null&&x!=='')}
  function pct(v){return v==null?'—':(Number(v)<=1?(Number(v)*100).toFixed(1):Number(v).toFixed(1))+'%'}
  function update(data){
    const a=data&&data.three_stage&&data.three_stage.identification||data&&data.identification||data&&data.stage1||{};
    const b=data&&data.three_stage&&data.three_stage.classification||data&&data.classification||data&&data.stage2||{};
    const c=data&&data.three_stage&&data.three_stage.prediction||data&&data.prediction||data&&data.stage3||{};
    const detected=pick(a.cyclone_detected,data&&data.cyclone_detected);
    const label=pick(b.label,b.classification,b.name);
    const confidence=pick(b.confidence_percent,b.confidence,b.classification_confidence);
    const next=pick(c.next_position);
    const risk=pick(c.risk_level,data&&data.risk_level);
    const wind=pick(c.maximum_wind_kmh,data&&data.maximum_wind_kmh);
    const state=document.getElementById('threeStageState');
    if(!data){state.textContent='Waiting for analysis';return}
    if(data.model_status==='INPUT_REJECTED'){state.textContent='Input rejected';panel.classList.add('rejected');return}
    state.textContent=detected===true?'Cyclone pattern detected':'Analysis complete';
    document.getElementById('stage1Value').textContent=detected===true?'CYCLONE DETECTED':detected===false?'NO CYCLONE DETECTED':'Verification result received';
    document.getElementById('stage1Meta').textContent='Detection probability: '+pct(pick(a.probability_percent,a.probability,a.confidence_percent));
    document.getElementById('stage2Value').textContent=label||'Classification unavailable';
    document.getElementById('stage2Meta').textContent='Confidence: '+pct(confidence);
    document.getElementById('stage3Value').textContent=next?('Next position: '+(typeof next==='object'?JSON.stringify(next):next)):(risk?('Risk: '+risk):(wind!=null?('Max wind: '+wind+' km/h'):'Prediction data unavailable'));
    document.getElementById('stage3Meta').textContent='Risk: '+(risk||'—')+' • Wind: '+(wind!=null?wind+' km/h':'—');
    panel.querySelectorAll('.stage-card').forEach(x=>x.classList.add('ready'));
    if(detected===true) panel.querySelector('[data-stage="1"]').classList.add('detected');
  }
  const previous=window.setIntel;
  if(typeof previous==='function') window.setIntel=function(data){previous(data);update(data)};
  window.addEventListener('stride:analysis-result',e=>update(e.detail));
})();
