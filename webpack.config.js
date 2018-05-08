const webpackMerge = require('webpack-merge');
const commons = require('./buildtools/webpack.commons');

let config = commons.config;

const nodeEnv = process.env['NODE_ENV'] || 'development';
switch (nodeEnv) {
  case 'development':
    config = webpackMerge(config, require('./buildtools/webpack.dev'));
    break;
  case 'production':
    config = webpackMerge(config, require('./buildtools/webpack.prod'));
    break;
  default:
    console.log(`The 'NODE_ENV' environement variable is set to an invalide value: ${process.env.NODE_ENV}.`);
    process.exit(2);
}

switch (process.env.TARGET) {
  case 'examples':
    config = webpackMerge(config, require('./buildtools/webpack.examples'));
    break;
  case 'library':
    config = webpackMerge(config, require('./buildtools/webpack.library'));
    break;
  default:
    console.log(`The 'TARGET' environement variable is set to an invalide value: ${process.env.TARGET}.`);
    process.exit(2);
}

module.exports = config;
