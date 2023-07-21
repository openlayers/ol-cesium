/**
 * @module examples.print
 */
import OLCesium from 'olcs/OLCesium.ts';
import {transform} from 'ol/proj.js';
import olView from 'ol/View.js';
import {defaults as olControlDefaults} from 'ol/control.js';
import olSourceOSM from 'ol/source/OSM.js';
import olLayerTile from 'ol/layer/Tile.js';
import olMap from 'ol/Map.js';
import {OLCS_ION_TOKEN} from './_common.js';
import {takeScreenshot} from 'olcs/print/takeCesiumScreenshot.ts';
import {autoDrawMask} from 'olcs/print/drawCesiumMask.ts';
import {computeRectangle} from 'olcs/print/computeRectangle.ts';

Cesium.Ion.defaultAccessToken = OLCS_ION_TOKEN;
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
  target: 'map',
  view: new olView({
    center: transform([25, 20], 'EPSG:4326', 'EPSG:3857'),
    zoom: 3
  })
});

const ol3d = new OLCesium({
  map: ol2d,
});
const scene = ol3d.getCesiumScene();
Cesium.createWorldTerrainAsync().then(tp => scene.terrainProvider = tp);
ol3d.setEnabled(true);


document.getElementById('enable').addEventListener('click', () => ol3d.setEnabled(!ol3d.getEnabled()));

function scalingOptions() {
  const printValue = document.querySelector('#printValue').value;
  const canvas = scene.canvas;
  const v = Math.min(canvas.width, canvas.height);
  switch (printValue) {
    case 'portrait':
      return computeRectangle(canvas, v / 4, v / 2);
    default:
      return computeRectangle(canvas, v / 2, v / 4);
  }
}
autoDrawMask(scene, () => scalingOptions().scaling);


window['takeScreenshot'] = async function() {
  const r = scalingOptions();
  console.log(r);
  const value = await takeScreenshot(scene, r);
  const img = new Image();
  img.src = value;
  document.body.append(img);
};
