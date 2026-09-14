/* Frontend bridge + strict browser vision gate. Backend/Render is untouched. */
(() => {
  const configured=(window.CYCLONE_API_BASE||'').trim();
  const api=(configured||'https://ai-cyclone-prediction-api.onrender.com').replace(/\/$/,'');
  window.CYCLONE_API_BASE=api;
  const originalFetch=window.fetch.bind(window);

  let visionPromise=null, mobileModel=null, cocoModel=null;
  const loadScript=src=>new Promise((resolve,reject)=>{if(document.querySelector(`script[src="${src}"]`))return resolve();const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('Vision library failed to load'));document.head.appendChild(s)});
  async function loadVision(){
    if(visionPromise)return visionPromise;
    visionPromise=(async()=>{
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js');
      mobileModel=await mobilenet.load({version:2,alpha:1});
      cocoModel=await cocoSsd.load({base:'lite_mobilenet_v2'});
    })();
    try{await visionPromise}catch(e){visionPromise=null;throw e}
  }

  const humanWords=['person','man','woman','boy','girl','face','portrait','selfie','people','groom','bride','suit','tie','jersey','uniform','helmet','mask'];
  const objectWords=['car','vehicle','bus','truck','motorcycle','bicycle','building','house','street','road','sign','poster','billboard','screen','television','book','menu','comic','cartoon','logo'];
  const weatherWords=['cloud','cloudy','storm','thunderstorm','rain','rainbow','sky','seashore','volcano','geyser','valley'];

  function maxLabelScore(preds,words){
    let best=null;
    for(const p of preds){
      const n=(p.className||'').toLowerCase();
      if(words.some(w=>n.includes(w))&&(!best||p.probability>best.probability))best=p;
    }
    return best;
  }

  async function browserVisionGate(file){
    if(!file)return {pass:false,reason:'No image selected.'};
    if(!file.type.startsWith('image/'))return {pass:false,reason:'Uploaded file is not an image.'};
    try{await loadVision()}catch(e){
      /* Strict mode: never send an unverified image to the cyclone model. */
      return {pass:false,reason:'Browser visual verification could not be loaded. Please refresh the page and try again.'};
    }

    const img=new Image();
    const objectUrl=URL.createObjectURL(file);
    img.src=objectUrl;
    try{
      await new Promise((res,rej)=>{img.onload=res;img.onerror=()=>rej(new Error('Image could not be decoded'))});
      const preds=await mobileModel.classify(img,10);
      const objects=await cocoModel.detect(img);
      const person=objects.filter(x=>x.class==='person').sort((a,b)=>b.score-a.score)[0];
      const human=maxLabelScore(preds,humanWords);
      const object=maxLabelScore(preds,objectWords);
      const weather=maxLabelScore(preds,weatherWords);
      const top=preds[0];

      /* A human/poster must not reach the cyclone model. Use multiple independent signals. */
      if(person&&person.score>=0.25){
        return {pass:false,reason:`Human/person detected (${Math.round(person.score*100)}%). This image is rejected before cyclone AI analysis. Upload satellite/weather imagery.` ,predictions:preds};
      }
      if(human&&human.probability>=0.10){
        return {pass:false,reason:`Human content detected (${human.className}, ${Math.round(human.probability*100)}%). Upload an actual satellite/weather image, not a human poster/photo.`,predictions:preds};
      }
      if(object&&object.probability>=0.12){
        return {pass:false,reason:`Non-meteorological content detected (${object.className}, ${Math.round(object.probability*100)}%). The image was blocked before cyclone AI analysis.`,predictions:preds};
      }

      /* If the general vision model sees no weather cue and is strongly confident in
         another everyday object/scene, treat it as an invalid source image. */
      const weatherScore=weather?.probability||0;
      if(top&&top.probability>=0.50&&weatherScore<0.08){
        return {pass:false,reason:`The image does not appear to be meteorological imagery (vision confidence ${Math.round(top.probability*100)}% for ${top.className}). Upload a satellite/weather image.`,predictions:preds};
      }

      /* Very text-heavy portrait/poster layouts commonly expose a person or poster label;
         this extra visual check rejects extreme poster-like aspect ratios when no weather cue exists. */
      const w=img.naturalWidth,h=img.naturalHeight;
      const extremePoster=w>0&&h>0&&(Math.max(w,h)/Math.min(w,h)>2.25);
      if(extremePoster&&weatherScore<0.08&&top&&top.probability>=0.30){
        return {pass:false,reason:'Poster/photo-like image rejected. Please upload the original satellite/weather frame.',predictions:preds};
      }

      return {pass:true,predictions:preds,weatherScore};
    }finally{URL.revokeObjectURL(objectUrl)}
  }

  /* Intercept only the cyclone image endpoint. Other API calls are unchanged. */
  window.fetch=(input,init)=>{
    const url=typeof input==='string'?input:input?.url||'';
    const isML=url.includes('/api/ml/analyze-image');
    if(!isML)return originalFetch(input,init);
    const body=init?.body;
    const file=body&&typeof body.get==='function'?body.get('file'):null;
    if(!file||typeof file!=='object')return originalFetch(input,init);
    return browserVisionGate(file).then(result=>{
      if(result.pass)return originalFetch(input,init);
      const payload={frontend_verification:{status:'REJECTED',reason:result.reason},model_status:'FRONTEND_REJECTED',stage1:{detected:false,probability:0},classification:null,confidence:null,message:result.reason};
      return new Response(JSON.stringify(payload),{status:200,headers:{'Content-Type':'application/json','X-Cyclone-Vision-Gate':'REJECTED'}});
    });
  };

  if(api){
    const fetchAfterBridge=window.fetch;
    window.fetch=(input,init)=>{
      const url=typeof input==='string'?input:input?.url||'';
      if(url.includes('api.imd.gov.in/api/v1/cyclone_track')){
        return fetchAfterBridge(`${api}/api/cyclones/active`,init).then(async r=>{
          const payload=await r.clone().json().catch(()=>({}));
          if(payload.status==='LIVE'&&payload.systems?.[0]){const s=payload.systems[0];return new Response(JSON.stringify({data:{observed:s.observed||[],forecast:s.forecast||[]}}),{status:200,headers:{'Content-Type':'application/json'}})}
          return new Response(JSON.stringify({data:{observed:[],forecast:[]}}),{status:200,headers:{'Content-Type':'application/json'}});
        });
      }
      return fetchAfterBridge(input,init);
    };
  }

  function installMapCapture(){if(!window.L||window.__cycloneMapCaptureInstalled)return;window.__cycloneMapCaptureInstalled=true;const originalMap=window.L.map;window.L.map=function(){const instance=originalMap.apply(this,arguments);window.cycloneMapInstance=instance;window.dispatchEvent(new CustomEvent('cyclone-map-ready',{detail:instance}));return instance}}
  function loadAILayer(){if(window.__aiMapLayerLoaded)return;window.__aiMapLayerLoaded=true;const s=document.createElement('script');s.src='ai-map-layer.js';s.defer=true;document.head.appendChild(s)}
  const boot=()=>{installMapCapture();if(window.cycloneMapInstance)loadAILayer()};
  if(window.L)boot();else window.addEventListener('load',boot,{once:true});
  window.addEventListener('cyclone-map-ready',loadAILayer);
})();