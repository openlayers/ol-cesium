OpenLayers - Cesium integration library. Create your map using [OpenLayers](https://openlayers.org/), and visualize it on a globe with [Cesium](https://cesiumjs.org).
See [live examples](https://openlayers.org/ol-cesium/examples/).


ES6 modules
-----------

Since version 2.0, the code is entirely based on ES6 modules and syntax.
That package requires OpenLayers 5.x.

Features
--------
Switch smoothly between 2D and 3D and synchronize:

- Map context (bounding box and zoom level);
- Raster data sources;
- Vector data sources in 2D and 3D;
- Map selection (selected items);
- Animated transitions between map and globe view.

The library is configurable and extensible and allows:

- Lazy or eager loading of Cesium
- Limiting Cesium resource consumption (idle detection)

For synchronization of maps in projections other than EPSG:4326 and EPSG:3857, see [#562](https://github.com/openlayers/ol-cesium/pull/562) branch.

Integration in your application
-------------------------------

There are several ways to use OL-Cesium in your application.

### As an ES6 library

See the examples for how it was done with webpack. It should work equally well
with other bundlers, please create an issue if it is not the case.

### As an old-fashioned independant library (need testing, if you are interested, get in touch with us)
```bash
npm i --save ol-cesium
```
```html
<!-- integrate OpenLayers and Cesium as usual
<link rel="stylesheet" href="ol.css" type="text/css">
<script src="ol.js"></script>
<script src="Cesium.js"></script>
-->
<link rel="stylesheet" href="node_modules/ol-cesium/dist/olcs.css" type="text/css">
<script src="node_modules/ol-cesium/dist/olcesium.js"></script>
```

### As an UMD library (need documentation, if you are interested, get in touch with us)

Use your webpack / require.js / ... as usual.


Getting started
--------------

An OpenLayers map can be switched to a 3d globe view by running the code below after the map has been created:
```js
import OLCesium from 'olcs/OLCesium.js';
const ol3d = new OLCesium({map: map}); // map is the ol.Map instance
ol3d.setEnabled(true);
```

See the [examples](https://openlayers.org/ol-cesium/examples/).

If you are new to Cesium, you should also check the [Cesium tutorials](https://cesiumjs.org/tutorials).


Running the examples in debug mode
----------------------------------

This is useful for contributing to Ol-Cesium, because it loads the
source files instead of a minified build:

    $ make serve

will make the distribution examples available at http://localhost:3000/examples

Running the unminified version of Cesium
----------------------------------------

Passing the parameter `?mode=dev` to an example will load the debug version of
Cesium instead of the minified one. This is helpful when something breaks inside
Cesium. In distribution mode, an unminified version of OpenLayers and Ol-Cesium is
also loaded.

Limitations
-----------

OpenLayers unmanaged layers are not discoverable and as a consequence not
supported. Plain layers should be used instead or the synchronization managed
manually. See https://github.com/openlayers/ol-cesium/issues/350.

Release process
---------------

See [RELEASE.md](https://github.com/openlayers/ol-cesium/blob/master/RELEASE.md).
