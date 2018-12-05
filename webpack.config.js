// eslint-disable-next-line import/no-unresolved
const webpackMerge = require('webpack-merge');
const commons = require('./buildtools/webpack.commons');

let config = commons.config;

const nodeEnv = process.env['NODE_ENV'] || 'development';
switch (nodeEnv) {
  case 'development':
    config = webpackMerge(config, require('./buildtools/webpack.dev.js'));
    break;
  case 'production':
    config = webpackMerge(config, require('./buildtools/webpack.prod.js'));
    break;
  default:
    console.log(`The 'NODE_ENV' environement variable is set to an invalid value: ${process.env.NODE_ENV}.`);
    process.exit(2);
}

switch (process.env.TARGET) {
  case 'examples':
    config = webpackMerge(config, require('./buildtools/webpack.examples.js'));
    break;
  case 'library':
    config = webpackMerge(config, require('./buildtools/webpack.library.js'));
    break;
  case 'umd':
    config = webpackMerge(config, require('./buildtools/webpack.umd.js'));
    break;
  default:
    console.log(`The 'TARGET' environement variable is set to an invalid value: ${process.env.TARGET}.`);
    process.exit(2);
}

module.exports = config;
