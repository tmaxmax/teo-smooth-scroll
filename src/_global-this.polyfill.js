/*
 * globalThis polyfill
 * inspired by https://mathiasbynens.be/notes/globalthis
 */
(function() {
  // Checks for existent globalThis, so Object won't get mutated if not needed.
  if (typeof globalThis === 'object') return;

  // Executes polyfill in a try-catch block so it works on old IE
  try {
    // Implementing a getter into Object's prototype, from which this inherits.
    // When the getter is executed, it returns the environment's global this.
    Object.defineProperty(Object.prototype, '__polyfill__', {
      get: function() {
        return this;
      },
      configurable: true // Allows the getter to be deleted later
    });
    // Assigning the global this value to the newly created globalThis variable.
    __polyfill__.globalThis = __polyfill__;
    if (typeof globalThis === 'undefined') {
      // If it failed, assumes window exists and assigns to globalThis the window itself.
      window.globalThis = window;
    }
  } catch (e) {
    // Again, assumes window exists and assigns window to globalThis.
    // This is required for browsers where Object.defineProperty only
    // works on DOM objects.
    window.globalThis = window;
  }
})();
