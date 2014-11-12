var point = new ol.geom.Point([700000, 200000, 100000]);

var iconFeature = new ol.Feature({
  geometry: point
});


var iconStyle = new ol.style.Style({
  image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
    anchor: [0.5, 46],
    anchorXUnits: 'fraction',
    anchorYUnits: 'pixels',
    opacity: 0.75,
    src: 'data/icon.png'
  }))
});

iconFeature.setStyle(iconStyle);


var vectorSource2 = new ol.source.Vector({
  features: [iconFeature]
});
var imageVectorSource = new ol.source.ImageVector({
  source: vectorSource2
});
var vectorLayer2 = new ol.layer.Image({
  source: imageVectorSource
});


var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    }),
    vectorLayer2
  ],
  target: 'map2d',
  controls: ol.control.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});


var ol3d = new olcs.OLCesium({map: map/*, target: 'map3d'*/});
var scene = ol3d.getCesiumScene();
var terrainProvider = new Cesium.CesiumTerrainProvider({
  url: '//assets.agi.com/stk-terrain/world',
  requestVertexNormals: false
});
scene.terrainProvider = terrainProvider;
ol3d.setEnabled(true);

var tracking = false;
function toggleTracking() {
  tracking = !tracking;
  ol3d.trackedFeature = tracking ? iconFeature : undefined;
}

setInterval(function() {
  var old = point.getCoordinates();
  point.setCoordinates([
    old[0] + 1000 * Math.random(),
    old[1] + 1000 * Math.random(),
    old[2]
  ]);
  iconFeature.changed();
}, 100);
