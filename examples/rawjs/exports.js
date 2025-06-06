import OLCesium from 'olcs';
import {transform} from 'ol/proj.js';
import olView from 'ol/View.js';
import olSourceOSM from 'ol/source/OSM.js';
import olLayerTile from 'ol/layer/Tile.js';
import olMap from 'ol/Map.js';

const ol2d = new olMap({
  layers: [
    new olLayerTile({
      source: new olSourceOSM()
    })
  ],
  target: 'mapCesium',
  view: new olView({
    center: transform([25, 20], 'EPSG:4326', 'EPSG:3857'),
    zoom: 3
  })
});

const ol3d = new OLCesium({map: ol2d});
ol3d.getCesiumScene();

ol3d.setEnabled(true);
const camera = ol3d.getCamera();

const infoDiv = document.getElementById('infoDiv');
const printInfo = function() {
  infoDiv.innerHTML = `Center: ${camera.getCenter()}<br />` +
                      `Distance: ${camera.getDistance()}<br />` +
                      `Heading: ${camera.getHeading()}<br />` +
                      `Tilt: ${camera.getTilt()}<br />` +
                      `<i>Position:</i> ${camera.getPosition()}<br />` +
                      `<i>Altitude:</i> ${camera.getAltitude()}<br />`;
};
setInterval(printInfo, 100);

document.getElementById('enable').addEventListener('click', () => ol3d.setEnabled(!ol3d.getEnabled()));
window['camera'] = camera;
window['olProjTransform'] = transform;

//##REMOVE## Keep this tag, split code here for code sandbox

import {initCodeSandbox} from './_code-sandbox.js';
initCodeSandbox('rawjs/exports.js');
