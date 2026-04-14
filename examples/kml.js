import {defaults as olControlDefaults} from 'ol/control.js';
import olLayerTile from 'ol/layer/Tile.js';
import olMap from 'ol/Map.js';
import {transform} from 'ol/proj.js';
import olSourceOSM from 'ol/source/OSM.js';
import olView from 'ol/View.js';
import OLCesium from 'olcs';

const Cesium = window.Cesium;
const ol2d = new olMap({
  layers: [
    new olLayerTile({
      source: new olSourceOSM(),
    }),
  ],
  controls: olControlDefaults({
    attributionOptions: {
      collapsible: false,
    },
  }),
  target: 'mapCesium',
  view: new olView({
    center: transform([25, 20], 'EPSG:4326', 'EPSG:3857'),
    zoom: 3,
  }),
});

const ol3d = new OLCesium({map: ol2d});
const scene = ol3d.getCesiumScene();

ol3d.getDataSources().add(
  Cesium.KmlDataSource.load(
    'https://data.geo.admin.ch/ch.bazl.luftfahrthindernis/luftfahrthindernis/luftfahrthindernis_4326.kmz',
    {
      camera: scene.camera,
      canvas: scene.canvas,
    },
  ),
);

document
  .getElementById('enable')
  .addEventListener('click', () => ol3d.setEnabled(!ol3d.getEnabled()));

//##REMOVE## Keep this tag, split code here for code sandbox

import {initCodeSandbox} from './_code-sandbox.js';
initCodeSandbox('rawjs/kml.js');
