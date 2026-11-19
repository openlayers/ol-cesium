import {defaults as olControlDefaults} from 'ol/control.js';
import olLayerTile from 'ol/layer/Tile.js';
import olMap from 'ol/Map.js';
import {transform, transformExtent} from 'ol/proj.js';
import olSourceOSM from 'ol/source/OSM.js';
import olView from 'ol/View.js';
import OLCesium from 'olcs';

import {getCenter} from 'ol/extent.js';
import {Image as ImageLayer} from 'ol/layer.js';
import Static from 'ol/source/ImageStatic.js';

const geographicExtent = [-40, 50, -10, 65];
const imageExtent = transformExtent(geographicExtent, 'EPSG:4326', 'EPSG:3857');

const canvas = document.createElement('canvas');
canvas.width = 256;
canvas.height = 256;
const context = canvas.getContext('2d');
context.strokeStyle = 'rgba(26, 115, 232, 0.9)';
context.lineWidth = 4;
const cells = 8;
for (let i = 0; i <= cells; ++i) {
  const position = (canvas.width / cells) * i;
  context.beginPath();
  context.moveTo(position, 0);
  context.lineTo(position, canvas.height);
  context.moveTo(0, position);
  context.lineTo(canvas.width, position);
  context.stroke();
}

const ol2d = new olMap({
  layers: [
    new olLayerTile({
      source: new olSourceOSM(),
    }),
    new ImageLayer({
      source: new Static({
        url: canvas.toDataURL(),
        projection: 'EPSG:3857',
        imageExtent,
      }),
    }),
  ],
  controls: olControlDefaults({
    attributionOptions: {
      collapsible: false,
    },
  }),
  target: 'mapCesium',
  view: new olView({
    center: transform(getCenter(geographicExtent), 'EPSG:4326', 'EPSG:3857'),
    zoom: 4,
    projection: 'EPSG:3857',
  }),
});

const ol3d = new OLCesium({
  map: ol2d,
});
ol3d.getCesiumScene();
ol3d.setEnabled(true);

document
  .getElementById('enable')
  .addEventListener('click', () => ol3d.setEnabled(!ol3d.getEnabled()));

//##REMOVE## Keep this tag, split code here for code sandbox

import {initCodeSandbox} from './_code-sandbox.js';
initCodeSandbox('rawjs/image-static-3857.js');
