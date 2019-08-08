import marked from 'marked';
// import { transform } from 'babel-standalone';
import createRenderer, { codeRenderer } from './createRenderer';

import htm from 'htm';

const voidElements = [
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr'
];

export function marksy(options = {}) {
  // eslint-disable-next-line no-param-reassign
  options.components = options.components || {};

  const tracker = {
    tree: null,
    elements: null,
    nextElementId: null,
    toc: null,
    currentId: []
  };
  const renderer = createRenderer(tracker, options, {
    html(html) {
      try {
        // eslint-disable-next-line no-plusplus
        const elementId = tracker.nextElementId++;

        const components = Object.keys(options.components).map(
          key => options.components[key]
        );

        // eslint-disable-next-line no-inner-declarations
        function customRenderer(type, props = {}, ...children) {
          const jsonifyProps = JSON.parse(props);

          const componentProps =
            components.indexOf(type) >= 0
              ? Object.assign(jsonifyProps || {}, {
                  // eslint-disable-next-line no-plusplus
                  key: tracker.nextElementId++
                })
              : Object.assign(jsonifyProps || {}, {
                  // eslint-disable-next-line no-plusplus
                  key: tracker.nextElementId++
                });

          const isElementVoid = voidElements.indexOf(type) > -1;

          return options.createElement(
            type,
            componentProps,
            isElementVoid ? null : children
          );
        }

        const htmRenderer = htm.bind(customRenderer);

        tracker.elements[elementId] = htmRenderer`${html}` || null;

        tracker.tree.push(tracker.elements[elementId]);

        return `{{${elementId}}}`;
      } catch (e) {
        //
      }
      return null;
    },
    code(code, language) {
      if (language === 'marksy') {
        return renderer.html(code);
      }
      return codeRenderer(tracker, options)(code, language);
    }
  });

  return function compile(content, markedOptions = {}, context = {}) {
    tracker.tree = [];
    tracker.elements = {};
    tracker.toc = [];
    tracker.nextElementId = 0;
    tracker.context = context;
    tracker.currentId = [];
    marked(
      content,
      Object.assign({ renderer, smartypants: true }, markedOptions)
    );

    return { tree: tracker.tree, toc: tracker.toc };
  };
}

export default function(options) {
  return marksy(options);
}
