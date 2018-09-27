const path = require('path');


const babelPresets = [['@babel/preset-env', {
  'targets': {
    'browsers': ['last 2 versions', 'Firefox ESR', 'ie 11'],
  },
  'modules': false,
  'loose': true,
}]];

const olRule = {
  test: /ol\/.*\.js$/,
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
      htmlRule,
      iconRule
    ]
  },
  plugins: [
  ],
  resolve: {
    modules: [
      '../node_modules', '../node_modules/ol/src'
    ],
    mainFields: ['jsnext:main', 'main'],
    alias: {
      'olcs': path.resolve(__dirname, '../src/olcs'),
    }
  }
};

module.exports = {
  config,
};
