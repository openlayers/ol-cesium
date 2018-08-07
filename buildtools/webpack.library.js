const path = require('path');

const olRegExp = /^ol\/.+$/;
const slashReplacerRegExp = new RegExp('/', 'g');
const extensionReplacerRegExp = new RegExp('\\.js$');

module.exports = {
  entry: './src/index.library.js',
  output: {
    library: 'olcs_unused_var',
    filename: 'olcesium.js',
    path: path.resolve(__dirname, '../dist/'),
  },
  externals: [
    function(context, request, callback) {
      if (olRegExp.test(request)) {
        const replacedWith = request.replace(extensionReplacerRegExp, '').replace(slashReplacerRegExp, '.');
        return callback(null, replacedWith);
      }
      callback();
    }
  ]
};
