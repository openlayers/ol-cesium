# Contributing to Ol-Cesium

Thanks for your interest in contributing to Ol-Cesium.

## Contributor License Agreement

Your contribution will be under our [license](https://raw.githubusercontent.com/openlayers/ol-cesium/master/LICENSE)
as per [GitHub's terms of service](https://help.github.com/articles/github-terms-of-service/#6-contributions-under-repository-license).

## Setting up development environment

You will obviously start by
[forking](https://github.com/openlayers/ol-cesium/fork) the ol-cesium repository.

```bash
npm i
npm start
browse http://localhost:1234
```

### OLCesium import

The examples use a compiled version of OLCesium. If you want to use the source code directly you can define an alias.
See https://en.parceljs.org/module_resolution.html#aliases

### The `check` target

```bash
npm run check
```

Run this before every commit. It will catch many problems quickly.

### Address a single issue or add a single item of functionality

Please submit separate pull requests for separate issues.  This allows each to
be reviewed on its own merits.

### Typescript imports

Write typescript files with the ".ts" extension.
But import these files with a ".js" extension.
This is a useful strangeness of Typescript which, in the end, produces correct transpiled code.
