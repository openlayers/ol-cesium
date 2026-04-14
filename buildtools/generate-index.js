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
      display: flex;
      justify-content: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .navigation a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background-size: cover;
      background-position: center;
      border-radius: 6px;
      width: 200px;
      height: 50px;
      color: #fff;
      text-decoration: none;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      font-size: 1.1rem;
      font-weight: 600;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
    }
    .navigation a:hover {
      opacity: 0.9;
    }
    .navigation a.btn-download { background-image: url('images/download-button.png'); }
    .navigation a.btn-examples { background-image: url('images/examples-button.png'); }
    .navigation a.btn-apidoc { background-image: url('images/apidoc-button.png'); }
  </style>
</head>
<body>
  <div class="navigation">
    <a class="btn-download" href="https://github.com/openlayers/ol-cesium/releases/">Download</a>
    <a class="btn-examples" href="examples/">Examples</a>
    <a class="btn-apidoc" href="doc/">API Doc</a>
  </div>
  <article class="markdown-body">
    ${content}
  </article>
</body>
</html>
`;

writeFileSync('dist/index.html', html);
console.log('Generated dist/index.html');
