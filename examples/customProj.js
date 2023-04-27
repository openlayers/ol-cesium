import OLCesium from 'olcs';
import olView from 'ol/View.js';
import olSourceImageWMS from 'ol/source/ImageWMS.js';
import olSourceOSM from 'ol/source/OSM.js';
import olLayerImage from 'ol/layer/Image.js';
import olLayerTile from 'ol/layer/Tile.js';
import olMap from 'ol/Map.js';
import {get as getProjection} from 'ol/proj.js';
import './_proj21781.js';
import {OLCS_ION_TOKEN} from './_common.js';

const customProjSource = new olSourceImageWMS({
  attributions: '© <a href="http://www.geo.admin.ch/internet/geoportal/' +
  'en/home.html">National parks / geo.admin.ch</a>',
  crossOrigin: 'anonymous',
  params: {'LAYERS': 'ch.bafu.schutzgebiete-paerke_nationaler_bedeutung'},
  projection: 'EPSG:21781',
  url: 'https://wms.geo.admin.ch/'
});

customProjSource.set('olcs_projection', getProjection('EPSG:3857'));

const Cesium = window.Cesium;
Cesium.Ion.defaultAccessToken = OLCS_ION_TOKEN;
const ol2d = new olMap({
  layers: [
    new olLayerTile({
      source: new olSourceOSM()
    }),
    new olLayerImage({
      source: customProjSource
    })
  ],
  target: 'mapCesium',
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
Cesium.createWorldTerrainAsync().then(tp => scene.terrainProvider = tp);
ol3d.setEnabled(true);

document.getElementById('enable').addEventListener('click', () => ol3d.setEnabled(!ol3d.getEnabled()));

//##REMOVE## Keep this tag, split code here for code sandbox

import {initCodeSandbox} from './_code-sandbox.js';
initCodeSandbox('./customProj.js', './_proj21781.js');
