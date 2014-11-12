var ol2d = new ol.Map({
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

var ol3d = new olcs.OLCesium({
  map: ol2d,
  time: function() {
    var val = timeElt.value;
    if (scene.globe.enableLighting && val) {
      var d = new Date();
      d.setUTCHours(val);
      return Cesium.JulianDate.fromDate(d);
    }
    return Cesium.JulianDate.now();
  }
});
var scene = ol3d.getCesiumScene();
var terrainProvider = new Cesium.CesiumTerrainProvider({
  url : '//assets.agi.com/stk-terrain/world',
  requestVertexNormals: true
});
scene.terrainProvider = terrainProvider;


var timeElt = document.getElementById('time');
timeElt.style.display = 'none';
var toggleTime = function() {
  scene.globe.enableLighting = !scene.globe.enableLighting;
  if (timeElt.style.display == 'none') {
    timeElt.style.display = 'inline-block';
  } else {
    timeElt.style.display = 'none';
  }
}

