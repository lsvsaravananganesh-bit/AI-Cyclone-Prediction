(() => {
  function apply() {
    if (document.getElementById('stride-mobile-style')) return;
    const style = document.createElement('style');
    style.id = 'stride-mobile-style';
    style.textContent = '#launcher{position:fixed!important;z-index:2147483647!important;display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;right:max(10px,env(safe-area-inset-right))!important;top:max(10px,env(safe-area-inset-top))!important}#prediction{z-index:1!important}#satellite{z-index:2147483646!important}@media(max-width:700px){#launcher{padding:10px 13px!important;min-height:44px!important;font-size:13px!important;white-space:nowrap!important}#satellite .topbar{height:auto!important;min-height:64px!important;padding:10px!important}#satellite .brand h1{font-size:16px!important}#satellite .brand small{font-size:10px!important}#satellite .logo{width:36px!important;height:36px!important;font-size:18px!important}#satellite .back{min-height:42px!important;padding:9px 11px!important}}';
    document.head.appendChild(style);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
})();
