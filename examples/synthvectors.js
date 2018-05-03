/**
 * @module examples.synthvectors
 */
const exports = {};
import olLayerVector from 'ol/layer/Vector.js';
import olSourceVector from 'ol/source/Vector.js';
import olStyleFill from 'ol/style/Fill.js';
import olStyleCircle from 'ol/style/Circle.js';
import olStyleStyle from 'ol/style/Style.js';
import OLCesium from 'olcs/OLCesium.js';
import olView from 'ol/View.js';
import olMap from 'ol/Map.js';
import olSourceOSM from 'ol/source/OSM.js';
import olLayerTile from 'ol/layer/Tile.js';
import olFeature from 'ol/Feature.js';
import olGeomPoint from 'ol/geom/Point.js';


let total = 0;
let created = 0;
let added = 0;
const vectorLayers = [];

const tile = new olLayerTile({
  source: new olSourceOSM()
});

const map = new olMap({
  layers: [tile],
  target: 'map2d',
  view: new olView({
    center: [0, 0],
    zoom: 2
  })
});

const ol3d = new OLCesium({map});
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


window['clearFeatures'] = function() {
  vectorLayers.forEach((layer) => {
    map.getLayers().remove(layer);
  });
  vectorLayers.length = 0;
  total = document.getElementById('total').innerHTML = 0;
  document.getElementById('created').innerHTML = '';
  document.getElementById('added').innerHTML = '';
};

window['addFeatures'] = function() {
  let then = Date.now();
  const count = 1000;
  const features = [];
  const e = 18000000;
  for (let i = 0; i < count; ++i) {
    const feature = new olFeature({
      geometry: new olGeomPoint([
        2 * e * Math.random() - e,
        2 * e * Math.random() - e,
        e * Math.random()
      ])
    });
    const style = [new olStyleStyle({
      image: new olStyleCircle({
        radius: 2,
        fill: new olStyleFill({color: [
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

  const vectorSource = new olSourceVector({});
  const vector = new olLayerVector({
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


export default exports;
