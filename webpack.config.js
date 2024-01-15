// eslint-disable-next-line
import {merge} from 'webpack-merge';
import commons from './buildtools/webpack.commons.js';
import examplesConfig from './buildtools/webpack.examples.js';


let config = commons.config;
config = merge(config, examplesConfig);

export default config;
