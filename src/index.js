import assert from 'assert';
import { writeFileSync } from 'fs';
import { relative, join, dirname, resolve } from 'path';
import { sync as mkDirPSync } from 'mkdirp';

import transformObjectExpressionIntoStyleSheetObject from './transformObjectExpressionIntoStyleSheetObject';
import transformStyleSheetObjectIntoSpecification from './transformStyleSheetObjectIntoSpecification';
import generateClassName from './generateClassName';
import buildCSS from './buildCSS';

const KEY = '__cssinjs';

const DEFAULT_OPTIONS = {
  identifier: 'cssInJS',
  vendorPrefixes: false,
  minify: false,
  compressClassNames: false,
  mediaMap: {},
  context: null,
  cacheDir: 'tmp/cache/',
  bundleFile: 'bundle.css',
};

export default function plugin(context) {
  context[KEY] = {
    cache: {},
    visiting: {},
  };

  return {
    visitor: visitor(context),
  };
}

function visitor(context) {
  const t = context.types;

  return {
    Program: {
      enter() {
        const filename = relative(process.cwd(), this.file.opts.filename);
        this.opts = buildOptions(this.opts, filename);

        this.cssInJS = { filename, stylesheets: {}, lookup: {} };
        context[KEY].visiting[filename] = true;
      },

      exit() {
        const filename = this.cssInJS.filename;
        /* istanbul ignore if */
        if (!context[KEY].visiting[filename]) return;
        // const css = buildCSS(this.cssInJS.lookup, this.cssInJS.stylesheets, this.cssInJS.options);

        if (Object.keys(this.cssInJS.lookup).length > 0) {
          context[KEY].cache[this.cssInJS.filename] = this.cssInJS;
        } else {
          delete context[KEY].cache[this.cssInJS.filename];
        }
        if (Object.keys(context[KEY].cache).length > 0 && this.opts.bundleFile) {
          const bundleFile = join(process.cwd(), this.opts.bundleFile);
          mkDirPSync(dirname(bundleFile));

          const bundleCSS = buildCSS(context[KEY].cache, this.opts);
          writeFileSync(bundleFile, bundleCSS, { encoding: 'utf8' });
        }

        context[KEY].visiting[filename] = false;
      },
    },

    CallExpression(path) {
      if (!t.isIdentifier(path.node.callee, { name: this.opts.identifier })) {
        return;
      }

      assert(
        t.isVariableDeclarator(path.parentPath.node),
        'return value of cssInJS(...) must be assigned to a variable'
      );

      const sheetId = path.parentPath.node.id.name;
      const expr = path.node.arguments[0];

      assert(expr, 'cssInJS(...) call is missing an argument');

      const obj = transformObjectExpressionIntoStyleSheetObject(expr, this.opts.context);
      const sheet = transformStyleSheetObjectIntoSpecification(obj);

      this.cssInJS.stylesheets[sheetId] = sheet;
      this.cssInJS.lookup[sheetId] = {};
      const gcnOptions = { prefixes: [this.cssInJS.filename, sheetId] };
      if (this.opts.prefix) {
        gcnOptions.prefix = this.opts.prefix;
      }
      if (this.opts.compressClassNames) {
        gcnOptions.compressClassNames = this.opts.compressClassNames;
      }

      Object.keys(sheet).forEach(styleId => {
        this.cssInJS.lookup[sheetId][styleId] = generateClassName(styleId, gcnOptions, Object.assign({}, sheet[styleId].rules, sheet[styleId].mediaQueries));
      });

      const properties = Object.keys(sheet).reduce((memo, styleId) => {
        return memo.concat(
          t.objectProperty(
            t.identifier(styleId),
            t.stringLiteral(this.cssInJS.lookup[sheetId][styleId])
          )
        );
      }, []);
      path.replaceWith(t.objectExpression(properties));
    },
  };
}

const contextFileCache = {};

function buildOptions(options, filename) {
  options = Object.assign({}, DEFAULT_OPTIONS, options, { filename });

  if (typeof options.context === 'string') {
    const file = resolve(options.context);

    if (typeof contextFileCache[file] === 'undefined') {
      contextFileCache[file] = require(file);
    }

    options.context = contextFileCache[file];
  }

  return options;
}
