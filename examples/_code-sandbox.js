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

  const additionalJsFiles = {};
  const resourcesFiles = filesPathes
      .filter(path => path.indexOf('data/') === 0)
      // eslint-disable-next-line arrow-body-style
      .map(path => ({
        [path]: {
          'isBinary': true,
          content: `https://openlayers.org/ol-cesium/examples/${path}`
        }
      }));
  const jsFiles = filesPathes.filter(path => path.indexOf('data/') !== 0);

  for (const filePath of jsFiles) {
    const responseFile = await fetch(filePath);
    const txtDataFile = await responseFile.text();

    additionalJsFiles[filePath.replace('./', '').replace('rawjs', '')] = {content: txtDataFile};
  }

  initCodeSandboxButton({indexJsContent, additionalJsFiles, resourcesFiles});
}

function initCodeSandboxButton(options) {
  const {indexJsContent, additionalJsFiles, resourcesFiles} = options;

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
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">
    <script src="https://cesium.com/downloads/cesiumjs/releases/1.9/Build/Cesium/Cesium.js"></script>
    <style>
      .ol-popup {
        position: absolute;
        background-color: white;
        -webkit-filter: drop-shadow(0 1px 4px rgba(0,0,0,0.2));
        filter: drop-shadow(0 1px 4px rgba(0,0,0,0.2));
        padding: 15px;
        border-radius: 10px;
        border: 1px solid #cccccc;
        bottom: 12px;
        left: -50px;
        min-width: 280px;
      }
      .ol-popup:after, .ol-popup:before {
        top: 100%;
        border: solid transparent;
        content: " ";
        height: 0;
        width: 0;
        position: absolute;
        pointer-events: none;
      }
      .ol-popup:after {
        border-top-color: white;
        border-width: 10px;
        left: 48px;
        margin-left: -10px;
      }
      .ol-popup:before {
        border-top-color: #cccccc;
        border-width: 11px;
        left: 48px;
        margin-left: -11px;
      }
      .ol-popup-closer {
        text-decoration: none;
        position: absolute;
        top: 2px;
        right: 8px;
      }
      .ol-popup-closer:after {
        content: "✖";
      }
      .popover-content {
        min-width: 180px;
      }
      code {
        padding: 2px 4px;
        font-size: 90%;
        color: #c7254e;
        background-color: #f9f2f4;
        border-radius: 4px;
      }
    </style>
  </head>
  <body>
  ${indexHtmlContent}
  </body>
  <script type="module" src="/index.js"></script>  
  <script src="https://code.jquery.com/jquery-2.2.3.min.js"></script>
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js"></script>
</html>`;
  const parameters = {
    template: 'parcel',
    files: {
      'package.json': {
        content: {
          'source': 'index.html',
          'main': 'index.html',
          'scripts': {
            'build': 'vite build',
            'start': 'npm run build && serve dist',
          },
          'devDependencies': {
            'serve': '14.2.3',
            'vite': '^3.2.3',
            '@babel/core': '^7.24.4',
            '@babel/plugin-proposal-class-properties': '^7.18.6'
          },
          'dependencies': {
            'olcs': 'latest',
            'proj4': '2.11.0',
            'cesium': '1.90.0',
            'ol': '10.1.0'
          }
        },
      },
      '.babelrc': {
        content: '{ "plugins": ["@babel/plugin-proposal-class-properties"] }'
      },
      'index.js': {
        content: indexJsContent,
      },
      'index.html': {
        content: indexHtml
      },
      ...resourcesFiles.reduce((acc, curr) => {
        const key = Object.keys(curr)[0]; // Récupérer la clé de l'objet
        acc[key] = curr[key]; // Ajouter la propriété à l'objet accumulé
        return acc;
      }, {}),
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
