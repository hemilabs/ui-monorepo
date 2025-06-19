'use strict'
;(function (global) {
  // See react-dom@17
  global.ReactDOM = {
    render(element, container) {
      container.innerHTML = element
    },
  }
})(this)
