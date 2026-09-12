/*
  AI Cyclone Prediction — SIH Presentation Demo
  ------------------------------------------------
  This version is intentionally FRONTEND-ONLY.
  It does not call an ML server, API, database, or external prediction service.
  Uploaded images are analysed with transparent deterministic demo rules so the
  presentation can work offline and still demonstrate the complete workflow.
  Replace analyseImageDemo() with the team's real model response later.
*/

const DEMO = {
  cyclone_detected: true,
  cyclone_name: 'VAYU (DEMO)',
  confidence: 0.92,
  pattern: 'Organized Spiral',
  stage: 'Mature Cyclone',
  category: 'Severe Cyclonic Storm',
  latitude: 15.2,
  longitude: 84.1,
  wind_speed: 110,
  pressure: 980,
  risk_score: 72,
  environment: {
    sst: 29.4,
    cloud_top_temperature: -75,
    humidity: 72,
    wind_shear: 12
  }
};

const TRACK = [[15.2,84.1],[15.7,83.6],[16.2,83.1],[17.1,82.4],[18.0,81.6],[18.8,80.7],[19.3,80.6]];
const FORECAST = [['NOW',110,980,92],['+6H',115,978,88],['+12H',122,975,84],['+24H',130,970,80],['+48H',120,972,76]];
const HISTORICAL = [
  {name:'Fani',year:2019,category:'Extremely Severe',wind:215,match:92},
  {name:'Amphan',year:2020,category:'Super Cyclonic',wind:260,match:88},
  {name:'Yaas',year:2021,category:'Very Severe',wind:150,match:76},
  {name:'Tauktae',year:2021,category:'Very Severe',wind:185,match:69},
  {name:'Biparjoy',year:2023,category:'Very Severe',wind:195,match:64}
];

let map, marker, aiLine, aiCone, chart, playing = false, timer;
const $ = id => document.getElementById(id);
const txt = (id, value) => { if ($(id)) $(id).textContent = value; };

function calculateRisk(d) {
  if (d.risk_score != null) return Math.round(d.risk_score);
  const wind = +d.wind_speed || 0;
  const pressure = +d.pressure || 1015;
  const confidence = +d.confidence || 0;
  return Math.round(Math.min(98, Math.max(10, wind * .45 + (1015 - pressure) * .4 + confidence * 18)));
}

function setPrediction(d, mode = 'LOCAL DEMO') {
  const raw = +d.confidence || 0;
  const confidence = Math.round(raw > 1 ? raw : raw * 100);
  const lat = Number.isFinite(+d.latitude) ? +d.latitude : DEMO.latitude;
  const lon = Number.isFinite(+d.longitude) ? +d.longitude : DEMO.longitude;
  const wind = +d.wind_speed || DEMO.wind_speed;
  const pressure = +d.pressure || DEMO.pressure;
  const env = d.environment || DEMO.environment;
  const risk = calculateRisk(d);

  txt('status', d.cyclone_detected === false ? 'NO' : 'YES');
  txt('confidence', confidence + '%');
  txt('pattern', d.pattern || 'Organized Spiral');
  txt('stage', d.stage || 'Mature Cyclone');
  txt('windTop', wind + ' km/h');
  txt('categoryTop', 'Category: ' + (d.category || DEMO.category));
  txt('locationTop', lat.toFixed(1) + '° N, ' + lon.toFixed(1) + '° E');
  txt('mapCurrent', lat.toFixed(1) + '°N, ' + lon.toFixed(1) + '°E');
  txt('mapConfidence', confidence + '%');

  txt('overviewStage', d.stage || 'Mature Cyclone');
  txt('overviewWind', wind);
  txt('overviewPressure', pressure);
  txt('overviewLocation', lat.toFixed(1) + '° N, ' + lon.toFixed(1) + '° E');
  txt('overviewConfidence', confidence + '%');

  txt('detectResult', d.cyclone_detected === false ? 'No Cyclone Detected' : 'Cyclone Detected');
  txt('detectConf', 'Confidence: ' + confidence + '%');
  txt('patternResult', d.pattern || 'Organized Spiral');
  txt('patternResultStage', 'Stage: ' + (d.stage || 'Mature Cyclone'));
  txt('intensityResult', wind + ' km/h');
  txt('pressureResult', '~' + pressure + ' hPa');

  txt('predCyclone', d.cyclone_detected === false ? 'Not detected' : 'Detected');
  txt('predPattern', d.pattern || 'Organized Spiral');
  txt('predIntensity', wind + ' km/h');
  txt('predStage', d.stage || 'Mature Cyclone');
  txt('predConfidence', confidence + '%');
  txt('predPressure', '~' + pressure + ' hPa');
  txt('predictionMode', mode);

  txt('envWind', wind + ' km/h');
  txt('envPressure', pressure + ' hPa');
  txt('envSst', (env.sst ?? DEMO.environment.sst) + '°C');
  txt('envCloud', (env.cloud_top_temperature ?? DEMO.environment.cloud_top_temperature) + '°C');
  txt('envHumidity', (env.humidity ?? DEMO.environment.humidity) + '%');
  txt('envShear', (env.wind_shear ?? DEMO.environment.wind_shear) + ' kt');
  txt('riskScore', risk);
  txt('lastUpdate', 'Last updated: ' + new Date().toLocaleTimeString('en-IN', {hour12:false}) + ' IST');

  const riskLevel = risk >= 75 ? 'VERY HIGH' : risk >= 60 ? 'HIGH' : risk >= 40 ? 'MODERATE' : 'LOW';
  txt('riskLevel', riskLevel);
  txt('riskWind', wind >= 120 ? 'Very High' : wind >= 90 ? 'High' : 'Moderate');
  txt('riskRain', risk >= 60 ? 'High' : 'Moderate');

  if (marker) {
    marker.setLatLng([lat, lon]);
    if (map) map.setView([lat, lon], 5);
  }
  if (aiLine) {
    const points = TRACK.map(x => [x[0] + lat - DEMO.latitude, x[1] + lon - DEMO.longitude]);
    aiLine.setLatLngs(points);
    aiCone.setLatLngs(corridor(points));
  }
  renderTimeline(wind);
}

function corridor(points) {
  const a = [], b = [];
  points.forEach((x, i) => {
    const width = .12 + i * .055;
    a.push([x[0] + width, x[1] - width]);
    b.unshift([x[0] - width, x[1] + width]);
  });
  return a.concat(b);
}

function stormIcon() {
  return L.divIcon({className:'', html:'<span class="storm-marker"></span>', iconSize:[18,18], iconAnchor:[9,9]});
}

function initMap() {
  if (!window.L || !$('cycloneMap')) return;
  map = L.map('cycloneMap', {zoomControl:false, worldCopyJump:true}).setView([16.5,82.5],5);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {maxZoom:18, attribution:'Tiles © Esri'}).addTo(map);
  L.control.zoom({position:'bottomright'}).addTo(map);
  aiLine = L.polyline(TRACK, {color:'#ffbd38',weight:4,dashArray:'9 7'}).addTo(map);
  aiCone = L.polygon(corridor(TRACK), {color:'#45aaff',weight:1,dashArray:'5 5',fillColor:'#3b9fff',fillOpacity:.08}).addTo(map);
  marker = L.marker(TRACK[0], {icon:stormIcon(),zIndexOffset:1000}).addTo(map).bindPopup('<b>Cyclone Analysis Demo</b><br>Illustrative analysis center<br>Not an operational warning');
  TRACK.slice(1).forEach((p,i) => L.circleMarker(p,{radius:5,color:'#ffbd38',fillColor:'#ffbd38',fillOpacity:1,weight:1}).bindTooltip('T+'+((i+1)*12)+'h • forecast').addTo(map));
  $('centerStorm').onclick = () => marker && map.setView(marker.getLatLng(),6,{animate:true});
  $('toggleAnimation').onclick = play;
  window.addEventListener('resize', () => map && map.invalidateSize());
  setTimeout(() => map.invalidateSize(),250);
}

function play() {
  if (playing) {
    clearInterval(timer);
    playing = false;
    txt('toggleAnimation','▶ PLAY TRACK');
    return;
  }
  playing = true;
  let i = 0;
  txt('toggleAnimation','■ STOP');
  timer = setInterval(() => {
    const p = TRACK[i];
    if (marker) marker.setLatLng(p);
    if (map) map.panTo(p,{animate:true,duration:.3});
    i++;
    if (i >= TRACK.length) {
      clearInterval(timer);
      playing = false;
      txt('toggleAnimation','▶ PLAY TRACK');
    }
  },700);
}

function initChart() {
  if (!window.Chart || !$('forecastChart')) return;
  chart = new Chart($('forecastChart'), {
    type:'line',
    data:{
      labels:FORECAST.map(x=>x[0]),
      datasets:[
        {label:'Wind km/h',data:FORECAST.map(x=>x[1]),borderColor:'#ff4e4e',backgroundColor:'#ff4e4e22',fill:true,tension:.35,pointRadius:3},
        {label:'Pressure hPa',data:FORECAST.map(x=>x[2]),borderColor:'#3e8cff',tension:.35,yAxisID:'p',pointRadius:3}
      ]
    },
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#8da6b2',font:{size:8}}}},scales:{x:{grid:{color:'#173342'},ticks:{color:'#647e8a',font:{size:8}}},y:{grid:{color:'#173342'},ticks:{color:'#ff8a72',font:{size:8}}},p:{position:'right',grid:{drawOnChartArea:false},ticks:{color:'#57a6ff',font:{size:8}}}}}
  });
}

function renderTimeline(w = 110) {
  const values = [w, Math.round(w*1.04), Math.round(w*1.1), Math.round(w*1.18), Math.round(w*1.09)];
  const box = $('predictionTimeline');
  if (box) box.innerHTML = values.map((v,i) => `<div><small>${FORECAST[i][0]}</small><b>${v} km/h</b><span>${FORECAST[i][3]}% conf.</span></div>`).join('');
}

function renderHistorical() {
  const box = $('historicalRows');
  if (!box) return;
  box.innerHTML = HISTORICAL.map(h => `<div class="history-row"><strong>◉ ${h.name} (${h.year})</strong><span class="badge">${h.category}</span><span>${h.wind} km/h</span><span class="match">${h.match}% similar</span><button class="view-btn" data-history="${h.name}">View</button></div>`).join('');
  box.querySelectorAll('[data-history]').forEach(b => b.onclick = () => {
    const h = HISTORICAL.find(x => x.name === b.dataset.history);
    if (h) txt('aiReason', `Historical comparison: the current demonstration pattern has a ${h.match}% similarity score with ${h.name} (${h.year}). This is a reference comparison only, not a scientific reanalysis.`);
  });
}

function getUploadHistory() {
  try { return JSON.parse(localStorage.getItem('cycloneAnalysisHistory') || '[]'); }
  catch { return []; }
}

function saveUpload(entry) {
  const history = getUploadHistory();
  history.unshift(entry);
  localStorage.setItem('cycloneAnalysisHistory', JSON.stringify(history.slice(0,8)));
  renderUploadHistory();
}

function renderUploadHistory() {
  const box = $('uploadHistoryList'), history = getUploadHistory();
  txt('historyCount', history.length + ' ANALYSES');
  if (!box) return;
  if (!history.length) {
    box.innerHTML = '<div class="empty-history">No uploaded images analyzed yet.<br><span>Upload an image above to create the first history entry.</span></div>';
    return;
  }
  box.innerHTML = history.map((h,i) => `<div class="history-entry"><img src="${h.image}" alt=""><div><b>${escapeHtml(h.name)}</b><span>${h.time} • ${h.pattern}</span><em>${h.wind} km/h • ${h.confidence}% confidence</em></div><button class="view-btn" data-entry="${i}">Load</button></div>`).join('');
  box.querySelectorAll('[data-entry]').forEach(b => b.onclick = () => loadHistory(+b.dataset.entry));
}

function escapeHtml(s) {
  return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function loadHistory(i) {
  const h = getUploadHistory()[i];
  if (!h) return;
  $('uploadPreviewWrap').hidden = false;
  $('uploadPreview').src = h.image;
  $('uploadName').textContent = h.name;
  $('uploadMeta').textContent = h.meta;
  setPrediction(h, 'SAVED ANALYSIS');
  $('satPreview').src = h.image;
  txt('imageTime', h.time);
  txt('aiReason', h.reason || 'Loaded from local analysis history.');
  location.hash = 'upload';
}

/*
  Transparent, frontend-only image analysis.
  No ML model is called. The result is generated from image properties so the
  prototype remains demonstrable without a backend. It must be labelled demo.
*/
function analyseImageDemo(file) {
  const seed = (file.size + file.name.length * 17) % 101;
  const wind = 92 + (seed % 45);
  const confidence = .78 + (seed % 18) / 100;
  const patterns = ['Organized Spiral','Curved Band','Developing Eye','Disorganized Cluster'];
  const pattern = patterns[seed % patterns.length];
  const stage = wind >= 130 ? 'Very Severe Cyclonic Storm' : wind >= 118 ? 'Severe Cyclonic Storm' : wind >= 90 ? 'Cyclonic Storm' : 'Depression';
  const lat = 14.8 + (seed % 9) * .18;
  const lon = 82.7 - (seed % 8) * .22;
  const pressure = Math.round(1002 - (wind - 90) * .42);
  const risk = Math.round(Math.min(96, 44 + confidence * 22 + (wind - 90) * .42));
  const env = {
    sst: +(28.6 + (seed % 10) * .1).toFixed(1),
    cloud_top_temperature: -65 - (seed % 16),
    humidity: 65 + (seed % 20),
    wind_shear: 7 + (seed % 10)
  };
  return {
    cyclone_detected: true,
    pattern,
    stage,
    category: stage,
    confidence,
    wind_speed: wind,
    pressure,
    latitude: lat,
    longitude: lon,
    risk_score: risk,
    environment: env,
    reason: `Demo analysis identified a ${pattern.toLowerCase()} signature from the uploaded image properties. The displayed environmental values, track and confidence are illustrative so the full SIH workflow can be demonstrated without a prediction server.`
  };
}

function runImageAnalysis(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) { alert('Please upload an image file.'); return; }
  if (file.size > 10 * 1024 * 1024) { alert('Please upload an image smaller than 10 MB.'); return; }

  const reader = new FileReader();
  reader.onload = e => {
    const image = e.target.result;
    $('uploadPreviewWrap').hidden = false;
    $('uploadPreview').src = image;
    $('uploadName').textContent = file.name;
    $('uploadMeta').textContent = (file.type || 'image') + ' • ' + (file.size / 1024 / 1024).toFixed(2) + ' MB';
    txt('imageTime','Analysed ' + new Date().toLocaleString('en-IN'));

    const data = analyseImageDemo(file);
    setPrediction(data, 'LOCAL DEMO — NO ML SERVER');
    $('satPreview').src = image;
    txt('aiReason', data.reason);

    saveUpload({
      name:file.name,
      time:new Date().toLocaleString('en-IN'),
      meta:(file.type || 'image') + ' • ' + (file.size / 1024 / 1024).toFixed(2) + ' MB',
      image,
      pattern:data.pattern || 'Unknown',
      wind:data.wind_speed || '—',
      confidence:Math.round((data.confidence || 0) * 100),
      mode:'LOCAL DEMO',
      reason:data.reason,
      environment:data.environment
    });
  };
  reader.readAsDataURL(file);
}

function initUpload() {
  const input = $('imageInput'), zone = $('dropzone');
  if (!input || !zone) return;
  input.onchange = () => input.files[0] && runImageAnalysis(input.files[0]);
  ['dragenter','dragover'].forEach(ev => zone.addEventListener(ev,e => {e.preventDefault();zone.classList.add('drag');}));
  ['dragleave','drop'].forEach(ev => zone.addEventListener(ev,e => {e.preventDefault();zone.classList.remove('drag');}));
  zone.addEventListener('drop',e => {const f=e.dataTransfer.files[0];if(f)runImageAnalysis(f);});
  $('analyzeImage')?.addEventListener('click',()=>input.files[0]&&runImageAnalysis(input.files[0]));
  $('analyzeImageTop')?.addEventListener('click',()=>{location.hash='upload';input.click();});
  $('clearHistory')?.addEventListener('click',()=>{localStorage.removeItem('cycloneAnalysisHistory');renderUploadHistory();});
}

function clock() {
  const d = new Date;
  txt('clock', d.toLocaleTimeString('en-IN',{hour12:false,timeZone:'Asia/Kolkata'}) + ' IST');
  txt('dateClock', d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Kolkata'}));
}

function start() {
  setPrediction(DEMO);
  renderHistorical();
  renderUploadHistory();
  initMap();
  initChart();
  initUpload();
  clock();
  setInterval(clock,1000);
  $('refresh')?.addEventListener('click',()=>{
    txt('lastUpdate','Refreshing demo data…');
    setTimeout(()=>txt('lastUpdate','Last updated: '+new Date().toLocaleTimeString('en-IN',{hour12:false})+' IST'),400);
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start);
else start();
