/**
 * @module examples.kml
 */
import OLCesium from 'olcs/OLCesium.js';
import {transform} from 'ol/proj.js';
import olView from 'ol/View.js';
import {defaults as olControlDefaults} from 'ol/control.js';
import olSourceOSM from 'ol/source/OSM.js';
import olLayerTile from 'ol/layer/Tile.js';
import olMap from 'ol/Map.js';

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0MzAyNzUyYi0zY2QxLTQxZDItODRkOS1hNTA3MDU3ZTBiMDUiLCJpZCI6MjU0MSwiaWF0IjoxNTMzNjI1MTYwfQ.oHn1SUWJa12esu7XUUtEoc1BbEbuZpRocLetw6M6_AA';
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

const ol3d = new OLCesium({map: ol2d});
const scene = ol3d.getCesiumScene();
scene.terrainProvider = Cesium.createWorldTerrain();

ol3d.getDataSources().add(Cesium.KmlDataSource.load(
    'https://api3.geo.admin.ch/ogcproxy?url=' +
  'https%3A%2F%2Fdav0.bgdi.admin.ch%2Fbazl_web%2FActive_Obstacles.kmz', {
      camera: scene.camera,
      canvas: scene.canvas
    }
));

document.getElementById('enable').addEventListener('click', () => ol3d.setEnabled(!ol3d.getEnabled()));
