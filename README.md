OL3-Cesium
==========

OpenLayers - Cesium integration library. Create your map using [OpenLayers 3](http://openlayers.org/), and visualize it on a globe with [Cesium](http://cesiumjs.org).

Getting started
---------------

To obtain OL3-Cesium, either download a release from https://github.com/openlayers/ol3-cesium/releases, or clone the repository and build it yourself (see below).

Applications using this OL3-Cesium distribution also need to load OpenLayers and Cesium resources (all included in the distribution):
```html
<link rel="stylesheet" href="ol3/css/ol.css" type="text/css">
<script src="ol3/ol.js"></script>
<script src="Cesium/Cesium.js"></script>
<script src="ol3cesium.js"></script>
```

An OpenLayers map can be switched to a 3d globe view by running the code below after the map has been created:
```js
var ol3d = new olcs.OLCesium(map); // map is the ol.Map instance
ol3d.setEnabled(true);
```
The above will use a flat surface all around the globe. To use terrain, simply add a terrain provider (can be your own, but in the snippet below it's one that ships with Cesium):
```js
var ol3d = new olcs.OLCesium(map); // map is the ol.Map instance
var scene = ol3d.getCesiumScene();
var terrainProvider = new Cesium.CesiumTerrainProvider({
  url: '//cesiumjs.org/stk-terrain/tilesets/world/tiles'
});
scene.terrainProvider = terrainProvider;
ol3d.setEnabled(true);
```

Building the library
--------------------

Requirements for building OL3-Cesium:

* [GNU Make](http://www.gnu.org/software/make/)
* [Node.js](http://nodejs.org/)
* [Python](http://python.org/)
* [Ant](http://ant.apache.org/)

To get started, clone the [OL3-Cesium repository](https://github.com/openlayers/ol3-cesium), and simply invoke

    $ make dist

from the root of the repository. You will then be able to use `dist/ol3cesium.js` for your applications.

Running the examples in debug mode
----------------------------------

This is useful for contributing to OL3-Cesium, because it loads the
source files instead of a minified build:

    $ make serve

will make the distribution examples available at http://localhost:3000/
