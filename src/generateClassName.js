import compressClassName from './compressClassName';
import splitSelector from './utils/splitSelector';

const invalidChars = /[^_a-z0-9-]/ig;

export default function generateClassName(id, options, sheet) {
  let result = '';

  if (options.prefix) {
    result += options.prefix.replace(invalidChars, '_') + '-';
  } else if (options.prefixes) {
    result += options.prefixes.map(p => p.replace(invalidChars, '_')).join('-') + '-';
  }

  result += id;

  if (options.compressClassNames) {
    const [className, selector] = splitSelector(result);
    return (options.prefix || '_') + compressClassName(sheet) + selector;
  }

  return result;
}
