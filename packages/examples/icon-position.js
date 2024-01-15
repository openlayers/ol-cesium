import OLCesium, {rotateAroundAxis, pickBottomPoint} from 'olcs';
import olView from 'ol/View.js';
import {defaults as olControlDefaults} from 'ol/control.js';
import olSourceOSM from 'ol/source/OSM.js';
import olLayerTile from 'ol/layer/Tile.js';
import olStyleText from 'ol/style/Text.js';
import olStyleIcon from 'ol/style/Icon.js';
import olStyleStyle from 'ol/style/Style.js';
import olGeomPoint from 'ol/geom/Point.js';
import olFeature from 'ol/Feature.js';
import olStyleStroke from 'ol/style/Stroke.js';
import {defaults as interactionDefaults} from 'ol/interaction.js';
import olStyleFill from 'ol/style/Fill.js';
import olMap from 'ol/Map.js';
import olSourceVector from 'ol/source/Vector.js';
import olLayerVector from 'ol/layer/Vector.js';
import {OLCS_ION_TOKEN} from './_common.js';


const icon1Feature = new olFeature({
  geometry: new olGeomPoint([700000, 200000])
});
icon1Feature.setStyle(new olStyleStyle({
  image: new olStyleIcon(/** @type {olx.style.IconOptions} */ ({
    anchor: [0.5, 1],
    src: 'data/icon.png',
  })),
  text: new olStyleText({
    text: 'Icon with anchor on the bottom center',
    stroke: new olStyleStroke({
      color: 'black',
      width: 3
    }),
    fill: new olStyleFill({
      color: 'white'
    })
  })
}));

const icon2Feature = new olFeature({
  geometry: new olGeomPoint([1000000, 200000])
});
icon2Feature.setStyle(new olStyleStyle({
  image: new olStyleIcon(/** @type {olx.style.IconOptions} */ ({
    src: 'data/image-static.png'
  })),
  text: new olStyleText({
    text: 'Default positioning',
    stroke: new olStyleStroke({
      color: 'black',
      width: 3
    }),
    fill: new olStyleFill({
      color: 'white'
    })
  })
}));

const vectorSource = new olSourceVector({
  features: [
    icon1Feature,
    icon2Feature
  ]
});

const vectorLayer = new olLayerVector({
  source: vectorSource
});

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
    center: [850000, 200000],
    zoom: 7
  })
});

Cesium.Ion.defaultAccessToken = OLCS_ION_TOKEN;
const ol3d = new OLCesium({map, target: 'map3d'});
const scene = ol3d.getCesiumScene();
Cesium.createWorldTerrainAsync().then(tp => scene.terrainProvider = tp);
ol3d.setEnabled(true);

window['toggleClampToGround'] = function() {
  let altitudeMode;
  if (!vectorLayer.get('altitudeMode')) {
    altitudeMode = 'clampToGround';
  }
  vectorLayer.set('altitudeMode', altitudeMode);
  map.removeLayer(vectorLayer);
  map.addLayer(vectorLayer);
};

window['ol3d'] = ol3d;
window['scene'] = scene;
document.getElementById('enable').addEventListener('click', () => ol3d.setEnabled(!ol3d.getEnabled()));

ol3d.enableAutoRenderLoop();


// Tilt camera
const camera = scene.camera;
const pivot = pickBottomPoint(scene);
if (pivot) {
  const options = {};
  const transform = Cesium.Matrix4.fromTranslation(pivot);
  const axis = camera.right;
  rotateAroundAxis(camera, -Math.PI / 4, axis, transform, options);
}
