var iconFeature = new ol.Feature({
  geometry: new ol.geom.Point([700000, 200000, 100000]),
});

var textFeature = new ol.Feature({
  geometry: new ol.geom.Point([1000000, 3000000, 50000]),
});

var cervinFeature = new ol.Feature({
  geometry: new ol.geom.Point([852541, 5776649])
});
cervinFeature.getGeometry().set('altitudeMode', 'clampToGround');


var iconStyle = new ol.style.Style({
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

var textStyle = new ol.style.Style({
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
});

iconFeature.setStyle(iconStyle);

textFeature.setStyle(textStyle);

cervinFeature.setStyle(iconStyle);


var image = new ol.style.Circle({
  radius: 5,
  fill: null,
  stroke: new ol.style.Stroke({color: 'red', width: 1})
});

var styles = {
  'Point': [new ol.style.Style({
    image: image
  })],
  'LineString': [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'green',
      lineDash: [4],
      width: 1
    })
  })],
  'MultiLineString': [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'green',
      width: 1
    })
  })],
  'MultiPoint': [new ol.style.Style({
    image: image,
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

var styleFunction = function(feature, resolution) {
  var geo = feature.getGeometry();
  // always assign a style to prevent feature skipping
  return geo ? styles[geo.getType()] : styles['Point'];
};

var vectorSource = new ol.source.Vector({
  format: new ol.format.GeoJSON(),
  url: 'data/geojson/vector_data.geojson'
});

var theCircle = new ol.Feature(new ol.geom.Circle([5e6, 7e6, 5e5], 1e6));

var vectorLayer = new ol.layer.Vector({
  source: vectorSource,
  style: styleFunction
});

var vectorSource2 = new ol.source.Vector({
  features: [iconFeature, textFeature, cervinFeature]
});
var imageVectorSource = new ol.source.ImageVector({
  source: vectorSource2
});
var vectorLayer2 = new ol.layer.Image({
  source: imageVectorSource
});

var dragAndDropInteraction = new ol.interaction.DragAndDrop({
  formatConstructors: [
    ol.format.GPX,
    ol.format.GeoJSON,
    ol.format.IGC,
    ol.format.KML,
    ol.format.TopoJSON
  ]
});


var map = new ol.Map({
  interactions: ol.interaction.defaults().extend([dragAndDropInteraction]),
  layers: [
    new ol.layer.Tile({
      source: new ol.source.BingMaps({
        key: 'Ak-dzM4wZjSqTlzveKz5u0d4IQ4bRzVI309GxmkgSVr1ewS6iPSrOvOKhA-CJlm3',
        imagerySet: 'Aerial'
      })
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

dragAndDropInteraction.on('addfeatures', function(event) {
  var vectorSource = new ol.source.Vector({
    features: event.features,
    projection: event.projection
  });
  map.getLayers().push(new ol.layer.Vector({
    source: vectorSource,
    style: styleFunction
  }));
  var view = map.getView();
  view.fitExtent(
      vectorSource.getExtent(), /** @type {ol.Size} */ (map.getSize()));
});


var ol3d = new olcs.OLCesium({map: map, target: 'map3d'});
var scene = ol3d.getCesiumScene();
var terrainProvider = new Cesium.CesiumTerrainProvider({
  url: '//assets.agi.com/stk-terrain/world'
});
scene.terrainProvider = terrainProvider;
ol3d.setEnabled(true);

var csLabels = new Cesium.LabelCollection();
csLabels.add({
  position: Cesium.Cartesian3.fromRadians(20, 20, 0),
  text: 'Pre-existing primitive'
});
scene.primitives.add(csLabels);

// Adding a feature after the layer has been synchronized.
vectorSource.addFeature(theCircle);

var hasTheVectorLayer = true;
function addOrRemoveOneVectorLayer() {
  if (hasTheVectorLayer) {
    map.getLayers().remove(vectorLayer);
  } else {
    map.getLayers().insertAt(1, vectorLayer);
  }
  hasTheVectorLayer = !hasTheVectorLayer;
}

function addOrRemoveOneFeature() {
  var found = vectorSource2.getFeatures().indexOf(iconFeature);
  if (found === -1) {
    vectorSource2.addFeature(iconFeature);
  } else {
    vectorSource2.removeFeature(iconFeature);
  }
}

var oldStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: 'blue',
    width: 2
  }),
  fill: new ol.style.Fill({
    color: 'green'
  })
});
function toggleStyle() {
  var swap = theCircle.getStyle();
  theCircle.setStyle(oldStyle);
  oldStyle = swap;
}

function toggleClampToGround() {
  var altitudeMode;
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

ol3d.enableAutoRenderLoop();
