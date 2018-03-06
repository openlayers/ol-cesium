#!/bin/sh

rm -rf .build/package
cp -r package .build
cp -r src/olcs/* .build/package
cp css/olcs.css .build/package
node node_modules/googshift/filename-case-from-module.js .build/package '*.js'
node_modules/.bin/jscodeshift --transform node_modules/googshift/transforms/goog_provide_to_goog_module.js .build/package
JSCS_ARGS="--non-default-import=olBase,ol,ol/size,ol/string,ol/has,ol/coordinate,ol/events,ol/events/condition,ol/xml,ol/proj,ol/proj/proj4,ol/dom,ol/array,ol/math,ol/extent,ol/easing,ol/color,ol/obj,ol/uri,ol/functions,ol/sphere,ol/format/Feature,ol/format/filter,ol/interaction --package=ol"
node_modules/.bin/jscodeshift --transform node_modules/googshift/transforms/goog_module_to_es6_module.js $JSCS_ARGS .build/package
node_modules/.bin/eslint --fix .build/package

