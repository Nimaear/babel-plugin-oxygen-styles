import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import CleanCSS from 'clean-css';
import transformSpecificationIntoCSS from './transformSpecificationIntoCSS';

function processClasses(classes, output, indent = '') {
  Object.keys(classes).forEach(className => {
    output.push(indent + '.' + className + ' {');
    classes[className].forEach(rule => {
      output.push(indent + '  ' + rule);
    });
    output.push(indent + '}');
  });
}

function specToCSS(spec) {
  const output = [];
  processClasses(spec.classDeclarations, output);

  Object.keys(spec.mediaQueries).forEach(media => {
    output.push(media + '{');
    processClasses(spec.mediaQueries[media], output, '  ');
    output.push('}');
  });

  return output.join('\n');
}


export default function buildCSS(cache, options) {
  const output = {
    classDeclarations: {},
    mediaQueries: {},
  };
  Object.keys(cache).forEach(fileName => {
    const spec = cache[fileName];
    const lookup = spec.lookup;
    Object.keys(spec.stylesheets).forEach(name => {
      const stylesheet = spec.stylesheets[name];
      const fileOuput = transformSpecificationIntoCSS(lookup[name], stylesheet, options);
      Object.keys(fileOuput).forEach(key => {
        Object.assign(output[key], fileOuput[key]);
      });
    })
  });
  return generateCSS(output, options);
}

function generateCSS(spec, options) {
  let css = specToCSS(spec);
  if (css.length === 0) {
    return css;
  }
  const vp = options.vendorPrefixes;

  if (vp) {
    if (typeof vp === 'object') {
      css = postcss([autoprefixer(vp)]).process(css).css;
    } else {
      css = postcss([autoprefixer]).process(css).css;
    }
  }

  if (options.minify) {
    css = new CleanCSS().minify(css).styles;
  }

  return css;
}
