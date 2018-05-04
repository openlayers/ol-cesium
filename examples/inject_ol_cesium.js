(function() {
  const mode = window.location.href.match(/mode=([a-z0-9\-]+)\&?/i);
  const isDev = mode && mode[1] === 'dev';
  window.IS_DEV = isDev;
  const cs = isDev ? 'CesiumUnminified/Cesium.js' : 'Cesium/Cesium.js';

  window.CESIUM_URL = `../node_modules/@camptocamp/cesium/Build/${cs}`;
  if (!window.LAZY_CESIUM) {
    document.write(`<scr${'i'}pt type="text/javascript" src="${window.CESIUM_URL}"></scr${'i'}pt>`);
  }
})();

