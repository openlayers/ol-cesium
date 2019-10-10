/**
 * @module examples.rastersync
 */
import olSourceTileWMS from 'ol/source/TileWMS.js';
import olSourceStamen from 'ol/source/Stamen.js';
import OLCesium from 'olcs/OLCesium.js';
import olLayerGroup from 'ol/layer/Group.js';
import olMap from 'ol/Map.js';
import olSourceTileJSON from 'ol/source/TileJSON.js';
import olSourceOSM from 'ol/source/OSM.js';
import olLayerTile from 'ol/layer/Tile.js';
import {transform} from 'ol/proj.js';
import olView from 'ol/View.js';


const view = new olView({
  center: transform([-112.2, 36.06], 'EPSG:4326', 'EPSG:3857'),
  zoom: 11
});

const layer0 = new olLayerTile({
  source: new olSourceOSM()
});
const layer1 = new olLayerTile({
  source: new olSourceTileJSON({
    url: 'https://tileserver.maptiler.com/grandcanyon.json',
    crossOrigin: 'anonymous'
  })
});

const key = 'pk.eyJ1IjoiZ2JvMiIsImEiOiJjazFraHV4N3gwZHliM2JucHYxdTNnNXh1In0.tzs3TxoVCaMNQf455mh-3w';
const tileJsonSource = new olSourceTileJSON({
  url: 'https://api.tiles.mapbox.com/v4/mapbox.world-borders-light.json?access_token=' + key,
  crossOrigin: 'anonymous'
});

const layer2 = new olLayerTile({
  source: tileJsonSource
});
const ol2d = new olMap({
  layers: [layer0, new olLayerGroup({layers: [layer1, layer2]})],
  target: 'map2d',
  view,
  renderer: 'webgl'
});

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0MzAyNzUyYi0zY2QxLTQxZDItODRkOS1hNTA3MDU3ZTBiMDUiLCJpZCI6MjU0MSwiaWF0IjoxNTMzNjI1MTYwfQ.oHn1SUWJa12esu7XUUtEoc1BbEbuZpRocLetw6M6_AA';
const ol3d = new OLCesium({map: ol2d, target: 'map3d'});
const scene = ol3d.getCesiumScene();
scene.terrainProvider = Cesium.createWorldTerrain();

ol3d.setEnabled(true);

const addStamen = function() { // eslint-disable-line no-unused-vars
  ol2d.addLayer(new olLayerTile({
    source: new olSourceStamen({
      opacity: 0.7,
      layer: 'watercolor'
    })
  }));
};

const tileWMSSource = new olSourceTileWMS({
  url: 'https://ahocevar.com/geoserver/wms',
  params: {'LAYERS': 'topp:states', 'TILED': true},
  serverType: 'geoserver',
  crossOrigin: 'anonymous'
});

const addTileWMS = function() { // eslint-disable-line no-unused-vars
  ol2d.addLayer(new olLayerTile({
    opacity: 0.5,
    extent: [-13884991, 2870341, -7455066, 6338219],
    source: tileWMSSource
  }));
};

let changeI = 0;
const changeTileWMSParams = function() { // eslint-disable-line no-unused-vars
  tileWMSSource.updateParams({
    'LAYERS': (changeI++) % 2 == 0 ? 'nurc:Img_Sample' : 'topp:states'
  });
};

const addTileJSON = function() { // eslint-disable-line no-unused-vars
  ol2d.addLayer(new olLayerTile({
    source: tileJsonSource
  }));
};

const removeLastLayer = function() { // eslint-disable-line no-unused-vars
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
  layer1,
  layer2
};
