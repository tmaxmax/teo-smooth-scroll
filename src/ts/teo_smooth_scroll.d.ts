declare type TimingFunction = (t: number) => number;
declare type DOMElements = NodeList | HTMLCollection;
declare type DOMElement = Node | HTMLElement;
declare type CustomTargetSelector = (triggers: DOMElements, container: DOMElement) => DOMElement;
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
}
interface ScrollObjects {
    triggers: HTMLCollection;
    container: DOMElement;
    target: DOMElement | CustomTargetSelector;
    distance?: number;
}
export default function teoSmoothScroll(objects?: string | ScrollObjects, userSettings?: ScrollSettings): void;
export {};
