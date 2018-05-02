const path = require('path');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')


const resourcesRule = {
  test: /\.jpeg$/,
  use: {
    loader: 'url-loader',
    options: {
      limit: 10000,
      name: 'build/[name].[hash:20].[ext]'
    }
  }
};

const fontRule = {
  test: /\.(eot|ttf|woff|woff2)$/,
  use: {
    loader: 'file-loader',
    options: {
      name: 'build/[name].[hash:20].[ext]'
    }
  }
};

module.exports = {
  mode: 'production',
  output: {
    filename: '[name].[chunkhash:20].js'
  },
  plugins: [
    new webpack.optimize.ModuleConcatenationPlugin(),
  ],
  module: {
    rules: [
      resourcesRule,
      fontRule,
    ]
  },
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
        sourceMap: true,
      })
    ]
  },
  resolve: {
    alias: {
      'goog/asserts': path.resolve(__dirname, '../src/goog.asserts.prod.js'),
      'goog/asserts.js': path.resolve(__dirname, '../src/goog.asserts.prod.js'),
    }
  },
};
