import {transform} from 'ol/proj.js';
import olView from 'ol/View.js';
import {defaults as olControlDefaults} from 'ol/control.js';
import olSourceOSM from 'ol/source/OSM.js';
import olLayerTile from 'ol/layer/Tile.js';
import olMap from 'ol/Map.js';
import {ContribManager} from 'olcs';
import {OLCS_ION_TOKEN} from './_common.js';

const ol2d = new olMap({
  layers: [
    new olLayerTile({
      source: new olSourceOSM()
    })
  ],
  controls: olControlDefaults({
    attributionOptions: {
      collapsible: false
    }
  }),
  target: 'map',
  view: new olView({
    center: transform([25, 20], 'EPSG:4326', 'EPSG:3857'),
    zoom: 3
  })
});

window['manager'] = new ContribManager(window.CESIUM_URL, {
  map: ol2d,
  cameraExtentInRadians: [0.0897, 0.7923, 0.2003, 0.8417],
  cesiumIonDefaultAccessToken: OLCS_ION_TOKEN
});
