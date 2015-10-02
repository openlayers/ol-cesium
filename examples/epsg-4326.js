var view = new ol.View({
  projection: 'EPSG:4326',
  center: [-100, 35],
  zoom: 3
});

var layer = new ol.layer.Tile({
  source: new ol.source.TileWMS({
    url: 'http://demo.boundlessgeo.com/geoserver/wms',
    params: {
      'LAYERS': 'ne:NE1_HR_LC_SR_W_DR'
    }
  })
});
var overlay = new ol.layer.Tile({
  opacity: 0.7,
  extent: [-124.74, 24.96, -66.96, 49.38],
  source: new ol.source.TileWMS(/** @type {olx.source.TileWMSOptions} */ ({
    url: 'http://demo.boundlessgeo.com/geoserver/wms',
    params: {'LAYERS': 'topp:states', 'TILED': true},
    serverType: 'geoserver',
    crossOrigin: 'anonymous'
  }))
});

var ol2d = new ol.Map({
  layers: [layer, overlay],
  target: 'map2d',
  view: view
});


var ol3d = new olcs.OLCesium({map: ol2d});
var scene = ol3d.getCesiumScene();
var terrainProvider = new Cesium.CesiumTerrainProvider({
    url : '//assets.agi.com/stk-terrain/world'
});
scene.terrainProvider = terrainProvider;

ol3d.setEnabled(true);
