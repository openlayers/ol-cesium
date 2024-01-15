import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const olRegExp = /^ol\/.+$/;
const slashReplacerRegExp = new RegExp('/', 'g');
const extensionReplacerRegExp = new RegExp('\\.js$');

const nodeEnv = process.env['NODE_ENV'] || 'development';
const filename = nodeEnv === 'development' ? 'olcesium-debug.js' : 'olcesium.js';
export default {
  entry: './src/olcs.ts',
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
