declare type TimingFunction = (t: number) => number;
declare type CustomTargetSelector = (triggers: HTMLCollectionOf<HTMLElement>, container: HTMLElement) => HTMLElement;
interface BezierParams {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}
interface DefaultEasings {
    linear: TimingFunction;
    ease: TimingFunction;
    easeIn: TimingFunction;
    easeInOut: TimingFunction;
    easeOut: TimingFunction;
}
interface ScrollSettings {
    duration?: number;
    relative?: boolean;
    easing?: keyof DefaultEasings | BezierParams;
    fixedHeader?: HTMLElement;
    callbackStart?: () => void;
    callbackEnd?: () => void;
}
interface ScrollObjects {
    triggers: HTMLCollectionOf<HTMLElement>;
    container: HTMLElement;
    target: HTMLElement | CustomTargetSelector;
    distance?: number;
}
interface ScrollControlObject {
    enable(isEnabled: boolean): void;
}
export default function teoSmoothScroll(objects?: string | ScrollObjects, userSettings?: ScrollSettings): ScrollControlObject;
export {};
