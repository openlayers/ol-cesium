import OLCesium from 'olcs';
import {transform} from 'ol/proj.js';
import olView from 'ol/View.js';
import {defaults as olControlDefaults} from 'ol/control.js';
import olSourceOSM from 'ol/source/OSM.js';
import olLayerTile from 'ol/layer/Tile.js';
import olMap from 'ol/Map.js';
import {OLCS_ION_TOKEN} from './_common.js';

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
Cesium.CesiumTerrainProvider.fromUrl('https://download.swissgeol.ch/cli_terrain/ch-2m/').then(tp => scene.terrainProvider = tp);
Cesium.Cesium3DTileset.fromUrl('https://sys-3d.dev.bgdi.ch/ch.swisstopo.swisstlm3d.3d/v1/tileset.json').then(ts => scene.primitives.add(ts));
ol3d.setEnabled(true);


document.getElementById('enable').addEventListener('click', () => ol3d.setEnabled(!ol3d.getEnabled()));

scene.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(6.54254, 46.50802, 1000.0)
});
