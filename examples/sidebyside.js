/**
 * @module examples.sidebyside
 */
import OLCesium from 'olcs/OLCesium.js';
import olSourceOSM from 'ol/source/OSM.js';
import olLayerTile from 'ol/layer/Tile.js';
import olMap from 'ol/Map.js';
import {transform} from 'ol/proj.js';
import olView from 'ol/View.js';


const view = new olView({
  center: transform([25, 20], 'EPSG:4326', 'EPSG:3857'),
  zoom: 3,
  rotation: Math.PI / 6
});

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0MzAyNzUyYi0zY2QxLTQxZDItODRkOS1hNTA3MDU3ZTBiMDUiLCJpZCI6MjU0MSwiaWF0IjoxNTMzNjI1MTYwfQ.oHn1SUWJa12esu7XUUtEoc1BbEbuZpRocLetw6M6_AA';
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
scene.terrainProvider = Cesium.createWorldTerrain();
ol3d.setEnabled(true);

document.getElementById('enable').addEventListener('click', () => ol3d.setEnabled(!ol3d.getEnabled()));
