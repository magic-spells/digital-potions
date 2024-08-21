class DPEventEmitter {
  #events;

  constructor() {
    this.#events = new Map();
  }

  /**
   * Binds a listener to an event.
   * @param {string} event - The event to bind the listener to.
   * @param {Function} listener - The listener function to bind.
   * @returns {DPEventEmitter} The current instance for chaining.
   * @throws {TypeError} If the listener is not a function.
   */
  on(event, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('Listener must be a function');
    }

    const listeners = this.#events.get(event) || [];
    if (!listeners.includes(listener)) {
      listeners.push(listener);
    }
    this.#events.set(event, listeners);

    return this;
  }

  /**
   * Unbinds a listener from an event.
   * @param {string} event - The event to unbind the listener from.
   * @param {Function} listener - The listener function to unbind.
   * @returns {DPEventEmitter} The current instance for chaining.
   */
  off(event, listener) {
    const listeners = this.#events.get(event);
    if (!listeners) return this;

    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
      if (listeners.length === 0) {
        this.#events.delete(event);
      } else {
        this.#events.set(event, listeners);
      }
    }

    return this;
  }

  /**
   * Triggers an event and calls all bound listeners.
   * @param {string} event - The event to trigger.
   * @param {...*} args - Arguments to pass to the listener functions.
   * @returns {boolean} True if the event had listeners, false otherwise.
   */
  emit(event, ...args) {
    const listeners = this.#events.get(event);
    if (!listeners || listeners.length === 0) return false;

    for (let i = 0, n = listeners.length; i < n; ++i) {
      try {
        listeners[i].apply(this, args);
      } catch (error) {
        console.error(`Error in listener for event '${event}':`, error);
      }
    }

    return true;
  }


  /**
   * Removes all listeners for a specific event or all events.
   * @param {string} [event] - The event to remove listeners from. If not provided, removes all listeners.
   * @returns {DPEventEmitter} The current instance for chaining.
   */
  removeAllListeners(event) {
    if (event) {
      this.#events.delete(event);
    } else {
      this.#events.clear();
    }
    return this;
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