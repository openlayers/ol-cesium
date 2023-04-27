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
  <script src="https://cesium.com/downloads/cesiumjs/releases/1.104/Build/Cesium/Cesium.js"></script>
  </head>
  <body>
  ${indexHtmlContent}
  <script src="/index.js"></script>
  </body>
</html>`;
  const parameters = {
    template: 'parcel',
    files: {
      'package.json': {
        content: {
          'main': 'index.html',
          'scripts': {
            'start': 'parcel index.html --open',
            'build': 'parcel build index.html'
          },
          'devDependencies': {
            '@babel/core': '7.2.0',
            'parcel-bundler': '^1.6.1',
          },
          'dependencies': {
            'ol': 'latest',
            'olcs': '^2.13.1',
            'proj4': '2.9.0',
          }
        },
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
