<!-- Begin Navigation buttons -->
<!-- Copy this block before clicking "Load README.md" above, and paste it back here afterwards -->
[![Download release](https://cdn.rawgit.com/ahocevar/a95de14fc607dcecce5a/raw/8dab32630b9c76526caa4ac152a339384ef0efd9/download-button.png)](https://github.com/openlayers/ol-cesium/releases/) [![Browse examples](https://cdn.rawgit.com/ahocevar/a95de14fc607dcecce5a/raw/95ff79a24b0ce611f99d46b113a215e6cb75b05a/examples-button.png)](http://openlayers.org/ol-cesium/examples/) [![View API docs](https://cdn.rawgit.com/ahocevar/a95de14fc607dcecce5a/raw/c027bfb4f33b163600ff55c7b7ecd4647fcbfc42/docs-button.png)](http://openlayers.org/ol-cesium/apidoc)

<!-- End Navigation buttons -->
# OpenLayers - Cesium library

OLCS is an opensource JS library for making [OpenLayers](https://openlayers.org/) and [CesiumJS](https://cesium.com/platform/cesiumjs/) works together, in the same application.
It addresses several use-cases:

- [Adding 3D to an existing OpenLayers map](#Adding 3D to an existing OpenLayers map)
- [Extending CesiumJS with new capabilities](#Extending CesiumJS with new capabilities)
- [Cherry-picking the pieces you need](#Cherry-picking the pieces you need)

See [live examples](https://openlayers.org/ol-cesium/examples/).

The npm package is called [olcs](https://www.npmjs.com/package/olcs).
Note that CesiumJS is accessed through the global `window.Cesium` object.

## Features

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

## Adding 3D to an existing OpenLayers map

```js
// Create an OpenLayers map or start from an existing one.
import Map from 'ol/Map.js';
const ol2dMap = new Map({
    ...
});
ol2dMap.addLayer(....)
```

```js
// Pass the map to the OL-Cesium constructor
// OL-Cesium will create and synchronize a 3D CesiumJs globe from your layers and data.
import OLCesium from 'olcs';
const ol3d = new OLCesium({map: ol2dMap});
```

```js
ol3d.setEnabled(true); // switch to 3D - show the globe
ol3d.setEnabled(true); // switch to 2D - show the map
```

Build with your prefered bundler.

You can use any version of CesiumJS: latest upstream, a fork...
Simply provide it as `window.Cesium` global:

```html
<script src="https://cesium.com/downloads/cesiumjs/releases/1.113/Build/Cesium/Cesium.js"></script>
```

## Extending CesiumJS with new capabilities

```js
// Start from a CesiumJS globe
const viewer = getYourCesiumJSViewer();

// Add OpenLayers imagery provider
import {OLImageryProvider} from 'olcs';
viewer.scene.imageryLayers.addImageryProvider(new OLImageryProvider(...));

// Add Mapbox MVT imagery provider (client side rendering)
import {MVTImageryProvider} from 'olcs';
viewer.scene.imageryLayers.addImageryProvider(new MVTImageryProvider(...));
```

This is a bit limited at the moment but idea would be to implement:

- client side reprojection;
- full client side MVT rendering;
- GeoTIFF rendering;
- ... any feature available in OpenLayers.

## Cherry-picking the pieces you need

Specific low level functionnalities can be cherry-picked from the library.
For example:

```js
// GoogleMap rotating effect
import {rotateAroundBottomCenter} from 'olcs';
rotateAroundBottomCenter(viewer.scene, someAngle);
```

```ts
// convert OpenLayers Vector Layer to CesiumJS primitives
import {FeatureConverter} from 'olcs';
const converter = new FeatureConverter(viewer.scene);
const featurePrimitiveMap: Record<number, PrimitiveCollection> = {};
const counterpart: VectorLayerCounterpart = this.converter.olVectorLayerToCesium(olLayer, view, featurePrimitiveMap);
const csPrimitives = counterpart.getRootPrimitive();
viewer.scene.primitives.add(csPrimitives);
```

```js
// Even more powerful, use a synchronizer
import {VectorSynchronizer} from 'olcs';
const synchronizer = new VectorSynchronizer(ol2dMtheap, viewer.scene);
```

If you think some low level features should be spotlited here, open an issue and let's discuss it.

## Configuration

Use properties to control specific aspects of OL-Cesium integration, see the [PROPERTIES.MD](https://github.com/openlayers/ol-cesium/blob/master/PROPERTIES.md).

Also, check the [api doc](https://openlayers.org/ol-cesium/apidoc/).

## Limitations due to OpenLayers

There are a few limitations due to decisions on

- OpenLayers unmanaged layers are not discoverable and as a consequence not
supported. Plain layers should be used instead of the synchronization managed
manually. See https://github.com/openlayers/ol-cesium/issues/350.

- OpenLayers interactions are not supported in 3d. See https://github.com/openlayers/ol-cesium/issues/655.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).
