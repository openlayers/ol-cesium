const path = require('path');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  mode: 'production',
  output: {
    filename: '[name].[chunkhash:20].js'
  },
  plugins: [
    new webpack.optimize.ModuleConcatenationPlugin(),
  ],
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
