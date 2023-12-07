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
  indexJsContent = indexJsContent.replace('OLCS_ION_TOKEN', `'${OLCS_ION_TOKEN}'`);

  const additionalJsFiles = {};

  for (const filePath of filesPathes) {
    const responseFile = await fetch(filePath);
    const txtDataFile = await responseFile.text();

    additionalJsFiles[filePath.replace('./', '')] = {content: txtDataFile};
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
  <title>Ol-Cesium example</title>
  <meta charset="UTF-8" />
  <link rel="stylesheet" href="node_modules/ol/ol.css">  
  <script type="text/javascript" src="node_modules/cesium/Build/Cesium/Cesium.js"></script>
  </head>
  <body>
  ${indexHtmlContent}
  </body>
  <script type="module" src="/index.js"></script>
</html>`;
  const parameters = {
    files: {
      'package.json': {
        content: {
          'source': 'index.html',
          'scripts': {
            "start": "vite",
            "build": "vite build"
          },
          "devDependencies": {            
            "vite": "^3.2.3",
            "typescript": "latest"
          },
          "dependencies": {
            "olcs": "^2.15.2",
            "proj4": "2.9.0",
            "cesium": "1.110",
            "ol": "8.1.0"
          }
        },
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
