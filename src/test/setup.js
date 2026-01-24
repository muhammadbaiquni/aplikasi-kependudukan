import '@testing-library/jest-dom';

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    })
  });
}

Object.defineProperty(window, 'getComputedStyle', {
  configurable: true,
  value: () => ({
    getPropertyValue: () => '',
    overflow: 'auto'
  })
});
