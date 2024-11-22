(function (factory) {
	typeof define === 'function' && define.amd ? define(factory) :
	factory();
})((function () { 'use strict';

	/**
	 * Retrieves all focusable elements within a given container.
	 *
	 * @param {HTMLElement} container - The container element to search for focusable elements.
	 * @returns {HTMLElement[]} An array of focusable elements found within the container.
	 */
	const getFocusableElements = (container) => {
		const focusableSelectors =
			'summary, a[href], button:not(:disabled), [tabindex]:not([tabindex^="-"]):not(focus-trap-start):not(focus-trap-end), [draggable], area, input:not([type=hidden]):not(:disabled), select:not(:disabled), textarea:not(:disabled), object, iframe';
		return Array.from(container.querySelectorAll(focusableSelectors));
	};

	class FocusTrap extends HTMLElement {
		/** @type {boolean} Indicates whether the styles have been injected into the DOM. */
		static styleInjected = false;

		constructor() {
			super();
			this.trapStart = null;
			this.trapEnd = null;

			// Inject styles only once, when the first FocusTrap instance is created.
			if (!FocusTrap.styleInjected) {
				this.injectStyles();
				FocusTrap.styleInjected = true;
			}
		}

		/**
		 * Injects necessary styles for the focus trap into the document's head.
		 * This ensures that focus-trap-start and focus-trap-end elements are hidden.
		 */
		injectStyles() {
			const style = document.createElement('style');
			style.textContent = `
      focus-trap-start,
      focus-trap-end {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        padding: 0;
        border: 0;
        clip: rect(0, 0, 0, 0);
        overflow: hidden;
        white-space: nowrap;
      }
    `;
			document.head.appendChild(style);
		}

		/**
		 * Called when the element is connected to the DOM.
		 * Sets up the focus trap and adds the keydown event listener.
		 */
		connectedCallback() {
			this.setupTrap();
			this.addEventListener('keydown', this.handleKeyDown);
		}

		/**
		 * Called when the element is disconnected from the DOM.
		 * Removes the keydown event listener.
		 */
		disconnectedCallback() {
			this.removeEventListener('keydown', this.handleKeyDown);
		}

		/**
		 * Sets up the focus trap by adding trap start and trap end elements.
		 * Focuses the trap start element to initiate the focus trap.
		 */
		setupTrap() {
			const focusableElements = getFocusableElements(this);
			if (focusableElements.length === 0) return;

			this.trapStart = document.createElement('focus-trap-start');
			this.trapEnd = document.createElement('focus-trap-end');

			this.prepend(this.trapStart);
			this.append(this.trapEnd);

			requestAnimationFrame(() => {
				this.trapStart.focus();
			});
		}

		/**
		 * Handles the keydown event. If the Escape key is pressed, the focus trap is exited.
		 *
		 * @param {KeyboardEvent} e - The keyboard event object.
		 */
		handleKeyDown = (e) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				this.exitTrap();
			}
		};

		/**
		 * Exits the focus trap by hiding the current container and shifting focus
		 * back to the trigger element that opened the trap.
		 */
		exitTrap() {
			const container = this.closest('[aria-hidden="false"]');
			if (!container) return;

			container.setAttribute('aria-hidden', 'true');

			const trigger = document.querySelector(
				`[aria-expanded="true"][aria-controls="${container.id}"]`
			);
			if (trigger) {
				trigger.setAttribute('aria-expanded', 'false');
				trigger.focus();
			}
		}
	}

	class FocusTrapStart extends HTMLElement {
		/**
		 * Called when the element is connected to the DOM.
		 * Sets the tabindex and adds the focus event listener.
		 */
		connectedCallback() {
			this.setAttribute('tabindex', '0');
			this.addEventListener('focus', this.handleFocus);
		}

		/**
		 * Called when the element is disconnected from the DOM.
		 * Removes the focus event listener.
		 */
		disconnectedCallback() {
			this.removeEventListener('focus', this.handleFocus);
		}

		/**
		 * Handles the focus event. If focus moves backwards from the first focusable element,
		 * it is cycled to the last focusable element, and vice versa.
		 *
		 * @param {FocusEvent} e - The focus event object.
		 */
		handleFocus = (e) => {
			const trap = this.closest('focus-trap');
			const focusableElements = getFocusableElements(trap);

			if (focusableElements.length === 0) return;

			const firstElement = focusableElements[0];
			const lastElement =
				focusableElements[focusableElements.length - 1];

			if (e.relatedTarget === firstElement) {
				lastElement.focus();
			} else {
				firstElement.focus();
			}
		};
	}

	class FocusTrapEnd extends HTMLElement {
		/**
		 * Called when the element is connected to the DOM.
		 * Sets the tabindex and adds the focus event listener.
		 */
		connectedCallback() {
			this.setAttribute('tabindex', '0');
			this.addEventListener('focus', this.handleFocus);
		}

		/**
		 * Called when the element is disconnected from the DOM.
		 * Removes the focus event listener.
		 */
		disconnectedCallback() {
			this.removeEventListener('focus', this.handleFocus);
		}

		/**
		 * Handles the focus event. When the trap end is focused, focus is shifted back to the trap start.
		 */
		handleFocus = () => {
			const trap = this.closest('focus-trap');
			const trapStart = trap.querySelector('focus-trap-start');
			trapStart.focus();
		};
	}

	customElements.define('focus-trap', FocusTrap);
	customElements.define('focus-trap-start', FocusTrapStart);
	customElements.define('focus-trap-end', FocusTrapEnd);

	/**
	 * Global keydown event listener.
	 * Listens for the Enter key to trigger focus trapping on the associated panel.
	 *
	 * @param {KeyboardEvent} e - The keyboard event object.
	 */
	document.addEventListener('keydown', function (e) {
		if (e.key !== 'Enter') return;
		const trigger = e.target.closest('[aria-controls]');
		if (!trigger) return;

		e.preventDefault();

		const panelId = trigger.getAttribute('aria-controls');
		const panel = document.getElementById(panelId);
		if (!panel) return;
		const trapStart = panel.querySelector('focus-trap-start');
		if (!trapStart) return;

		trigger.setAttribute('aria-expanded', 'true');
		panel.setAttribute('aria-hidden', 'false');

		requestAnimationFrame(() => {
			trapStart.focus();
		});
	});

}));
//# sourceMappingURL=focus-trap.js.map
