/**
 * A class to calculate intermediate states (tweens) between keyframes for CSS properties.
 */
class DPTweenCalculator {
  /**
   * Create a DPTweenCalculator.
   * @param {Object[]} keyframes - Array of keyframe objects, each containing a percent and styles.
   */
  constructor(keyframes) {
    const _ = this;
    _.keyframes = keyframes.sort((a, b) => a.percent - b.percent);
    _.discreteProperties = [
      // Layout
      'display', 'position', 'float', 'clear', 'visibility', 'overflow', 'overflow-x', 'overflow-y',
      
      // Flexbox and Grid
      'flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'align-content', 'order',
      'grid-template-columns', 'grid-template-rows', 'grid-template-areas', 'grid-auto-flow',
      
      // Positioning
      'z-index',
      
      // Table
      'table-layout', 'empty-cells', 'caption-side',
      
      // List
      'list-style-type', 'list-style-position',
      
      // Miscellaneous
      'pointer-events', 'user-select', 'box-sizing', 'resize',
      
      // Text and Font
      'text-align', 'text-transform', 'white-space', 'word-break', 'word-wrap', 'font-style', 'font-weight', 'font-variant',
      
      // Background
      'background-repeat', 'background-attachment', 'background-position',
      
      // Border
      'border-style', 'border-collapse',
      
      // Generated content
      'content',
      
      // Paged media
      'page-break-before', 'page-break-after', 'page-break-inside'
    ];
  }

  /**
   * Calculate the tween state at a given percentage.
   * @param {number} position - The percentage (0-100) at which to calculate the tween.
   * @returns {Object} An object containing the interpolated styles.
   */
  calculateTween(position) {
    const _ = this;
    const interpolatedStyles = {};

    // Iterate through all properties across all keyframes
    const allProperties = new Set(_.keyframes.flatMap(kf => Object.keys(kf.styles)));

    for (const prop of allProperties) {
      interpolatedStyles[prop] = _.interpolateProperty(prop, position);
    }

    return interpolatedStyles;
  }

  /**
   * Interpolate a single property across all keyframes.
   * @param {string} prop - The name of the property to interpolate.
   * @param {number} position - The position (0-100) at which to interpolate.
   * @returns {*} The interpolated value of the property.
   */
  interpolateProperty(prop, position) {
    const _ = this;
    
    if (_.discreteProperties.includes(prop)) {
      return _.interpolateDiscreteProperty(prop, position);
    }

    const relevantKeyframes = _.keyframes.filter(kf => prop in kf.styles);
    if (relevantKeyframes.length === 0) return null;
    if (relevantKeyframes.length === 1) return relevantKeyframes[0].styles[prop];

    // Find the two keyframes that surround the current position
    let startFrame = relevantKeyframes[0];
    let endFrame = relevantKeyframes[relevantKeyframes.length - 1];
    for (let i = 0; i < relevantKeyframes.length - 1; i++) {
      if (position >= relevantKeyframes[i].percent && position <= relevantKeyframes[i + 1].percent) {
        startFrame = relevantKeyframes[i];
        endFrame = relevantKeyframes[i + 1];
        break;
      }
    }

    const startValue = startFrame.styles[prop];
    const endValue = endFrame.styles[prop];
    const factor = (position - startFrame.percent) / (endFrame.percent - startFrame.percent);

    if (prop === 'transform') {
      return _.interpolateTransform(startValue, endValue, factor);
    }

    return _.interpolateValue(startValue, endValue, factor);
  }

  /**
   * Interpolate discrete properties.
   * @param {string} prop - The name of the discrete property.
   * @param {number} position - The position (0-100) at which to interpolate.
   * @returns {*} The value of the discrete property at the given position.
   */
  interpolateDiscreteProperty(prop, position) {
    const _ = this;
    const relevantKeyframes = _.keyframes.filter(kf => prop in kf.styles);
    if (relevantKeyframes.length === 0) return null;
    
    // Find the last keyframe that's at or before the current position
    const activeKeyframe = relevantKeyframes.reduce((prev, curr) => 
      (curr.percent <= position && curr.percent > prev.percent) ? curr : prev
    );

    return activeKeyframe.styles[prop];
  }


  /**
   * Interpolate between two transform values.
   * @param {string} startTransform - The starting transform value.
   * @param {string} endTransform - The ending transform value.
   * @param {number} factor - The interpolation factor (0-1).
   * @returns {string} The interpolated transform value.
   */
  interpolateTransform(startTransform, endTransform, factor) {
    const _ = this;
    const startFunctions = _.parseTransform(startTransform);
    const endFunctions = _.parseTransform(endTransform);

    const interpolatedFunctions = [];

    // Interpolate functions that exist in both start and end
    const allFunctions = new Set([...Object.keys(startFunctions), ...Object.keys(endFunctions)]);
    for (const func of allFunctions) {
      const start = startFunctions[func] || endFunctions[func];
      const end = endFunctions[func] || startFunctions[func];
      const interpolatedValue = _.interpolateValue(start.value, end.value, factor);
      interpolatedFunctions.push(`${func}(${interpolatedValue}${start.unit || ''})`);
    }

    return interpolatedFunctions.join(' ');
  }

  /**
   * Parse a transform string into an object of transform functions.
   * @param {string} transform - The transform string to parse.
   * @returns {Object} An object where keys are function names and values are objects with value and unit.
   */
  parseTransform(transform) {
    const functions = {};
    const regex = /(\w+)\(([^)]+)\)/g;
    let match;
    while ((match = regex.exec(transform)) !== null) {
      const [, func, args] = match;
      const value = parseFloat(args);
      const unit = args.replace(value.toString(), '').trim();
      functions[func] = { value, unit };
    }
    return functions;
  }

  /**
   * Interpolate between two values.
   * @param {*} start - The starting value.
   * @param {*} end - The ending value.
   * @param {number} factor - The interpolation factor (0-1).
   * @returns {*} The interpolated value.
   */
  interpolateValue(start, end, factor) {
    const _ = this;

    // Handle color interpolation
    if (_.isColor(start) && _.isColor(end)) {
      return _.interpolateColor(start, end, factor);
    }

    // Handle numeric values with units
    const startParsed = _.parseValue(start);
    const endParsed = _.parseValue(end);

    if (startParsed && endParsed) {
      const interpolatedValue = startParsed.value + (endParsed.value - startParsed.value) * factor;
      return `${interpolatedValue.toFixed(2)}${startParsed.unit || ''}`;
    }

    // For any other case, use discrete steps but ensure smooth transition
    return factor < 1 ? start : end;
  }

  /**
   * Parse a value into its numeric part and unit.
   * @param {string|number} value - The value to parse.
   * @returns {Object|null} An object with value and unit properties, or null if parsing fails.
   */
  parseValue(value) {
    if (typeof value === 'number') {
      return { value: value, unit: '' };
    }
    const match = String(value).match(/^(-?\d*\.?\d+)(\D*)$/);
    if (match) {
      return { value: parseFloat(match[1]), unit: match[2] };
    }
    return null;
  }

  /**
   * Check if a value is a valid color (supports hex, rgb, rgba, hsl, hsla).
   * @param {string} value - The value to check.
   * @returns {boolean} True if the value is a valid color, false otherwise.
   */
  isColor(value) {
    return /^(#[0-9A-Fa-f]{6}|rgb\(.*\)|rgba\(.*\)|hsl\(.*\)|hsla\(.*\))$/.test(value);
  }

  /**
   * Interpolate between two colors.
   * @param {string} start - The starting color.
   * @param {string} end - The ending color.
   * @param {number} factor - The interpolation factor (0-1).
   * @returns {string} The interpolated color.
   */
  interpolateColor(start, end, factor) {
    const _ = this;
    
    // Convert both colors to RGB
    const startRGB = _.colorToRGB(start);
    const endRGB = _.colorToRGB(end);

    // Interpolate each channel
    const r = Math.round(startRGB[0] + factor * (endRGB[0] - startRGB[0]));
    const g = Math.round(startRGB[1] + factor * (endRGB[1] - startRGB[1]));
    const b = Math.round(startRGB[2] + factor * (endRGB[2] - startRGB[2]));

    // Convert back to hex
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  /**
   * Convert a color to RGB values.
   * @param {string} color - The color to convert (hex, rgb, rgba, hsl, hsla).
   * @returns {number[]} An array of RGB values.
   */
  colorToRGB(color) {
    const _ = this;
    if (color.startsWith('#')) {
      return [
        parseInt(color.slice(1, 3), 16),
        parseInt(color.slice(3, 5), 16),
        parseInt(color.slice(5, 7), 16)
      ];
    }
    // For simplicity, we'll just return a default color for non-hex colors
    // In a full implementation, you'd want to properly parse rgb, rgba, hsl, and hsla
    return [0, 0, 0];
  }
}

// Conditional export as ESM module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DPTweenCalculator;
} else if (typeof define === 'function' && define.amd) {
  define([], () => DPTweenCalculator);
} else if (typeof window !== 'undefined') {
  window.DPTweenCalculator = DPTweenCalculator;
}
