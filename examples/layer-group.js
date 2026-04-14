import olMap from 'ol/Map.js';
import olView from 'ol/View.js';
import olLayerGroup from 'ol/layer/Group.js';
import olLayerTile from 'ol/layer/Tile.js';
import {fromLonLat} from 'ol/proj.js';
import olSourceOSM from 'ol/source/OSM.js';
import StadiaMaps from 'ol/source/StadiaMaps.js';
import OLCesium from 'olcs';

const layer0 = new olLayerTile({
  source: new olSourceOSM(),
});

const layer10 = new olLayerTile({
  source: new StadiaMaps({
    layer: 'stamen_terrain',
  }),
});

const layer11 = new olLayerTile({
  source: new StadiaMaps({
    layer: 'stamen_toner',
  }),
});

const layer1 = new olLayerGroup({
  layers: [layer10, layer11],
});

const ol2d = new olMap({
  layers: [layer0, layer1],
  target: 'map2d',
  view: new olView({
    center: fromLonLat([37.4057, 8.81566]),
    zoom: 4,
  }),
});

const ol3d = new OLCesium({map: ol2d, target: 'mapCesium'});
ol3d.setEnabled(true);

function getLayer(layername) {
  switch (layername) {
    case 'layer0':
      return layer0;
    case 'layer1':
      return layer1;
    case 'layer10':
      return layer10;
    case 'layer11':
      return layer11;
    default:
      throw new Error('Unknown layer');
  }
}

window['toggleLayer'] = function (element, name) {
  getLayer(name).setVisible(element.checked);
};
window['setLayerOpacity'] = function (element, name) {
  getLayer(name).setOpacity(parseFloat(element.value));
};

//##REMOVE## Keep this tag, split code here for code sandbox

import {initCodeSandbox} from './_code-sandbox.js';
initCodeSandbox('rawjs/layer-group.js');
