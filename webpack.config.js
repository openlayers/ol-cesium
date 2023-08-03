// eslint-disable-next-line
import {merge} from 'webpack-merge';
import commons from './buildtools/webpack.commons.js';
import devConfig from './buildtools/webpack.dev.js';
import prodConfig from './buildtools/webpack.prod.js';
import examplesConfig from './buildtools/webpack.examples.js';
import libraryConfig from './buildtools/webpack.library.js';
import umdConfig from './buildtools/webpack.umd.js';


let config = commons.config;

const nodeEnv = process.env['NODE_ENV'] || 'development';
switch (nodeEnv) {
  case 'development':
    config = merge(config, devConfig);
    break;
  case 'production':
    config = merge(config, prodConfig);
    break;
  default:
    console.log(`The 'NODE_ENV' environement variable is set to an invalid value: ${process.env.NODE_ENV}.`);
    process.exit(2);
}

switch (process.env.TARGET) {
  case 'examples':
    config = merge(config, examplesConfig);
    break;
  case 'library':
    config = merge(config, libraryConfig);
    break;
  case 'umd':
    config = merge(config, umdConfig);
    break;
  default:
    console.log(`The 'TARGET' environement variable is set to an invalid value: ${process.env.TARGET}. Using library mode.`);
    config = merge(config, libraryConfig);
}

export default config;
