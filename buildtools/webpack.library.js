const path = require('path');
const webpack = require('webpack');


module.exports = {
  entry: './src/index.library.js',
  output: {
    library: 'olcs',
    filename: 'olcs.js', // FIXME: the lib should be called olcs.js, why is it main.js?
    libraryTarget: 'umd'
  },
  externals: [
    /^ol\/.+$/
  ]
};

if (!process.env.DEV_SERVER) {
  Object.assign(module.exports, {
    output: {
      path: path.resolve(__dirname, '../dist/'),
    },
  });
}
