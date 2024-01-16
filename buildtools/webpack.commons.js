import path from 'path';
import { fileURLToPath } from 'url';

const babelPresets = [
  ['@babel/preset-env', {
    'targets': {
      'browsers': ['safari 13'],
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
  resolve: {
    fullySpecified: false
  },
  use: {
    loader: 'babel-loader',
    options: {
      babelrc: false,
      presets: babelPresets,
    }
  }
};

const ruleTS = {
  test: /\.ts$/,
  resolve: {
    fullySpecified: false
  },
  use: {
    loader: 'babel-loader',
    options: {
      babelrc: false,
      presets: [...babelPresets, '@babel/preset-typescript'],
      plugins: [
        ['@babel/plugin-syntax-dynamic-import'],
        ['@babel/plugin-transform-typescript', {allowDeclareFields: true}],
      ]
    }
  },
  exclude: /node_modules/,
};


const iconRule = {
  test: /\.(png|svg)$/,
  use: {
    loader: 'url-loader'
  }
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = {
  context: path.resolve(__dirname, '../'),
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, '../dist/')
  },
  module: {
    rules: [
      olRule,
      ruleTS,
      olcsRule,
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
    },
    fallback: {
      http: false,
      https: false,
      zlib: false,
      url: false,
    },
    extensions: ['.ts', '.js']
  }
};

export default {
  config,
};
