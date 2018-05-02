/**
 * @module examples.lazy
 */
const exports = {};
/* eslint googshift/valid-provide-and-module: 0 */
import * as olProj from 'ol/proj.js';
import olView from 'ol/View.js';
import olControl from 'ol/control.js';
import olSourceOSM from 'ol/source/OSM.js';
import olLayerTile from 'ol/layer/Tile.js';
import olMap from 'ol/Map.js';
import olcsContribManager from 'olcs/contrib/Manager.js';


const ol2d = new olMap({
  layers: [
    new olLayerTile({
      source: new olSourceOSM()
    })
  ],
  controls: olControl.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  target: 'map',
  view: new olView({
    center: olProj.transform([25, 20], 'EPSG:4326', 'EPSG:3857'),
    zoom: 3
  })
});


// eslint-disable-line no-unused-vars
window.manager = new olcsContribManager(window.CESIUM_URL, {map: ol2d});


export default exports;
