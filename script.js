const demo={cyclone_detected:true,cyclone_name:'DEMO CYCLONE',confidence:.92,category:'Cyclonic Storm',latitude:15.82,longitude:82.15,wind_speed:95,pressure:982,movement:'NW'};
const $=id=>document.getElementById(id);
function updateDashboard(data=demo){
  $('status').textContent=data.cyclone_detected?'Cyclone detected':'No cyclone detected';
  $('stormName').textContent=data.cyclone_name||'UNNAMED SYSTEM';
  $('category').textContent=data.category||'Under analysis';
  $('movement').textContent=data.movement?`↖ ${data.movement}`:'—';
  const confidence=Math.round((data.confidence||0)*100);
  $('confidence').textContent=`${confidence}%`;
  $('wind').innerHTML=`${data.wind_speed??'—'} <i>km/h</i>`;
  $('pressure').innerHTML=`${data.pressure??'—'} <i>hPa</i>`;
  const lat=Number(data.latitude||0).toFixed(2),lon=Number(data.longitude||0).toFixed(2);
  $('latitude').textContent=`${lat}°N`;$('longitude').textContent=`${lon}°E`;
  $('mapLat').textContent=`${lat}°N`;$('mapLon').textContent=`${lon}°E`;
  $('windMeter').style.width=`${Math.min(100,Math.max(10,(data.wind_speed||0)/1.5))}%`;
  $('pressureMeter').style.width=`${Math.min(100,Math.max(10,(1015-(data.pressure||1015))*3+35))}%`;
}
function buildChart(){
 const canvas=$('forecastChart');if(!canvas||typeof Chart==='undefined')return;
 new Chart(canvas,{type:'line',data:{labels:['NOW','+3H','+6H','+9H','+12H','+18H','+24H'],datasets:[{label:'Wind (km/h)',data:[95,97,100,102,105,108,110],borderColor:'#b8f34a',backgroundColor:'#b8f34a12',fill:true,tension:.38,yAxisID:'y',pointRadius:2},{label:'Pressure (hPa)',data:[982,980,978,977,975,972,970],borderColor:'#789097',backgroundColor:'transparent',fill:false,tension:.38,yAxisID:'y1',pointRadius:2}]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{display:false},tooltip:{backgroundColor:'#071318',borderColor:'#29434a',borderWidth:1,titleColor:'#fff',bodyColor:'#a6b5b9'}},scales:{x:{grid:{color:'#173038'},ticks:{color:'#60777e',font:{size:8}}},y:{position:'left',min:80,max:120,grid:{color:'#173038'},ticks:{color:'#b8f34a',font:{size:8}}},y1:{position:'right',min:960,max:990,grid:{drawOnChartArea:false},ticks:{color:'#789097',font:{size:8}}}}}});
}
function updateClock(){const now=new Date();$('clock').textContent=new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(now)+' IST';}
async function refreshData(){const btn=$('refresh');btn.disabled=true;btn.textContent='↻ Updating…';try{const response=await fetch('/api/prediction',{headers:{Accept:'application/json'}});if(!response.ok)throw new Error('API unavailable');updateDashboard(await response.json());$('lastUpdate').textContent='Updated just now';}catch{updateDashboard(demo);$('lastUpdate').textContent='Demo data • API not connected';}finally{btn.disabled=false;btn.textContent='↻ Refresh';}}
$('refresh')?.addEventListener('click',refreshData);updateDashboard();buildChart();updateClock();setInterval(updateClock,1000);