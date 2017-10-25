(function() {
  const mode = window.location.href.match(/mode=([a-z0-9\-]+)\&?/i);
  const DIST = false;
  const isDev = mode && mode[1] === 'dev';
  const cs = isDev ? 'CesiumUnminified/Cesium.js' : 'Cesium/Cesium.js';
  const ol = (DIST && isDev) ? 'olcesium-debug.js' : '@loader';

  window.CESIUM_URL = `../node_modules/@camptocamp/cesium/Build/${cs}`;
  if (!window.LAZY_CESIUM) {
    document.write(`<scr${'i'}pt type="text/javascript" src="${window.CESIUM_URL}"></scr${'i'}ipt>`);
  }
  document.write(`<scr${'i'}pt type="text/javascript" src="../${ol}"></scr${'i'}pt>`);
})();

