// eslint-disable-next-line
import {merge} from 'webpack-merge';
import commons from './buildtools/webpack.commons.js';
import examplesConfig from './buildtools/webpack.examples.js';
import libraryConfig from './buildtools/webpack.library.js';


let config = commons.config;
switch (process.env.TARGET) {
  case 'examples':
    config = merge(config, examplesConfig);
    break;
  case 'library':
    config = merge(config, libraryConfig);
    break;
  default:
    console.log(`The 'TARGET' environement variable is set to an invalid value: ${process.env.TARGET}. Using library mode.`);
    config = merge(config, libraryConfig);
}

export default config;
