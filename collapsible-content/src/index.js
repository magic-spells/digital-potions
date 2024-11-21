// Collapsible content component
class CollapsibleContent extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		// Set initial height if hidden
		if (this.hidden) {
			this.style.height = "0";
		}
	}

	// Override hidden property to animate height
	set hidden(value) {
		if (value) {
			const height = this.scrollHeight;
			// Force a repaint to ensure the animation runs
			this.offsetHeight;
			this.style.height = "0";
		} else {
			this.style.height = `${this.scrollHeight}px`;
		}

		// Use hidden attribute for accessibility
		if (value) {
			this.setAttribute("hidden", "");
		} else {
			this.removeAttribute("hidden");
		}
	}

	get hidden() {
		return this.hasAttribute("hidden");
	}
}

// Main collapsible component
class CollapsibleComponent extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		const button = this.querySelector("button");
		const content = this.querySelector("collapsible-content");

		if (!button || !content) {
			console.error(
				"CollapsibleComponent requires a <button> and a <collapsible-content>.",
			);
			return;
		}

		// Generate unique IDs if not present
		if (!button.id) {
			button.id = `collapsible-button-${Math.random().toString(36).substr(2, 9)}`;
		}
		if (!content.id) {
			content.id = `collapsible-content-${Math.random().toString(36).substr(2, 9)}`;
		}

		// Associate button and content via ARIA attributes
		button.setAttribute("aria-controls", content.id);
		content.setAttribute("role", "region");
		content.setAttribute("aria-labelledby", button.id);

		// Set initial state
		let expanded = button.getAttribute("aria-expanded") === "true";
		content.hidden = !expanded;

		// Add click event listener to toggle content
		button.addEventListener("click", () => {
			expanded = !expanded;
			button.setAttribute("aria-expanded", expanded);
			content.hidden = !expanded;
		});
	}
}

// Define the custom elements
customElements.define("collapsible-content", CollapsibleContent);
customElements.define("collapsible-component", CollapsibleComponent);
