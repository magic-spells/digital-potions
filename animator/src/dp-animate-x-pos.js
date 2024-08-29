import EventEmitter from '../../event-emitter/dp-event-emitter';

let ranFPSTest = false;
let defaultTimeDeltaFactor = 1;

/**
 * Events:
 * animationDidFinish: animation finished
 */

export default class DPAnimateXPos {

	// Private fields
	#carousel;
	#element;
	#isAnimating = false;
	#targetX;
	#currentX;
	#velocity = 0;
	#attraction;
	#friction;
	#frictionFactor;
	#prevTime;
	#animationIntervals = [];
	#eventEmitter = new EventEmitter();

	/**
	 * Creates an instance of DPAnimateXPos.
	 * @param {Object} carousel - The carousel object.
	 * @param {HTMLElement} element - The DOM element to animate.
	 * @param {number} startX - The starting X position.
	 * @param {number} attraction - The attraction value for physics-based animation (floating point).
	 * @param {number} friction - The friction value for physics-based animation (floating point).
	 */
	constructor(carousel, element, startX, attraction, friction) {
		const _ = this;

		// settings
		_.#carousel = carousel;
		_.#element = element;
		_.#isAnimating = false;

		// positions
		_.#targetX = startX;
		_.#currentX = startX;

		// physics
		_.#velocity = 0;
		_.#attraction = attraction;
		_.#friction = friction;
		_.#frictionFactor = 1 - friction;

		_.jumpToTarget();

		// Only let the first instance run the test
		if (!ranFPSTest) {
			ranFPSTest = true;
			_.#getDeviceAnimationInterval();
		}
	}

	/**
	 * Calculates the device's animation interval to adjust FPS multiplier.
	 * @param {DOMHighResTimeStamp} [time] - The current time in milliseconds.
	 * @private
	 */
	#getDeviceAnimationInterval(time) {
		const _ = this;

		// If we have 60 frame intervals
		if (_.#animationIntervals.length >= 12) {

			// first few readings aren't usually not accurate 
			_.#animationIntervals.shift();
			_.#animationIntervals.shift();

			// calculate total in array
			let total = _.#animationIntervals.reduce((a, b) => a + b);

			// get average
			const fpsAverage = total / _.#animationIntervals.length;
			
			// compare to 60 FPS (16.66 ms interval)
			defaultTimeDeltaFactor = fpsAverage / 16.66;
			_.#prevTime = null;
			return;
		}

		// get time delta
		let timeDelta = time - _.#prevTime;
		// save prev time
		_.#prevTime = time;

		if (!time) _.#prevTime = performance.now();

		// push value to array
		if (timeDelta) {
			_.#animationIntervals.push(timeDelta);
		}

		// tell browser to request another frame 
		requestAnimationFrame(time => _.#getDeviceAnimationInterval(time));
	}

	/**
	 * Animates the element to a specified X position.
	 * @param {number} target - The target X position.
	 * @param {number} [velocity] - The initial velocity for the animation.
	 */
	animateToXPos(target, velocity) {
		const _ = this;
		
		// if we're already animating, don't start a new one
		if (_.#isAnimating) return;

		// set new target
		_.#targetX = target;

		// include velocity if we have it
		_.#velocity = velocity || 0;

		// we are starting a new animation
		_.#isAnimating = true;

		// just do it ✓
		_.#animateToTarget();
	}

	/**
	 * Jumps the element to a specified X position without animation.
	 * @param {number} xPos - The X position to jump to.
	 */
	jumpToXPos(xPos) {
		const _ = this;
		// set target
		_.#targetX = xPos;
		// make the jump
		_.jumpToTarget();
	}

	/**
	 * Stops the ongoing animation.
	 */
	stopAnimation() {
		// stop all the animating
		this.#isAnimating = false;
	}

	/**
	 * Performs the animation to move the element towards the target position.
	 * @param {DOMHighResTimeStamp} [time] - The current time in milliseconds.
	 * @param {boolean} [requestFrame=true] - Whether to request the next animation frame.
	 * @private
	 */
	#animateToTarget(time, requestFrame = true) {
		const _ = this;

		// defaults to pre-calculated time interval
		let timeDeltaFactor = defaultTimeDeltaFactor;

		// exit if we stopped animation
		if (!_.#isAnimating) return;

		// check to see if we have a current and previous time
		// if we do then we can calculate exact animation value
		if (time !== undefined && _.#prevTime !== undefined) {
			// calculate timeDelta
			const timeDelta = time - _.#prevTime;

			// compare to 60 fps - 16.66 ms
			timeDeltaFactor = timeDelta / 16.66;

			// average with default time delta factor
			defaultTimeDeltaFactor = (defaultTimeDeltaFactor + timeDeltaFactor) / 2;
		}

		// save previous time
		_.#prevTime = time;

		// calculate attraction
		let force = (_.#targetX - _.#currentX) * _.#attraction;

		// apply attraction to increase velocity towards target
		_.#velocity += force * timeDeltaFactor;

		// apply friction (after applying velocity to x position)
		_.#velocity *= Math.pow(_.#frictionFactor, timeDeltaFactor);

		// apply velocity to position
		_.#currentX += _.#velocity * timeDeltaFactor;

		// apply animation to DOM
		_.#element.style.transform = `translate3d(${_.#currentX}px,0,0)`;

		// Stop after the wobble has settled
		if (Math.abs(_.#currentX - _.#targetX) < 0.20) {
			_.#finishAnimation();
			return;
		}

		// don't request next frame
		if (!requestFrame) return;

		// tell browser to request another frame 
		requestAnimationFrame(time => _.#animateToTarget(time));
	}

		

	#finishAnimation() {
		const _ = this;
		// stop the animation
		_.#isAnimating = false;
		// clear velocity
		_.#velocity = 0;
		_.#prevTime = null;
		// set current position to target
		_.#currentX = _.#targetX;
		// set DOM element to target
		_.#element.style.transform = `translateX(${_.#targetX}px)`;
		// trigger animation did finish event for any event hooks
		_.#eventEmitter.emit('animationDidFinish');
	}

	/**
	 * Jumps the element to the target position without animation.
	 */
	jumpToTarget() {
		const _ = this;
		// set current to target so they're the same
		_.#currentX = _.#targetX;
		// set DOM element to target position
		_.#element.style.transform = `translateX(${_.#targetX}px)`;
	}

	/**
	 * Sets the attraction value.
	 * @param {number} attraction - The attraction value for physics-based animation (floating point).
	 */
	setAttraction(attraction) {
		this.#attraction = attraction;
	}

	/**
	 * Sets the friction value.
	 * @param {number} friction - The friction value for physics-based animation (floating point).
	 */
	setFriction(friction) {
		const _ = this;
		_.#friction = friction;
		_.#frictionFactor = 1 - friction;
	}

	/**
	 * Gets the current X position.
	 * @returns {number} - The current X position.
	 */
	getCurrentXPos() {
		return this.#currentX;
	}

	getIsAnimating() {
		return this.#isAnimating;
	}

	/**
	 * Adds an event listener for the specified event.
	 * @param {string} eventName - The name of the event.
	 * @param {function} eventFunction - The function to call when the event is triggered.
	 */
	on(eventName, eventFunction) {
		this.#eventEmitter.on(eventName, eventFunction);
	}

	/**
	 * Removes an event listener for the specified event.
	 * @param {string} eventName - The name of the event.
	 * @param {function} eventFunction - The function to remove.
	 */
	off(eventName, eventFunction) {
		this.#eventEmitter.off(eventName, eventFunction);
	}

}


// Conditional export as Universal Module
if (typeof module !== 'undefined' && module.exports) {
	// CommonJS (Node.js) export
	module.exports = DPAnimateXPos;
} else if (typeof define === 'function' && define.amd) {
	// AMD (RequireJS) export
	define([], () => DPAnimateXPos);
} else if (typeof window !== 'undefined') {
	// Browser global export
	window.DPAnimateXPos = DPAnimateXPos;
}