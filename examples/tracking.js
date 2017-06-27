const point = new ol.geom.Point([700000, 200000, 100000]);

const iconFeature = new ol.Feature({
  geometry: point
});


const iconStyle = new ol.style.Style({
  image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
    anchor: [0.5, 46],
    anchorXUnits: 'fraction',
    anchorYUnits: 'pixels',
    opacity: 0.75,
    src: 'data/icon.png'
  }))
});

iconFeature.setStyle(iconStyle);


const vectorSource2 = new ol.source.Vector({
  features: [iconFeature]
});
const imageVectorSource = new ol.source.ImageVector({
  source: vectorSource2
});
const vectorLayer2 = new ol.layer.Image({
  source: imageVectorSource
});


const map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    }),
    vectorLayer2
  ],
  target: 'map2d',
  controls: ol.control.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});


const ol3d = new olcs.OLCesium({map/*, target: 'map3d'*/});
const scene = ol3d.getCesiumScene();
const terrainProvider = new Cesium.CesiumTerrainProvider({
  url: '//assets.agi.com/stk-terrain/world',
  requestVertexNormals: false
});
scene.terrainProvider = terrainProvider;
ol3d.setEnabled(true);

let tracking = false;
function toggleTracking() { // eslint-disable-line no-unused-vars
  tracking = !tracking;
  ol3d.trackedFeature = tracking ? iconFeature : undefined;
}

setInterval(() => {
  const old = point.getCoordinates();
  point.setCoordinates([
    old[0] + 1000 * Math.random(),
    old[1] + 1000 * Math.random(),
    old[2]
  ]);
  iconFeature.changed();
}, 100);
