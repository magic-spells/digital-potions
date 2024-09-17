
// import EventEmitter from '../../event-emitter/dp-event-emitter';

export default class PhysicsAnimator {

	/**
	 * Creates an instance of PhysicsAnimator.
	 * @param {number} [attraction=0.026] - The attraction value for physics-based animation (0 < attraction < 1).
	 * @param {number} [friction=0.28] - The friction value for physics-based animation (0 < friction < 1).
	 */
	constructor({ attraction = 0.026, friction = 0.28 } = {}) {

		// Validate attraction
		if (typeof attraction !== 'number' || attraction < 0 || attraction > 1) {
			throw new Error('Attraction must be a number between 0 and 1.');
		}
		// Validate friction
		if (typeof friction !== 'number' || friction < 0 || friction > 1) {
			throw new Error('Friction must be a number between 0 and 1.');
		}

		this.attraction = attraction;
		this.friction = friction;
		this.frictionFactor = 1 - friction;

		this.velocity = 0;
		this.currentValue = 0;
		this.targetValue = 0;

		this.isAnimating = false;
		this.prevTime = null;
	}

	/**
	 * Animates from a start value to an end value.
	 * @param {number} startValue - The starting value.
	 * @param {number} endValue - The target value.
	 * @param {function} callback - A callback function that receives the current value and progress.
	 */
	animateTo(startValue, endValue, velocity, callback) {

		return new Promise((resolve) => {

			this.currentValue = startValue;
			this.targetValue = endValue;
			this.velocity = velocity;
			this.isAnimating = true;
			this.prevTime = null;

			const animate = (time) => {
				if (!this.isAnimating) return;

				if (this.prevTime === null) {
					this.prevTime = time;
					requestAnimationFrame(animate);
					return;
				}

				const timeDelta = time - this.prevTime;
				const timeDeltaFactor = timeDelta / 16.66; // Assuming 60 FPS baseline

				this.prevTime = time;

				// Calculate attraction force
				const force = (this.targetValue - this.currentValue) * this.attraction;

				// Update velocity
				this.velocity += (force * timeDeltaFactor);

				// Apply friction
				this.velocity *= Math.pow(this.frictionFactor, timeDeltaFactor);

				// Update current value
				this.currentValue += this.velocity * timeDeltaFactor;

				// Calculate progress
				const totalDistance = this.targetValue - startValue;
				const distanceCovered = this.currentValue - startValue;
				let progress = 0;
				if (totalDistance !== 0) {
					progress = distanceCovered / totalDistance;
				}

				// Call the callback with the current value and progress
				// callback(this.currentValue, progress);
				callback({ position: this.currentValue, progress: progress})

				// Check if animation is complete
				if (Math.abs(this.currentValue - this.targetValue) < 0.01) {
					this.isAnimating = false;
					callback({ position: this.targetValue, progress: 1}); // Ensure we call the callback with final value
					resolve();
					return;
				}

				requestAnimationFrame(animate);
			};

			requestAnimationFrame(animate);

		});
	}

	/**
	 * Stops the ongoing animation.
	 */
	stop() {
		this.isAnimating = false;
	}

	/**
	 * Sets the attraction value
	 * @param {number} [attraction=0.026] - The attraction value for physics-based animation (0 < attraction < 1).
	 */
	setAttraction(attraction){
		if (typeof attraction !== 'number' || attraction < 0 || attraction > 1) {
			throw new Error('Attraction must be a number between 0 and 1.');
		}
		this.attraction = attraction;
	}

	/**
	 * Sets the friction value
	 * @param {number} [friction=0.28] - The friction value for physics-based animation (0 < friction < 1).
	 */
	setFriction(friction){
		if (typeof friction !== 'number' || friction < 0 || friction > 1) {
			throw new Error('Friction must be a number between 0 and 1.');
		}
		this.friction = friction;
		this.frictionFactor = 1 - friction;
	}
}

