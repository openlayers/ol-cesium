import OLCesium from 'olcs';
import {transform} from 'ol/proj.js';
import olView from 'ol/View.js';
import olSourceOSM from 'ol/source/OSM.js';
import olLayerTile from 'ol/layer/Tile.js';
import olMap from 'ol/Map.js';
import {OLCS_ION_TOKEN} from './_common.js';
import {initCodeSandboxButton} from './_code-sandbox';

Cesium.Ion.defaultAccessToken = OLCS_ION_TOKEN;
const ol2d = new olMap({
  layers: [
    new olLayerTile({
      source: new olSourceOSM()
    })
  ],
  target: 'map',
  view: new olView({
    center: transform([25, 20], 'EPSG:4326', 'EPSG:3857'),
    zoom: 3
  })
});

const ol3d = new OLCesium({map: ol2d});
const scene = ol3d.getCesiumScene();
Cesium.createWorldTerrainAsync().then(tp => scene.terrainProvider = tp);

ol3d.setEnabled(true);
const camera = ol3d.getCamera();

const infoDiv = document.getElementById('infoDiv');
const printInfo = function() {
  infoDiv.innerHTML = `Center: ${camera.getCenter()}<br />` +
                      `Distance: ${camera.getDistance()}<br />` +
                      `Heading: ${camera.getHeading()}<br />` +
                      `Tilt: ${camera.getTilt()}<br />` +
                      `<i>Position:</i> ${camera.getPosition()}<br />` +
                      `<i>Altitude:</i> ${camera.getAltitude()}<br />`;
};
setInterval(printInfo, 100);

document.getElementById('enable').addEventListener('click', () => ol3d.setEnabled(!ol3d.getEnabled()));
window['camera'] = camera;
window['olProjTransform'] = transform;

/**
 * Open code in sandbox
 */
let code = `
import OLCesium from 'olcs/OLCesium.js';
import {transform} from 'ol/proj.js';
import olView from 'ol/View.js';
import olSourceOSM from 'ol/source/OSM.js';
import olLayerTile from 'ol/layer/Tile.js';
import olMap from 'ol/Map.js';

const Cesium = window.Cesium;

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3ZWVhYmU0Mi1jNTZkLTQ3OGItYmUxYS00YTMyMDQyZTMwNDkiLCJpZCI6NjQ1LCJpYXQiOjE2MDYxMjE2OTF9.zQibbf5P0-moQ8KiV_K7KMtyLHbR-VlPghj8lyqWduU';
const ol2d = new olMap({
  layers: [
    new olLayerTile({
      source: new olSourceOSM()
    })
  ],
  target: 'map',
  view: new olView({
    center: transform([25, 20], 'EPSG:4326', 'EPSG:3857'),
    zoom: 3
  })
});

const ol3d = new OLCesium({map: ol2d});
const scene = ol3d.getCesiumScene();
scene.terrainProvider = Cesium.createWorldTerrain();

ol3d.setEnabled(true);
const camera = ol3d.getCamera();

const infoDiv = document.getElementById('infoDiv');
const printInfo = function() {
  infoDiv.innerHTML = \`Center: ${camera.getCenter()}<br />\` +
                      \`Distance: ${camera.getDistance()}<br />\` +
                      \`Heading: ${camera.getHeading()}<br />\` +
                      \`Tilt: ${camera.getTilt()}<br />\` +
                      \`<i>Position:</i> ${camera.getPosition()}<br />\` +
                      \`<i>Altitude:</i> ${camera.getAltitude()}<br />\`;
};
setInterval(printInfo, 100);

document.getElementById('enable').addEventListener('click', () => ol3d.setEnabled(!ol3d.getEnabled()));
window['camera'] = camera;
window['olProjTransform'] = transform;
`;

const divExampleCodeSource = document.createElement('div');
divExampleCodeSource.innerHTML = document.getElementById('example-html-source').innerHTML;
divExampleCodeSource.querySelector("#map").innerHTML = '';

const html = `
<!DOCTYPE html>
<html>
  <head>
    <title>Ol-Cesium example</title>
    <meta charset="UTF-8" />
    <link rel="stylesheet" href="node_modules/ol/ol.css">    
    <script src="https://cesium.com/downloads/cesiumjs/releases/1.104/Build/Cesium/Cesium.js"></script>
    </head>
  <body>
    ${divExampleCodeSource.innerHTML}
    <script src="/index.js"></script>
  </body>
</html>`;

const parameters = {
  template: "parcel",
  files: {
    "package.json": {
      content: {
        "main": "index.html",
        "scripts": {
          "start": "parcel index.html --open",
          "build": "parcel build index.html"
        },
        "devDependencies": {
          "@babel/core": "7.2.0",
          "parcel-bundler": "^1.6.1"
        },
        "dependencies": {
          "ol": "latest",
          "olcs": "^2.13.1"
        }
      },
    },
    "index.js": {
      content: code,
    },
    "index.html": {
      content: html
    },
  }
}

initCodeSandboxButton(parameters);