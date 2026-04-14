import olLayerGroup from 'ol/layer/Group.js';
import olLayerTile from 'ol/layer/Tile.js';
import olMap from 'ol/Map.js';
import {transform} from 'ol/proj.js';
import olSourceOSM from 'ol/source/OSM.js';
import StadiaMaps from 'ol/source/StadiaMaps.js';
import olSourceTileWMS from 'ol/source/TileWMS.js';
import olView from 'ol/View.js';
import OLCesium from 'olcs';

const view = new olView({
  center: transform([-112.2, 36.06], 'EPSG:4326', 'EPSG:3857'),
  zoom: 11,
});

const layer0 = new olLayerTile({
  source: new olSourceOSM(),
});

const stadiaMapsSource = new StadiaMaps({
  layer: 'stamen_toner',
});

const layer2 = new olLayerTile({
  source: stadiaMapsSource,
});
const ol2d = new olMap({
  layers: [layer0, new olLayerGroup({layers: [layer2]})],
  target: 'map2d',
  view,
});

const ol3d = new OLCesium({map: ol2d, target: 'mapCesium'});

ol3d.getCesiumScene();
ol3d.setEnabled(true);

const addStamen = function () {
  ol2d.addLayer(
    new olLayerTile({
      source: new StadiaMaps({
        opacity: 0.7,
        layer: 'stamen_watercolor',
      }),
    }),
  );
};

const tileWMSSource = new olSourceTileWMS({
  url: 'https://ahocevar.com/geoserver/wms',
  params: {'LAYERS': 'topp:states', 'TILED': true},
  serverType: 'geoserver',
  crossOrigin: 'anonymous',
});

const addTileWMS = function () {
  ol2d.addLayer(
    new olLayerTile({
      opacity: 0.5,
      extent: [-13884991, 2870341, -7455066, 6338219],
      source: tileWMSSource,
    }),
  );
};

let changeI = 0;
const changeTileWMSParams = function () {
  tileWMSSource.updateParams({
    'LAYERS': changeI++ % 2 == 0 ? 'nurc:Img_Sample' : 'topp:states',
  });
};

const addTileJSON = function () {
  ol2d.addLayer(
    new olLayerTile({
      source: stadiaMapsSource,
    }),
  );
};

const removeLastLayer = function () {
  const length = ol2d.getLayers().getLength();
  if (length > 0) {
    ol2d.getLayers().removeAt(length - 1);
  }
};

window['global'] = {
  ol2d,
  removeLastLayer,
  addStamen,
  addTileWMS,
  addTileJSON,
  changeTileWMSParams,
  layer0,
  layer2,
};

//##REMOVE## Keep this tag, split code here for code sandbox

import {initCodeSandbox} from './_code-sandbox.js';
initCodeSandbox('rawjs/rastersync.js');
