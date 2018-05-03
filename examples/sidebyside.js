/**
 * @module examples.sidebyside
 */
const exports = {};
import OLCesium from 'olcs/OLCesium.js';
import olSourceOSM from 'ol/source/OSM.js';
import olLayerTile from 'ol/layer/Tile.js';
import olMap from 'ol/Map.js';
import * as olProj from 'ol/proj.js';
import olView from 'ol/View.js';


const view = new olView({
  center: olProj.transform([25, 20], 'EPSG:4326', 'EPSG:3857'),
  zoom: 3,
  rotation: Math.PI / 6
});

const ol2d = new olMap({
  layers: [
    new olLayerTile({
      source: new olSourceOSM()
    })
  ],
  target: 'map2d',
  view
});

const ol3d = new OLCesium({map: ol2d, target: 'map3d'});
const scene = ol3d.getCesiumScene();
const terrainProvider = new Cesium.CesiumTerrainProvider({
  url: '//assets.agi.com/stk-terrain/world'
});
scene.terrainProvider = terrainProvider;
ol3d.setEnabled(true);

document.getElementById('enable').addEventListener('click', () => ol3d.setEnabled(!ol3d.getEnabled()));

export default exports;
