(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], function() {
      return factory(root);
    });
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(root);
  } else {
    root.teoSmoothScroll = factory(root);
  }
})(globalThis, function(window) {
  'use strict';

  return () => console.log('Hello world!');
});
