var ol2d = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  target: 'map2d',
  view: new ol.View({
    center: [0, 0],
    zoom: 3
  })
});

var ol3d = new olcs.OLCesium({map: ol2d, target: 'map3d'});
var scene = ol3d.getCesiumScene();
var terrainProvider = new Cesium.CesiumTerrainProvider({
  url : '//assets.agi.com/stk-terrain/world'
});
scene.terrainProvider = terrainProvider;

var box = new olcs.DragBox();
box.setScene(scene);

box.listen('boxstart', function(event) {
  console.log('boxstart', event);
});

box.listen('boxend', function(event) {
  console.log('boxend', event);
});

ol3d.setEnabled(true);
