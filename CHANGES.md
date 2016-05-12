# Changelog

* Changes
  * Add support for drawing rectangles according to the longitude and latitude
    curves instead of straight lines. This functionality can be activated by
    setting the olcs.polygon_kind property to 'rectangle' on the OpenLayers
    geometry.

## v 1.15 - 2016-04-28

* Changes
  * Use fast pixelated canvas scaling on supported browsers. See
    PR 3288 / commit 322df7b in Cesium. On unsupported browsers, render at
    full resolution (slow).
  * Port to OL 3.15.1.
  * Port to Cesium 1.20.

## v 1.14 - 2016-03-31

* Changes
  * Accept a mode=dev parameter in examples to ease debugging.
  * Port to OL 3.14.2.
  * Port to Cesium 1.19.

## v 1.13 - 2016-02-29

* Changes
  * Port to Cesium 1.18.
  * Port to OL 3.14.0.

## v1.12 - 2016-01-30

* Breaking changes
  * Remove dragbox functionality due to the removal of the Cesium.RectanglePrimitive
    by upstream. See the commit message for hints about how to reimplement it.
  * Remove Cesium.RectanglePrimitive, Cesium.PerspectiveFrustrum.getPixelSize,
    Cesium.OpenStreetMapImageryProvider from Cesium externs.
* Changes
  * Port to OL 3.13.0.
  * Port to Cesium 1.17.

## v1.11 - 2015-12-23

* Changes
  * Port to Cesium 1.16.
  * Port to OL 3.12.1

## v1.10 - 2015-11-30

* Breaking changes
  * OL3-Cesium is now compiled together with OL3. A custom closure compiler
    build is no more required.

## v1.9 - 2015-10-22

* Breaking changes
  * Port to OL 3.10.1, remove saturation, gamma and hue functions.
  * Change `olcs.AbstractSynchronizer.prototype.createSingleCounterpart` to
    return an array of counterparts instead of a unique object. This allows
    one OL3 layer to be transformed in several Cesium layers.
  * Rename `olcs.AbstractSynchronizer.prototype.createSingleCounterpart` to
    `olcs.AbstractSynchronizer.prototype.createSingleLayerCounterparts`.
  * Rename `olcs.RasterSynchronizer.prototype.convertLayerToCesiumImagery` to
    `olcs.RasterSynchronizer.prototype.convertLayerToCesiumImageries`.

* Changes
  * Add `olcs.OLCesium.setResolutionScale` to allow improving performance at
    the cost of quality.
  * Automatically use device pixel ratio to configure the Webgl 3D globe.
  * Add the experimental method `olcs.OLCesium.enableAutoRenderLoop` to stop
    rendering the globe when idle. This is based on work from Kevin Ring.
  * Port to Cesium 1.14.
  * The `olcs.AbstractSynchronizer` now tries to synchronize the layer groups.
    Only if null is returned will it synchronize each of its children. This
    allows more synchronization strategies in user applications.

## v1.8 - 2015-09-10

* Breaking changes
  * Rename `olcs.core.OlLayerPrimitive` to `olcs.core.VectorLayerCounterpart`
    and stop inheriting from `Cesium.PrimitiveCollection`. The underlying
    primitive collection may be retrieved with the `getRootPrimitive()` method.

* Changes
  * Port to Cesium 1.13 and OL 3.9.0.
  * Allow blocking Cesium rendering to save resources using
    `olcs.OLCesium#setBlockCesiumRendering(true)`.
  * The `build/generate-info.js` tool now follows symlinks to properly
    generate exports.
  * `olcs.RasterSynchronizer.prototype.convertLayerToCesiumImagery` may be
    overriden. As usual, subclassing requires that the subclass and the
    library code be compiled together by Closure. This change notably allows
    application code to handle projections not supported by Cesium.
  * Allow application developers to easily compile plugin code together with
    the library by putting their files in the src/plugins directory. See
    src/plugins/README.md for details and instructions.
  * Allow lazy loading of the Cesium script (experimental feature).

## v1.7 - 2015-08-07

  * Port to Cesium 1.12 and Ol 3.8.1

## v1.6 - 2015-06-30

  * Breaking changes
    * The layer is now passed to the conversion methods of `ol.FeatureConverter`.
    * The feature is now passed to the conversion methods of `ol.FeatureConverter`.
    * The `olcs.core.olVectorLayerToCesium()` function now takes a `scene`
      parameter. The `olcs.core.OlLayerPrimitive` constructor now takes a
      `scene` parameter.
    * Core static functions for converting from OL3 features to Cesium primitives
      have been moved into a class designed for inheritance.
      The `olcs.FeatureConverter` may be extended and passed as a parameter of
      the `olcs.VectorSynchronizer` constructor. See the synchronizer function 
      parameter of the `olcs.OLCesium` constructor. Subclassing requires that
      the subclass and the library code be compiled together.
      One way of migrating existing code is to define a global variable:
      `app.converter = new olcs.FeatureConverter({scene: scene});` and call
      the methods through it: `app.converter.olLineStringGeometryToCesium()`.
  * Set reference to the OpenLayers feature and layer to all created Cesium
    primitives.
  * Compiled code may override the new `olcs.FeatureConverter.csAddBillboard`
    method in order to manipulate the option before the Cesium billboard is
    actually created.
  * The layer is now stored together with the feature in the Cesium counterpart.
    They may be retrieved using `pickedCesiumPrimitive.olLayer` and
    `pickedCesiumPrimitive.olFeature`.
  * Position point geometries on terrain.
    With 2D coordinates, use `pointFeature.getGeometry().set('altitudeMode', 'clampToGround')`.
    With 3D relative coordinates, use `pointFeature.getGeometry().set('altitudeMode', 'relativeToGround')`.
  * Port to Cesium 1.10.

## v1.5 - 2015-05-29

  * Port to Cesium 1.9 and Ol 3.5.0

## v1.4 - 2015-04-30

  * Port to Cesium 1.8 and Ol 3.4.0
  * Mark `olcs.RasterSynchronizer` @api

## v1.3 - 2015-03-23

* Breaking changes
  * The `enable` argument to `olcs.OLCesium#setEnabled()` is no longer optional.
* Port to Cesium 1.7.1 and Ol 3.3.0

## v1.2 - 2015-02-25

* Port to Cesium 1.6 and Ol 3.2

## v1.1 - 2015-01-20

* Breaking changes
  * The `olFeatureId` has been removed from the picked Cesium counterpart.
    Use directly `olFeature` as illustrated in the synthetic vector examples.
  * The `olcs.OLCesium` constructor signature has changed. Use
    `new olcs.OLCesium({map: map, target: target});` instead of `new olcs.OLCesium(map, target);`
* Custom synchronizer function may be passed to the OLCesium constructor
* Core functions for implementing custom 2D-3D transitions à la Google Map
* Store the `ol.Feature` in the Cesium counterpart instead of an id.
  Use `primitive.olFeature` to read it after picking. See the synthetic vector examples.
* Allow 3D warmup while displaying the 2D map

## v1.0.0 - 2014-11-17
