import OLCesium from 'olcs';
import {transform} from 'ol/proj.js';
import olView from 'ol/View.js';
import {defaults as olControlDefaults} from 'ol/control.js';
import olSourceOSM from 'ol/source/OSM.js';
import olLayerTile from 'ol/layer/Tile.js';
import olMap from 'ol/Map.js';

const Cesium = window.Cesium;
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
  target: 'mapCesium',
  view: new olView({
    center: transform([25, 20], 'EPSG:4326', 'EPSG:3857'),
    zoom: 3
  })
});

const timeElt = document.getElementById('time');
const ol3d = new OLCesium({
  map: ol2d,
  time() {
    const val = timeElt.value;
    if (ol3d.getCesiumScene().globe.enableLighting && val) {
      const d = new Date();
      d.setUTCHours(val);
      return Cesium.JulianDate.fromDate(d);
    }
    return Cesium.JulianDate.now();
  }
});
const scene = ol3d.getCesiumScene();
ol3d.setEnabled(true);


timeElt.style.display = 'none';

document.getElementById('enable').addEventListener('click', () => ol3d.setEnabled(!ol3d.getEnabled()));
window['toggleTime'] = function() {
  scene.globe.enableLighting = !scene.globe.enableLighting;
  if (timeElt.style.display === 'none') {
    timeElt.style.display = 'inline-block';
  } else {
    timeElt.style.display = 'none';
  }
};

//##REMOVE## Keep this tag, split code here for code sandbox

import {initCodeSandbox} from './_code-sandbox.js';
initCodeSandbox('rawjs/main.js');
