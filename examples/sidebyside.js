import OLCesium from 'olcs';
import olSourceOSM from 'ol/source/OSM.js';
import olLayerTile from 'ol/layer/Tile.js';
import olMap from 'ol/Map.js';
import {transform} from 'ol/proj.js';
import olView from 'ol/View.js';

const Cesium = window.Cesium;
//##OLCS_ION_TOKEN##

const view = new olView({
  center: transform([25, 20], 'EPSG:4326', 'EPSG:3857'),
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
Cesium.createWorldTerrainAsync().then(tp => scene.terrainProvider = tp);
ol3d.setEnabled(true);

document.getElementById('enable').addEventListener('click', () => ol3d.setEnabled(!ol3d.getEnabled()));

//##REMOVE## Keep this tag, split code here for code sandbox

import {initCodeSandbox} from './_code-sandbox.js';
initCodeSandbox('rawjs/sidebyside.js');