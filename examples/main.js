const ol2d = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  controls: ol.control.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  target: 'map',
  view: new ol.View({
    center: ol.proj.transform([25, 20], 'EPSG:4326', 'EPSG:3857'),
    zoom: 3
  })
});

const timeElt = document.getElementById('time');
const ol3d = new olcs.OLCesium({
  map: ol2d,
  time() {
    const val = timeElt.value;
    if (ol3d.getCesiumScene().globe.enableLighting && val) {
      const d = new Date();
      d.setUTCHours(val);
      return Cesium.JulianDate.fromDate(d);
    }
    return Cesium.JulianDate.now();
  }
});
const scene = ol3d.getCesiumScene();
const terrainProvider = new Cesium.CesiumTerrainProvider({
  url: '//assets.agi.com/stk-terrain/world',
  requestVertexNormals: true
});
scene.terrainProvider = terrainProvider;


timeElt.style.display = 'none';
const toggleTime = function() { // eslint-disable-line no-unused-vars
  scene.globe.enableLighting = !scene.globe.enableLighting;
  if (timeElt.style.display == 'none') {
    timeElt.style.display = 'inline-block';
  } else {
    timeElt.style.display = 'none';
  }
};

