/**
 * @module examples.reprojection
 */
const exports = {};

import proj4 from 'proj4';
import {register} from 'ol/proj/proj4';
import {get as getProjection} from 'ol/proj';
import olTileWMS from 'ol/source/TileWMS';
import olMap from 'ol/Map';
import olLayerTile from 'ol/layer/Tile';
import olView from 'ol/View';
import OLCesium from 'olcs/OLCesium';
import olSourceOSM from 'ol/source/OSM';

proj4.defs('EPSG:21781', '+proj=somerc +lat_0=46.95240555555556 ' +
    '+lon_0=7.439583333333333 +k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel ' +
    '+towgs84=674.4,15.1,405.3,0,0,0,0 +units=m +no_defs');
register(proj4);
const proj21781 = getProjection('EPSG:21781');
proj21781.setExtent([485071.54, 75346.36, 828515.78, 299941.84]);
const source = new olTileWMS({
  attributions: ['&copy; ' +
        '<a href="http://www.geo.admin.ch/internet/geoportal/' +
        'en/home.html">' +
        'Pixelmap 1:1000000 / geo.admin.ch</a>'],
  crossOrigin: 'anonymous',
  params: {
    'LAYERS': 'ch.swisstopo.pixelkarte-farbe-pk1000.noscale',
    'FORMAT': 'image/jpeg'
  },
  url: 'http://wms.geo.admin.ch/',
  projection: 'EPSG:21781'
});
const ol2d = new olMap({
  layers: [
    new olLayerTile({source: new olSourceOSM()}),
    new olLayerTile({
      source
    })
  ],
  target: 'map',
  view: new olView({
    projection: 'EPSG:4326',
    center: [6.56273, 46.51781],
    zoom: 6
  })
});
const ol3d = new OLCesium({map: ol2d});
const scene = ol3d.getCesiumScene();
const terrainProvider = new Cesium.CesiumTerrainProvider({
  url: '//assets.agi.com/stk-terrain/world'
});
scene.terrainProvider = terrainProvider;
ol3d.setEnabled(true);

document.getElementById('enable').addEventListener('click', () => ol3d.setEnabled(!ol3d.getEnabled()));

export default exports;
