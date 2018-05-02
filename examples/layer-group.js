/**
 * @module examples.layer-group
 */
const exports = {};
/* eslint googshift/valid-provide-and-module: 0 */
import olMap from 'ol/Map.js';
import olView from 'ol/View.js';
import olLayerGroup from 'ol/layer/Group.js';
import olLayerTile from 'ol/layer/Tile.js';
import * as olProj from 'ol/proj.js';
import olSourceOSM from 'ol/source/OSM.js';
import olSourceTileJSON from 'ol/source/TileJSON.js';
import olcsOLCesium from 'olcs/OLCesium.js';

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

const ol3d = new olcsOLCesium({map: ol2d, target: 'map3d'});
ol3d.setEnabled(true);

// eslint-disable-next-line no-unused-vars
function toggleLayer(element, layer) {
  layer.setVisible(element.checked);
}
// eslint-disable-next-line no-unused-vars
function setLayerOpacity(element, layer) {
  layer.setOpacity(parseFloat(element.value));
}


export default exports;
