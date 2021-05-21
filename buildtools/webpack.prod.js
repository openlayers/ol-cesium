const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  output: {
    filename: '[name].[chunkhash:20].js'
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          sourceMap: true,
          ecma: 5,
          compress: {
            drop_console: true,
            drop_debugger: true,
          }
        },
        parallel: true,
      })
    ]
  }
};
