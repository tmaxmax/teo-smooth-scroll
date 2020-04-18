'use strict';

const htmlSectionLinks = document.querySelectorAll('nav.aside a');

const section = {
  get active() {
    return parseInt(sessionStorage.getItem('activeSection'));
  },
  set active(index) {
    sessionStorage.setItem('activeSection', index);
  },
  get next() {
    if (this.active === htmlSectionLinks.length - 1) return 0;
    return this.active + 1;
  },
  get previous() {
    if (this.active === 0) return htmlSectionLinks.length - 1;
    return this.active - 1;
  },
};

htmlSectionLinks.forEach((link, index, links) => {
  link.addEventListener('click', () => {
    link.classList.add('active');
    for (let i = 0; i < links.length; i++) {
      if (i != index) links[i].classList.remove('active');
    }
    section.active = index;
  });
});

window.addEventListener('load', () => {
  const currentActiveSection = sessionStorage.getItem('activeSection');
  if (currentActiveSection) {
    htmlSectionLinks[parseInt(currentActiveSection)].click();
  } else {
    htmlSectionLinks[0].click();
  }
});

window.addEventListener('wheel', (ev) => {
  if (ev.deltaY > 0) htmlSectionLinks[section.next].click();
  else htmlSectionLinks[section.previous].click();
});

(function() {
  let touchStartPositionY;

  const onTouchStart = (ev) => {
    touchStartPositionY = ev.touches[0].clientY;
    window.removeEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
  };

  const onTouchMove = (ev) => {
    const touchEndPositionY = ev.touches[0].clientY;
    const delta = touchStartPositionY - touchEndPositionY;

    if (Math.abs(delta) > 125) {
      window.removeEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd(delta), {once: true});
    }
  };

  const onTouchEnd = (delta) => {
    return () => {
      if (delta < 0) htmlSectionLinks[section.previous].click();
      else htmlSectionLinks[section.next].click();

      window.addEventListener('touchstart', onTouchStart);
    };
  };

  window.addEventListener('touchstart', onTouchStart);
})();
