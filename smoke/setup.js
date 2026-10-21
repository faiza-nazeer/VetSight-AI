import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
window.scrollTo = () => {};
Element.prototype.scrollTo = () => {};
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
afterEach(() => { cleanup(); localStorage.clear(); });
// jsdom gaps (real browsers have these)
URL.createObjectURL = () => 'blob:test';
URL.revokeObjectURL = () => {};
if (!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect) {
  SVGElement.prototype.createSVGRect = () => ({});
}
