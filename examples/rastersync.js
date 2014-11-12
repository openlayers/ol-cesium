var view = new ol.View({
  center: ol.proj.transform([-112.2, 36.06], 'EPSG:4326', 'EPSG:3857'),
  zoom: 11
});

var layer0 = new ol.layer.Tile({
  source: new ol.source.OSM()
});
var layer1 = new ol.layer.Tile({
  source: new ol.source.TileJSON({
    url: 'https://tileserver.maptiler.com/grandcanyon.json',
    crossOrigin: 'anonymous'
  })
});

var tileJsonSource = new ol.source.TileJSON({
  url: 'https://api.tiles.mapbox.com/v3/mapbox.world-borders-light.json',
  crossOrigin: 'anonymous'
});

var layer2 = new ol.layer.Tile({
  source: tileJsonSource
});
var ol2d = new ol.Map({
  layers: [layer0, new ol.layer.Group({layers: [layer1, layer2]})],
  target: 'map2d',
  view: view,
  renderer: 'webgl'
});


var ol3d = new olcs.OLCesium({map: ol2d, target: 'map3d'});
var scene = ol3d.getCesiumScene();
var terrainProvider = new Cesium.CesiumTerrainProvider({
  url : 'https://assets.agi.com/stk-terrain/world'
});
scene.terrainProvider = terrainProvider;

ol3d.setEnabled(true);

var addStamen = function() {
  ol2d.addLayer(new ol.layer.Tile({
    source: new ol.source.Stamen({
      opacity: 0.7,
      layer: 'watercolor'
    })
  }));
};

var tileWMSSource = new ol.source.TileWMS({
  url: 'http://demo.boundlessgeo.com/geoserver/wms',
  params: {'LAYERS': 'topp:states', 'TILED': true},
  serverType: 'geoserver',
  crossOrigin: 'anonymous'
});

var addTileWMS = function() {
  ol2d.addLayer(new ol.layer.Tile({
    opacity: 0.5,
    extent: [-13884991, 2870341, -7455066, 6338219],
    source: tileWMSSource
  }));
};

var changeI = 0;
var changeTileWMSParams = function() {
  tileWMSSource.updateParams({
    'LAYERS': (changeI++) % 2 == 0 ? 'nurc:Img_Sample' : 'topp:states'
  });
};

var addTileJSON = function() {
  ol2d.addLayer(new ol.layer.Tile({
    source: tileJsonSource
  }));
};

var removeLastLayer = function() {
  var length = ol2d.getLayers().getLength();
  if (length >  0) {
    ol2d.getLayers().removeAt(length - 1);
  }
};
