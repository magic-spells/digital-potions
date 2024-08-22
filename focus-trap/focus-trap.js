
document.addEventListener( 'keydown', function(e) {
  
  if (e.key != "Enter") return;
  if (!e.target.closest('[aria-controls]')) return;
  
  e.preventDefault();

  let trigger = e.target;
  let panelId = trigger.getAttribute("aria-controls");
  let panel = document.getElementById(panelId);
  if (panel == undefined) return;
  let trapStart = panel.querySelector('focus-trap-start')
  if (trapStart == undefined) return;

  trigger.setAttribute('aria-expanded', 'true')
  panel.setAttribute('aria-hidden', 'false')

  // Give DOM a moment to refactor itself
  setTimeout(function(){
    trapStart.focus()
  }, 200)
});


const getFocusableElements = (container) => {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']):not(focus-trap-start):not(focus-trap-end), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  )
}


class FocusTrap extends HTMLElement {

  constructor() {
    super();

    if ( getFocusableElements(this).length == 0 ) return;
    let focusTrapStart = document.createElement("focus-trap-start")
    focusTrapStart.focus({preventScroll: true});

    this.prepend(focusTrapStart);
    this.append(document.createElement("focus-trap-end"));

    window.setTimeout(function (){
      focusTrapStart.focus({preventScroll: true});
    }, 5);

    this.addEventListener( 'keydown', (e) => {
      if (e.key == "Escape"){
        e.preventDefault()
        this.exitTrap()
      }
    });
  }

  exitTrap() {
    let container = this.closest('[aria-hidden=false]');

    if (container == undefined) return;

    // Hide panel
    container.setAttribute('aria-hidden', 'true');

    // Find original trigger button
    let trigger = document.querySelector(`[aria-expanded="true"][aria-controls="${container.id}"]`);
    if (!trigger) return;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus();
  }


  connectedCallback() {
    // browser calls this method when the element is added to the document
    // (can be called many times if an element is repeatedly added/removed)
  }

  disconnectedCallback() {
    // browser calls this method when the element is removed from the document
    // (can be called many times if an element is repeatedly added/removed)
  }

  static get observedAttributes() {
    return [/* array of attribute names to monitor for changes */];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // called when one of attributes listed above is modified
  }

  adoptedCallback() {
    // called when the element is moved to a new document
    // (happens in document.adoptNode, very rarely used)
  }

  // there can be other element methods and properties
}


 

class FocusTrapStart extends HTMLElement {
  constructor() {
    super();

    // Make sure this is focusable
    this.setAttribute('tabindex', 0);
  
    this.addEventListener( 'focus', (e) => {
      let relatedElement = e.relatedTarget;
      let trap = this.closest('focus-trap');
      let focusableElements = getFocusableElements(trap);
      
      // No focusable elements in trap scope
      if (focusableElements.length == 0) return;
     
      // If we are going in reverse, focus the last element
      if ( relatedElement == focusableElements[0] ) {
        focusableElements[ focusableElements.length - 1 ].focus();
        return
      }
      
      focusableElements[0].focus()
    })


  }

  connectedCallback() {
    // browser calls this method when the element is added to the document
    // (can be called many times if an element is repeatedly added/removed)
  }

  disconnectedCallback() {
    // browser calls this method when the element is removed from the document
    // (can be called many times if an element is repeatedly added/removed)
  }

  static get observedAttributes() {
    return [/* array of attribute names to monitor for changes */];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // called when one of attributes listed above is modified
  }

  adoptedCallback() {
    // called when the element is moved to a new document
    // (happens in document.adoptNode, very rarely used)
  }

  // there can be other element methods and properties
}

class FocusTrapEnd extends HTMLElement {
  constructor() {
    super();

    // Make sure this is focusable
    this.setAttribute('tabindex', 0);

    this.addEventListener( 'focus', (e) => {
        let trap = this.closest('focus-trap')
        trap.querySelector('focus-trap-start').focus()
      }
    );
    
  }


  connectedCallback() {
    // browser calls this method when the element is added to the document
    // (can be called many times if an element is repeatedly added/removed)
  }

  disconnectedCallback() {
    // browser calls this method when the element is removed from the document
    // (can be called many times if an element is repeatedly added/removed)
  }

  static get observedAttributes() {
    return [/* array of attribute names to monitor for changes */];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // called when one of attributes listed above is modified
  }

  adoptedCallback() {
    // called when the element is moved to a new document
    // (happens in document.adoptNode, very rarely used)
  }

  // there can be other element methods and properties
}


customElements.define('focus-trap', FocusTrap);
customElements.define('focus-trap-start', FocusTrapStart);
customElements.define('focus-trap-end', FocusTrapEnd);


