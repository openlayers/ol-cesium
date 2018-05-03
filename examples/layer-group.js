/**
 * @module examples.layer-group
 */
const exports = {};
import olMap from 'ol/Map.js';
import olView from 'ol/View.js';
import olLayerGroup from 'ol/layer/Group.js';
import olLayerTile from 'ol/layer/Tile.js';
import * as olProj from 'ol/proj.js';
import olSourceOSM from 'ol/source/OSM.js';
import olSourceTileJSON from 'ol/source/TileJSON.js';
import OLCesium from 'olcs/OLCesium.js';

const layer0 = new olLayerTile({
  source: new olSourceOSM()
});

const layer10 = new olLayerTile({
  source: new olSourceTileJSON({
    url: 'https://api.tiles.mapbox.com/v3/mapbox.20110804-hoa-foodinsecurity-3month.json?secure',
    crossOrigin: 'anonymous'
  })
});

const layer11 = new olLayerTile({
  source: new olSourceTileJSON({
    url: 'https://api.tiles.mapbox.com/v3/mapbox.world-borders-light.json?secure',
    crossOrigin: 'anonymous'
  })
});

const layer1 = new olLayerGroup({
  layers: [
    layer10,
    layer11
  ]
});

const ol2d = new olMap({
  layers: [layer0, layer1],
  target: 'map2d',
  view: new olView({
    center: olProj.fromLonLat([37.40570, 8.81566]),
    zoom: 4
  })
});

const ol3d = new OLCesium({map: ol2d, target: 'map3d'});
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

window['toggleLayer'] = function(element, name) {
  getLayer(name).setVisible(element.checked);
};
window['setLayerOpacity'] = function(element, name) {
  getLayer(name).setOpacity(parseFloat(element.value));
};

export default exports;
