// Improved getFocusableElements function
const getFocusableElements = (container) => {
  const focusableSelectors = 'summary, a[href], button:not(:disabled), [tabindex]:not([tabindex^="-"]):not(focus-trap-start):not(focus-trap-end), [draggable], area, input:not([type=hidden]):not(:disabled), select:not(:disabled), textarea:not(:disabled), object, iframe';
  return Array.from(container.querySelectorAll(focusableSelectors));
}

class FocusTrap extends HTMLElement {

  static styleInjected = false;

  constructor() {
    super();
    this.trapStart = null;
    this.trapEnd = null;

    if (!FocusTrap.styleInjected) {
      this.injectStyles();
      FocusTrap.styleInjected = true;
    }
  }

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

  connectedCallback() {
    this.setupTrap();
    this.addEventListener('keydown', this.handleKeyDown);
  }

  disconnectedCallback() {
    this.removeEventListener('keydown', this.handleKeyDown);
  }

  setupTrap() {
    const focusableElements = getFocusableElements(this);
    if (focusableElements.length === 0) return;

    this.trapStart = document.createElement("focus-trap-start");
    this.trapEnd = document.createElement("focus-trap-end");

    this.prepend(this.trapStart);
    this.append(this.trapEnd);

    requestAnimationFrame(() => {
      this.trapStart.focus();
    });
  }

  handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      this.exitTrap();
    }
  }

  exitTrap() {
    const container = this.closest('[aria-hidden="false"]');
    if (!container) return;

    container.setAttribute('aria-hidden', 'true');

    const trigger = document.querySelector(`[aria-expanded="true"][aria-controls="${container.id}"]`);
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
    }
  }
}

class FocusTrapStart extends HTMLElement {
  connectedCallback() {
    this.setAttribute('tabindex', '0');
    this.addEventListener('focus', this.handleFocus);
  }

  disconnectedCallback() {
    this.removeEventListener('focus', this.handleFocus);
  }

  handleFocus = (e) => {
    const trap = this.closest('focus-trap');
    const focusableElements = getFocusableElements(trap);
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.relatedTarget === firstElement) {
      lastElement.focus();
    } else {
      firstElement.focus();
    }
  }
}

class FocusTrapEnd extends HTMLElement {
  connectedCallback() {
    this.setAttribute('tabindex', '0');
    this.addEventListener('focus', this.handleFocus);
  }

  disconnectedCallback() {
    this.removeEventListener('focus', this.handleFocus);
  }

  handleFocus = () => {
    const trap = this.closest('focus-trap');
    const trapStart = trap.querySelector('focus-trap-start');
    trapStart.focus();
  }
}

customElements.define('focus-trap', FocusTrap);
customElements.define('focus-trap-start', FocusTrapStart);
customElements.define('focus-trap-end', FocusTrapEnd);

// Global keydown event listener (unchanged)
document.addEventListener('keydown', function(e) {
  if (e.key !== "Enter") return;
  const trigger = e.target.closest('[aria-controls]');
  if (!trigger) return;
  
  e.preventDefault();

  const panelId = trigger.getAttribute("aria-controls");
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