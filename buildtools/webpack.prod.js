const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

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
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true
          }
        },
        cache: true,
        parallel: true,
        sourceMap: true,
      })
    ]
  }
};
