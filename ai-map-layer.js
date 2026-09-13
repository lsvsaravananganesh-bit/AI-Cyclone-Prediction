/* SIH AI Detection + Classification map layer.
   Default visualization is explicitly DEMO data. Replace DEMO_POINT/DEMO_TRACK
   with validated model output when the trained inference service is connected. */
(function(){
  const DEMO_TRACK=[
    {lat:12.80,lon:86.20,wind:45,class:'Depression',label:'IDENTIFICATION'},
    {lat:13.35,lon:85.45,wind:55,class:'Deep Depression',label:'CLASSIFICATION'},
    {lat:14.05,lon:84.70,wind:75,class:'Cyclonic Storm',label:'CLASSIFICATION'},
    {lat:14.75,lon:84.05,wind:105,class:'Severe Cyclonic Storm',label:'CLASSIFICATION'},
    {lat:15.45,lon:83.35,wind:125,class:'Very Severe Cyclonic Storm',label:'AI PREDICTION'}
  ];
  const DEMO_POINT=DEMO_TRACK[3];
  let layers=[];
  const waitForMap=()=>{
    const map=window.cycloneMapInstance;
    if(!map || !window.L){setTimeout(waitForMap,150);return;}
    render(map);
  };
  function badgeIcon(text,kind){
    return L.divIcon({className:'ai-map-badge-icon',iconSize:[170,54],iconAnchor:[85,27],html:`<div class="ai-map-badge ${kind||''}"><span>${text}</span></div>`});
  }
  function render(map){
    if(map.__aiDetectionLayerRendered)return;
    map.__aiDetectionLayerRendered=true;
    const group=L.layerGroup().addTo(map);layers.push(group);
    const latlngs=DEMO_TRACK.map(p=>[p.lat,p.lon]);
    L.polyline(latlngs,{color:'#ff5b5b',weight:3,dashArray:'6 7',opacity:.9}).addTo(group);
    DEMO_TRACK.forEach((p,i)=>{
      const marker=L.circleMarker([p.lat,p.lon],{radius:i===DEMO_POINT?8:5,color:'#ff5b5b',fillColor:'#ff5b5b',fillOpacity:.9,weight:2}).addTo(group);
      marker.bindPopup(`<div style="min-width:190px"><b>${p.label==='AI PREDICTION'?'AI PREDICTION':'AI CLASSIFICATION'}</b><br><strong>${p.class}</strong><br>Wind: ${p.wind} km/h<br>Position: ${p.lat.toFixed(4)}°N, ${p.lon.toFixed(4)}°E<br><small>DEMO / SAMPLE DATA — not an official warning</small></div>`);
    });
    const detection=L.marker([DEMO_POINT.lat,DEMO_POINT.lon],{icon:badgeIcon('AI DETECTED • DEMO','detected'),zIndexOffset:2000}).addTo(group);
    detection.bindPopup(`<div style="min-width:230px"><b>🔎 AI CYCLONE DETECTION</b><br><strong>Cyclone detected in satellite-analysis demo</strong><br>Classification: <strong>${DEMO_POINT.class}</strong><br>Wind: ${DEMO_POINT.wind} km/h<br>Coordinates: ${DEMO_POINT.lat.toFixed(4)}°N, ${DEMO_POINT.lon.toFixed(4)}°E<br><small>DEMO / SAMPLE MODEL OUTPUT. Replace with trained-model output for real inference.</small></div>`);
    L.marker([DEMO_POINT.lat,DEMO_POINT.lon],{icon:badgeIcon(DEMO_POINT.class,'classification'),zIndexOffset:1999}).addTo(group);
    const uncertainty=L.circle([DEMO_TRACK[DEMO_TRACK.length-1].lat,DEMO_TRACK[DEMO_TRACK.length-1].lon],{radius:95000,color:'#ffbd38',weight:1,dashArray:'5 6',fillColor:'#ffbd38',fillOpacity:.05}).addTo(group);
    const control=L.control({position:'topright'});
    control.onAdd=function(){const d=L.DomUtil.create('div','ai-map-panel');d.innerHTML=`<div class="ai-map-title">AI CYCLONE INTELLIGENCE</div><div class="ai-map-row"><span class="ai-dot detect"></span><b>AI DETECTION</b><em>DEMO</em></div><div class="ai-map-row"><span class="ai-dot classdot"></span><b>CLASSIFICATION</b><em>${DEMO_POINT.class}</em></div><div class="ai-map-row"><span class="ai-dot pred"></span><b>AI PREDICTION</b><em>TRACK</em></div><div class="ai-map-note">Satellite → Detection → Classification → Prediction → Track</div>`;L.DomEvent.disableClickPropagation(d);return d;};
    control.addTo(map);
    const legend=L.control({position:'bottomleft'});
    legend.onAdd=function(){const d=L.DomUtil.create('div','ai-map-legend');d.innerHTML='<b>AI LAYER</b><span><i class="det"></i> Detected center</span><span><i class="cls"></i> Classification points</span><span><i class="predline"></i> AI sample trajectory</span><small>DEMO / SAMPLE DATA</small>';return d;};
    legend.addTo(map);
    const style=document.createElement('style');style.textContent=`
      .ai-map-badge{background:#07151d;border:1px solid #ff5b5b;border-radius:9px;padding:7px 10px;color:#fff;font:900 10px/1.1 system-ui;letter-spacing:.04em;box-shadow:0 5px 18px rgba(0,0,0,.45);white-space:nowrap;text-align:center}.ai-map-badge.classification{border-color:#ffbd38;color:#ffe2a0}.ai-map-panel,.ai-map-legend{background:rgba(4,13,18,.94);border:1px solid #29434f;border-radius:10px;box-shadow:0 6px 20px rgba(0,0,0,.35);color:#eaf5f7;font:10px/1.4 system-ui;padding:10px}.ai-map-title{font-weight:900;color:#a8e063;margin-bottom:8px;letter-spacing:.08em}.ai-map-row{display:flex;gap:6px;align-items:center;margin:5px 0}.ai-map-row em{margin-left:auto;color:#ffbd38;font-style:normal;font-weight:800}.ai-dot{width:7px;height:7px;border-radius:50%;display:inline-block}.ai-dot.detect{background:#ff5b5b}.ai-dot.classdot{background:#ffbd38}.ai-dot.pred{background:#39c5ef}.ai-map-note{border-top:1px solid #203541;margin-top:8px;padding-top:8px;color:#8fa9b3;font-size:9px}.ai-map-legend{display:grid;gap:4px}.ai-map-legend span{display:flex;align-items:center;gap:6px}.ai-map-legend i{display:inline-block;width:16px;height:3px}.ai-map-legend .det{width:8px;height:8px;border-radius:50%;background:#ff5b5b}.ai-map-legend .cls{width:8px;height:8px;border-radius:50%;background:#ffbd38}.ai-map-legend .predline{background:#ff5b5b}.ai-map-legend small{color:#ffbd38;font-weight:900;margin-top:3px}
    `;document.head.appendChild(style);
  }
  window.addEventListener('cyclone-map-ready',waitForMap);
  document.addEventListener('DOMContentLoaded',waitForMap);
})();
