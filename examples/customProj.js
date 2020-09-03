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
import './_proj21781.js';

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
