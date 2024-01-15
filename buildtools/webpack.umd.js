import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nodeEnv = process.env['NODE_ENV'] || 'development';
const filename = nodeEnv === 'development' ? 'olcesium-debug.umd.js' : 'olcesium.umd.js';
export default {
  entry: './src/olcs.ts',
  output: {
    library: 'olcs',
    filename,
    path: path.resolve(__dirname, '../dist/'),
    libraryTarget: 'umd'
  },
  externals: [
    /^ol\/.+$/
  ]
};
