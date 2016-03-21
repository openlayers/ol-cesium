goog.provide('olcs.FeatureConverter');

goog.require('goog.asserts');
goog.require('ol.extent');
goog.require('ol.geom.SimpleGeometry');
goog.require('olcs.core.VectorLayerCounterpart');
goog.require('olcs.obj');



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
   * @type {function(ol.source.VectorEvent)}
   * @private
   */
  this.boundOnRemoveOrClearFeatureListener_ =
      this.onRemoveOrClearFeature_.bind(this);
};


/**
 * @param {ol.source.VectorEvent} evt
 * @private
 */
olcs.FeatureConverter.prototype.onRemoveOrClearFeature_ = function(evt) {
  var source = evt.target;
  goog.asserts.assertInstanceof(source, ol.source.Vector);

  var cancellers = olcs.obj(source)['olcs_cancellers'];
  if (cancellers) {
    var feature = evt.feature;
    if (goog.isDef(feature)) {
      // remove
      var id = goog.getUid(feature);
      var canceller = cancellers[id];
      if (canceller) {
        canceller();
        delete cancellers[id];
      }
    } else {
      // clear
      for (var key in cancellers) {
        if (cancellers.hasOwnProperty(key)) {
          cancellers[key]();
        }
      }
      olcs.obj(source)['olcs_cancellers'] = {};
    }
  }
};


/**
 * @param {ol.layer.Vector|ol.layer.Image} layer
 * @param {!ol.Feature} feature Ol3 feature.
 * @param {!Cesium.Primitive|Cesium.Label|Cesium.Billboard} primitive
 * @protected
 */
olcs.FeatureConverter.prototype.setReferenceForPicking =
    function(layer, feature, primitive) {
  primitive.olLayer = layer;
  primitive.olFeature = feature;
};


/**
 * Basics primitive creation using a color attribute.
 * Note that Cesium has 'interior' and outline geometries.
 * @param {ol.layer.Vector|ol.layer.Image} layer
 * @param {!ol.Feature} feature Ol3 feature.
 * @param {!ol.geom.Geometry} olGeometry Ol3 geometry.
 * @param {!Cesium.Geometry} geometry
 * @param {!Cesium.Color} color
 * @param {number=} opt_lineWidth
 * @return {Cesium.Primitive}
 * @protected
 */
olcs.FeatureConverter.prototype.createColoredPrimitive =
    function(layer, feature, olGeometry, geometry, color, opt_lineWidth) {
  var createInstance = function(geometry, color) {
    return new Cesium.GeometryInstance({
      // always update Cesium externs before adding a property
      geometry: geometry,
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
      }
    });
  };

  var options = {
    // always update Cesium externs before adding a property
    flat: true, // work with all geometries
    renderState: {
      depthTest: {
        enabled: true
      }
    }
  };

  if (goog.isDef(opt_lineWidth)) {
    if (!options.renderState) {
      options.renderState = {};
    }
    options.renderState.lineWidth = opt_lineWidth;
  }

  var instances = createInstance(geometry, color);

  var heightReference = this.getHeightReference(layer, feature, olGeometry);

  var primitive;

  if (heightReference == Cesium.HeightReference.CLAMP_TO_GROUND) {
    var ctor = instances.geometry.constructor;
    if (ctor && !ctor.createShadowVolume) {
      return null;
    }
    primitive = new Cesium.GroundPrimitive({
      // always update Cesium externs before adding a property
      geometryInstances: instances
    });
  } else {
    var appearance = new Cesium.PerInstanceColorAppearance(options);
    primitive = new Cesium.Primitive({
      // always update Cesium externs before adding a property
      geometryInstances: instances,
      appearance: appearance
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
olcs.FeatureConverter.prototype.extractColorFromOlStyle =
    function(style, outline) {
  var fillColor = style.getFill() ? style.getFill().getColor() : null;
  var strokeColor = style.getStroke() ? style.getStroke().getColor() : null;

  var olColor = 'black';
  if (strokeColor && outline) {
    olColor = strokeColor;
  } else if (fillColor) {
    olColor = fillColor;
  }

  return olcs.core.convertColorToCesium(olColor);
};


/**
 * Return the width of stroke from a plain ol style.
 * Use GL aliased line width range constraint.
 * @param {!ol.style.Style|ol.style.Text} style
 * @return {number}
 * @protected
 */
olcs.FeatureConverter.prototype.extractLineWidthFromOlStyle =
    function(style) {
  var width = style.getStroke() ? style.getStroke().getWidth() : 1;
  return Math.min(width, this.scene.maximumAliasedLineWidth);
};


/**
 * Create a primitive collection out of two Cesium geometries.
 * Only the OpenLayers style colors will be used.
 * @param {ol.layer.Vector|ol.layer.Image} layer
 * @param {!ol.Feature} feature Ol3 feature.
 * @param {!ol.geom.Geometry} olGeometry Ol3 geometry.
 * @param {!Cesium.Geometry} fillGeometry
 * @param {!Cesium.Geometry} outlineGeometry
 * @param {!ol.style.Style} olStyle
 * @return {!Cesium.PrimitiveCollection}
 * @protected
 */
olcs.FeatureConverter.prototype.wrapFillAndOutlineGeometries =
    function(layer, feature, olGeometry, fillGeometry, outlineGeometry,
        olStyle) {
  var fillColor = this.extractColorFromOlStyle(olStyle, false);
  var outlineColor = this.extractColorFromOlStyle(olStyle, true);

  var primitives = new Cesium.PrimitiveCollection();
  if (olStyle.getFill()) {
    var p = this.createColoredPrimitive(layer, feature, olGeometry,
        fillGeometry, fillColor);
    goog.asserts.assert(!!p);
    primitives.add(p);
  }

  if (olStyle.getStroke()) {
    var width = this.extractLineWidthFromOlStyle(olStyle);
    var p = this.createColoredPrimitive(layer, feature, olGeometry,
        outlineGeometry, outlineColor, width);
    if (p) {
      // Some outline geometries are not supported by Cesium in clamp to ground
      // mode. These primitives are skipped.
      primitives.add(p);
    }
  }

  return primitives;
};


// Geometry converters
/**
 * Create a Cesium primitive if style has a text component.
 * Eventually return a PrimitiveCollection including current primitive.
 * @param {ol.layer.Vector|ol.layer.Image} layer
 * @param {!ol.Feature} feature Ol3 feature..
 * @param {!ol.geom.Geometry} geometry
 * @param {!ol.style.Style} style
 * @param {!Cesium.Primitive} primitive current primitive
 * @return {!Cesium.PrimitiveCollection}
 * @protected
 */
olcs.FeatureConverter.prototype.addTextStyle =
    function(layer, feature, geometry, style, primitive) {
  var primitives;
  if (!(primitive instanceof Cesium.PrimitiveCollection)) {
    primitives = new Cesium.PrimitiveCollection();
    primitives.add(primitive);
  } else {
    primitives = primitive;
  }

  if (!style.getText()) {
    return primitives;
  }

  var text = /** @type {!ol.style.Text} */ (style.getText());
  var label = this.olGeometry4326TextPartToCesium(layer, feature, geometry,
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
 * @param {!ol.Feature} feature Ol3 feature.
 * @param {!ol.geom.Geometry} geometry
 * @param {!ol.style.Style} style
 * @return {!Cesium.Billboard} newly created billboard
 * @api
 */
olcs.FeatureConverter.prototype.csAddBillboard =
    function(billboards, bbOptions, layer, feature, geometry, style) {
  var bb = billboards.add(bbOptions);
  this.setReferenceForPicking(layer, feature, bb);
  return bb;
};


/**
 * Convert an OpenLayers circle geometry to Cesium.
 * @param {ol.layer.Vector|ol.layer.Image} layer
 * @param {!ol.Feature} feature Ol3 feature..
 * @param {!ol.geom.Circle} olGeometry Ol3 circle geometry.
 * @param {!ol.proj.ProjectionLike} projection
 * @param {!ol.style.Style} olStyle
 * @return {!Cesium.PrimitiveCollection} primitives
 * @api
 */
olcs.FeatureConverter.prototype.olCircleGeometryToCesium =
    function(layer, feature, olGeometry, projection, olStyle) {

  olGeometry = olcs.core.olGeometryCloneTo4326(olGeometry, projection);
  goog.asserts.assert(olGeometry.getType() == 'Circle');

  // ol.Coordinate
  var center = olGeometry.getCenter();
  var height = center.length == 3 ? center[2] : 0.0;
  var point = center.slice();
  point[0] += olGeometry.getRadius();

  // Cesium
  center = olcs.core.ol4326CoordinateToCesiumCartesian(center);
  point = olcs.core.ol4326CoordinateToCesiumCartesian(point);

  // Accurate computation of straight distance
  var radius = Cesium.Cartesian3.distance(center, point);

  var fillGeometry = new Cesium.CircleGeometry({
    // always update Cesium externs before adding a property
    center: center,
    radius: radius,
    height: height
  });

  var outlineGeometry = new Cesium.CircleOutlineGeometry({
    // always update Cesium externs before adding a property
    center: center,
    radius: radius,
    extrudedHeight: height,
    height: height
  });

  var primitives = this.wrapFillAndOutlineGeometries(
      layer, feature, olGeometry, fillGeometry, outlineGeometry, olStyle);

  return this.addTextStyle(layer, feature, olGeometry, olStyle, primitives);
};


/**
 * Convert an OpenLayers line string geometry to Cesium.
 * @param {ol.layer.Vector|ol.layer.Image} layer
 * @param {!ol.Feature} feature Ol3 feature..
 * @param {!ol.geom.LineString} olGeometry Ol3 line string geometry.
 * @param {!ol.proj.ProjectionLike} projection
 * @param {!ol.style.Style} olStyle
 * @return {!Cesium.PrimitiveCollection} primitives
 * @api
 */
olcs.FeatureConverter.prototype.olLineStringGeometryToCesium =
    function(layer, feature, olGeometry, projection, olStyle) {

  olGeometry = olcs.core.olGeometryCloneTo4326(olGeometry, projection);
  goog.asserts.assert(olGeometry.getType() == 'LineString');

  var positions = olcs.core.ol4326CoordinateArrayToCsCartesians(
      olGeometry.getCoordinates());

  var appearance = new Cesium.PolylineMaterialAppearance({
    // always update Cesium externs before adding a property
    material: this.olStyleToCesium(feature, olStyle, true)
  });

  // Handle both color and width
  var outlineGeometry = new Cesium.PolylineGeometry({
    // always update Cesium externs before adding a property
    positions: positions,
    width: this.extractLineWidthFromOlStyle(olStyle),
    vertexFormat: appearance.vertexFormat
  });

  var outlinePrimitive = new Cesium.Primitive({
    // always update Cesium externs before adding a property
    geometryInstances: new Cesium.GeometryInstance({
      geometry: outlineGeometry
    }),
    appearance: appearance
  });
  this.setReferenceForPicking(layer, feature, outlinePrimitive);

  return this.addTextStyle(layer, feature, olGeometry, olStyle,
      outlinePrimitive);
};


/**
 * Convert an OpenLayers polygon geometry to Cesium.
 * @param {ol.layer.Vector|ol.layer.Image} layer
 * @param {!ol.Feature} feature Ol3 feature..
 * @param {!ol.geom.Polygon} olGeometry Ol3 polygon geometry.
 * @param {!ol.proj.ProjectionLike} projection
 * @param {!ol.style.Style} olStyle
 * @return {!Cesium.PrimitiveCollection} primitives
 * @api
 */
olcs.FeatureConverter.prototype.olPolygonGeometryToCesium =
    function(layer, feature, olGeometry, projection, olStyle) {

  olGeometry = olcs.core.olGeometryCloneTo4326(olGeometry, projection);
  goog.asserts.assert(olGeometry.getType() == 'Polygon');

  var rings = olGeometry.getLinearRings();
  // always update Cesium externs before adding a property
  var hierarchy = {};
  var polygonHierarchy = hierarchy;
  goog.asserts.assert(rings.length > 0);

  for (var i = 0; i < rings.length; ++i) {
    var olPos = rings[i].getCoordinates();
    var positions = olcs.core.ol4326CoordinateArrayToCsCartesians(olPos);
    goog.asserts.assert(positions && positions.length > 0);
    if (i == 0) {
      hierarchy.positions = positions;
    } else {
      hierarchy.holes = {
        // always update Cesium externs before adding a property
        positions: positions
      };
      hierarchy = hierarchy.holes;
    }
  }

  var fillGeometry = new Cesium.PolygonGeometry({
    // always update Cesium externs before adding a property
    polygonHierarchy: polygonHierarchy,
    perPositionHeight: true
  });

  var outlineGeometry = new Cesium.PolygonOutlineGeometry({
    // always update Cesium externs before adding a property
    polygonHierarchy: hierarchy,
    perPositionHeight: true
  });

  var primitives = this.wrapFillAndOutlineGeometries(
      layer, feature, olGeometry, fillGeometry, outlineGeometry, olStyle);

  return this.addTextStyle(layer, feature, olGeometry, olStyle, primitives);
};


/**
 * @param {ol.layer.Vector|ol.layer.Image} layer
 * @param {ol.Feature} feature Ol3 feature..
 * @param {!ol.geom.Geometry} geometry
 * @return {!Cesium.HeightReference}
 * @api
 */
olcs.FeatureConverter.prototype.getHeightReference =
    function(layer, feature, geometry) {

  // Read from the geometry
  var altitudeMode = geometry.get('altitudeMode');

  // Or from the feature
  if (!goog.isDef(altitudeMode)) {
    altitudeMode = feature.get('altitudeMode');
  }

  // Or from the layer
  if (!goog.isDef(altitudeMode)) {
    altitudeMode = layer.get('altitudeMode');
  }

  var heightReference = Cesium.HeightReference.NONE;
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
 * @param {!ol.Feature} feature Ol3 feature..
 * @param {!ol.geom.Point} olGeometry Ol3 point geometry.
 * @param {!ol.proj.ProjectionLike} projection
 * @param {!ol.style.Style} style
 * @param {!Cesium.BillboardCollection} billboards
 * @param {function(!Cesium.Billboard)=} opt_newBillboardCallback Called when
 * the new billboard is added.
 * @return {Cesium.Primitive} primitives
 * @api
 */
olcs.FeatureConverter.prototype.olPointGeometryToCesium =
    function(layer, feature, olGeometry, projection, style, billboards,
    opt_newBillboardCallback) {
  goog.asserts.assert(olGeometry.getType() == 'Point');
  olGeometry = olcs.core.olGeometryCloneTo4326(olGeometry, projection);

  var imageStyle = style.getImage();
  if (imageStyle) {
    if (imageStyle instanceof ol.style.Icon) {
      // make sure the image is scheduled for load
      imageStyle.load();
    }

    var image = imageStyle.getImage(1); // get normal density
    var isImageLoaded = function(image) {
      return image.src != '' &&
          image.naturalHeight != 0 &&
          image.naturalWidth != 0 &&
          image.complete;
    };
    var reallyCreateBillboard = (function() {
      if (goog.isNull(image)) {
        return;
      }
      if (!(image instanceof HTMLCanvasElement ||
          image instanceof Image ||
          image instanceof HTMLImageElement)) {
        return;
      }
      var center = olGeometry.getCoordinates();
      var position = olcs.core.ol4326CoordinateToCesiumCartesian(center);
      var color;
      var opacity = imageStyle.getOpacity();
      if (goog.isDef(opacity)) {
        color = new Cesium.Color(1.0, 1.0, 1.0, opacity);
      }

      var heightReference = this.getHeightReference(layer, feature, olGeometry);

      var bbOptions = /** @type {Cesium.optionsBillboardCollectionAdd} */ ({
        // always update Cesium externs before adding a property
        image: image,
        color: color,
        scale: imageStyle.getScale(),
        heightReference: heightReference,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        position: position
      });
      var bb = this.csAddBillboard(billboards, bbOptions, layer, feature,
          olGeometry, style);
      if (opt_newBillboardCallback) {
        opt_newBillboardCallback(bb);
      }
    }).bind(this);

    if (image instanceof Image && !isImageLoaded(image)) {
      // Cesium requires the image to be loaded
      var cancelled = false;
      var source = layer.getSource();
      if (source instanceof ol.source.ImageVector) {
        source = source.getSource();
      }
      var canceller = function() {
        cancelled = true;
      };
      source.on(['removefeature', 'clear'],
          this.boundOnRemoveOrClearFeatureListener_);
      var cancellers = olcs.obj(source)['olcs_cancellers'];
      if (!cancellers) {
        cancellers = olcs.obj(source)['olcs_cancellers'] = {};
      }

      var fuid = goog.getUid(feature);
      if (cancellers[fuid]) {
        // When the feature change quickly, a canceller may still be present so
        // we cancel it here to prevent creation of a billboard.
        cancellers[fuid]();
      }
      cancellers[fuid] = canceller;

      var listener = function() {
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
 * @param {!ol.Feature} feature Ol3 feature..
 * @param {!ol.geom.Geometry} geometry Ol3 geometry.
 * @param {!ol.proj.ProjectionLike} projection
 * @param {!ol.style.Style} olStyle
 * @param {!Cesium.BillboardCollection} billboards
 * @param {function(!Cesium.Billboard)=} opt_newBillboardCallback Called when
 * the new billboard is added.
 * @return {Cesium.Primitive} primitives
 * @api
 */
olcs.FeatureConverter.prototype.olMultiGeometryToCesium =
    function(layer, feature, geometry, projection, olStyle, billboards,
    opt_newBillboardCallback) {
  // Do not reproject to 4326 now because it will be done later.

  // FIXME: would be better to combine all child geometries in one primitive
  // instead we create n primitives for simplicity.
  var accumulate = function(geometries, functor) {
    var primitives = new Cesium.PrimitiveCollection();
    geometries.forEach(function(geometry) {
      primitives.add(functor(layer, feature, geometry, projection, olStyle));
    });
    return primitives;
  };

  var subgeos;
  switch (geometry.getType()) {
    case 'MultiPoint':
      geometry = /** @type {!ol.geom.MultiPoint} */ (geometry);
      subgeos = geometry.getPoints();
      if (olStyle.getText()) {
        var primitives = new Cesium.PrimitiveCollection();
        subgeos.forEach(function(geometry) {
          goog.asserts.assert(geometry);
          var result = this.olPointGeometryToCesium(layer, feature, geometry,
              projection, olStyle, billboards, opt_newBillboardCallback);
          if (result) {
            primitives.add(result);
          }
        }.bind(this));
        return primitives;
      } else {
        subgeos.forEach(function(geometry) {
          goog.asserts.assert(!goog.isNull(geometry));
          this.olPointGeometryToCesium(layer, feature, geometry, projection,
              olStyle, billboards, opt_newBillboardCallback);
        }.bind(this));
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
      goog.asserts.fail('Unhandled multi geometry type' + geometry.getType());
  }
};


/**
 * Convert an OpenLayers text style to Cesium.
 * @param {ol.layer.Vector|ol.layer.Image} layer
 * @param {!ol.Feature} feature Ol3 feature..
 * @param {!ol.geom.Geometry} geometry
 * @param {!ol.style.Text} style
 * @return {Cesium.LabelCollection} Cesium primitive
 * @api
 */
olcs.FeatureConverter.prototype.olGeometry4326TextPartToCesium =
    function(layer, feature, geometry, style) {
  var text = style.getText();
  goog.asserts.assert(goog.isDef(text));


  var labels = new Cesium.LabelCollection({scene: this.scene});
  // TODO: export and use the text draw position from ol3 .
  // See src/ol/render/vector.js
  var extentCenter = ol.extent.getCenter(geometry.getExtent());
  if (geometry instanceof ol.geom.SimpleGeometry) {
    var first = geometry.getFirstCoordinate();
    extentCenter[2] = first.length == 3 ? first[2] : 0.0;
  }
  var options = /** @type {Cesium.optionsLabelCollection} */ ({});

  options.position = olcs.core.ol4326CoordinateToCesiumCartesian(extentCenter);

  options.text = text;

  options.heightReference = this.getHeightReference(layer, feature, geometry);

  var offsetX = style.getOffsetX();
  var offsetY = style.getOffsetY();
  if (offsetX != 0 && offsetY != 0) {
    var offset = new Cesium.Cartesian2(offsetX, offsetY);
    options.pixelOffset = offset;
  }

  var font = style.getFont();
  if (goog.isDefAndNotNull(font)) {
    options.font = font;
  }

  var labelStyle = undefined;
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

  var horizontalOrigin;
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
    var verticalOrigin;
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
        goog.asserts.fail('unhandled baseline ' + style.getTextBaseline());
    }
    options.verticalOrigin = verticalOrigin;
  }


  var l = labels.add(options);
  this.setReferenceForPicking(layer, feature, l);
  return labels;
};


/**
 * Convert an OpenLayers style to a Cesium Material.
 * @param {ol.Feature} feature Ol3 feature..
 * @param {!ol.style.Style} style
 * @param {boolean} outline
 * @return {Cesium.Material}
 * @api
 */
olcs.FeatureConverter.prototype.olStyleToCesium =
    function(feature, style, outline) {
  var fill = style.getFill();
  var stroke = style.getStroke();
  if ((outline && !stroke) || (!outline && !fill)) {
    return null; // FIXME use a default style? Developer error?
  }

  var color = outline ? stroke.getColor() : fill.getColor();
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
      color: color
    });
  }

};


/**
 * Compute OpenLayers plain style.
 * Evaluates style function, blend arrays, get default style.
 * @param {ol.layer.Vector|ol.layer.Image} layer
 * @param {!ol.Feature} feature
 * @param {ol.style.StyleFunction|undefined} fallbackStyleFunction
 * @param {number} resolution
 * @return {ol.style.Style} null if no style is available
 * @api
 */
olcs.FeatureConverter.prototype.computePlainStyle =
    function(layer, feature, fallbackStyleFunction, resolution) {
  /**
   * @type {ol.FeatureStyleFunction|undefined}
   */
  var featureStyleFunction = feature.getStyleFunction();

  /**
   * @type {ol.style.Style|Array.<ol.style.Style>}
   */
  var style = null;

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
  return goog.isArray(style) ? style[0] : style;
};


/**
 * Convert one OpenLayers feature up to a collection of Cesium primitives.
 * @param {ol.layer.Vector|ol.layer.Image} layer
 * @param {!ol.Feature} feature Ol3 feature.
 * @param {!ol.style.Style} style
 * @param {!olcsx.core.OlFeatureToCesiumContext} context
 * @param {!ol.geom.Geometry=} opt_geom Geometry to be converted.
 * @return {Cesium.Primitive} primitives
 * @api
 */
olcs.FeatureConverter.prototype.olFeatureToCesium =
    function(layer, feature, style, context, opt_geom) {
  var geom = opt_geom || feature.getGeometry();
  var proj = context.projection;
  if (!geom) {
    // Ol3 features may not have a geometry
    // See http://geojson.org/geojson-spec.html#feature-objects
    return null;
  }

  var newBillboardAddedCallback = function(bb) {
    context.featureToCesiumMap[goog.getUid(feature)] = bb;
  };

  switch (geom.getType()) {
    case 'GeometryCollection':
      var primitives = new Cesium.PrimitiveCollection();
      var collection = /** @type {!ol.geom.GeometryCollection} */ (geom);
      // TODO: use getGeometriesArray() instead
      collection.getGeometries().forEach(function(geom) {
        if (geom) {
          var prims = this.olFeatureToCesium(layer, feature, style, context,
              geom);
          if (prims) {
            primitives.add(prims);
          }
        }
      }.bind(this));
      return primitives;
    case 'Point':
      geom = /** @type {!ol.geom.Point} */ (geom);
      var bbs = context.billboards;
      var result = this.olPointGeometryToCesium(layer, feature, geom, proj,
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
      var result = this.olMultiGeometryToCesium(layer, feature, geom, proj,
          style, context.billboards, newBillboardAddedCallback);
      if (!result) {
        // no wrapping primitive
        return null;
      } else {
        return result;
      }
    case 'LinearRing':
      throw new Error('LinearRing should only be part of polygon.');
    default:
      throw new Error('Ol geom type not handled : ' + geom.getType());
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
olcs.FeatureConverter.prototype.olVectorLayerToCesium =
    function(olLayer, olView, featurePrimitiveMap) {
  var proj = olView.getProjection();
  var resolution = olView.getResolution();

  if (!goog.isDef(resolution) || !proj) {
    goog.asserts.fail('View not ready');
    // an assertion is not enough for closure to assume resolution and proj
    // are defined
    throw new Error('View not ready');
  }

  var source = olLayer.getSource();
  if (olLayer instanceof ol.layer.Image) {
    if (source instanceof ol.source.ImageVector) {
      source = source.getSource();
    } else {
      // Not supported
      return new olcs.core.VectorLayerCounterpart(proj, this.scene);
    }
  }

  goog.asserts.assertInstanceof(source, ol.source.Vector);
  var features = source.getFeatures();
  var counterpart = new olcs.core.VectorLayerCounterpart(proj, this.scene);
  var context = counterpart.context;
  for (var i = 0; i < features.length; ++i) {
    var feature = features[i];
    if (!goog.isDefAndNotNull(feature)) {
      continue;
    }
    /**
     * @type {ol.style.StyleFunction|undefined}
     */
    var layerStyle;
    if (olLayer instanceof ol.layer.Image) {
      var imageSource = olLayer.getSource();
      goog.asserts.assertInstanceof(imageSource, ol.source.ImageVector);
      layerStyle = imageSource.getStyleFunction();
    } else {
      layerStyle = olLayer.getStyleFunction();
    }
    var style = this.computePlainStyle(olLayer, feature, layerStyle,
        resolution);
    if (!style) {
      // only 'render' features with a style
      continue;
    }
    var primitives = this.olFeatureToCesium(olLayer, feature, style, context);
    if (!primitives) continue;
    featurePrimitiveMap[goog.getUid(feature)] = primitives;
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
olcs.FeatureConverter.prototype.convert =
    function(layer, view, feature, context) {
  var proj = view.getProjection();
  var resolution = view.getResolution();

  if (!goog.isDef(resolution) || !proj) {
    return null;
  }

  /**
   * @type {ol.style.StyleFunction|undefined}
   */
  var layerStyle;
  if (layer instanceof ol.layer.Image) {
    var imageSource = layer.getSource();
    if (imageSource instanceof ol.source.ImageVector) {
      layerStyle = imageSource.getStyleFunction();
    } else {
      return null;
    }
  } else {
    layerStyle = layer.getStyleFunction();
  }
  var style = this.computePlainStyle(layer, feature, layerStyle, resolution);

  if (!style) {
    // only 'render' features with a style
    return null;
  }

  context.projection = proj;
  return this.olFeatureToCesium(layer, feature, style, context);
};
