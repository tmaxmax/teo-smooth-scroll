'use strict';

import teoSmoothScroll from '../src/ts/teo_smooth_scroll.js';

/**
 * Determines if device is iOS or not.
 * @return {boolean} true if device is iOS
 */
const isIOS = () => {
  return (
    /iPad|iPhone|iPod/.test(navigator.platform) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
};

const supportsPassive = (() => {
  let returnValue = false;
  try {
    window.addEventListener(
        'test',
        null,
        Object.defineProperty({}, 'passive', {
          get: function() {
            returnValue = true;
          },
        }),
    );
  } catch (error) {}
  return returnValue;
})();

const wheelOptions = supportsPassive ? {passive: false} : false;
const wheelEvent = 'onwheel' in window ? 'wheel' : 'mousewheel';

// Workaround for iOS to blur focused element when clicked outside.
// Safari WebKit does not trigger click events on unclickable objects.
if (isIOS()) {
  window.addEventListener('touchend', (ev) => {
    if (ev.target !== document.activeElement) document.activeElement.blur();
  });
}

window.addEventListener(
    'touchmove',
    (ev) => {
      if (!userWontScroll()) ev.preventDefault();
    },
    wheelOptions,
);
/** Sections anchor links collection */
const htmlSectionLinks = document.querySelectorAll('nav.section-links a');
/** Sections collection */
const htmlSections = document.querySelectorAll('section.main');

// Adding for each content container an event listener for touch devices,
// so the touched container gets focused, preventing any accidental scroll
// changes.
// Also listens for mouse hovering, so when the user is with the cursor
// over a container, it automatically gets focused.
htmlSections.forEach((section) => {
  section.querySelectorAll('.content[tabindex="-1"]').forEach((elem) => {
    elem.addEventListener('touchstart', () => {
      elem.focus({preventScroll: true});
    });
    elem.addEventListener('mouseover', () => {
      elem.focus({preventScroll: true});
    });
    elem.addEventListener('mouseleave', () => elem.blur());
  });
});

/** object that holds indexes for active section,
 * and also sets it in the sessionStorage
 *
 * _**Active section**: the section the user currently **has** in viewport_
 *
 * _**Next/Previous sections**: the sections that **follow** or **precede**
 * the active section in the DOM_
 */
const section = {
  /**
   * Retrieves last active section from sessionStorage.
   *
   * @return {number} Last active section
   */
  get active() {
    return parseInt(sessionStorage.getItem('activeSection'));
  },
  /**
   * Sets last active section to sessionStorage.
   *
   * @param {number} index current active section
   */
  set active(index) {
    sessionStorage.setItem('activeSection', index);
  },
  /**
   * Returns the index of the section after the active one.
   * If the active section is the last section, it returns the
   * first section.
   *
   * @return {number} next section
   */
  get next() {
    if (this.active === htmlSectionLinks.length - 1) return 0;
    return this.active + 1;
  },
  /**
   * Returns the index of the section before the active one.
   * If the active section is the first section, it returns the
   * last section.
   *
   * @return {number} previous section
   */
  get previous() {
    if (this.active === 0) return htmlSectionLinks.length - 1;
    return this.active - 1;
  },
};

/**
 * Function that sets a section's contents tab indexes, so those that are
 * not visible in the viewport can't be tabbed.
 * @param {number} sectionIndex the section to be set
 * @param {string} tabIndexValue tabindex value to be set ("-1" or "0")
 */
const setSectionContentTabIndex = (sectionIndex, tabIndexValue) => {
  if (!sectionIndex) return;
  htmlSections[sectionIndex]
      .querySelectorAll('.content[tabindex]')
      .forEach((elem) => {
        elem.tabIndex = tabIndexValue;
      });
};

// click event listeners for anchor links, so that the necessary updates
// are made to the section elements.
//
// adds the active class to the anchor links, removes it from the previous
// active class;
// hides the previous' active section's content from the tab flow, revealing
// the new content.
htmlSectionLinks.forEach((link, index, links) => {
  link.addEventListener('click', () => {
    links[section.active].classList.remove('active');
    setSectionContentTabIndex(section.active, '-1');
    section.active = index;
    link.classList.add('active');
    setSectionContentTabIndex(section.active, '0');
  });
});

// goes to the last active section on page load. if there is
// none, it goes to the first.
window.addEventListener('load', () => {
  if (!section.active) section.active = 0;
  htmlSectionLinks[section.active].click();
});

// Resize handling
// On many mobile devices, the resize event is fired multiple times,
// leading to erroneous updates. This script brings the active section
// in view after a resize;
(function() {
  let lastResizeEvent;
  let handleResizeTimeout;

  const onResize = () => {
    lastResizeEvent = Date.now();
    handleResizeTimeout = setTimeout(handleResize, 50);
  };

  const handleResize = () => {
    if (Date.now() - lastResizeEvent < 50) {
      handleResizeTimeout = setTimeout(handleResize, 50);
    } else {
      clearTimeout(handleResizeTimeout);
      htmlSectionLinks[section.active].click();
    }
  };

  window.addEventListener('resize', onResize);
})();

/**
 * Determines if the user will not scroll in the future,
 * based on the current active (focused) element.
 *
 * @return {boolean} true if active element isn't body
 */
const userWontScroll = () => {
  return document.activeElement !== (document.body || document.documentElement);
};

/**
 * Changes the active secction when the user moves the scroll wheel,
 * according to the sign of the delta number (negative for previous,
 * positive for next section).
 *
 * Then it removes the event listener, and adds it again, 500ms later,
 * so the event callback isn't executed too often.
 *
 * @param {WheelEvent} ev the wheel event from the event listener
 */
const onWheel = (ev) => {
  if (userWontScroll()) return;

  ev.preventDefault();
  window.removeEventListener(wheelEvent, onWheel, wheelOptions);

  if (ev.deltaY > 0) htmlSectionLinks[section.next].click();
  else htmlSectionLinks[section.previous].click();

  setTimeout(() => {
    window.addEventListener(wheelEvent, onWheel, wheelOptions);
  }, 500);
};

window.addEventListener('wheel', onWheel, wheelOptions);

// Changes the active section based on the key released.
// NOTE: the event doesn't trigger on 'keydown' so the callback
// won't be executed continuously while the key is pressed.
window.addEventListener('keyup', (ev) => {
  if (userWontScroll()) return;

  if (ev.key === 'ArrowUp') htmlSectionLinks[section.previous].click();
  else if (ev.key === 'ArrowDown') htmlSectionLinks[section.next].click();
});

// Touch related event listeners for the section scrolling.
(function() {
  /** Vertical touchstart coordinates */
  let touchStartPositionY;

  /**
   * touchstart event handler
   *
   * This function saves the touchstart coordinates, removes the
   * touchstart scroll event listener, so no other requests to change
   * the active section can be started after, and adds a listener
   * for touchmove
   *
   * @param {TouchEvent} ev the touchstart event
   */
  const onTouchStart = (ev) => {
    touchStartPositionY = ev.touches[0].clientY;
    window.removeEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
  };

  /**
   * touchmove event handler
   *
   * This function keeps recording the current vertical coordinate
   * of user's touch, and when the absolute difference between the starting
   * coordinate and current coordinate reach the set threshold (minimum
   * between 100px and a quarter of screen's height)
   *
   * @param {TouchEvent} ev the touchmove event
   */
  const onTouchMove = (ev) => {
    const touchEndPositionY = ev.touches[0].clientY;
    const delta = touchStartPositionY - touchEndPositionY;

    if (Math.abs(delta) > Math.min(25, screen.height / 4)) {
      window.removeEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd(delta), {once: true});
    }
  };

  /**
   * Returns touchend event handler that, based on delta's sign, changes the
   * active section (negative for previous, positive for next section)
   *
   * @param {number} delta Difference between touch extreme vertical coordinates
   * @return {Function} The returned touchend event handler
   */
  const onTouchEnd = (delta) => {
    return () => {
      if (!userWontScroll()) {
        if (delta < 0) htmlSectionLinks[section.previous].click();
        else htmlSectionLinks[section.next].click();
      }
      window.addEventListener('touchstart', onTouchStart);
    };
  };

  // Starting the events chain
  window.addEventListener('touchstart', onTouchStart);
})();

teoSmoothScroll('nav.section-links a', {
  duration: 2000,
  relative: true,
  easing: {x1: 0.25, y1: 0.1, x2: 0.25, y2: 1},
});
