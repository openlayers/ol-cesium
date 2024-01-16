import olStyleStroke from 'ol/style/Stroke.js';
import olStyleFill from 'ol/style/Fill.js';
import olStyleStyle from 'ol/style/Style.js';
import OLCesium from 'olcs';
import olView from 'ol/View.js';
import olFormatGeoJSON from 'ol/format/GeoJSON.js';
import olSourceVector from 'ol/source/Vector.js';
import olLayerVector from 'ol/layer/Vector.js';
import olSourceOSM from 'ol/source/OSM.js';
import olLayerTile from 'ol/layer/Tile.js';
import olMap from 'ol/Map.js';

const raster = new olLayerTile({
  source: new olSourceOSM(),
});

const vector = new olLayerVector({
  style(feature, resolution) {
    const fillColor = feature.get('fillColor') || 'white';
    const strokeColor = feature.get('strokeColor') || 'grey';
    return new olStyleStyle({
      fill: new olStyleFill({
        color: fillColor,
      }),
      stroke: new olStyleStroke({
        color: strokeColor,
        width: 1,
      }),
    });
  },
  source: new olSourceVector({
    format: new olFormatGeoJSON(),
    url: 'data/geojson/buildings.geojson',
  }),
});

const map = new olMap({
  layers: [raster, vector],
  target: 'map2d',
  view: new olView({
    center: [0, 0],
    zoom: 2,
  }),
});
// Enable the property 'olcs_shadows' for the entire set of features
// Alternatively, you can enable 'olcs_shadows' for each feature individually
vector.set('olcs_shadows', true);


const ol3d = new OLCesium({map, target: 'map3d'});
ol3d.setEnabled(true);

// Be aware that enabling the following properties can impact performance
// Enable shadow map to allow Cesium to cast scene's shadows
const scene = ol3d.getCesiumScene();
scene.shadowMap.enabled = true;
// Enable lighting the globe with the sun as a light source to have dynamic lighting conditions according to the position of the sun
scene.globe.enableLighting = true;


const vectorSource = vector.getSource();
vectorSource.once('featuresloadend', () => {
  if (vectorSource.getState() === 'ready') {
    map.getView().fit(vector.getSource().getExtent());
  }
});


const selectionStyle = new olStyleStyle({
  fill: new olStyleFill({
    color: [0, 255, 0, 1],
  }),
  stroke: new olStyleStroke({
    color: [0, 153, 255, 1],
    width: 3,
  }),
});

let selectedFeature;
map.on('click', (e) => {
  if (selectedFeature) {
    selectedFeature.setStyle(null);
  }
  selectedFeature = map.forEachFeatureAtPixel(
      e.pixel,
      (feature, layer) => feature
  );
  if (selectedFeature) {
    selectedFeature.setStyle(selectionStyle);
  }
});
