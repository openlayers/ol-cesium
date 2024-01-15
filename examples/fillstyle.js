import OLCesium from 'olcs';
import olView from 'ol/View.js';
import {defaults as olControlDefaults} from 'ol/control.js';
import olSourceOSM from 'ol/source/OSM.js';
import olLayerTile from 'ol/layer/Tile.js';
import olStyleStyle from 'ol/style/Style.js';
import olFeature from 'ol/Feature.js';
import olStyleStroke from 'ol/style/Stroke.js';
import {defaults as interactionDefaults} from 'ol/interaction.js';
import olStyleFill from 'ol/style/Fill.js';
import olMap from 'ol/Map.js';
import olSourceVector from 'ol/source/Vector.js';
import olGeomPolygon from 'ol/geom/Polygon.js';
import olLayerVector from 'ol/layer/Vector.js';
import {OLCS_ION_TOKEN} from './_common.js';


const vectorSource = new olSourceVector({
  features: []
});

const vectorLayer = new olLayerVector({
  source: vectorSource,
  altitudeMode: 'clampToGround'
});

const image = new Image();
image.onload = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 32;
  canvas.height = 48;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const canvas2 = document.createElement('canvas');
  const ctx2 = canvas2.getContext('2d');

  const polygonFeature = new olFeature({
    geometry: new olGeomPolygon([[[-3e6, 0], [-3e6, 2e6], [-1e6, 2e6], [-1e6, 0], [-3e6, 0]]])
  });
  polygonFeature.setStyle(new olStyleStyle({
    stroke: new olStyleStroke({
      color: 'green',
      lineDash: [4],
      width: 3
    }),
    fill: new olStyleFill({
      color: ctx2.createPattern(canvas, 'repeat')
    })
  }));
  vectorSource.addFeature(polygonFeature);
};
image.src = 'data/icon.png';


const map = new olMap({
  interactions: interactionDefaults(),
  layers: [
    new olLayerTile({
      source: new olSourceOSM()
    }),
    vectorLayer
  ],
  target: 'map2d',
  controls: olControlDefaults({
    attributionOptions: {
      collapsible: false
    }
  }),
  view: new olView({
    center: [-2e6, 1e6],
    zoom: 4
  })
});

Cesium.Ion.defaultAccessToken = OLCS_ION_TOKEN;
const ol3d = new OLCesium({map, target: 'map3d'});
const scene = ol3d.getCesiumScene();
Cesium.createWorldTerrainAsync().then(tp => scene.terrainProvider = tp);
ol3d.setEnabled(true);

window['ol3d'] = ol3d;
window['scene'] = scene;
document.getElementById('enable').addEventListener('click', () => ol3d.setEnabled(!ol3d.getEnabled()));

ol3d.enableAutoRenderLoop();

window['toggleClampToGround'] = function() {
  let altitudeMode;
  if (!vectorLayer.get('altitudeMode')) {
    altitudeMode = 'clampToGround';
  }
  vectorLayer.set('altitudeMode', altitudeMode);
  map.removeLayer(vectorLayer);
  map.addLayer(vectorLayer);
};
