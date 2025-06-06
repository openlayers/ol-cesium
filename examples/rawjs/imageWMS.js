import OLCesium from 'olcs';
import olView from 'ol/View.js';
import {defaults as olControlDefaults} from 'ol/control.js';
import olSourceImageWMS from 'ol/source/ImageWMS.js';
import olSourceOSM from 'ol/source/OSM.js';
import olLayerImage from 'ol/layer/Image.js';
import olLayerTile from 'ol/layer/Tile.js';
import olMap from 'ol/Map.js';

const imageWMSSource = new olSourceImageWMS({
  url: 'https://ahocevar.com/geoserver/wms',
  params: {'LAYERS': 'topp:states'},
  ratio: 1
});

const Cesium = window.Cesium;
const ol2d = new olMap({
  layers: [
    new olLayerTile({
      source: new olSourceOSM()
    }),
    new olLayerImage({
      extent: [-13884991, 2870341, -7455066, 6338219],
      source: imageWMSSource
    })
  ],
  controls: olControlDefaults({
    attributionOptions: {
      collapsible: false
    }
  }),
  target: 'mapCesium',
  view: new olView({
    center: [-10967567.978507737, 4204193.972847062],
    zoom: 3
  })
});

const ol3d = new OLCesium({
  map: ol2d,
  time() {
    return Cesium.JulianDate.now();
  }
});
ol3d.getCesiumScene();
ol3d.setEnabled(true);

document.getElementById('enable').addEventListener('click', () => ol3d.setEnabled(!ol3d.getEnabled()));

//##REMOVE## Keep this tag, split code here for code sandbox

import {initCodeSandbox} from './_code-sandbox.js';
initCodeSandbox('rawjs/imageWMS.js');
