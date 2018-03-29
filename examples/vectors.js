/* eslint googshift/valid-provide-and-module: 0 */

goog.provide('examples.vectors');

goog.require('olcs.OLCesium');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.source.OSM');
goog.require('ol.layer.Tile');
goog.require('ol.style.Text');
goog.require('ol.style.Icon');
goog.require('ol.style.Style');
goog.require('ol.geom.Point');
goog.require('ol.Feature');
goog.require('ol.style.Stroke');
goog.require('ol.interaction');
goog.require('ol.style.Fill');
goog.require('ol.Map');
goog.require('ol.geom.Circle');
goog.require('ol.format.TopoJSON');
goog.require('ol.style.Circle');
goog.require('ol.format.KML');
goog.require('ol.source.Vector');
goog.require('ol.format.IGC');
goog.require('ol.format.GeoJSON');
goog.require('ol.format.GPX');
goog.require('ol.geom.Polygon');
goog.require('ol.interaction.DragAndDrop');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.layer.Vector');
goog.require('ol.proj');
goog.require('olcs.core');


const iconFeature = new ol.Feature({
  geometry: new ol.geom.Point([700000, 200000, 100000])
});

const textFeature = new ol.Feature({
  geometry: new ol.geom.Point([1000000, 3000000, 500000])
});

const cervinFeature = new ol.Feature({
  geometry: new ol.geom.Point([852541, 5776649])
});
cervinFeature.getGeometry().set('altitudeMode', 'clampToGround');


const modelFeatures = [-1, -1 / 2, 0, 1 / 2, 1, 3 / 2].map(
    factor => new ol.Feature({
      geometry: new ol.geom.Point([852641, 5776749, 4500]),
      'rotation': factor * Math.PI
    })
);


const iconStyle = new ol.style.Style({
  image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
    anchor: [0.5, 46],
    anchorXUnits: 'fraction',
    anchorYUnits: 'pixels',
    opacity: 0.75,
    src: 'data/icon.png'
  })),
  text: new ol.style.Text({
    text: 'Some text',
    textAlign: 'center',
    textBaseline: 'middle',
    stroke: new ol.style.Stroke({
      color: 'magenta',
      width: 3
    }),
    fill: new ol.style.Fill({
      color: 'rgba(0, 0, 155, 0.3)'
    })
  })
});

const textStyle = [new ol.style.Style({
  text: new ol.style.Text({
    text: 'Only text',
    textAlign: 'center',
    textBaseline: 'middle',
    stroke: new ol.style.Stroke({
      color: 'red',
      width: 3
    }),
    fill: new ol.style.Fill({
      color: 'rgba(0, 0, 155, 0.3)'
    })
  })
}), new ol.style.Style({
  geometry: new ol.geom.Circle([1000000, 3000000, 10000], 2e6),
  stroke: new ol.style.Stroke({
    color: 'blue',
    width: 2
  }),
  fill: new ol.style.Fill({
    color: 'rgba(0, 0, 255, 0.2)'
  })
})];

iconFeature.setStyle(iconStyle);

textFeature.setStyle(textStyle);

cervinFeature.setStyle(iconStyle);
let iCase = 0;
modelFeatures.forEach((feature) => {
  ++iCase;
  const modelStyle = new ol.style.Style({
    image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
      anchor: [0.5, 46],
      anchorXUnits: 'fraction',
      anchorYUnits: 'pixels',
      opacity: 0.75,
      src: 'data/icon.png'
    }))
  });
  const olcsModelFunction = () => {
    const coordinates = feature.getGeometry().getCoordinates();
    const center = ol.proj.transform(coordinates, 'EPSG:3857', 'EPSG:4326');
    const rotation = /** @type {number} */ (feature.get('rotation'));
    return {
      cesiumOptions: {
        url: 'data/arrow5.glb',
        modelMatrix: olcs.core.createMatrixAtCoordinates(center, rotation, new Cesium.Cartesian3(0, 0, 20)),
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        minimumPixelSize: 64
      }
    };
  };
  let host = feature;
  switch (iCase % 3) {
    case 0:
      host = feature.getGeometry();
      break;
    case 1:
      modelStyle.setGeometry(feature.getGeometry().clone());
      host = modelStyle.getGeometry();
      break;
    default:
      host = feature;
  }
  host.set('olcs_model', olcsModelFunction);
  feature.setStyle(modelStyle);
});


const image = new ol.style.Circle({
  radius: 5,
  fill: null,
  stroke: new ol.style.Stroke({color: 'red', width: 1})
});

const styles = {
  'Point': [new ol.style.Style({
    image
  })],
  'LineString': [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'green',
      lineDash: [12],
      width: 10
    })
  })],
  'MultiLineString': [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'green',
      width: 10
    })
  })],
  'MultiPoint': [new ol.style.Style({
    image,
    text: new ol.style.Text({
      text: 'MP',
      stroke: new ol.style.Stroke({
        color: 'purple'
      })
    })
  })],
  'MultiPolygon': [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'yellow',
      width: 1
    }),
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 0, 0.1)'
    })
  })],
  'Polygon': [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'blue',
      lineDash: [4],
      width: 3
    }),
    fill: new ol.style.Fill({
      color: 'rgba(0, 0, 255, 0.1)'
    })
  })],
  'GeometryCollection': [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'magenta',
      width: 2
    }),
    fill: new ol.style.Fill({
      color: 'magenta'
    }),
    image: new ol.style.Circle({
      radius: 10, // pixels
      fill: null,
      stroke: new ol.style.Stroke({
        color: 'magenta'
      })
    })
  })],
  'Circle': [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'red',
      width: 2
    }),
    fill: new ol.style.Fill({
      color: 'rgba(255,0,0,0.2)'
    })
  })]
};

const styleFunction = function(feature, resolution) {
  const geo = feature.getGeometry();
  // always assign a style to prevent feature skipping
  return geo ? styles[geo.getType()] : styles['Point'];
};

const vectorSource = new ol.source.Vector({
  format: new ol.format.GeoJSON(),
  url: 'data/geojson/vector_data.geojson'
});

const theCircle = new ol.Feature(new ol.geom.Circle([5e6, 7e6, 5e5], 1e6));

// Add a Cesium rectangle, via setting the property olcs.polygon_kind
const cartographicRectangleStyle = new ol.style.Style({
  fill: new ol.style.Fill({
    color: 'rgba(255, 69, 0, 0.7)'
  }),
  stroke: new ol.style.Stroke({
    color: 'rgba(255, 69, 0, 0.9)',
    width: 1
  })
});
const cartographicRectangleGeometry = new ol.geom.Polygon([[[-5e6, 11e6],
  [4e6, 11e6], [4e6, 10.5e6], [-5e6, 10.5e6], [-5e6, 11e6]]]);
cartographicRectangleGeometry.set('olcs.polygon_kind', 'rectangle');
const cartographicRectangle = new ol.Feature({
  geometry: cartographicRectangleGeometry
});
cartographicRectangle.setStyle(cartographicRectangleStyle);

// Add two Cesium rectangles with height and the property olcs.polygon_kind
const cartographicRectangleGeometry2 = new ol.geom.MultiPolygon([
  [[
    [-5e6, 12e6, 0], [4e6, 12e6, 0], [4e6, 11.5e6, 0], [-5e6, 11.5e6, 0],
    [-5e6, 12e6, 0]
  ]],
  [[
    [-5e6, 11.5e6, 1e6], [4e6, 11.5e6, 1e6], [4e6, 11e6, 1e6],
    [-5e6, 11e6, 1e6], [-5e6, 11.5e6, 1e6]
  ]]
]);
cartographicRectangleGeometry2.set('olcs.polygon_kind', 'rectangle');
const cartographicRectangle2 = new ol.Feature({
  geometry: cartographicRectangleGeometry2
});
cartographicRectangle2.setStyle(cartographicRectangleStyle);

const vectorLayer = new ol.layer.Vector({
  source: vectorSource,
  style: styleFunction
});

const vectorSource2 = new ol.source.Vector({
  features: [iconFeature, textFeature, cervinFeature, ...modelFeatures, cartographicRectangle,
    cartographicRectangle2]
});
const vectorLayer2 = new ol.layer.Vector({
  source: vectorSource2
});

const dragAndDropInteraction = new ol.interaction.DragAndDrop({
  formatConstructors: [
    ol.format.GPX,
    ol.format.GeoJSON,
    ol.format.IGC,
    ol.format.KML,
    ol.format.TopoJSON
  ]
});

const map = new ol.Map({
  interactions: ol.interaction.defaults().extend([dragAndDropInteraction]),
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    }),
    vectorLayer,
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

dragAndDropInteraction.on('addfeatures', (event) => {
  const vectorSource = new ol.source.Vector({
    features: event.features,
    projection: event.projection
  });
  map.getLayers().push(new ol.layer.Vector({
    source: vectorSource,
    style: styleFunction
  }));
  const view = map.getView();
  view.fitExtent(
      vectorSource.getExtent(), /** @type {ol.Size} */ (map.getSize()));
});


const ol3d = new olcs.OLCesium({map, target: 'map3d'});
const scene = ol3d.getCesiumScene();
const terrainProvider = new Cesium.CesiumTerrainProvider({
  url: '//assets.agi.com/stk-terrain/world'
});
scene.terrainProvider = terrainProvider;
ol3d.setEnabled(true);

const csLabels = new Cesium.LabelCollection();
csLabels.add({
  position: Cesium.Cartesian3.fromRadians(20, 20, 0),
  text: 'Pre-existing primitive'
});
scene.primitives.add(csLabels);

// Adding a feature after the layer has been synchronized.
vectorSource.addFeature(theCircle);

let hasTheVectorLayer = true;
function addOrRemoveOneVectorLayer() { // eslint-disable-line no-unused-vars
  if (hasTheVectorLayer) {
    map.getLayers().remove(vectorLayer);
  } else {
    map.getLayers().insertAt(1, vectorLayer);
  }
  hasTheVectorLayer = !hasTheVectorLayer;
}

function addOrRemoveOneFeature() { // eslint-disable-line no-unused-vars
  const found = vectorSource2.getFeatures().indexOf(iconFeature);
  if (found === -1) {
    vectorSource2.addFeature(iconFeature);
  } else {
    vectorSource2.removeFeature(iconFeature);
  }
}

let oldStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: 'blue',
    width: 2
  }),
  fill: new ol.style.Fill({
    color: 'green'
  })
});
function toggleStyle() { // eslint-disable-line no-unused-vars
  const swap = theCircle.getStyle();
  theCircle.setStyle(oldStyle);
  oldStyle = swap;
}

function toggleClampToGround() { // eslint-disable-line no-unused-vars
  let altitudeMode;
  if (!vectorLayer.get('altitudeMode')) {
    altitudeMode = 'clampToGround';
  }
  vectorLayer.set('altitudeMode', altitudeMode);
  vectorLayer2.set('altitudeMode', altitudeMode);
  map.removeLayer(vectorLayer);
  map.removeLayer(vectorLayer2);
  map.addLayer(vectorLayer);
  map.addLayer(vectorLayer2);
}

function setTargetFrameRate() { // eslint-disable-line no-unused-vars
  let fps;
  const fpsEl = document.querySelector('#framerate');
  if (fpsEl) {
    fps = Number(fpsEl.value);
    ol3d.setTargetFrameRate(fps);
  }
}

ol3d.enableAutoRenderLoop();
