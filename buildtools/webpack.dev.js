const webpack = require('webpack');

const loaderOptionsPlugin = new webpack.LoaderOptionsPlugin({
  debug: false
});


module.exports = {
  mode: 'development',
  output: {
    filename: '[name].js'
  },
};
