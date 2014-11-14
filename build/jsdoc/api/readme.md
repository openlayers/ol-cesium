# API Documentation

This directory contains configuration (`conf.json`), static content (`index.md`), template (`template/`) and plugins (`plugins/`) for the [JSDoc3](http://usejsdoc.org/) API generator.

## Documenting the source code

JSDoc annotations are used for metadata used by the compiler, for defining the user facing API, and for user documentation.

In the simplest case, a JSDoc block can look like this:
```js
/**
 * Enables/disables the Cesium.
 * This modifies the visibility style of the container element.
 * @param {boolean=} opt_enable
 * @api
 */
olcs.OLCesium.prototype.setEnabled = function(opt_enable) {
  // ...
};
```
The first two lines are text for the user documentation. This can be long, and it can contain Markdown.

The second line tells the Closure compiler the type of the argument.

The third line (`@api`) marks the method as part of the api and thus exportable. The stability can be added as value, e.g. `@api stable`. Without such an api annotation, the method will not be documented in the generated API documentation. Symbols without an api annotation will also not be exportable (unless they are explicitly exported with a `goog.exportProperty` call).
