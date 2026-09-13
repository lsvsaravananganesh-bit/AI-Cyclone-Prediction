/* Capture the existing Leaflet map instance so optional SIH visualization layers can use it. */
(function(){
  function install(){
    if(!window.L || window.__cycloneMapCaptureInstalled) return;
    window.__cycloneMapCaptureInstalled=true;
    const originalMap=window.L.map;
    window.L.map=function(){
      const instance=originalMap.apply(this,arguments);
      window.cycloneMapInstance=instance;
      window.dispatchEvent(new CustomEvent('cyclone-map-ready',{detail:instance}));
      return instance;
    };
  }
  if(window.L) install();
  else window.addEventListener('load',install,{once:true});
})();
