import fs from 'fs';
import path from 'path';

function handleFile(filePath) {
  if (filePath.endsWith('.d.ts')) {
    console.log('Skipping', filePath);
    return;
  }
  fs.readFile(filePath, 'utf-8', (error, content) => {
    if (error) {
      console.error('Error reading the file:', error);
      return;
    }
    const split = content.split('\n');
    let changed = false;
    const newSplit = split.map((line) => {
      if (!(line.startsWith('import') || line.startsWith('export')) || !line.endsWith(';') || line.endsWith(".js';") || line.includes("from 'cesium") || line === 'export default OLCesium;') {
        return line;
      }
      let newline = undefined;
      if (line.endsWith(".ts';")) {
        newline = line.replace(".ts';", ".js';");
      } else if (line.includes("from './") || line.includes("from '../")) {
        newline = line.replace("';", ".js';");
      } else {
        console.error('XX', filePath, line);
        throw new Error('pb', line);
      }
      console.log('changed:', line, '->', newline);
      changed = true;
      return newline;
    });
    if (changed) {
      fs.writeFileSync(filePath, newSplit.join('\n'), {
        encoding: 'utf-8'
      });
      console.log('wrote', filePath);
    }
  });
}

function listFilesRecursively(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);

    const stat = fs.statSync(filePath);

    if (stat.isFile()) {
      handleFile(filePath);
    } else if (stat.isDirectory()) {
      listFilesRecursively(filePath);
    }
  });
}

const startingDirectory = process.argv[2];
listFilesRecursively(startingDirectory);
