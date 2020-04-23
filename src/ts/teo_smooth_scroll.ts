// eslint-disable-next-line spaced-comment
/* eslint-disable require-jsdoc */
const cubicBezier = (function() {
  const NEWTON_ITERATIONS = 4;
  const NEWTON_MIN_SLOPE = 0.001;
  const SUBDIVISION_PRECISION = 0.0000001;
  const SUBDIVION_MAX_ITERATIONS = 10;

  const kSplineTableSize = 11;
  const kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

  const float32ArraySupported = typeof Float32Array === 'function';

  const a = (aA1: number, aA2: number) => 1.0 - 3.0 * aA2 + 3.0 * aA1;
  const b = (aA1: number, aA2: number) => 3.0 * aA2 - 6.0 * aA1;
  const c = (aA1: number) => 3.0 * aA1;

  const calcBezier = (aT: number, aA1: number, aA2: number) =>
    ((a(aA1, aA2) * aT + b(aA1, aA2)) * aT + c(aA1)) * aT;
  const getSlope = (aT: number, aA1: number, aA2: number) =>
    2.0 * a(aA1, aA2) * aT * aT + 2.0 * b(aA1, aA2) * aT + c(aA1);

  // eslint-disable-next-line require-jsdoc
  function binarySubdivide(
      aX: number,
      aA: number,
      aB: number,
      mX1: number,
      mX2: number,
  ) {
    let currentX: number; let currentT: number; let i = 0;
    do {
      currentT = aA + (aB - aA) / 2.0;
      currentX = calcBezier(currentT, mX1, mX2) - aX;
      if (currentX > 0.0) {
        aB = currentT;
      } else {
        aA = currentT;
      }
    } while (Math.abs(currentX) > SUBDIVISION_PRECISION &&
                 ++i < SUBDIVION_MAX_ITERATIONS);
    return currentT;
  }

  // eslint-disable-next-line require-jsdoc
  function newtonRaphsonIterate(
      aX: number,
      aGuessT: number,
      mX1: number,
      mX2: number,
  ) {
    for (let i = 0; i < NEWTON_ITERATIONS; ++i) {
      const currentSlope = getSlope(aGuessT, mX1, mX2);
      if (currentSlope === 0.0) {
        return aGuessT;
      }
      const currentX = calcBezier(aGuessT, mX1, mX2) - aX;
      aGuessT -= currentX / currentSlope;
    }
    return aGuessT;
  }

  const linearEasing = (x: number) => x;

  return (mX1: number, mY1: number, mX2: number, mY2: number) => {
    if (mX1 < 0 || mX1 > 1 || mX2 < 0 || mX2 > 1) {
      throw new Error('Bezier x values must be in [0, 1] range!');
    }

    if (mX1 === mY1 && mX2 === mY2) {
      return linearEasing;
    }

    const sampleValues = float32ArraySupported ?
                           new Float32Array(kSplineTableSize) :
                           new Array(kSplineTableSize);
    for (let i = 0; i < kSplineTableSize; ++i) {
      sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
    }

    const getTForX = (aX: number) => {
      let intervalStart = 0.0;
      let currentSample = 1;
      const lastSample = kSplineTableSize - 1;

      for (;
        currentSample !== lastSample && sampleValues[currentSample] <= aX;
        ++currentSample
      ) {
        intervalStart += kSampleStepSize;
      }
      --currentSample;

      const dist =
            (aX - sampleValues[currentSample]) /
            (sampleValues[currentSample + 1] - sampleValues[currentSample]);
      const guessForT = intervalStart + dist * kSampleStepSize;

      const initialSlope = getSlope(guessForT, mX1, mX2);
      if (initialSlope >= NEWTON_MIN_SLOPE) {
        return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
      } else if (initialSlope === 0.0) {
        return guessForT;
      } else {
        return binarySubdivide(
            aX,
            intervalStart,
            intervalStart + kSampleStepSize,
            mX1, mX2,
        );
      }
    };

    return (x: number) =>
          x === 0 ? 0 : x === 1 ? 1 : calcBezier(getTForX(x), mY1, mY2);
  };
})();

type TimingFunction = (t: number) => number;
type DOMElements = NodeList | HTMLCollection;
type DOMElement = Node | HTMLElement
type CustomTargetSelector =
  (triggers: DOMElements, container: DOMElement) => DOMElement;

interface BezierParams {
  x1: number,
  y1: number,
  x2: number,
  y2: number,
}

interface DefaultEasings {
  linear: TimingFunction,
  ease: TimingFunction,
  easeIn: TimingFunction,
  easeInOut: TimingFunction,
  easeOut: TimingFunction,
}
interface ScrollSettings {
  duration?: number,
  relative?: boolean,
  easing?: keyof DefaultEasings | BezierParams,
  fixedHeader?: HTMLElement,
}

interface ScrollObjects {
  triggers: HTMLCollection,
  container: DOMElement,
  target: DOMElement | CustomTargetSelector
  distance?: number
}

interface ScrollControlObject {
  enabled: (isEnabled: boolean) => void
}

/**
 * Library provided easings. The same as the CSS aliased cubic-bezier easings.
 */
const defaultEasings: DefaultEasings = Object.freeze({
  linear: cubicBezier(0.0, 0.0, 1.0, 1.0),
  ease: cubicBezier(0.25, 0.1, 0.25, 1.0),
  easeIn: cubicBezier(0.42, 0.0, 1.0, 1.0),
  easeInOut: cubicBezier(0.42, 0.0, 0.58, 1.0),
  easeOut: cubicBezier(0.0, 0.0, 0.58, 1.0),
});

const defaultSettings: ScrollSettings = Object.freeze({
  duration: 1000,
  relative: true,
  easing: 'linear',
});

/**
 * Parses easing to be used from user settings.
 * @param {undefined | string | BezierParams} param User passed easing
 * @return {TimingFunction} Easing function to be used.
 */
const getEasing = (param: undefined | keyof DefaultEasings | BezierParams ): TimingFunction => {
  if (typeof param === 'string') {
    if (defaultEasings[param]) {
      return defaultEasings[param];
    }
  } else if (typeof param === 'object') {
    for (const key in param) {
      if (!param.hasOwnProperty(key)) continue;
      if (typeof param[key] !== 'number') {
        return defaultEasings['linear'];
      }
    }
    return cubicBezier(param.x1, param.y1, param.x2, param.y2);
  }
  return defaultEasings['linear'];
};

/**
 * Merges scroll settings. Objects closer to the end will overwrite the
 * existing identic keys with their respective values.
 *
 * @param {ScrollSettings[]} objects Multiple scroll settings objects
 * @return {ScrollSettings} Final settings object
 */
const mergeScrollSettings = (...objects: ScrollSettings[]): ScrollSettings => {
  const merged: ScrollSettings = {};
  Array.prototype.forEach.call(objects, (obj: ScrollSettings) => {
    for (const key in obj) {
      if (!obj.hasOwnProperty(key)) continue;
      merged[key] = obj[key];
    }
  });
  return merged;
};

const clickHandler = (ev: MouseEvent) => {
  ev.preventDefault();
};

export default function teoSmoothScroll(
    objects?: string | ScrollObjects,
    userSettings?: ScrollSettings) {
  const settings = mergeScrollSettings(defaultSettings, userSettings || {});
  let triggers: Node[];
  if (typeof objects === 'string') {
    triggers = Array.from(document.querySelectorAll(objects));
  } else {
    triggers = Array.from(objects.triggers);
  }
  triggers.forEach((trigger) => {
    trigger.addEventListener('click', clickHandler.bind(this), false);
  });
}
