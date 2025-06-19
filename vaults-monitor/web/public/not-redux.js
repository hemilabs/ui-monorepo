'use strict'
;(function (global) {
  // See redux@4
  global.redux = {
    createStore(reducer, preloadedState) {
      let state = preloadedState
      const listeners = []
      return {
        dispatch(action) {
          state = reducer(state, action)
          listeners.forEach(function (fn) {
            fn()
          })
        },
        getState: () => state,
        subscribe(fn) {
          listeners.push(fn)
        },
      }
    },
  }
})(this)
