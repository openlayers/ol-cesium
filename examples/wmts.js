/**
 * @module examples.wmts
 */
import OLCesium from 'olcs/OLCesium.js';

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0MzAyNzUyYi0zY2QxLTQxZDItODRkOS1hNTA3MDU3ZTBiMDUiLCJpZCI6MjU0MSwiaWF0IjoxNTMzNjI1MTYwfQ.oHn1SUWJa12esu7XUUtEoc1BbEbuZpRocLetw6M6_AA';

import Map from 'ol/Map.js';
import View from 'ol/View.js';
import {getWidth, getTopLeft} from 'ol/extent.js';
import TileLayer from 'ol/layer/Tile.js';
import {get as getProjection} from 'ol/proj.js';
import OSM from 'ol/source/OSM.js';
import WMTS from 'ol/source/WMTS.js';
import WMTSTileGrid from 'ol/tilegrid/WMTS.js';


const projection = getProjection('EPSG:3857');
const projectionExtent = projection.getExtent();
const size = getWidth(projectionExtent) / 256;
const resolutions = new Array(14);
const matrixIds = new Array(14);
for (let z = 0; z < 14; ++z) {
  // generate resolutions and matrixIds arrays for this WMTS
  resolutions[z] = size / Math.pow(2, z);
  matrixIds[z] = z;
}

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
      opacity: 0.7
    }),
    new TileLayer({
      opacity: 0.7,
      source: new WMTS({
        attributions: 'Tiles © <a href="https://services.arcgisonline.com/arcgis/rest/' +
            'services/Demographics/USA_Population_Density/MapServer/">ArcGIS</a>',
        url: 'https://services.arcgisonline.com/arcgis/rest/' +
            'services/Demographics/USA_Population_Density/MapServer/WMTS/',
        layer: '0',
        matrixSet: 'EPSG:3857',
        format: 'image/png',
        projection,
        tileGrid: new WMTSTileGrid({
          origin: getTopLeft(projectionExtent),
          resolutions,
          matrixIds
        }),
        style: 'default',
        wrapX: true
      })
    })
  ],
  target: 'map',
  view: new View({
    center: [-11158582, 4813697],
    zoom: 4
  })
});

const ol2d = map;
const ol3d = new OLCesium({
  map: ol2d,
});
const scene = ol3d.getCesiumScene();
scene.terrainProvider = Cesium.createWorldTerrain();
ol3d.setEnabled(true);

document.getElementById('enable').addEventListener('click', () => ol3d.setEnabled(!ol3d.getEnabled()));
