import OLCesium from 'olcs';

import Map from 'ol/Map.js';
import View from 'ol/View.js';
import {getWidth, getTopLeft} from 'ol/extent.js';
import TileLayer from 'ol/layer/Tile.js';
import {get as getProjection} from 'ol/proj.js';
import OSM from 'ol/source/OSM.js';
import WMTS from 'ol/source/WMTS.js';
import WMTSTileGrid from 'ol/tilegrid/WMTS.js';
import {OLCS_ION_TOKEN} from './_common.js';

Cesium.Ion.defaultAccessToken = OLCS_ION_TOKEN;
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
        attributions: 'Tiles © <a href="https://sampleserver6.arcgisonline.com/arcgis/rest/' +
            'services/WorldTimeZones/MapServer/WMTS/">ArcGIS</a>',
        url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/' +
            'services/WorldTimeZones/MapServer/WMTS/',
        layer: 'WorldTimeZones',
        matrixSet: 'GoogleMapsCompatible',
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
Cesium.createWorldTerrainAsync().then(tp => scene.terrainProvider = tp);
ol3d.setEnabled(true);

document.getElementById('enable').addEventListener('click', () => ol3d.setEnabled(!ol3d.getEnabled()));
