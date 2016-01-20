import foreach from 'foreach';
import buildCSSRule from './buildCSSRule';

export default function transformSpecificationIntoCSS(lookup, spec, options = {}) {
  const output = {
    classDeclarations: {},
    mediaQueries: {},
  };

  foreach(spec, (value, key) => {
    processStyle(output, lookup, key, value, 0, options);
  });
  return output;
}

function processStyle(css, lookup, name, spec, level, options) {
  const className = lookup[name];

  css.classDeclarations[className] = processRules(spec.rules, level);
  processSelectors(css.classDeclarations, className, spec.selectors, level);
  processMediaQueries(css.mediaQueries, className, spec.mediaQueries, level, options);
}

function processRules(rules, level) {
  if (isEmpty(rules)) { return []; }
  const generatedRules = [];

  foreach(rules, (value, key) => {
    generatedRules.push(buildCSSRule(key, value));
  });
  return generatedRules;
}

function processSelectors(css, name, selectors, level) {
  if (isEmpty(selectors)) { return; }

  foreach(selectors, (value, key) => {
    css[name + key] = processRules(value.rules, level);
  });
}

function processMediaQueries(css, name, mediaQueries, level, options) {
  if (isEmpty(mediaQueries)) { return; }

  foreach(mediaQueries, (value, key) => {
    processMediaQuery(css, name, key, value, level, options);
  });
}

function processMediaQuery(css, name, query, content, level, options) {
  const mediaQueryName = '@' + generateMediaQueryName(query, options);
  css[mediaQueryName] = css[mediaQueryName] || {};

  css[mediaQueryName][name] = processRules(content.rules, level + 1);
  processSelectors(css[mediaQueryName], name, content.selectors, level + 1);
}

function generateMediaQueryName(name, options) {
  if (options.mediaMap) {
    return options.mediaMap[name] || name;
  }

  return name;
}

function indent(level) {
  let result = '';

  for (let i = 0; i < level; i++) {
    result += '  ';
  }

  return result;
}

function isEmpty(obj) {
  return typeof obj !== 'object' || Object.keys(obj).length === 0;
}
