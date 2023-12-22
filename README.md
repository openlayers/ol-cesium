OpenLayers - Cesium integration library. Create your map using [OpenLayers](https://openlayers.org/), and visualize it on a globe with [Cesium](https://cesium.com/platform/cesiumjs/).
See [live examples](https://openlayers.org/ol-cesium/examples/).


ES6 modules
-----------

Since version 2.0, the code is entirely based on ES6 modules and syntax.
It requires OpenLayers 6.x.
A convenient ES6 package `olcs` is available on npm.

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

For synchronization of maps in projections other than EPSG:4326 and EPSG:3857 you need 2 datasets, see the customProj example.

Integration in your application
-------------------------------

There are several ways to integrate OL-Cesium in your application.
In all cases OpenLayers and Cesium are peer-dependencies of OL-Cesium, your application need to depend on a compatible version of OpenLayers and of Cesium. Note that Cesium is accessed through the global `window.Cesium` object. OpenLayers is accessed through ES6 imports.

### As an ES6 library (recommended method)
```bash
npm i --save olcs
```

Then import the parts you need. Example:
```js
import OLCesium from 'olcs/OLCesium';
const ol3d = new OLCesium({map: ol2dMap}); // ol2dMap is the ol.Map instance
ol3d.setEnabled(true);
```

In addition, you need to expose the Cesium library as `window.Cesium`.
For this, simply add the Cesium script to your html:
```html
<script type="text/javascript" src="..your_path../Cesium.js"></script>
```

For Cesium integration with Webpack, see [ol-cesium-webpack-example](https://github.com/gberaudo/ol-cesium-webpack-example).

### As an old-fashioned independent library (need update)

- build the library in dist/olcs.js:
```bash
npm i --save olcs
npm run build-library
```

- get the CSS and JS from the full build at https://openlayers.org/download/

- use as follow:
```js
const ol3d = new olcs.OLCesium({map: ol2dMap}); // ol2dMap is the ol.Map instance
ol3d.setEnabled(true);
```

For the remaining steps, see the [old fashioned example](https://openlayers.org/ol-cesium/examples/oldfashioned.html).
Notably, you need the Cesium library.

### As an UMD library (Angular, ...)
```bash
npm i --save ol-cesium
```
The UMD-specific build is located here: `node_modules/ol-cesium/dist/olcesium.umd.js`


Then import the parts you need. Example:
```js
import OLCesium from 'ol-cesium';
const ol3d = new OLCesium({map: ol2dMap}); // ol2dMap is the ol.Map instance
ol3d.setEnabled(true);
```

In addition, you need to expose the Cesium library as `window.Cesium`.
For this, simply add the Cesium script to your html:
```html
<script type="text/javascript" src="..your_path../Cesium.js"></script>
```

Going further
-------------

See the [examples](https://openlayers.org/ol-cesium/examples/).

Use properties to control specific aspects of OL-Cesium integration, see the [PROPERTIES.MD](https://github.com/openlayers/ol-cesium/blob/master/PROPERTIES.md).

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

- OpenLayers unmanaged layers are not discoverable and as a consequence not
supported. Plain layers should be used instead of the synchronization managed
manually. See https://github.com/openlayers/ol-cesium/issues/350.

- OpenLayers interactions are not supported in 3d. See https://github.com/openlayers/ol-cesium/issues/655.

Release process
---------------

See [RELEASE.md](https://github.com/openlayers/ol-cesium/blob/master/RELEASE.md).
