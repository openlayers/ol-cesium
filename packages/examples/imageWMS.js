import OLCesium from 'olcs';
import olView from 'ol/View.js';
import {defaults as olControlDefaults} from 'ol/control.js';
import olSourceImageWMS from 'ol/source/ImageWMS.js';
import olSourceOSM from 'ol/source/OSM.js';
import olLayerImage from 'ol/layer/Image.js';
import olLayerTile from 'ol/layer/Tile.js';
import olMap from 'ol/Map.js';
import {OLCS_ION_TOKEN} from './_common.js';

const imageWMSSource = new olSourceImageWMS({
  url: 'https://ahocevar.com/geoserver/wms',
  params: {'LAYERS': 'topp:states'},
  ratio: 1
});

Cesium.Ion.defaultAccessToken = OLCS_ION_TOKEN;
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
  target: 'map',
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
const scene = ol3d.getCesiumScene();
Cesium.createWorldTerrainAsync().then(tp => scene.terrainProvider = tp);
ol3d.setEnabled(true);

document.getElementById('enable').addEventListener('click', () => ol3d.setEnabled(!ol3d.getEnabled()));
