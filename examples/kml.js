/**
 * @module examples.kml
 */
const exports = {};
import OLCesium from 'olcs/OLCesium.js';
import * as olProj from 'ol/proj.js';
import olView from 'ol/View.js';
import {defaults as olControlDefaults} from 'ol/control.js';
import olSourceOSM from 'ol/source/OSM.js';
import olLayerTile from 'ol/layer/Tile.js';
import olMap from 'ol/Map.js';


const ol2d = new olMap({
  layers: [
    new olLayerTile({
      source: new olSourceOSM()
    })
  ],
  controls: olControlDefaults({
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

const ol3d = new OLCesium({map: ol2d});
const scene = ol3d.getCesiumScene();
const terrainProvider = new Cesium.CesiumTerrainProvider({
  url: '//assets.agi.com/stk-terrain/world'
});
scene.terrainProvider = terrainProvider;

ol3d.getDataSources().add(Cesium.KmlDataSource.load(
    'https://api3.geo.admin.ch/ogcproxy?url=' +
  'https%3A%2F%2Fdav0.bgdi.admin.ch%2Fbazl_web%2FActive_Obstacles.kmz', {
      camera: scene.camera,
      canvas: scene.canvas
    }
));

document.getElementById('enable').addEventListener('click', () => ol3d.setEnabled(!ol3d.getEnabled()));

export default exports;
