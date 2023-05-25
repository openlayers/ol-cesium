/**
 * @module examples.lazy
 */
import olLayerTile from 'ol/layer/Tile.js';
import olMap from 'ol/Map.js';
import olSourceOSM from 'ol/source/OSM.js';
import olView from 'ol/View.js';
import olcsContribManager from 'olcs/contrib/Manager.js';
import {OLCS_ION_TOKEN} from './_common.js';
import {defaults as olControlDefaults} from 'ol/control.js';
import {transform} from 'ol/proj.js';

const ol2d = new olMap({
  layers: [
    new olLayerTile({
      source: new olSourceOSM(),
    }),
  ],
  controls: olControlDefaults({
    attributionOptions: {
      collapsible: false,
    },
  }),
  target: 'map',
  view: new olView({
    center: transform([25, 20], 'EPSG:4326', 'EPSG:3857'),
    zoom: 3,
  }),
});

window['manager'] = new olcsContribManager(window.CESIUM_URL, {
  map: ol2d,
  cesiumIonDefaultAccessToken: OLCS_ION_TOKEN,
});
