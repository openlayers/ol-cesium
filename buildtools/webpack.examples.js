import path from 'path';
import fs from 'fs';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import {fileURLToPath} from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const plugins = [];
const entry = {};


const exampleFilenamePrefix = process.env.DEV_SERVER ? 'examples/' : '';

const splitter = /(.*)\.html/;
const htmls = fs.readdirSync('./examples', {withFileTypes: true}).filter(item => !item.isDirectory()).map(item => item.name).filter(n => n.endsWith('.html'));
for (const filename of htmls) {
  const matches = filename.match(splitter);
  const name = matches[1];
  const jsName = `./examples/${name}.js`;
  if (!fs.existsSync(jsName)) {
    continue;
  }
  entry[name] = [
    jsName
  ];

  plugins.push(
      new HtmlWebpackPlugin({
        template: `examples/${name}.html`,
        filename: `${exampleFilenamePrefix + name}.html`,
        chunks: ['commons', name],
      })
  );
}

// move data folder
plugins.push(new CopyWebpackPlugin({
  patterns: [
    {
      from: 'examples/data',
      to: 'data/',
    },
  ],
}));

export default Object.assign({
  entry,
  optimization: {
    splitChunks: {
      chunks: 'all',
      name: 'commons',
    }
  },
  plugins,
}, !process.env.DEV_SERVER ? {
  output: {
    path: path.resolve(__dirname, '../dist/examples/'),
  },
} : {});
