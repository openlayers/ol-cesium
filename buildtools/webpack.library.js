const path = require('path');

const olRegExp = /^ol\/.+$/;
const slashReplacerRegExp = new RegExp('/', 'g');
const extensionReplacerRegExp = new RegExp('\\.js$');

const nodeEnv = process.env['NODE_ENV'] || 'development';
const filename = nodeEnv === 'development' ? 'olcesium-debug.js' : 'olcesium.js';
module.exports = {
  entry: './src/index.library.js',
  output: {
    library: 'olcs_unused_var',
    filename,
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
