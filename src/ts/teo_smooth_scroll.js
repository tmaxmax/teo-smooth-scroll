// eslint-disable-next-line spaced-comment
/* eslint-disable require-jsdoc */
var cubicBezier = (function () {
    var NEWTON_ITERATIONS = 4;
    var NEWTON_MIN_SLOPE = 0.001;
    var SUBDIVISION_PRECISION = 0.0000001;
    var SUBDIVION_MAX_ITERATIONS = 10;
    var kSplineTableSize = 11;
    var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);
    var float32ArraySupported = typeof Float32Array === 'function';
    var a = function (aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; };
    var b = function (aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; };
    var c = function (aA1) { return 3.0 * aA1; };
    var calcBezier = function (aT, aA1, aA2) {
        return ((a(aA1, aA2) * aT + b(aA1, aA2)) * aT + c(aA1)) * aT;
    };
    var getSlope = function (aT, aA1, aA2) {
        return 2.0 * a(aA1, aA2) * aT * aT + 2.0 * b(aA1, aA2) * aT + c(aA1);
    };
    // eslint-disable-next-line require-jsdoc
    function binarySubdivide(aX, aA, aB, mX1, mX2) {
        var currentX;
        var currentT;
        var i = 0;
        do {
            currentT = aA + (aB - aA) / 2.0;
            currentX = calcBezier(currentT, mX1, mX2) - aX;
            if (currentX > 0.0) {
                aB = currentT;
            }
            else {
                aA = currentT;
            }
        } while (Math.abs(currentX) > SUBDIVISION_PRECISION &&
            ++i < SUBDIVION_MAX_ITERATIONS);
        return currentT;
    }
    // eslint-disable-next-line require-jsdoc
    function newtonRaphsonIterate(aX, aGuessT, mX1, mX2) {
        for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
            var currentSlope = getSlope(aGuessT, mX1, mX2);
            if (currentSlope === 0.0) {
                return aGuessT;
            }
            var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
            aGuessT -= currentX / currentSlope;
        }
        return aGuessT;
    }
    var linearEasing = function (x) { return x; };
    return function (mX1, mY1, mX2, mY2) {
        if (mX1 < 0 || mX1 > 1 || mX2 < 0 || mX2 > 1) {
            throw new Error('Bezier x values must be in [0, 1] range!');
        }
        if (mX1 === mY1 && mX2 === mY2) {
            return linearEasing;
        }
        var sampleValues = float32ArraySupported ?
            new Float32Array(kSplineTableSize) :
            new Array(kSplineTableSize);
        for (var i = 0; i < kSplineTableSize; ++i) {
            sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
        }
        var getTForX = function (aX) {
            var intervalStart = 0.0;
            var currentSample = 1;
            var lastSample = kSplineTableSize - 1;
            for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
                intervalStart += kSampleStepSize;
            }
            --currentSample;
            var dist = (aX - sampleValues[currentSample]) /
                (sampleValues[currentSample + 1] - sampleValues[currentSample]);
            var guessForT = intervalStart + dist * kSampleStepSize;
            var initialSlope = getSlope(guessForT, mX1, mX2);
            if (initialSlope >= NEWTON_MIN_SLOPE) {
                return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
            }
            else if (initialSlope === 0.0) {
                return guessForT;
            }
            else {
                return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
            }
        };
        return function (x) {
            return x === 0 ? 0 : x === 1 ? 1 : calcBezier(getTForX(x), mY1, mY2);
        };
    };
})();
/**
 * Library provided easings. The same as the CSS aliased cubic-bezier easings.
 */
var defaultEasings = Object.freeze({
    linear: cubicBezier(0.0, 0.0, 1.0, 1.0),
    ease: cubicBezier(0.25, 0.1, 0.25, 1.0),
    easeIn: cubicBezier(0.42, 0.0, 1.0, 1.0),
    easeInOut: cubicBezier(0.42, 0.0, 0.58, 1.0),
    easeOut: cubicBezier(0.0, 0.0, 0.58, 1.0),
});
var defaultSettings = Object.freeze({
    duration: 1000,
    relative: true,
    easing: 'linear',
});
/**
 * Parses easing to be used from user settings.
 * @param {undefined | string | BezierParams} param User passed easing
 * @return {TimingFunction} Easing function to be used.
 */
var getEasing = function (param) {
    if (typeof param === 'string') {
        if (defaultEasings[param]) {
            return defaultEasings[param];
        }
    }
    else if (typeof param === 'object') {
        for (var key in param) {
            if (!param.hasOwnProperty(key))
                continue;
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
var mergeScrollSettings = function () {
    var objects = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        objects[_i] = arguments[_i];
    }
    var merged = {};
    Array.prototype.forEach.call(objects, function (obj) {
        for (var key in obj) {
            if (!obj.hasOwnProperty(key))
                continue;
            merged[key] = obj[key];
        }
    });
    return merged;
};
var getDocumentHeight = function () {
    return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight);
};
/**
 * Focuses on the passed parameter object. If it isn't focusable
 * by default, sets the object's tabindex to -1, focuses, then resets
 * to default.
 *
 * @param {HTMLElement} target The target to focus on
 */
var focusTarget = function (target) {
    target.focus();
    if (document.activeElement === target)
        return;
    target.setAttribute('tabindex', '-1');
    target.focus();
    target.removeAttribute('tabindex');
};
/**
 * Updates the browser history after scroll
 * @param {HTMLElement} target The element that was scrolled to
 * @param {ScrollSettings} currentSettings The scroll settings
 */
var updateURL = function (target, currentSettings) {
    if (!history.pushState)
        return;
    history.pushState({
        teoSmoothScroll: JSON.stringify(currentSettings),
        target: target.id,
    }, document.title, target === document.documentElement ? '#top' : '#' + target.id);
};
var getElementPosition = function (element, parent) {
    var topPos = 0;
    var leftPos = 0;
    do {
        topPos += element.offsetTop || 0;
        leftPos += element.offsetLeft || 0;
        element = element.offsetParent;
    } while (element && element !== parent.offsetParent);
    return { top: topPos, left: leftPos };
};
var animateAnchorScroll = function (target, settings) {
    var endPos = Math.min(Math.floor(getElementPosition(target, document.body).top), getDocumentHeight() - window.innerHeight);
    var startPos = window.scrollY;
    var totalScrollAmount = endPos - startPos;
    var easing = getEasing(settings.easing);
    var start;
    var loopAnchorScroll = function (timestamp) {
        if (!start)
            start = timestamp;
        var elapsed = timestamp - start;
        var percentage = (function () {
            var ret = elapsed / settings.duration;
            return ret;
        })();
        var currentScrollPosition = startPos + easing(percentage) * totalScrollAmount;
        window.scrollTo(0, Math.floor(currentScrollPosition));
        if (percentage <= 1)
            requestAnimationFrame(loopAnchorScroll);
        if (percentage >= 1 && currentScrollPosition !== endPos) {
            window.scrollTo(0, endPos);
        }
        ;
    };
    requestAnimationFrame(loopAnchorScroll);
};
function anchorClickHandler(currentSettings, target) {
    return function (ev) {
        ev.preventDefault();
        animateAnchorScroll(target, currentSettings);
        updateURL(target, currentSettings);
        focusTarget(target);
    };
}
;
var addAnchorEventListeners = function (triggers, settings) {
    triggers.forEach(function (trigger) {
        var target = document.getElementById(trigger.getAttribute('href').replace('#', ''));
        trigger.addEventListener('click', anchorClickHandler(settings, target).bind(trigger), false);
    });
};
var removeAnchorEventListeners = function (triggers, settings) {
    triggers.forEach(function (trigger) {
        var target = document.getElementById(trigger.getAttribute('href').replace('#', ''));
        trigger.removeEventListener('click', anchorClickHandler(settings, target).bind(trigger), false);
    });
};
export default function teoSmoothScroll(objects, userSettings) {
    var settings = mergeScrollSettings(defaultSettings, userSettings || {});
    var isEnabled = true;
    var triggers;
    if (typeof objects === 'string') {
        triggers = Array.from(document.querySelectorAll(objects));
    }
    else {
        triggers = Array.from(objects.triggers);
    }
    addAnchorEventListeners(triggers, settings);
    return {
        enable: function (state) {
            console.log(state === isEnabled);
            if (state === isEnabled)
                return;
            isEnabled = state;
            if (isEnabled) {
                addAnchorEventListeners(triggers, settings);
            }
            else {
                removeAnchorEventListeners(triggers, settings);
            }
        },
    };
}
//# sourceMappingURL=teo_smooth_scroll.js.map