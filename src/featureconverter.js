goog.provide('olcs.FeatureConverter');

goog.require('goog.asserts');
goog.require('ol');
goog.require('ol.events');
goog.require('ol.extent');
goog.require('ol.geom.SimpleGeometry');
goog.require('olcs.core');
goog.require('olcs.core.VectorLayerCounterpart');
goog.require('olcs.util');



/**
 * Concrete base class for converting from OpenLayers3 vectors to Cesium
 * primitives.
 * Extending this class is possible provided that the extending class and
 * the library are compiled together by the closure compiler.
 * @param {!Cesium.Scene} scene Cesium scene.
 * @constructor
 * @api
 * @struct
 */
olcs.FeatureConverter = function(scene) {

  /**
   * @protected
   */
  this.scene = scene;

  /**
   * Bind once to have a unique function for using as a listener
   * @type {function(ol.source.Vector.Event)}
   * @private
   */
  this.boundOnRemoveOrClearFeatureListener_ =
      this.onRemoveOrClearFeature_.bind(this);
};


/**
 * @param {ol.source.Vector.Event} evt
 * @private
 */
olcs.FeatureConverter.prototype.onRemoveOrClearFeature_ = function(evt) {
  const source = evt.target;
  goog.asserts.assertInstanceof(source, ol.source.Vector);

  const cancellers = olcs.util.obj(source)['olcs_cancellers'];
  if (cancellers) {
    const feature = evt.feature;
    if (feature) {
      // remove
      const id = ol.getUid(feature);
      const canceller = cancellers[id];
      if (canceller) {
        canceller();
        delete cancellers[id];
      }
    } else {
      // clear
      for (const key in cancellers) {
        if (cancellers.hasOwnProperty(key)) {
          cancellers[key]();
        }
      }
      olcs.util.obj(source)['olcs_cancellers'] = {};
    }
  }
};


/**
 * @param {ol.layer.Vector|ol.layer.Image} layer
 * @param {!ol.Feature} feature OpenLayers feature.
 * @param {!Cesium.Primitive|Cesium.Label|Cesium.Billboard} primitive
 * @protected
 */
olcs.FeatureConverter.prototype.setReferenceForPicking = function(layer, feature, primitive) {
  primitive.olLayer = layer;
  primitive.olFeature = feature;
};


/**
 * Basics primitive creation using a color attribute.
 * Note that Cesium has 'interior' and outline geometries.
 * @param {ol.layer.Vector|ol.layer.Image} layer
 * @param {!ol.Feature} feature OpenLayers feature.
 * @param {!ol.geom.Geometry} olGeometry OpenLayers geometry.
 * @param {!Cesium.Geometry} geometry
 * @param {!Cesium.Color} color
 * @param {number=} opt_lineWidth
 * @return {Cesium.Primitive}
 * @protected
 */
olcs.FeatureConverter.prototype.createColoredPrimitive = function(layer, feature, olGeometry, geometry, color, opt_lineWidth) {
  const createInstance = function(geometry, color) {
    return new Cesium.GeometryInstance({
      // always update Cesium externs before adding a property
      geometry,
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
      }
    });
  };

  const options = {
    // always update Cesium externs before adding a property
    flat: true, // work with all geometries
    renderState: {
      depthTest: {
        enabled: true
      }
    }
  };

  if (opt_lineWidth !== undefined) {
    if (!options.renderState) {
      options.renderState = {};
    }
    options.renderState.lineWidth = opt_lineWidth;
  }

  const instances = createInstance(geometry, color);

  const heightReference = this.getHeightReference(layer, feature, olGeometry);

  let primitive;

  if (heightReference == Cesium.HeightReference.CLAMP_TO_GROUND) {
    const ctor = instances.geometry.constructor;
    if (ctor && !ctor['createShadowVolume']) {
      return null;
    }
    primitive = new Cesium.GroundPrimitive({
      // always update Cesium externs before adding a property
      geometryInstances: instances
    });
  } else {
    const appearance = new Cesium.PerInstanceColorAppearance(options);
    primitive = new Cesium.Primitive({
      // always update Cesium externs before adding a property
      geometryInstances: instances,
      appearance
    });
  }

  this.setReferenceForPicking(layer, feature, primitive);
  return primitive;
};


/**
 * Return the fill or stroke color from a plain ol style.
 * @param {!ol.style.Style|ol.style.Text} style
 * @param {boolean} outline
 * @return {!Cesium.Color}
 * @protected
 */
olcs.FeatureConverter.prototype.extractColorFromOlStyle = function(style, outline) {
  const fillColor = style.getFill() ? style.getFill().getColor() : null;
  const strokeColor = style.getStroke() ? style.getStroke().getColor() : null;

  let olColor = 'black';
  if (strokeColor && outline) {
    olColor = strokeColor;
  } else if (fillColor) {
    olColor = fillColor;
  }

  return olcs.core.convertColorToCesium(olColor);
};


/**
 * Return the width of stroke from a plain ol style.
 * @param {!ol.style.Style|ol.style.Text} style
 * @return {number}
 * @protected
 */
olcs.FeatureConverter.prototype.extractLineWidthFromOlStyle = function(style) {
  // Handling of line width WebGL limitations is handled by Cesium.
  const width = style.getStroke() ? style.getStroke().getWidth() : undefined;
  return width !== undefined ? width : 1;
};


/**
 * Create a primitive collection out of two Cesium geometries.
 * Only the OpenLayers style colors will be used.
 * @param {ol.layer.Vector|ol.layer.Image} layer
 * @param {!ol.Feature} feature OpenLayers feature.
 * @param {!ol.geom.Geometry} olGeometry OpenLayers geometry.
 * @param {!Cesium.Geometry} fillGeometry
 * @param {!Cesium.Geometry} outlineGeometry
 * @param {!ol.style.Style} olStyle
 * @return {!Cesium.PrimitiveCollection}
 * @protected
 */
olcs.FeatureConverter.prototype.wrapFillAndOutlineGeometries = function(layer, feature, olGeometry, fillGeometry, outlineGeometry, olStyle) {
  const fillColor = this.extractColorFromOlStyle(olStyle, false);
  const outlineColor = this.extractColorFromOlStyle(olStyle, true);

  const primitives = new Cesium.PrimitiveCollection();
  if (olStyle.getFill()) {
    const p1 = this.createColoredPrimitive(layer, feature, olGeometry,
        fillGeometry, fillColor);
    goog.asserts.assert(!!p1);
    primitives.add(p1);
  }

  if (olStyle.getStroke()) {
    const width = this.extractLineWidthFromOlStyle(olStyle);
    const p2 = this.createColoredPrimitive(layer, feature, olGeometry,
        outlineGeometry, outlineColor, width);
    if (p2) {
      // Some outline geometries are not supported by Cesium in clamp to ground
      // mode. These primitives are skipped.
      primitives.add(p2);
    }
  }

  return primitives;
};


// Geometry converters
/**
 * Create a Cesium primitive if style has a text component.
 * Eventually return a PrimitiveCollection including current primitive.
 * @param {ol.layer.Vector|ol.layer.Image} layer
 * @param {!ol.Feature} feature OpenLayers feature..
 * @param {!ol.geom.Geometry} geometry
 * @param {!ol.style.Style} style
 * @param {!Cesium.Primitive} primitive current primitive
 * @return {!Cesium.PrimitiveCollection}
 * @protected
 */
olcs.FeatureConverter.prototype.addTextStyle = function(layer, feature, geometry, style, primitive) {
  let primitives;
  if (!(primitive instanceof Cesium.PrimitiveCollection)) {
    primitives = new Cesium.PrimitiveCollection();
    primitives.add(primitive);
  } else {
    primitives = primitive;
  }

  if (!style.getText()) {
    return primitives;
  }

  const text = /** @type {!ol.style.Text} */ (style.getText());
  const label = this.olGeometry4326TextPartToCesium(layer, feature, geometry,
      text);
  if (label) {
    primitives.add(label);
  }
  return primitives;
};


/**
 * Add a billboard to a Cesium.BillboardCollection.
 * Overriding this wrapper allows manipulating the billboard options.
 * @param {!Cesium.BillboardCollection} billboards
 * @param {!Cesium.optionsBillboardCollectionAdd} bbOptions
 * @param {ol.layer.Vector|ol.layer.Image} layer
 * @param {!ol.Feature} feature OpenLayers feature.
 * @param {!ol.geom.Geometry} geometry
 * @param {!ol.style.Style} style
 * @return {!Cesium.Billboard} newly created billboard
 * @api
 */
olcs.FeatureConverter.prototype.csAddBillboard = function(billboards, bbOptions, layer, feature, geometry, style) {
  const bb = billboards.add(bbOptions);
  this.setReferenceForPicking(layer, feature, bb);
  return bb;
};


/**
 * Convert an OpenLayers circle geometry to Cesium.
 * @param {ol.layer.Vector|ol.layer.Image} layer
 * @param {!ol.Feature} feature OpenLayers feature..
 * @param {!ol.geom.Circle} olGeometry OpenLayers circle geometry.
 * @param {!ol.ProjectionLike} projection
 * @param {!ol.style.Style} olStyle
 * @return {!Cesium.PrimitiveCollection} primitives
 * @api
 */
olcs.FeatureConverter.prototype.olCircleGeometryToCesium = function(layer, feature, olGeometry, projection, olStyle) {

  olGeometry = olcs.core.olGeometryCloneTo4326(olGeometry, projection);
  goog.asserts.assert(olGeometry.getType() == 'Circle');

  // ol.Coordinate
  let center = olGeometry.getCenter();
  const height = center.length == 3 ? center[2] : 0.0;
  let point = center.slice();
  point[0] += olGeometry.getRadius();

  // Cesium
  center = olcs.core.ol4326CoordinateToCesiumCartesian(center);
  point = olcs.core.ol4326CoordinateToCesiumCartesian(point);

  // Accurate computation of straight distance
  const radius = Cesium.Cartesian3.distance(center, point);

  const fillGeometry = new Cesium.CircleGeometry({
    // always update Cesium externs before adding a property
    center,
    radius,
    height
  });

  const outlineGeometry = new Cesium.CircleOutlineGeometry({
    // always update Cesium externs before adding a property
    center,
    radius,
    extrudedHeight: height,
    height
  });

  const primitives = this.wrapFillAndOutlineGeometries(
      layer, feature, olGeometry, fillGeometry, outlineGeometry, olStyle);

  return this.addTextStyle(layer, feature, olGeometry, olStyle, primitives);
};


/**
 * Convert an OpenLayers line string geometry to Cesium.
 * @param {ol.layer.Vector|ol.layer.Image} layer
 * @param {!ol.Feature} feature OpenLayers feature..
 * @param {!ol.geom.LineString} olGeometry OpenLayers line string geometry.
 * @param {!ol.ProjectionLike} projection
 * @param {!ol.style.Style} olStyle
 * @return {!Cesium.PrimitiveCollection} primitives
 * @api
 */
olcs.FeatureConverter.prototype.olLineStringGeometryToCesium = function(layer, feature, olGeometry, projection, olStyle) {

  olGeometry = olcs.core.olGeometryCloneTo4326(olGeometry, projection);
  goog.asserts.assert(olGeometry.getType() == 'LineString');

  const positions = olcs.core.ol4326CoordinateArrayToCsCartesians(
      olGeometry.getCoordinates());

  const appearance = new Cesium.PolylineMaterialAppearance({
    // always update Cesium externs before adding a property
    material: this.olStyleToCesium(feature, olStyle, true)
  });

  const geometryOptions = {
    // always update Cesium externs before adding a property
    positions,
    width: this.extractLineWidthFromOlStyle(olStyle),
    vertexFormat: appearance.vertexFormat
  };

  let outlinePrimitive;
  const heightReference = this.getHeightReference(layer, feature, olGeometry);

  if (heightReference == Cesium.HeightReference.CLAMP_TO_GROUND) {
    const color = this.extractColorFromOlStyle(olStyle, true);
    outlinePrimitive = new Cesium.GroundPrimitive({
      // always update Cesium externs before adding a property
      geometryInstances: new Cesium.GeometryInstance({
        geometry: new Cesium.CorridorGeometry(geometryOptions),
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
        }
      })
    });
  } else {
    outlinePrimitive = new Cesium.Primitive({
      // always update Cesium externs before adding a property
      geometryInstances: new Cesium.GeometryInstance({
        geometry: new Cesium.PolylineGeometry(geometryOptions)
      }),
      appearance
    });
  }

  this.setReferenceForPicking(layer, feature, outlinePrimitive);

  return this.addTextStyle(layer, feature, olGeometry, olStyle,
      outlinePrimitive);
};


/**
 * Convert an OpenLayers polygon geometry to Cesium.
 * @param {ol.layer.Vector|ol.layer.Image} layer
 * @param {!ol.Feature} feature OpenLayers feature..
 * @param {!ol.geom.Polygon} olGeometry OpenLayers polygon geometry.
 * @param {!ol.ProjectionLike} projection
 * @param {!ol.style.Style} olStyle
 * @return {!Cesium.PrimitiveCollection} primitives
 * @api
 */
olcs.FeatureConverter.prototype.olPolygonGeometryToCesium = function(layer, feature, olGeometry, projection, olStyle) {

  olGeometry = olcs.core.olGeometryCloneTo4326(olGeometry, projection);
  goog.asserts.assert(olGeometry.getType() == 'Polygon');

  let fillGeometry, outlineGeometry;
  if ((olGeometry.getCoordinates()[0].length == 5) &&
      (feature.getGeometry().get('olcs.polygon_kind') === 'rectangle')) {
    // Create a rectangle according to the longitude and latitude curves
    const coordinates = olGeometry.getCoordinates()[0];
    // Extract the West, South, East, North coordinates
    const extent = ol.extent.boundingExtent(coordinates);
    const rectangle = Cesium.Rectangle.fromDegrees(extent[0], extent[1],
        extent[2], extent[3]);

    // Extract the average height of the vertices
    let maxHeight = 0.0;
    if (coordinates[0].length == 3) {
      for (let c = 0; c < coordinates.length; c++) {
        maxHeight = Math.max(maxHeight, coordinates[c][2]);
      }
    }

    // Render the cartographic rectangle
    fillGeometry = new Cesium.RectangleGeometry({
      ellipsoid: Cesium.Ellipsoid.WGS84,
      rectangle,
      height: maxHeight
    });

    outlineGeometry = new Cesium.RectangleOutlineGeometry({
      ellipsoid: Cesium.Ellipsoid.WGS84,
      rectangle,
      height: maxHeight
    });
  } else {
    const rings = olGeometry.getLinearRings();
    // always update Cesium externs before adding a property
    const hierarchy = {};
    const polygonHierarchy = hierarchy;
    goog.asserts.assert(rings.length > 0);

    for (let i = 0; i < rings.length; ++i) {
      const olPos = rings[i].getCoordinates();
      const positions = olcs.core.ol4326CoordinateArrayToCsCartesians(olPos);
      goog.asserts.assert(positions && positions.length > 0);
      if (i == 0) {
        hierarchy.positions = positions;
      } else {
        if (!hierarchy.holes) {
          hierarchy.holes = [];
        }
        hierarchy.holes.push({
          positions
        });
      }
    }

    fillGeometry = new Cesium.PolygonGeometry({
      // always update Cesium externs before adding a property
      polygonHierarchy,
      perPositionHeight: true
    });

    outlineGeometry = new Cesium.PolygonOutlineGeometry({
      // always update Cesium externs before adding a property
      polygonHierarchy: hierarchy,
      perPositionHeight: true
    });
  }

  const primitives = this.wrapFillAndOutlineGeometries(
      layer, feature, olGeometry, fillGeometry, outlineGeometry, olStyle);

  return this.addTextStyle(layer, feature, olGeometry, olStyle, primitives);
};


/**
 * @param {ol.layer.Vector|ol.layer.Image} layer
 * @param {ol.Feature} feature OpenLayers feature..
 * @param {!ol.geom.Geometry} geometry
 * @return {!Cesium.HeightReference}
 * @api
 */
olcs.FeatureConverter.prototype.getHeightReference = function(layer, feature, geometry) {

  // Read from the geometry
  let altitudeMode = geometry.get('altitudeMode');

  // Or from the feature
  if (altitudeMode === undefined) {
    altitudeMode = feature.get('altitudeMode');
  }

  // Or from the layer
  if (altitudeMode === undefined) {
    altitudeMode = layer.get('altitudeMode');
  }

  let heightReference = Cesium.HeightReference.NONE;
  if (altitudeMode === 'clampToGround') {
    heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
  } else if (altitudeMode === 'relativeToGround') {
    heightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
  }

  return heightReference;
};


/**
 * Convert a point geometry to a Cesium BillboardCollection.
 * @param {ol.layer.Vector|ol.layer.Image} layer
 * @param {!ol.Feature} feature OpenLayers feature..
 * @param {!ol.geom.Point} olGeometry OpenLayers point geometry.
 * @param {!ol.ProjectionLike} projection
 * @param {!ol.style.Style} style
 * @param {!Cesium.BillboardCollection} billboards
 * @param {function(!Cesium.Billboard)=} opt_newBillboardCallback Called when
 * the new billboard is added.
 * @return {Cesium.Primitive} primitives
 * @api
 */
olcs.FeatureConverter.prototype.olPointGeometryToCesium = function(layer, feature, olGeometry, projection, style, billboards,
    opt_newBillboardCallback) {
  goog.asserts.assert(olGeometry.getType() == 'Point');
  olGeometry = olcs.core.olGeometryCloneTo4326(olGeometry, projection);

  const imageStyle = style.getImage();
  if (imageStyle) {
    if (imageStyle instanceof ol.style.Icon) {
      // make sure the image is scheduled for load
      imageStyle.load();
    }

    const image = imageStyle.getImage(1); // get normal density
    const isImageLoaded = function(image) {
      return image.src != '' &&
          image.naturalHeight != 0 &&
          image.naturalWidth != 0 &&
          image.complete;
    };
    const reallyCreateBillboard = (function() {
      if (!image) {
        return;
      }
      if (!(image instanceof HTMLCanvasElement ||
          image instanceof Image ||
          image instanceof HTMLImageElement)) {
        return;
      }
      const center = olGeometry.getCoordinates();
      const position = olcs.core.ol4326CoordinateToCesiumCartesian(center);
      let color;
      const opacity = imageStyle.getOpacity();
      if (opacity !== undefined) {
        color = new Cesium.Color(1.0, 1.0, 1.0, opacity);
      }

      const heightReference = this.getHeightReference(layer, feature, olGeometry);

      const bbOptions = /** @type {Cesium.optionsBillboardCollectionAdd} */ ({
        // always update Cesium externs before adding a property
        image,
        color,
        scale: imageStyle.getScale(),
        heightReference,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        position
      });
      const bb = this.csAddBillboard(billboards, bbOptions, layer, feature,
          olGeometry, style);
      if (opt_newBillboardCallback) {
        opt_newBillboardCallback(bb);
      }
    }).bind(this);

    if (image instanceof Image && !isImageLoaded(image)) {
      // Cesium requires the image to be loaded
      let cancelled = false;
      let source = layer.getSource();
      if (source instanceof ol.source.ImageVector) {
        source = source.getSource();
      }
      const canceller = function() {
        cancelled = true;
      };
      source.on(['removefeature', 'clear'],
          this.boundOnRemoveOrClearFeatureListener_);
      let cancellers = olcs.util.obj(source)['olcs_cancellers'];
      if (!cancellers) {
        cancellers = olcs.util.obj(source)['olcs_cancellers'] = {};
      }

      const fuid = ol.getUid(feature);
      if (cancellers[fuid]) {
        // When the feature change quickly, a canceller may still be present so
        // we cancel it here to prevent creation of a billboard.
        cancellers[fuid]();
      }
      cancellers[fuid] = canceller;

      const listener = function() {
        if (!billboards.isDestroyed() && !cancelled) {
          // Create billboard if the feature is still displayed on the map.
          reallyCreateBillboard();
        }
      };

      ol.events.listenOnce(image, 'load', listener);
    } else {
      reallyCreateBillboard();
    }
  }

  if (style.getText()) {
    return this.addTextStyle(layer, feature, olGeometry, style,
        new Cesium.Primitive());
  } else {
    return null;
  }
};


/**
 * Convert an OpenLayers multi-something geometry to Cesium.
 * @param {ol.layer.Vector|ol.layer.Image} layer
 * @param {!ol.Feature} feature OpenLayers feature..
 * @param {!ol.geom.Geometry} geometry OpenLayers geometry.
 * @param {!ol.ProjectionLike} projection
 * @param {!ol.style.Style} olStyle
 * @param {!Cesium.BillboardCollection} billboards
 * @param {function(!Cesium.Billboard)=} opt_newBillboardCallback Called when
 * the new billboard is added.
 * @return {Cesium.Primitive} primitives
 * @api
 */
olcs.FeatureConverter.prototype.olMultiGeometryToCesium = function(layer, feature, geometry, projection, olStyle, billboards,
    opt_newBillboardCallback) {
  // Do not reproject to 4326 now because it will be done later.

  // FIXME: would be better to combine all child geometries in one primitive
  // instead we create n primitives for simplicity.
  const accumulate = function(geometries, functor) {
    const primitives = new Cesium.PrimitiveCollection();
    geometries.forEach((geometry) => {
      primitives.add(functor(layer, feature, geometry, projection, olStyle));
    });
    return primitives;
  };

  let subgeos;
  switch (geometry.getType()) {
    case 'MultiPoint':
      geometry = /** @type {!ol.geom.MultiPoint} */ (geometry);
      subgeos = geometry.getPoints();
      if (olStyle.getText()) {
        const primitives = new Cesium.PrimitiveCollection();
        subgeos.forEach((geometry) => {
          goog.asserts.assert(geometry);
          const result = this.olPointGeometryToCesium(layer, feature, geometry,
              projection, olStyle, billboards, opt_newBillboardCallback);
          if (result) {
            primitives.add(result);
          }
        });
        return primitives;
      } else {
        subgeos.forEach((geometry) => {
          goog.asserts.assert(geometry);
          this.olPointGeometryToCesium(layer, feature, geometry, projection,
              olStyle, billboards, opt_newBillboardCallback);
        });
        return null;
      }
    case 'MultiLineString':
      geometry = /** @type {!ol.geom.MultiLineString} */ (geometry);
      subgeos = geometry.getLineStrings();
      return accumulate(subgeos, this.olLineStringGeometryToCesium.bind(this));
    case 'MultiPolygon':
      geometry = /** @type {!ol.geom.MultiPolygon} */ (geometry);
      subgeos = geometry.getPolygons();
      return accumulate(subgeos, this.olPolygonGeometryToCesium.bind(this));
    default:
      goog.asserts.fail(`Unhandled multi geometry type${geometry.getType()}`);
  }
};


/**
 * Convert an OpenLayers text style to Cesium.
 * @param {ol.layer.Vector|ol.layer.Image} layer
 * @param {!ol.Feature} feature OpenLayers feature..
 * @param {!ol.geom.Geometry} geometry
 * @param {!ol.style.Text} style
 * @return {Cesium.LabelCollection} Cesium primitive
 * @api
 */
olcs.FeatureConverter.prototype.olGeometry4326TextPartToCesium = function(layer, feature, geometry, style) {
  const text = style.getText();
  goog.asserts.assert(text !== undefined);


  const labels = new Cesium.LabelCollection({scene: this.scene});
  // TODO: export and use the text draw position from OpenLayers .
  // See src/ol/render/vector.js
  const extentCenter = ol.extent.getCenter(geometry.getExtent());
  if (geometry instanceof ol.geom.SimpleGeometry) {
    const first = geometry.getFirstCoordinate();
    extentCenter[2] = first.length == 3 ? first[2] : 0.0;
  }
  const options = /** @type {Cesium.optionsLabelCollection} */ ({});

  options.position = olcs.core.ol4326CoordinateToCesiumCartesian(extentCenter);

  options.text = text;

  options.heightReference = this.getHeightReference(layer, feature, geometry);

  const offsetX = style.getOffsetX();
  const offsetY = style.getOffsetY();
  if (offsetX != 0 && offsetY != 0) {
    const offset = new Cesium.Cartesian2(offsetX, offsetY);
    options.pixelOffset = offset;
  }

  const font = style.getFont();
  if (font !== undefined) {
    options.font = font;
  }

  let labelStyle = undefined;
  if (style.getFill()) {
    options.fillColor = this.extractColorFromOlStyle(style, false);
    labelStyle = Cesium.LabelStyle.FILL;
  }
  if (style.getStroke()) {
    options.outlineWidth = this.extractLineWidthFromOlStyle(style);
    options.outlineColor = this.extractColorFromOlStyle(style, true);
    labelStyle = Cesium.LabelStyle.OUTLINE;
  }
  if (style.getFill() && style.getStroke()) {
    labelStyle = Cesium.LabelStyle.FILL_AND_OUTLINE;
  }
  options.style = labelStyle;

  let horizontalOrigin;
  switch (style.getTextAlign()) {
    case 'left':
      horizontalOrigin = Cesium.HorizontalOrigin.LEFT;
      break;
    case 'right':
      horizontalOrigin = Cesium.HorizontalOrigin.RIGHT;
      break;
    case 'center':
    default:
      horizontalOrigin = Cesium.HorizontalOrigin.CENTER;
  }
  options.horizontalOrigin = horizontalOrigin;

  if (style.getTextBaseline()) {
    let verticalOrigin;
    switch (style.getTextBaseline()) {
      case 'top':
        verticalOrigin = Cesium.VerticalOrigin.TOP;
        break;
      case 'middle':
        verticalOrigin = Cesium.VerticalOrigin.CENTER;
        break;
      case 'bottom':
        verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
        break;
      case 'alphabetic':
        verticalOrigin = Cesium.VerticalOrigin.TOP;
        break;
      case 'hanging':
        verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
        break;
      default:
        goog.asserts.fail(`unhandled baseline ${style.getTextBaseline()}`);
    }
    options.verticalOrigin = verticalOrigin;
  }


  const l = labels.add(options);
  this.setReferenceForPicking(layer, feature, l);
  return labels;
};


/**
 * Convert an OpenLayers style to a Cesium Material.
 * @param {ol.Feature} feature OpenLayers feature..
 * @param {!ol.style.Style} style
 * @param {boolean} outline
 * @return {Cesium.Material}
 * @api
 */
olcs.FeatureConverter.prototype.olStyleToCesium = function(feature, style, outline) {
  const fill = style.getFill();
  const stroke = style.getStroke();
  if ((outline && !stroke) || (!outline && !fill)) {
    return null; // FIXME use a default style? Developer error?
  }

  let color = outline ? stroke.getColor() : fill.getColor();
  color = olcs.core.convertColorToCesium(color);

  if (outline && stroke.getLineDash()) {
    return Cesium.Material.fromType('Stripe', {
      // always update Cesium externs before adding a property
      horizontal: false,
      repeat: 500, // TODO how to calculate this?
      evenColor: color,
      oddColor: new Cesium.Color(0, 0, 0, 0) // transparent
    });
  } else {
    return Cesium.Material.fromType('Color', {
      // always update Cesium externs before adding a property
      color
    });
  }

};


/**
 * Compute OpenLayers plain style.
 * Evaluates style function, blend arrays, get default style.
 * @param {ol.layer.Vector|ol.layer.Image} layer
 * @param {!ol.Feature} feature
 * @param {ol.StyleFunction|undefined} fallbackStyleFunction
 * @param {number} resolution
 * @return {ol.style.Style} null if no style is available
 * @api
 */
olcs.FeatureConverter.prototype.computePlainStyle = function(layer, feature, fallbackStyleFunction, resolution) {
  /**
   * @type {ol.FeatureStyleFunction|undefined}
   */
  const featureStyleFunction = feature.getStyleFunction();

  /**
   * @type {ol.style.Style|Array.<ol.style.Style>}
   */
  let style = null;

  if (featureStyleFunction) {
    style = featureStyleFunction.call(feature, resolution);
  }

  if (!style && fallbackStyleFunction) {
    style = fallbackStyleFunction(feature, resolution);
  }

  if (!style) {
    // The feature must not be displayed
    return null;
  }

  // FIXME combine materials as in cesium-materials-pack?
  // then this function must return a custom material
  // More simply, could blend the colors like described in
  // http://en.wikipedia.org/wiki/Alpha_compositing
  return Array.isArray(style) ? style[0] : style;
};


/**
 * Convert one OpenLayers feature up to a collection of Cesium primitives.
 * @param {ol.layer.Vector|ol.layer.Image} layer
 * @param {!ol.Feature} feature OpenLayers feature.
 * @param {!ol.style.Style} style
 * @param {!olcsx.core.OlFeatureToCesiumContext} context
 * @param {!ol.geom.Geometry=} opt_geom Geometry to be converted.
 * @return {Cesium.Primitive} primitives
 * @api
 */
olcs.FeatureConverter.prototype.olFeatureToCesium = function(layer, feature, style, context, opt_geom) {
  let geom = opt_geom || feature.getGeometry();
  const proj = context.projection;
  if (!geom) {
    // OpenLayers features may not have a geometry
    // See http://geojson.org/geojson-spec.html#feature-objects
    return null;
  }

  const newBillboardAddedCallback = function(bb) {
    context.featureToCesiumMap[ol.getUid(feature)] = bb;
  };

  switch (geom.getType()) {
    case 'GeometryCollection':
      const primitives = new Cesium.PrimitiveCollection();
      const collection = /** @type {!ol.geom.GeometryCollection} */ (geom);
      // TODO: use getGeometriesArray() instead
      collection.getGeometries().forEach((geom) => {
        if (geom) {
          const prims = this.olFeatureToCesium(layer, feature, style, context,
              geom);
          if (prims) {
            primitives.add(prims);
          }
        }
      });
      return primitives;
    case 'Point':
      geom = /** @type {!ol.geom.Point} */ (geom);
      const bbs = context.billboards;
      const result = this.olPointGeometryToCesium(layer, feature, geom, proj,
          style, bbs, newBillboardAddedCallback);
      if (!result) {
        // no wrapping primitive
        return null;
      } else {
        return result;
      }
    case 'Circle':
      geom = /** @type {!ol.geom.Circle} */ (geom);
      return this.olCircleGeometryToCesium(layer, feature, geom, proj,
          style);
    case 'LineString':
      geom = /** @type {!ol.geom.LineString} */ (geom);
      return this.olLineStringGeometryToCesium(layer, feature, geom, proj,
          style);
    case 'Polygon':
      geom = /** @type {!ol.geom.Polygon} */ (geom);
      return this.olPolygonGeometryToCesium(layer, feature, geom, proj,
          style);
    case 'MultiPoint':
    case 'MultiLineString':
    case 'MultiPolygon':
      const result2 = this.olMultiGeometryToCesium(layer, feature, geom, proj,
          style, context.billboards, newBillboardAddedCallback);
      if (!result2) {
        // no wrapping primitive
        return null;
      } else {
        return result2;
      }
    case 'LinearRing':
      throw new Error('LinearRing should only be part of polygon.');
    default:
      throw new Error(`Ol geom type not handled : ${geom.getType()}`);
  }
};


/**
 * Convert an OpenLayers vector layer to Cesium primitive collection.
 * For each feature, the associated primitive will be stored in
 * `featurePrimitiveMap`.
 * @param {!(ol.layer.Vector|ol.layer.Image)} olLayer
 * @param {!ol.View} olView
 * @param {!Object.<number, !Cesium.Primitive>} featurePrimitiveMap
 * @return {!olcs.core.VectorLayerCounterpart}
 * @api
 */
olcs.FeatureConverter.prototype.olVectorLayerToCesium = function(olLayer, olView, featurePrimitiveMap) {
  const proj = olView.getProjection();
  const resolution = olView.getResolution();

  if (resolution === undefined || !proj) {
    goog.asserts.fail('View not ready');
    // an assertion is not enough for closure to assume resolution and proj
    // are defined
    throw new Error('View not ready');
  }

  let source = olLayer.getSource();
  if (olLayer instanceof ol.layer.Image) {
    if (source instanceof ol.source.ImageVector) {
      source = source.getSource();
    } else {
      // Not supported
      return new olcs.core.VectorLayerCounterpart(proj, this.scene);
    }
  }

  goog.asserts.assertInstanceof(source, ol.source.Vector);
  const features = source.getFeatures();
  const counterpart = new olcs.core.VectorLayerCounterpart(proj, this.scene);
  const context = counterpart.context;
  for (let i = 0; i < features.length; ++i) {
    const feature = features[i];
    if (!feature) {
      continue;
    }
    /**
     * @type {ol.StyleFunction|undefined}
     */
    let layerStyle;
    if (olLayer instanceof ol.layer.Image) {
      const imageSource = olLayer.getSource();
      goog.asserts.assertInstanceof(imageSource, ol.source.ImageVector);
      layerStyle = imageSource.getStyleFunction();
    } else {
      layerStyle = olLayer.getStyleFunction();
    }
    const style = this.computePlainStyle(olLayer, feature, layerStyle,
        resolution);
    if (!style) {
      // only 'render' features with a style
      continue;
    }
    const primitives = this.olFeatureToCesium(olLayer, feature, style, context);
    if (!primitives) {
      continue;
    }
    featurePrimitiveMap[ol.getUid(feature)] = primitives;
    counterpart.getRootPrimitive().add(primitives);
  }

  return counterpart;
};


/**
 * Convert an OpenLayers feature to Cesium primitive collection.
 * @param {!(ol.layer.Vector|ol.layer.Image)} layer
 * @param {!ol.View} view
 * @param {!ol.Feature} feature
 * @param {!olcsx.core.OlFeatureToCesiumContext} context
 * @return {Cesium.Primitive}
 * @api
 */
olcs.FeatureConverter.prototype.convert = function(layer, view, feature, context) {
  const proj = view.getProjection();
  const resolution = view.getResolution();

  if (resolution == undefined || !proj) {
    return null;
  }

  /**
   * @type {ol.StyleFunction|undefined}
   */
  let layerStyle;
  if (layer instanceof ol.layer.Image) {
    const imageSource = layer.getSource();
    if (imageSource instanceof ol.source.ImageVector) {
      layerStyle = imageSource.getStyleFunction();
    } else {
      return null;
    }
  } else {
    layerStyle = layer.getStyleFunction();
  }
  const style = this.computePlainStyle(layer, feature, layerStyle, resolution);

  if (!style) {
    // only 'render' features with a style
    return null;
  }

  context.projection = proj;
  return this.olFeatureToCesium(layer, feature, style, context);
};
