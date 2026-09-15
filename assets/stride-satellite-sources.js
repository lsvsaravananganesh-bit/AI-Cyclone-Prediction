(() => {
  'use strict';
  const sources = [
    {name:'MOSDAC / ISRO', type:'Official satellite-data source', url:'https://www.mosdac.gov.in/'},
    {name:'India Meteorological Department', type:'Official meteorological source', url:'https://mausam.imd.gov.in/'},
    {name:'NOAA / NESDIS', type:'International satellite source', url:'https://www.nesdis.noaa.gov/'},
    {name:'Zoom Earth', type:'Visual storm monitoring reference', url:'https://zoom.earth/storms/94a-2026/'}
  ];
  function add(){
    if(document.getElementById('strideSourcePanel')) return;
    const analysis=document.getElementById('analysis'); if(!analysis) return;
    const host=analysis.querySelector('.intel'); if(!host) return;
    const sec=document.createElement('section'); sec.id='strideSourcePanel';
    sec.innerHTML='<div class="heading" style="margin-top:22px"><h2 style="font-size:21px">🛰️ Satellite & Data Sources</h2><p>Source registry only. STRIDE does not present an external source as its own AI output.</p></div><div id="strideSourceGrid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px"></div>';
    host.appendChild(sec);
    const grid=sec.querySelector('#strideSourceGrid');
    sources.forEach(s=>{const a=document.createElement('a');a.href=s.url;a.target='_blank';a.rel='noopener noreferrer';a.style.cssText='display:block;text-decoration:none;color:#dff3ff;border:1px solid #ffffff10;border-radius:12px;padding:14px;background:#06172a';a.innerHTML=`<b>${s.name}</b><div style="margin-top:6px;color:#7897b5;font-size:11px">${s.type}</div>`;grid.appendChild(a);});
    const st=document.createElement('style');st.textContent='@media(max-width:900px){#strideSourceGrid{grid-template-columns:1fr 1fr!important}}@media(max-width:520px){#strideSourceGrid{grid-template-columns:1fr!important}}';document.head.appendChild(st);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add);else add();
})();
