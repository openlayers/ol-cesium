const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');


const babelPresets = [['env', {
  'targets': {
    'browsers': ['last 2 versions', 'Firefox ESR', 'ie 11'],
  },
  'modules': false,
  'loose': true,
}]];

const olRule = {
  test: /openlayers\/src\/.*\.js$/,
  use: {
    loader: 'babel-loader',
    options: {
      babelrc: false,
      presets: babelPresets,
    }
  }
};

const olcsRule = {
  test: /olcs\/.*\.js$/,
  use: {
    loader: 'babel-loader',
    options: {
      babelrc: false,
      presets: babelPresets,
    }
  }
};

const cssRule = {
  test: /\.css$/,
  use: ExtractTextPlugin.extract({
    use: 'css-loader'
  })
};

const htmlRule = {
  test: /\.html$/,
  use: [{
    loader: 'html-loader',
    options: {
      minimize: false
    }
  }]
};

const iconRule = {
  test: /\.(png|svg)$/,
  use: {
    loader: 'url-loader'
  }
};

const config = {
  context: path.resolve(__dirname, '../'),
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, '../dist/')
  },
  module: {
    rules: [
      olRule,
      olcsRule,
      cssRule,
      htmlRule,
      iconRule
    ]
  },
  plugins: [
    new ExtractTextPlugin('[name].css')
  ],
  resolve: {
    modules: [
      '../node_modules'
    ],
    mainFields: ['jsnext:main', 'main'],
    alias: {
      'olcs': path.resolve(__dirname, '../src/olcs'),
      'goog': path.resolve(__dirname, '../src/goog'),
      'ol/ol.css': 'openlayers/css/ol.css',
      'ol': 'openlayers/src/ol'
    }
  }
};

module.exports = {
  config,
};
