# Changelog

# v 1.36

* Changes
  * Rework the autorenderloop using Cesium RenderMode.
  * Adapt credit handling following Cesium API changes.

* Breaking changes
  * Remove now useless debug switch of the autorenderloop.
  * Remove buggy and unused camera.lookAt method.
  * Make the camera.setPosition position the camera in the reference frame.

# v 1.35 - 2018-03-02

* Changes
  * Implement stacked ground corridors to improve the rendering of lines on
    terrain. A stack of ground corridors with increasing widths is created;
    Cesium will render the best one depending on the distance from the camera
    to the corridor.
  * Implement basic support for transformation to Cesium Model. It allows applications
    to notably implement arrows along a line clamped on terrain.
  * Port to Cesium 1.43.

# v 1.34 - 2018-01-24

* Changes
  * Allow overriding the 3D extent by setting an olcs.extent property in raster layers.
  * Port to OpenLayers 4.6.4 and Cesium 1.41.

# v 1.33 - 2017-12-07

* Changes
  * Animate olcs.contrib.Manager#toggle3d.
  * Add support for Overlay synchronization, see example Overlays.
  * Port to OpenLayers 4.6.2 and Cesium 1.40.
  * Restore OpenLayers events propagation.
  * Workaround camera sinking under the terrain and finally jumping above it.
    See https://github.com/AnalyticalGraphicsInc/cesium/issues/5999. The
    workaround requires the Camptocamp version of Cesium (otherwise it has no effect).
  * Add preliminary work for an ES6 package https://www.npmjs.com/package/olcs.
  * Remove management of ol.source.ImageVector. This class is deprecated in OpenLayers 4.6.2.

# v 1.32 - 2017-10-26

* Breaking changes
  * Changed AbstractSynchronizer.createSingleLayerCounterparts Plugin API
    in existing plugins the function has to be modified.
    It now takes an object {layer: !ol.layer.Base, parents: Array<ol.layer.Group>}.
    The parents are ordered with the first parent coming first and the last parent coming last.

* Changes
  * Allow features to specify a dedicated geometry for rendering in Cesium
    using the `olcs.3d_geometry` property.
  * Enable googshift eslint rules to prepare for ES6 modules migration; move
    source to the olcs directory and fix filenames.
  * Add basic support for clustered sources: see https://github.com/openlayers/ol-cesium/pull/496.
  * Introduce olcs.contrib.LazyLoader and olcs.contrib.Manager classes to ease
    initialization of an application. For extending these classes, see the plugins below.
  * Add calcResolutionForDistance and calcDistanceForResolution functions to Camera API
  * Add ol.layer.Group synchronization
  * Port to OpenLayers 4.4.2 and Cesium 1.38.

# v 1.31 - 2017-09-06

* Changes
  * Port to OpenLayers 4.3.2
  * Port to Cesium 1.37
  * Update OpenLayers to v4.3.1 to fix https://github.com/openlayers/ol-cesium/issues/479
  * Get OpenLayers and Cesium dependencies through npm instead of git
    submodules. On old clones you must remove manually the unused "ol" and
    "cesium" directories.
  * Switch to @camptocamp/closure-util fork to allow using goog.modules.
  * Switch to @camptocamp/cesium to allow examples based on vector tiles and
    advanced performance optimizations.

# v 1.30 - 2017-08-03

* Changes
  * Port to Cesium 1.36. This fixes blinking of the vector example
    https://github.com/openlayers/ol-cesium/issues/465.

# v 1.29 - 2017-07-12

* Changes
  * Port to OpenLayers 4.2.0.
  * Lint the examples with the same rules as the rest of the code, making
    it necessary to display the examples using an ES6-capable browser.
  * Port to Cesium 1.35.2.

# v 1.28 - 2017-06-02

* Changes
  * Port to Cesium 1.34.
  * Use all the styles defined for a feature.
  * Display geometries coming from style (using getGeometryFunction()).

# v 1.27- 2017-05-04

* Changes
  * Port to OpenLayers 4.1.1.
  * Port to cesium 1.33.

# v 1.26 - 2017-04-04

* Changes
  * WMTS OpenLayers layers are now automatically converted to Cesium layers.
  * Port to Cesium 1.32.

# v 1.25 - 2017-03-28

* Breaking changes
  * Stop returning promise from olcs.core.rotateAroundAxis function.

* Changes
  * Port to Cesium 1.31.
  * Add example rotate.html about animating rotation of the Cesium globe.
  * Convert source to Ecmascript 6. Continue to output Ecmascript 5.1.

# v 1.24.3 - 2017-02-17

* Changes
  * For npm.

# v 1.24.2 - 2017-02-17

* Changes
  * Final rename and publication of the project as a new npm project.

# v 1.24.1 - 2017-02-17

* Changes
  * Renamed project to OL-Cesium following the renaming of the OpenLayers3 project.
    In existing clones, do:
      git submodule sync
      git submodule update --recursive --init
      rm -rf ol3
      make cleanall
    Note that the distributed js file is olcesium.js

# v 1.24 - 2017-02-17

* Changes
  * Clamp line to the ground using Corridor geometry (experimental feature).
  * Port to Cesium 1.30.
  * Port to OpenLayers 4.0.1.

# v 1.23 - 2017-01-04

* Changes
  * Port to Cesium 1.29.
  * Port to OpenLayers 3.20.0.

# v 1.22 - 2016-12-02

* Changes
  * Port to Cesium 1.28.
  * Add OLCesium.setTargetFrameRate to enforce an fps limit for Cesium.
  * Add OLCesium option `time` to control the current time passed to Cesium.

# v 1.21 - 2016-11-02

* Changes
  * Add olcs.OLCesium.trackedFeature property to make Cesium automatically track an
    OpenLayers point feature. When active, the Cesium camera will follow changes of
    the feature position. This requires using stacked view.
  * Port to OpenLayers 3.19.1.
  * Port to Cesium 1.27.

# v 1.20 - 2016-09-02

* Changes
  * Port to Cesium 1.25.
  * Port to OpenLayers 3.18.2.

# v 1.19 - 2016-08-08

* Changes
  * Require node 4 or 6.
  * Port to Cesium 1.24.

# v 1.18 - 2016-07-18

* Changes
  * Port to Cesium 1.23.
  * Port to OL 3.17.1 (include OL3 typedefs.js and rename some symbols).
  * In examples, use OSM instead of obsolete MapQuest tiles.

# v 1.17 - 2016-06-23

* Changes
  * Port to Cesium 1.22.
  * Add olcs.core.convertUrlToCesium function to help convert OpenLayers urls
    to Cesium.
  * Handle arbitrary line widths on Windows OS.

## v 1.16 - 2016-05-30

* Changes
  * Switch to eslint.
  * Update npm dependencies.
  * Port to Cesium 1.21.
  * Port to OL 3.16.0.
  * Add support for drawing rectangles according to the longitude and latitude
    curves instead of straight lines. This functionality can be activated by
    setting the olcs.polygon_kind property to 'rectangle' on the OpenLayers
    geometry.
  * Add support to set a proxy for Cesium to load layer not accessible 
    due to missing CORS headers (eg. when user can't modify configuration 
    of the mapservice used). This functionality can be activated by 
    setting the olcs.proxy property to the OpenLayers source.

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
