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

var ol3d = new olcs.OLCesium({map: ol2d});
var scene = ol3d.getCesiumScene();
var terrainProvider = new Cesium.CesiumTerrainProvider({
  url : '//assets.agi.com/stk-terrain/world'
});
scene.terrainProvider = terrainProvider;

ol3d.getDataSources().add(Cesium.KmlDataSource.load(
  'https://api3.geo.admin.ch/ogcproxy?url=' +
  'https%3A%2F%2Fdav0.bgdi.admin.ch%2Fbazl_web%2FActive_Obstacles.kmz', {
    camera: scene.camera,
    canvas: scene.canvas
  }
));

