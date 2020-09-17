const path = require('path');
const fs = require('fs');
const glob = require('fast-glob');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const plugins = [];
const entry = {};

const exampleFilenamePrefix = process.env.DEV_SERVER ? 'examples/' : '';

const splitter = /.*\/(.*)\.html/;
for (const filename of glob.sync('examples/*.html', {onlyFiles: true})) {
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
        chunksSortMode: 'manual',
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

module.exports = {
  entry,
  optimization: {
    splitChunks: {
      chunks: 'all',
      name: 'commons',
    }
  },
  plugins,
};

if (!process.env.DEV_SERVER) {
  Object.assign(module.exports, {
    output: {
      path: path.resolve(__dirname, '../dist/examples/'),
    },
  });
}
