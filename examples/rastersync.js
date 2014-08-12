var view = new ol.View({
  center: ol.proj.transform([-112.2, 36.06], 'EPSG:4326', 'EPSG:3857'),
  zoom: 11
});

var layer0 = new ol.layer.Tile({
  source: new ol.source.MapQuest({layer: 'sat'})
});
var layer1 = new ol.layer.Tile({
  source: new ol.source.TileJSON({
    url: 'http://tileserver.maptiler.com/grandcanyon.json',
    crossOrigin: 'anonymous'
  })
});
var layer2 = new ol.layer.Tile({
  source: new ol.source.TileJSON({
    url: 'http://api.tiles.mapbox.com/v3/' +
        'mapbox.world-borders-light.jsonp',
    crossOrigin: 'anonymous'
  })
});
var ol2d = new ol.Map({
  layers: [layer0, layer1, layer2],
  target: 'map2d',
  view: view,
  renderer: 'webgl'
});


var ol3d = new olcs.OLCesium(ol2d, 'map3d');
var scene = ol3d.getCesiumScene();
var terrainProvider = new Cesium.CesiumTerrainProvider({
    url : '//cesiumjs.org/stk-terrain/tilesets/world/tiles'
});
scene.terrainProvider = terrainProvider;

ol3d.setEnabled(true);
