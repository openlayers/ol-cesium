const path = require('path');

module.exports = {
  entry: './src/index.library.js',
  output: {
    library: 'olcs',
    filename: 'olcesium.js',
    path: path.resolve(__dirname, '../dist/'),
    libraryTarget: 'umd'
  },
  externals: [
    /^ol\/.+$/
  ]
};
