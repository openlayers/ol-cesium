var total = 0;
var created = 0;
var added = 0;

var vectorSource = new ol.source.Vector({});
var vector = new ol.layer.Vector({
  source: vectorSource
});
var addFeatures = function() {
  var then = Date.now();
  var count = 1000;
  var features = [];
  var e = 18000000;
  for (var i = 0; i < count; ++i) {
    var feature = new ol.Feature({
      geometry: new ol.geom.Point([
        2 * e * Math.random() - e,
        2 * e * Math.random() - e,
        e * Math.random()
      ])
    });
    var style = [new ol.style.Style({
      image: new ol.style.Circle({
        radius: 2,
        fill: new ol.style.Fill({color: [
          Math.random() * 255,
          Math.random() * 255,
          Math.random() * 255,
          Math.random()
        ]})
      })
    })];
    feature.setStyle(style);

    feature.setId(e * Math.random());
    features.push(feature);
  }

  var now = Date.now();
  created = now - then;
  then = now;

  vectorSource.addFeatures(features);
  now = Date.now();
  added = now - then;
  total += count;

  document.getElementById('total').innerHTML = total;
  document.getElementById('created').innerHTML = 'Features created in ' + created + 'ms.';
  document.getElementById('added').innerHTML = 'Features added in ' + added + 'ms.';
};

var tile = new ol.layer.Tile({
  source: new ol.source.TileWMS({
    url: 'http://demo.boundlessgeo.com/geoserver/wms',
    params: {
      'LAYERS': 'ne:NE1_HR_LC_SR_W_DR'
    }
  })
});

var map = new ol.Map({
  layers: [tile, vector],
  target: 'map2d',
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});

var ol3d = new olcs.OLCesium({map: map});
var scene = ol3d.getCesiumScene();
var terrainProvider = new Cesium.CesiumTerrainProvider({
  url: '//assets.agi.com/stk-terrain/world'
});
scene.terrainProvider = terrainProvider;
ol3d.setEnabled(true);


// Show off 3D feature picking
var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
var lastPicked;
handler.setInputAction(function(movement) {
  var pickedObjects = scene.drillPick(movement.position);
  if (Cesium.defined(pickedObjects)) {
    for (var i = 0; i < pickedObjects.length; ++i) {
      var picked = pickedObjects[i].primitive;
      if (picked.olFeature == lastPicked) continue;
      var carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(picked.position);
      console.log('Picked feature', picked.olFeature, ' is at ', carto);
      lastPicked = picked.olFeature;
    }
  } else {
    lastPicked = undefined;
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

function clearFeatures() {
  vectorSource.clear();
  total = document.getElementById('total').innerHTML = 0;
}
