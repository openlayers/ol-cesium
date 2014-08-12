var view = new ol.View({
  projection: 'EPSG:4326',
  center: [0, 0],
  zoom: 3
});

var layer = new ol.layer.Tile({
  source: new ol.source.TileWMS({
    url: 'http://demo.opengeo.org/geoserver/wms',
    params: {
      'LAYERS': 'ne:NE1_HR_LC_SR_W_DR'
    }
  })
});
var ol2d = new ol.Map({
  layers: [layer],
  target: 'map2d',
  view: view
});


var ol3d = new olcs.OLCesium(ol2d);
var scene = ol3d.getCesiumScene();
var terrainProvider = new Cesium.CesiumTerrainProvider({
    url : '//cesiumjs.org/stk-terrain/tilesets/world/tiles'
});
scene.terrainProvider = terrainProvider;

ol3d.setEnabled(true);
