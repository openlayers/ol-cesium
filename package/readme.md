# olcs

OL-Cesium as ES2015 modules.

## Usage

Add the `olcs` (and `ol`) package as a dependency to your project.

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
