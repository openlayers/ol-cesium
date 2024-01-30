# Howto create a new release

## Frequency
Each month, a new release is published in accordance to https://github.com/openlayers/ol-cesium/wiki/Versioning-policy.

## Steps
- Update OpenLayers and Cesium dependencies to latest stable version
- Check the Cesium CHANGES.md for API changes and update the Cesium externs
- Update the version number in `package.json`
- Compile from scratch and run all tests:
  - npm run lint
  - npm run typecheck
  - npm start; open http://localhost:3000/examples # test all examples (dev mode)
  - npm run build-examples; python3 -m http.server --directory dist 12345; open http://localhost:12345/examples # test all examples (built mode)
- Publish with:
  - npm version minor # or patch
  - npm pack
  - npm publish # this will publish package olcs (ol-cesium package is obsolete and not updated anymore)
  - git push --tags
