import OLCesium from 'olcs';
import olView from 'ol/View.js';
import {defaults as olControlDefaults} from 'ol/control.js';
import olSourceOSM from 'ol/source/OSM.js';
import olLayerTile from 'ol/layer/Tile.js';
import olSourceVector from 'ol/source/Vector.js';
import olLayerVector from 'ol/layer/Vector.js';
import olStyleIcon from 'ol/style/Icon.js';
import olStyleStyle from 'ol/style/Style.js';
import olFeature from 'ol/Feature.js';
import olGeomPoint from 'ol/geom/Point.js';
import olMap from 'ol/Map.js';
import {OLCS_ION_TOKEN} from './_common.js';


const point = new olGeomPoint([700000, 200000, 100000]);

const iconFeature = new olFeature({
  geometry: point
});


const iconStyle = new olStyleStyle({
  image: new olStyleIcon(/** @type {olx.style.IconOptions} */ ({
    anchor: [0.5, 46],
    anchorXUnits: 'fraction',
    anchorYUnits: 'pixels',
    opacity: 0.75,
    src: 'data/icon.png'
  }))
});

iconFeature.setStyle(iconStyle);


const vectorSource2 = new olSourceVector({
  features: [iconFeature]
});
const vectorLayer2 = new olLayerVector({
  renderMode: 'image',
  source: vectorSource2
});


const map = new olMap({
  layers: [
    new olLayerTile({
      source: new olSourceOSM()
    }),
    vectorLayer2
  ],
  target: 'map2d',
  controls: olControlDefaults({
    attributionOptions: {
      collapsible: false
    }
  }),
  view: new olView({
    center: [0, 0],
    zoom: 2
  })
});


Cesium.Ion.defaultAccessToken = OLCS_ION_TOKEN;
const ol3d = new OLCesium({map/*, target: 'map3d'*/});
const scene = ol3d.getCesiumScene();
Cesium.createWorldTerrainAsync().then(tp => scene.terrainProvider = tp);
ol3d.setEnabled(true);

let tracking = false;
window['toggleTracking'] = function() {
  tracking = !tracking;
  ol3d.trackedFeature = tracking ? iconFeature : undefined;
};

setInterval(() => {
  const old = point.getCoordinates();
  point.setCoordinates([
    old[0] + 1000 * Math.random(),
    old[1] + 1000 * Math.random(),
    old[2]
  ]);
  iconFeature.changed();
}, 100);
