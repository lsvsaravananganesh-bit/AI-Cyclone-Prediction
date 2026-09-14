/* Browser-only visual gate. No Render/backend changes. */
(() => {
  const TF='https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
  const MOB='https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js';
  const COCO='https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js';
  let mobile=null, coco=null, loading=null;
  const loadScript=src=>new Promise((resolve,reject)=>{if(document.querySelector(`script[src="${src}"]`))return resolve();const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('Vision library failed to load'));document.head.appendChild(s)});
  async function load(){
    if(loading)return loading; loading=(async()=>{await loadScript(TF);await loadScript(MOB);await loadScript(COCO);mobile=await mobilenet.load({version:2,alpha:1.0});coco=await cocoSsd.load({base:'lite_mobilenet_v2'});return true})();
    try{return await loading}catch(e){loading=null;throw e}
  }
  const badWords=['person','man','woman','boy','girl','face','portrait','selfie','people','groom','bride','suit','tie','jersey','uniform','helmet','mask','car','vehicle','bus','truck','motorcycle','bicycle','building','house','street','road','sign','poster','billboard','screen','television','book','menu','comic','cartoon','logo'];
  const weatherWords=['cloud','cloudy','storm','thunderstorm','rain','rainbow','sky','seashore','volcano','geyser'];
  function scoreLabels(preds){
    let bad=0,weather=0;for(const p of preds){const n=p.className.toLowerCase(),v=p.probability; if(badWords.some(w=>n.includes(w)))bad=Math.max(bad,v);if(weatherWords.some(w=>n.includes(w)))weather=Math.max(weather,v)}return {bad,weather};
  }
  async function verify(file){
    if(!file)return {passed:false,code:'NO_FILE',message:'No image selected.'};
    if(!/^image\/(png|jpe?g|webp|tiff)$/.test(file.type))return {passed:false,code:'INVALID_TYPE',message:'Please upload a PNG, JPG, WEBP or TIFF image.'};
    const img=new Image();img.src=URL.createObjectURL(file);await new Promise((res,rej)=>{img.onload=res;img.onerror=()=>rej(new Error('Image could not be read'))});
    await load();
    const preds=await mobile.classify(img,10); const labels=scoreLabels(preds);
    const objects=await coco.detect(img); const person=objects.filter(o=>o.class==='person').sort((a,b)=>b.score-a.score)[0];
    const strongPerson=Boolean(person&&person.score>=0.58);
    const badSemantic=labels.bad>=0.28;
    const strongNonWeather=preds[0]&&labels.weather<0.12&&labels.bad<0.28&&preds[0].probability>=0.55;
    const w=img.naturalWidth,h=img.naturalHeight;
    const photoLike=(w>0&&h>0&&Math.max(w,h)/Math.min(w,h)>2.2);
    URL.revokeObjectURL(img.src);
    if(strongPerson)return {passed:false,code:'HUMAN_DETECTED',message:`Human/person detected (${Math.round(person.score*100)}%). This is not accepted as a cyclone satellite image.`,person:person.class,personScore:person.score,predictions:preds};
    if(badSemantic)return {passed:false,code:'NON_METEO_OBJECT',message:`Image classifier found a non-meteorological object (${preds[0]?.className||'object'}). Upload satellite/weather imagery.`,predictions:preds};
    if(strongNonWeather && photoLike)return {passed:false,code:'PHOTO_OR_POSTER',message:'Image does not look like satellite/weather imagery. Upload an actual meteorological satellite image.',predictions:preds};
    return {passed:true,code:'VISION_GATE_PASSED',message:'Visual gate passed. Image is suitable for the cyclone ML stage.',predictions:preds,weatherScore:labels.weather};
  }
  window.CycloneVisionVerifier={load,verify};
})();
