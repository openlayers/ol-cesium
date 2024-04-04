import {OLCS_ION_TOKEN} from './_common.js';

function compress(json) {
  return window.LZString.compressToBase64(JSON.stringify(json))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
}

export async function initCodeSandbox(indexJsPath, ...filesPathes) {
  const response = await fetch(indexJsPath);
  const txtData = await response.text();
  let indexJsContent = txtData.split('//##REMOVE##')[0];
  
  indexJsContent = indexJsContent.replaceAll(/(olcs\/.*?).ts('?;?)/ig, '$1.js$2');
  indexJsContent = indexJsContent.replace('import {OLCS_ION_TOKEN} from \'./_common.js\';', '');
  indexJsContent = indexJsContent.replace('//##OLCS_ION_TOKEN##', `Cesium.Ion.defaultAccessToken = '${OLCS_ION_TOKEN}'`);

  const additionalJsFiles = {};

  for (const filePath of filesPathes) {
    const responseFile = await fetch(filePath);
    const txtDataFile = await responseFile.text();

    additionalJsFiles[filePath.replace('./', '').replace('rawjs', '')] = {content: txtDataFile};
  }

  initCodeSandboxButton({indexJsContent, additionalJsFiles});
}

function initCodeSandboxButton(options) {
  const {indexJsContent, additionalJsFiles} = options;
  let indexHtmlContent = '';
  const button = document.getElementById('sandbox-button');
  const form = document.querySelector('#sandbox-form');

  if (!button || !form) {
    return;
  }

  const divExampleCodeSource = document.createElement('div');
  divExampleCodeSource.innerHTML = document.getElementById('example-html-source').innerHTML;
  divExampleCodeSource.querySelectorAll('.clear-map-sandbox').forEach(map => map.innerHTML = '');
  indexHtmlContent = divExampleCodeSource.innerHTML;


  const indexHtml = `
<!DOCTYPE html>
<html>
  <head>
  <title>Ol-Cesium example in sandbox</title>
  <meta charset="UTF-8" />
  <link rel="stylesheet" href="node_modules/ol/ol.css">
  <script src="https://cesium.com/downloads/cesiumjs/releases/1.116/Build/Cesium/Cesium.js"></script>
  </head>
  <body>
  ${indexHtmlContent}
  </body>
  <script type="module" src="/index.js"></script>
</html>`;
  const parameters = {
    template: 'parcel',
    files: {
      'package.json': {
        content: {
          'source': 'index.html',
          'main': 'index.html',
          'scripts': {
            "start": "vite",
          },
          "devDependencies": {
            "vite": "^3.2.3",
            "@babel/core": "^7.24.4",
            "@babel/plugin-proposal-class-properties": "^7.18.6"
          },
          "dependencies": {
            "olcs": "latest",
            "proj4": "2.9.0",
            "cesium": "1.108",
            "ol": "8.1.0"
          }
        },
      },
      '.babelrc': {
        content: '{ "plugins": ["@babel/plugin-proposal-class-properties"] }'
      },
      'data/geojson/countries.geojson': {
        "isBinary": true,
        content: "https://openlayers.org/ol-cesium/examples/data/geojson/countries.geojson"
      },
      'data/geojson/buildings.geojson': {
        "isBinary": true,
        content: "https://openlayers.org/ol-cesium/examples/data/geojson/buildings.geojson"
      },
      'data/icon.png': {
        "isBinary": true,
        content: "https://openlayers.org/ol-cesium/examples/data/icon.png"
      },
      'index.js': {
        content: indexJsContent,
      },
      'index.html': {
        content: indexHtml
      },
      ...additionalJsFiles
    }
  };

  button.onclick = function(event) {
    event.preventDefault();
    form.parameters.value = compress(parameters);
    form.submit();
  };
}


// dans npm prepare : extraire les versions à utiliser et faire un fichier json avec ces versions
// Ce fichier json doit etre lu, faire un fetch de ce fichier
// ce fichier ne peut pas etre commit
// à rajouter dans gitinore