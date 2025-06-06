import OLCesium from 'olcs';
import olMap from 'ol/Map.js';
import TileLayer from 'ol/layer/Tile.js';
import {get as getProjection} from 'ol/proj.js';
import View from 'ol/View.js';
import MVT from 'ol/format/MVT.js';
import VectorTileLayer from 'ol/layer/VectorTile.js';
import VectorTileSource from 'ol/source/VectorTile.js';
import Stroke from 'ol/style/Stroke.js';
import Style from 'ol/style/Style.js';
import OSMSource from 'ol/source/OSM.js';
import './_proj21781.js';

const projection = getProjection('EPSG:3857');
console.assert(projection);

let styleNumber = 0;

function createMVTStyle(color = 'purple') {
  return [
    new Style({
      stroke: new Stroke({
        color,
        width: 4
      })
    })
  ];
}

const allStyles = [
  createMVTStyle(),
  createMVTStyle('red'),
];

function createMVTLayer(url, maxZoom) {
  const source = new VectorTileSource({
    url,
    attributions: 'Schweizmobil',
    format: new MVT(),
  });
  const styles = allStyles[styleNumber];
  source.set('olcs_skip', false);
  source.set('olcs_minimumLevel', 6);
  return new VectorTileLayer({
    source,
    extent: [572215, 5684416, 1277662, 6145307], // swiss extent
    opacity: 0.6,
    style: styles
  });
}

export const mvtLayer = createMVTLayer(
    'https://map.schweizmobil.ch/api/4/mvt_routes/wander/3857/{z}/{x}/{y}.pbf?olcs',
    20);

function createOSMLayer() {
  const source = new OSMSource();
  return new TileLayer({source});
}

const ol2d = new olMap({
  layers: [
    createOSMLayer(),
    mvtLayer
  ],
  target: 'mapCesium',
  view: new View()
});

const ol3d = new OLCesium({
  map: ol2d,
});
setTimeout(() => {
  ol3d.setEnabled(true);
});

const EXTENT = [572215, 5684416, 1277662, 6145307];
const padding = -50000;
ol2d.getView().fit([
  EXTENT[0] - padding, EXTENT[1] - padding,
  EXTENT[2] + padding, EXTENT[3] + padding,
]);


document.getElementById('enable').addEventListener('click', () => ol3d.setEnabled(!ol3d.getEnabled()));
document.getElementById('toggle').addEventListener('click', () => {
  styleNumber = (styleNumber + 1) % 2;
  mvtLayer.setStyle(allStyles[styleNumber]);
});

//##REMOVE## Keep this tag, split code here for code sandbox

import {initCodeSandbox} from './_code-sandbox.js';
initCodeSandbox('rawjs/mvt.js', 'rawjs/_proj21781.js');
