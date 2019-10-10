/**
 * @module examples.customProj
 */
import OLCesium from 'olcs/OLCesium.js';
import olView from 'ol/View.js';
import olSourceImageWMS from 'ol/source/ImageWMS.js';
import olSourceOSM from 'ol/source/OSM.js';
import olLayerImage from 'ol/layer/Image.js';
import olLayerTile from 'ol/layer/Tile.js';
import olMap from 'ol/Map.js';
import {get as getProjection} from 'ol/proj.js';
import {register as olProj4Register} from 'ol/proj/proj4.js';
import proj4 from 'proj4';

const epsg21781def = [
  '+proj=somerc',
  '+lat_0=46.95240555555556',
  '+lon_0=7.439583333333333',
  '+k_0=1',
  '+x_0=600000',
  '+y_0=200000',
  '+ellps=bessel',
  '+towgs84=674.374,15.056,405.346,0,0,0,0',
  '+units=m',
  '+no_defs'
].join(' ');
const epsg21781extent = [420000, 30000, 900000, 350000];

proj4.defs('EPSG:21781', epsg21781def);

olProj4Register(proj4);
getProjection('EPSG:21781').setExtent(epsg21781extent);

const customProjSource = new olSourceImageWMS({
  attributions: '© <a href="http://www.geo.admin.ch/internet/geoportal/' +
  'en/home.html">National parks / geo.admin.ch</a>',
  crossOrigin: 'anonymous',
  params: {'LAYERS': 'ch.bafu.schutzgebiete-paerke_nationaler_bedeutung'},
  projection: 'EPSG:21781',
  url: 'https://wms.geo.admin.ch/'
});

customProjSource.set('olcs.projection', getProjection('EPSG:3857'));

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0MzAyNzUyYi0zY2QxLTQxZDItODRkOS1hNTA3MDU3ZTBiMDUiLCJpZCI6MjU0MSwiaWF0IjoxNTMzNjI1MTYwfQ.oHn1SUWJa12esu7XUUtEoc1BbEbuZpRocLetw6M6_AA';
const ol2d = new olMap({
  layers: [
    new olLayerTile({
      source: new olSourceOSM()
    }),
    new olLayerImage({
      source: customProjSource
    })
  ],
  target: 'map',
  view: new olView({
    center: [860434.6266531206, 6029479.0044273855],
    zoom: 6
  })
});

const ol3d = new OLCesium({
  map: ol2d,
  time() {
    return Cesium.JulianDate.now();
  }
});
const scene = ol3d.getCesiumScene();
scene.terrainProvider = Cesium.createWorldTerrain();
ol3d.setEnabled(true);

document.getElementById('enable').addEventListener('click', () => ol3d.setEnabled(!ol3d.getEnabled()));
