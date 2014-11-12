var view = new ol.View({
  center: ol.proj.transform([25, 20], 'EPSG:4326', 'EPSG:3857'),
  zoom: 3,
  rotation: Math.PI / 6
});

var ol2d = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  target: 'map2d',
  view: view
});

var ol3d = new olcs.OLCesium({map: ol2d, target: 'map3d'});
var scene = ol3d.getCesiumScene();
var terrainProvider = new Cesium.CesiumTerrainProvider({
  url : '//assets.agi.com/stk-terrain/world'
});
scene.terrainProvider = terrainProvider;
ol3d.setEnabled(true);
