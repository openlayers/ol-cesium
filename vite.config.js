import {createReadStream, readdirSync} from 'fs';
import {resolve} from 'path';
import {defineConfig} from 'vite';

function cesiumWorkerPlugin() {
  return {
    name: 'cesium-worker',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Rewrite /examples/node_modules/ to /node_modules/ so that
        // inject_ol_cesium.js works in dev mode
        if (req.url.startsWith('/examples/node_modules/')) {
          req.url = req.url.replace('/examples/node_modules/', '/node_modules/');
        }
        // Serve Cesium Build files without Vite transforms (workers use IIFE)
        if (req.url.startsWith('/node_modules/cesium/Build/')) {
          const filePath = resolve(
            __dirname,
            req.url.slice(1).split('?')[0],
          );
          res.setHeader('Content-Type', 'application/javascript');
          createReadStream(filePath).pipe(res);
          return;
        }
        next();
      });
    },
  };
}

const input = {};
for (const file of readdirSync('examples')) {
  if (file.endsWith('.html')) {
    input[file.replace('.html', '')] = resolve(__dirname, 'examples', file);
  }
}

export default defineConfig({
  plugins: [cesiumWorkerPlugin()],
  resolve: {
    alias: {
      olcs: resolve(__dirname, 'lib/olcs'),
    },
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    rollupOptions: {
      input,
    },
  },
});
