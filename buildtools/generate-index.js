import {readFileSync, writeFileSync} from 'fs';
import {marked} from 'marked';

const readme = readFileSync('README.md', 'utf-8');
const content = await marked(readme);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>OL-Cesium – OpenLayers Cesium integration library</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.5.1/github-markdown-light.min.css">
  <style>
    body {
      max-width: 980px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }
    .navigation {
      text-align: center;
      margin-bottom: 2rem;
    }
    .navigation a img {
      margin: 0 0.5rem;
    }
  </style>
</head>
<body>
  <div class="navigation">
    <a href="https://github.com/openlayers/ol-cesium/releases/"><img src="images/download-button.png" alt="Download release"></a>
    <a href="examples/"><img src="images/examples-button.png" alt="Browse examples"></a>
    <a href="apidoc/"><img src="images/apidoc-button.png" alt="View API docs"></a>
  </div>
  <article class="markdown-body">
    ${content}
  </article>
</body>
</html>
`;

writeFileSync('dist/index.html', html);
console.log('Generated dist/index.html');
