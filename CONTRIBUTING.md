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
The examples use a compiled version of OLCesium. If you want to use the source code directly you can change the import to '../src/olcs.ts'

```typescript
import OLCesium from 'olcs'; // or '../src/olcs.ts' for source code
```

### The `check` target

```bash
npm run check
```

Run this before every commit. It will catch many problems quickly.

### Address a single issue or add a single item of functionality

Please submit separate pull requests for separate issues.  This allows each to
be reviewed on its own merits.
