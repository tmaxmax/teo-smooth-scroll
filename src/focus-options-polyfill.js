/* eslint-disable no-invalid-this */

/* focus - focusOptions - preventScroll polyfill
 * by calvellido (https://github.com/calvellido/focus-options-polyfill)
 */
(function() {
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    typeof HTMLElement === 'undefined'
  ) {
    return;
  }

  let supportsPreventScrollOption = false;
  try {
    const focusElem = document.createElement('div');
    focusElem.addEventListener(
        'focus',
        function(event) {
          event.preventDefault();
          event.stopPropagation();
        },
        true,
    );
    focusElem.focus(
        Object.defineProperty({}, 'preventScroll', {
          get: function() {
            supportsPreventScrollOption = true;
          },
        }),
    );
  } catch (e) {}

  if (
    HTMLElement.prototype.nativeFocus === undefined &&
    !supportsPreventScrollOption
  ) {
    HTMLElement.prototype.nativeFocus = HTMLElement.prototype.focus;

    const calcScrollableElements = function(element) {
      let parent = element.parentNode;
      const scrollableElements = [];
      const rootScrollingElement =
        document.scrollingElement || document.documentElement;

      while (parent && parent !== rootScrollingElement) {
        if (
          parent.offsetHeight < parent.scrollHeight ||
          parent.offsetWidth < parent.scrollWidth
        ) {
          scrollableElements.push([
            parent,
            parent.scrollTop,
            parent.scrollLeft,
          ]);
        }
        parent = parent.parentNode;
      }
      parent = rootScrollingElement;
      scrollableElements.push([parent, parent.scrollTop, parent.scrollLeft]);

      return scrollableElements;
    };

    const restoreScrollPosition = function(scrollableElements) {
      for (let i = 0; i < scrollableElements.length; i++) {
        scrollableElements[i][0].scrollTop = scrollableElements[i][1];
        scrollableElements[i][0].scrollLeft = scrollableElements[i][2];
      }
      scrollableElements = [];
    };

    const patchedFocus = function(args) {
      if (args && args.preventScroll) {
        const evScrollableElements = calcScrollableElements(this);
        this.nativeFocus();
        restoreScrollPosition(evScrollableElements);
      } else {
        this.nativeFocus();
      }
    };

    HTMLElement.prototype.focus = patchedFocus;
  }
})();
