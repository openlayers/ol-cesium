/**
 * This file resolves extension-less imports to JS files if they exist, preserving sourcemaps.
 * This allows to write extension-less imports in typescript files (which is required to allow transpilation).
 * And still produces correctly resolving transpiled results, which can be used even without bundler.
 * Note that we use inline sourcemaps here, as it is what we configure in tsconfig.json.
 */
import fs from 'fs';
import path from 'path';

import {parse, print} from 'recast';
import * as typescript from 'recast/parsers/typescript.js';

/**
 *
 * @param {string} dir
 */
async function* walk(dir) {
  for await (const d of await fs.promises.opendir(dir)) {
    const entry = path.join(dir, d.name);
    if (d.isDirectory()) {yield* walk(entry);}
    else if (d.isFile()) {yield entry;}
  }
}

for await (const p of walk('lib')) {
  if (p.endsWith('js')) {
    console.log(p);
    const source = fs.readFileSync(p);
    const sourceMapPath = p + '.map';
    let inputSourceMap;
    if (fs.existsSync(sourceMapPath)) {
      inputSourceMap = fs.readFileSync(sourceMapPath);
    }
    const ast = parse(source, {
      sourceFileName: p,
      parser: typescript,
      inputSourceMap,
    });
    rewriteJSEnds(p, ast);

    // Remove sourcemaps
    const comments = ast.program.body.at(-1).comments;
    const hasInlineSourceMap = comments && comments[0].value.startsWith('# sourceMappingURL=data:');
    const hasExternalSourceMap = !hasInlineSourceMap && comments && comments[0].value.startsWith('# sourceMappingURL');
    if (hasInlineSourceMap || hasExternalSourceMap) {
      ast.program.body.at(-1).comments = undefined; // remove comment
    }

    // Output
    const output = print(ast, {
      sourceMapName: sourceMapPath
    });
    fs.writeFileSync(p, output.code);

    // Write sourcemap
    if (hasInlineSourceMap) {
      const inlineSourceMap = `
//# sourceMappingURL=data:application/json;base64,${btoa(JSON.stringify(output.map))}
`;
      fs.appendFileSync(p, inlineSourceMap);
    } else if (hasExternalSourceMap) {
      const externalSourceMap = `
//# sourceMappingURL=${p}.map}
`;
      fs.appendFileSync(p, externalSourceMap);
      fs.writeFileSync(`${p}.map`, JSON.stringify(output.map));
    }
  }
}


/**
 *
 * @param {string} source
 * @return {string} if import rewritten
 */
function sourceRewrite(inFile, source) {
  if (!source.startsWith('.')) {
    return; // non relative paths are not in our project
  }
  const newSource = source + '.js';
  const newsourcePath = path.join(path.dirname(inFile), newSource);
  if (!fs.existsSync(newsourcePath)) {
    return; // if there is no js there that means we should not rewrite it
  }
  return newSource;

}

/**
 *
 * @param {string} p path to the file
 * @param {*} ast
 */
function rewriteJSEnds(p, ast) {
  const body = ast.program.body;
  for (const node of body) {
    switch (node.type) {
      case 'ImportDeclaration':
      case 'ExportNamedDeclaration': {
        if (!node.source) {
          continue;
        }
        const source = node.source.value;
        const newSource = sourceRewrite(p, source);
        if (newSource) {
          node.source.value = newSource;
        }
        break;
      }
      default: {
        // pass
      }
    }
  }
}
