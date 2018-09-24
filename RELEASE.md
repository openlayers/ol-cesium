# Howto create a new release

## Frequency
Each month, a new release is published in accordance to https://github.com/openlayers/ol-cesium/wiki/Versioning-policy.

## Steps
- Update OpenLayers and Cesium dependencies to latest stable version
- Check the Cesium CHANGES.md for API changes and update the Cesium externs
- Update the version number in `package.json`
- Compile from scratch and run all tests:
  - `make dist serve`
  - check examples both in development and hosted modes
- Run buildtools/release.sh and follow instructions
