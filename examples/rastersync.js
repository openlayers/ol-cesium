const view = new ol.View({
  center: ol.proj.transform([-112.2, 36.06], 'EPSG:4326', 'EPSG:3857'),
  zoom: 11
});

const layer0 = new ol.layer.Tile({
  source: new ol.source.OSM()
});
const layer1 = new ol.layer.Tile({
  source: new ol.source.TileJSON({
    url: 'https://tileserver.maptiler.com/grandcanyon.json',
    crossOrigin: 'anonymous'
  })
});

const tileJsonSource = new ol.source.TileJSON({
  url: 'https://api.tiles.mapbox.com/v3/mapbox.world-borders-light.json',
  crossOrigin: 'anonymous'
});

const layer2 = new ol.layer.Tile({
  source: tileJsonSource
});
const ol2d = new ol.Map({
  layers: [layer0, new ol.layer.Group({layers: [layer1, layer2]})],
  target: 'map2d',
  view,
  renderer: 'webgl'
});


const ol3d = new olcs.OLCesium({map: ol2d, target: 'map3d'});
const scene = ol3d.getCesiumScene();
const terrainProvider = new Cesium.CesiumTerrainProvider({
  url: 'https://assets.agi.com/stk-terrain/world'
});
scene.terrainProvider = terrainProvider;

ol3d.setEnabled(true);

const addStamen = function() { // eslint-disable-line no-unused-vars
  ol2d.addLayer(new ol.layer.Tile({
    source: new ol.source.Stamen({
      opacity: 0.7,
      layer: 'watercolor'
    })
  }));
};

const tileWMSSource = new ol.source.TileWMS({
  url: 'http://demo.boundlessgeo.com/geoserver/wms',
  params: {'LAYERS': 'topp:states', 'TILED': true},
  serverType: 'geoserver',
  crossOrigin: 'anonymous'
});

const addTileWMS = function() { // eslint-disable-line no-unused-vars
  ol2d.addLayer(new ol.layer.Tile({
    opacity: 0.5,
    extent: [-13884991, 2870341, -7455066, 6338219],
    source: tileWMSSource
  }));
};

let changeI = 0;
const changeTileWMSParams = function() { // eslint-disable-line no-unused-vars
  tileWMSSource.updateParams({
    'LAYERS': (changeI++) % 2 == 0 ? 'nurc:Img_Sample' : 'topp:states'
  });
};

const addTileJSON = function() { // eslint-disable-line no-unused-vars
  ol2d.addLayer(new ol.layer.Tile({
    source: tileJsonSource
  }));
};

const removeLastLayer = function() { // eslint-disable-line no-unused-vars
  const length = ol2d.getLayers().getLength();
  if (length >  0) {
    ol2d.getLayers().removeAt(length - 1);
  }
};
