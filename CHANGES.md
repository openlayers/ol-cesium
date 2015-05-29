# Changelog

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
