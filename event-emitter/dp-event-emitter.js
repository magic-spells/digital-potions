class DPEventEmitter {
  #events;

  constructor() {
    this.#events = {};
  }

  /**
   * Binds a listener to an event.
   * @param {string} event - The event to bind the listener to.
   * @param {Function} listener - The listener function to bind.
   * @returns {EventEmitter} The current instance for chaining.
   * @throws {Error} If the listener is not a function.
   */
  on(event, listener) {
    const _ = this;
    if (typeof listener !== 'function') {
      throw new Error('listener must be a function');
    }
    _.#events[event] = _.#events[event] || [];
    // prevent duplicates of the same callback function
    if (!_.#events[event].includes(listener)) {
      _.#events[event].push(listener);
    }
    return _;
  }

  /**
   * Unbinds a listener from an event.
   * @param {string} event - The event to unbind the listener from.
   * @param {Function} listener - The listener function to unbind.
   * @returns {EventEmitter} The current instance for chaining.
   */
  off(event, listener) {
    const _ = this;
    // exit if there aren't any listeners for this event
    if (!_.#events[event]) return _;
    // get index of listener funciton in event array
    const index = _.#events[event].indexOf(listener);
    if (index !== -1) {
      _.#events[event].splice(index, 1);
    }
    return _;
  }

  /**
   * Triggers an event and calls all bound listeners.
   * @param {string} event - The event to trigger.
   * @param {...*} args - Arguments to pass to the listener functions.
   */
  emit(event, ...args) {
    const _ = this;
    // return if no events
    if (!_.#events[event]) return;
    // get all listener functions for this event
    const listeners = _.#events[event];
    // call functions and pass in arguments
    for (let i = 0, n = listeners.length; i < n; ++i) {
      listeners[i](...args);
    }
  }
}


// Conditional export as Universal Module
if (typeof module !== 'undefined' && module.exports) {
    // CommonJS (Node.js) export
    module.exports = DPEventEmitter;
} else if (typeof define === 'function' && define.amd) {
    // AMD (RequireJS) export
    define([], () => DPEventEmitter);
} else if (typeof window !== 'undefined') {
    // Browser global export
    window.DPEventEmitter = DPEventEmitter;
}