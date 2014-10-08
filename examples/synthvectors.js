var vectorSource = new ol.source.Vector({});

var style = [new ol.style.Style({
    image: new ol.style.Circle({
      radius: 2,
      fill: new ol.style.Fill({color: '#0f0'}),
    })
  })
];

var vector = new ol.layer.Vector({
  source: vectorSource,
  style: style
});

var total = 0;
var created = 0;
var added = 0;
var addFeatures = function() {
  var coordinates = [];
  var then = Date.now();
  var count = 1000;
  var e = 18000000;
  for (var i = 0; i < count; ++i) {
    coordinates.push([
        2 * e * Math.random() - e,
        2 * e * Math.random() - e,
        e * Math.random()
    ]);
  }

  var multiPoint = new ol.geom.MultiPoint(coordinates);
  var now = Date.now();
  created = now - then;
  then = now;

  vectorSource.addFeature(new ol.Feature(multiPoint));
  now = Date.now();
  added = now - then;
  total += count;

  document.getElementById('total').innerHTML = total;
  document.getElementById('created').innerHTML = 'Features created in ' + created + 'ms.';
  document.getElementById('added').innerHTML = 'Features added in ' + added + 'ms.';
};

var clearFeatures = function() {
  vectorSource.clear();
  total = 0;
  document.getElementById('total').innerHTML = total;
};

var tile = new ol.layer.Tile({
  source: new ol.source.TileWMS({
    url: 'http://demo.opengeo.org/geoserver/wms',
    params: {
      'LAYERS': 'ne:NE1_HR_LC_SR_W_DR'
    }
  })
});

var map = new ol.Map({
  layers: [ tile, vector ],
  target: 'map2d',
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});

var ol3d = new olcs.OLCesium(map);
var scene = ol3d.getCesiumScene();
var terrainProvider = new Cesium.CesiumTerrainProvider({
  url: '//cesiumjs.org/stk-terrain/tilesets/world/tiles'
});
scene.terrainProvider = terrainProvider;
ol3d.setEnabled(true);

