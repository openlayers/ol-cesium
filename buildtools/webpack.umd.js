const path = require('path');

const nodeEnv = process.env['NODE_ENV'] || 'development';
const filename = nodeEnv === 'development' ? 'olcesium-debug.umd.js' : 'olcesium.umd.js';
module.exports = {
  entry: './src/index.library.js',
  output: {
    library: 'olcs',
    filename,
    path: path.resolve(__dirname, '../dist/'),
    libraryTarget: 'umd'
  },
  externals: [
    /^ol\/.+$/
  ]
};
