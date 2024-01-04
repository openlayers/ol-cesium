import path from 'path';
import {fileURLToPath} from 'url';

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
  mode: 'development',
  context: path.resolve(__dirname, '../'),
  devtool: 'eval-source-map',
  output: {
    filename: '[name].js',
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
    fullySpecified: false,
    modules: [
      // This fallback is useful when npm-linking OpenLayers
      '../node_modules', '../node_modules/ol/src'
    ],
    alias: {
      /* FIXME?
      We articially map the olcs imports from the examples to the typescript source code
      This has 2 advantages:
      - workaround the requirement to have '.js' suffixes in newer node/webpack versions;
      - have the examples update automatically when the source code change (otherwise we would need a tsc pass).
      But also drawbacks:
      - we are not testing the real package we publish
*/
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
