# olcs

OL-Cesium as ES2015 modules.

## Requirement

At this stage (beta), you need a specific version of OpenLayers:
```
devDependencies:
    "openlayers": "https://api.github.com/repos/openlayers/openlayers/tarball/bfae19c7e138533ad0c1a071d8886d55aac9bd35",
```

It might also work with OpenLayers master, which will be soon released as OL5.

## Usage

Add the `olcs` package as a dependency to your project.

    npm install olcs --save

Import just what you need for your application:

```js
import Map from 'ol/map';
import View from 'ol/view';
import TileLayer from 'ol/layer/tile';
import XYZ from 'ol/source/xyz';

import OLCesium from 'olcs/OLCesium';

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new XYZ({
        url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      })
    })
  ],
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

new OLCesium({map});

```

Create an alias to the `goog` directory. With webpack:

```
resolve: {
  alias: {
    'goog': path_to_goog,
    'ol': path_to_openlayers_es6
  }
}
```
