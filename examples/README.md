# Examples

The examples' HTML pages include four script tags: one for ol, one for Cesium,
one for the example itself, and one whose `href` is `/@loader`. The latter is
managed by `closure-util`; it loads all the `ol-cesium` code (sorted in
dependency order).
