let total = 0;
let created = 0;
let added = 0;
const vectorLayers = [];

const tile = new ol.layer.Tile({
  source: new ol.source.OSM()
});

const map = new ol.Map({
  layers: [tile],
  target: 'map2d',
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});

const ol3d = new olcs.OLCesium({map});
const scene = ol3d.getCesiumScene();
const terrainProvider = new Cesium.CesiumTerrainProvider({
  url: '//assets.agi.com/stk-terrain/world'
});
scene.terrainProvider = terrainProvider;
ol3d.setEnabled(true);

// Show off 3D feature picking
const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
let lastPicked;
handler.setInputAction((movement) => {
  const pickedObjects = scene.drillPick(movement.position);
  if (Cesium.defined(pickedObjects)) {
    for (let i = 0; i < pickedObjects.length; ++i) {
      const picked = pickedObjects[i].primitive;
      if (picked.olFeature == lastPicked) {continue;}
      const carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(picked.position);
      console.log('Picked feature', picked.olFeature, ' is at ', carto);
      lastPicked = picked.olFeature;
    }
  } else {
    lastPicked = undefined;
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);


function clearFeatures() { // eslint-disable-line no-unused-vars
  vectorLayers.forEach((layer) => {
    map.getLayers().remove(layer);
  });
  vectorLayers.length = 0;
  total = document.getElementById('total').innerHTML = 0;
  document.getElementById('created').innerHTML = '';
  document.getElementById('added').innerHTML = '';
}

const addFeatures = function() { // eslint-disable-line no-unused-vars
  let then = Date.now();
  const count = 1000;
  const features = [];
  const e = 18000000;
  for (let i = 0; i < count; ++i) {
    const feature = new ol.Feature({
      geometry: new ol.geom.Point([
        2 * e * Math.random() - e,
        2 * e * Math.random() - e,
        e * Math.random()
      ])
    });
    const style = [new ol.style.Style({
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

  let now = Date.now();
  created = now - then;
  then = now;

  const vectorSource = new ol.source.Vector({});
  const vector = new ol.layer.Vector({
    source: vectorSource
  });
  vectorSource.addFeatures(features);
  map.addLayer(vector);
  vectorLayers.push(vector);
  now = Date.now();
  added = now - then;
  total += count;

  document.getElementById('total').innerHTML = total;
  document.getElementById('created').innerHTML = `Features created in ${created}ms.`;
  document.getElementById('added').innerHTML = `Features added in ${added}ms.`;
};

