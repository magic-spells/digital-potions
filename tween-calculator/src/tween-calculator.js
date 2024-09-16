/**
 * A class to calculate intermediate states (tweens) between keyframes for CSS properties.
 */
export default class TweenCalculator {
  /**
   * Create a TweenCalculator.
   * @param {Object[]} keyframes - Array of keyframe objects, each containing a percent (0-100) and styles.
   */
  constructor(keyframes) {
    this.setKeyframes(keyframes);
    this.discreteProperties = [
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
   * Calculate the tween state at a given normalized position.
   * @param {number} position - The normalized position (0-1) at which to calculate the tween. Values outside 0-1 are allowed.
   * @returns {Object} An object containing the interpolated styles.
   */
  calculateTween(position) {
    const interpolatedStyles = {};

    // Normalize position to percentage (0-100)
    const percent = position * 100;

    // Iterate through all properties across all keyframes
    const allProperties = new Set(this.keyframes.flatMap(kf => Object.keys(kf.styles)));

    for (const prop of allProperties) {
      interpolatedStyles[prop] = this.interpolateProperty(prop, percent);
    }

    return interpolatedStyles;
  }

  /**
   * Interpolate a single property across all keyframes.
   * Supports extrapolation beyond the first and last keyframes.
   * @param {string} prop - The name of the property to interpolate.
   * @param {number} percent - The position (0-100) at which to interpolate.
   * @returns {*} The interpolated value of the property.
   */
  interpolateProperty(prop, percent) {
    if (this.discreteProperties.includes(prop)) {
      return this.interpolateDiscreteProperty(prop, percent);
    }

    const relevantKeyframes = this.keyframes.filter(kf => prop in kf.styles);
    if (relevantKeyframes.length === 0) return null;

    const firstFrame = relevantKeyframes[0];
    const lastFrame = relevantKeyframes[relevantKeyframes.length - 1];

    if (percent < firstFrame.percent) {
      return this.handleExtrapolation(prop, percent, firstFrame, relevantKeyframes[1] || firstFrame, 'below');
    } else if (percent > lastFrame.percent) {
      return this.handleExtrapolation(prop, percent, relevantKeyframes[relevantKeyframes.length - 2] || lastFrame, lastFrame, 'above');
    } else {
      const { startFrame, endFrame } = this.findSurroundingKeyframes(relevantKeyframes, percent);
      return this.handleInterpolation(prop, percent, startFrame, endFrame);
    }
  }

  /**
   * Handle extrapolation beyond the keyframes.
   * @param {string} prop - The name of the property to extrapolate.
   * @param {number} percent - The position to extrapolate.
   * @param {Object} startFrame - The starting keyframe.
   * @param {Object} endFrame - The ending keyframe.
   * @param {string} direction - 'above' or 'below'.
   * @returns {*} The extrapolated value.
   */
  handleExtrapolation(prop, percent, startFrame, endFrame, direction) {
    const factor = (percent - startFrame.percent) / (endFrame.percent - startFrame.percent);
    const startValue = startFrame.styles[prop];
    const endValue = endFrame.styles[prop];

    if (prop === 'transform') {
      return this.extrapolateTransform(startValue, endValue, factor, direction);
    }

    return this.interpolateNumericValues(startValue, endValue, factor, direction);
  }

  /**
   * Handle interpolation between keyframes.
   * @param {string} prop - The name of the property to interpolate.
   * @param {number} percent - The position to interpolate.
   * @param {Object} startFrame - The starting keyframe.
   * @param {Object} endFrame - The ending keyframe.
   * @returns {*} The interpolated value.
   */
  handleInterpolation(prop, percent, startFrame, endFrame) {
    const factor = (percent - startFrame.percent) / (endFrame.percent - startFrame.percent);
    const startValue = startFrame.styles[prop];
    const endValue = endFrame.styles[prop];

    if (prop === 'transform') {
      return this.interpolateTransform(startValue, endValue, factor);
    } else if (prop === 'filter') {
      return this.interpolateFilter(startValue, endValue, factor);
    }

    return this.interpolateValue(startValue, endValue, factor);
  }

  interpolateFilter(startFilter, endFilter, factor) {
    const startFunctions = this.parseFilter(startFilter);
    const endFunctions = this.parseFilter(endFilter);

    const interpolatedFunctions = [];
    const allFunctions = new Set([...Object.keys(startFunctions), ...Object.keys(endFunctions)]);

    for (const func of allFunctions) {
      const start = startFunctions[func] || { value: 0, unit: this.getDefaultFilterUnit(func) };
      const end = endFunctions[func] || { value: start.value, unit: start.unit };
      
      const interpolatedValue = this.interpolateValue(start.value, end.value, factor);
      interpolatedFunctions.push(`${func}(${interpolatedValue}${start.unit})`);
    }

    return interpolatedFunctions.join(' ');
  }

  parseFilter(filter) {
    const functions = {};
    const regex = /(\w+)\(([^)]+)\)/g;
    let match;
    while ((match = regex.exec(filter)) !== null) {
      const [, func, arg] = match;
      const { value, unit } = this.parseValue(arg);
      functions[func] = { value, unit };
    }
    return functions;
  }

  getDefaultFilterUnit(func) {
    switch (func) {
      case 'blur':
        return 'px';
      case 'hue-rotate':
        return 'deg';
      default:
        return '%';
    }
  }

   interpolateTransform(startTransform, endTransform, factor) {
    const _ = this;
    const startFunctions = _.parseTransform(startTransform);
    const endFunctions = _.parseTransform(endTransform);

    const interpolatedFunctions = [];

    const allFunctions = new Set([...Object.keys(startFunctions), ...Object.keys(endFunctions)]);
    for (const func of allFunctions) {
      const start = startFunctions[func] || (_.isNumericFunction(func) ? { value: 0, unit: 'px' } : { value: 0, unit: '' });
      const end = endFunctions[func] || { value: start.value, unit: start.unit };
      
      if (Array.isArray(start.value)) {
        const interpolatedArgs = start.value.map((arg, index) => {
          const endArg = (end.value[index] !== undefined) ? end.value[index] : { value: arg.value, unit: arg.unit };
          const interpolatedValue = _.interpolateValue(arg.value, endArg.value, factor, true);
          return `${interpolatedValue}${arg.unit || ''}`;
        });
        interpolatedFunctions.push(`${func}(${interpolatedArgs.join(', ')})`);
      } else {
        const interpolatedValue = _.interpolateValue(start.value, end.value, factor, true);
        interpolatedFunctions.push(`${func}(${interpolatedValue}${start.unit || ''})`);
      }
    }

    return interpolatedFunctions.join(' ');
  }

  /**
   * Find the keyframes surrounding the current percent.
   * @param {Object[]} keyframes - Array of relevant keyframes.
   * @param {number} percent - The current percentage.
   * @returns {Object} The surrounding startFrame and endFrame.
   */
  findSurroundingKeyframes(keyframes, percent) {
    let startFrame = keyframes[0];
    let endFrame = keyframes[keyframes.length - 1];
    for (let i = 0; i < keyframes.length - 1; i++) {
      if (percent >= keyframes[i].percent && percent <= keyframes[i + 1].percent) {
        startFrame = keyframes[i];
        endFrame = keyframes[i + 1];
        break;
      }
    }
    return { startFrame, endFrame };
  }

  /**
   * Interpolate numeric values with optional units.
   * @param {number|string} start - The starting value.
   * @param {number|string} end - The ending value.
   * @param {number} factor - The interpolation factor.
   * @returns {string|number} The interpolated value.
   */
  interpolateNumericValues(start, end, factor) {
    const startParsed = this.parseValue(start);
    const endParsed = this.parseValue(end);

    if (startParsed && endParsed && startParsed.unit === endParsed.unit) {
      const value = startParsed.value + (endParsed.value - startParsed.value) * factor;
      return `${this.formatNumber(value)}${startParsed.unit || ''}`;
    }

    return factor < 1 ? start : end;
  }

  /**
   * Interpolate between two values.
   * Supports extrapolation beyond keyframes.
   * @param {*} start - The starting value.
   * @param {*} end - The ending value.
   * @param {number} factor - The interpolation factor (can be <0 or >1 for extrapolation).
   * @returns {*} The interpolated value of the property.
   */
  interpolateValue(start, end, factor) {
    // Handle color interpolation
    if (this.isColor(start) && this.isColor(end)) {
      return this.interpolateColor(start, end, factor);
    }

    // Handle numeric values without units
    if (typeof start === 'number' && typeof end === 'number') {
      return this.formatNumber(start + (end - start) * factor);
    }

    // Handle numeric values with units
    return this.interpolateNumericValues(start, end, factor);
  }

  /**
   * Extrapolate a transform string beyond the keyframes.
   * @param {string} startTransform - The starting transform value.
   * @param {string} endTransform - The ending transform value.
   * @param {number} factor - The extrapolation factor.
   * @param {string} direction - 'above' or 'below' to indicate extrapolation direction.
   * @returns {string} The extrapolated transform value.
   */
  extrapolateTransform(startTransform, endTransform, factor, direction) {
    const startFunctions = this.parseTransform(startTransform);
    const endFunctions = this.parseTransform(endTransform);

    const interpolatedFunctions = [];
    const allFunctions = new Set([...Object.keys(startFunctions), ...Object.keys(endFunctions)]);
    for (const func of allFunctions) {
      const start = startFunctions[func] || { value: 0, unit: 'px' };
      const end = endFunctions[func] || { value: start.value, unit: start.unit };

      if (Array.isArray(start.value)) {
        const interpolatedArgs = start.value.map((arg, index) => {
          const endArg = end.value[index] || { value: arg.value, unit: arg.unit };
          return this.formatNumber(arg.value + (endArg.value - arg.value) * factor);
        });
        interpolatedFunctions.push(`${func}(${interpolatedArgs.join(', ')})`);
      } else {
        const interpolatedValue = this.formatNumber(start.value + (end.value - start.value) * factor);
        interpolatedFunctions.push(`${func}(${interpolatedValue}${start.unit || ''})`);
      }
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
      const argParts = args.split(/\s*,\s*|\s+/).map(arg => {
        const valueMatch = arg.match(/^(-?\d*\.?\d+)(\D*)$/);
        return valueMatch ? { value: parseFloat(valueMatch[1]), unit: valueMatch[2] } : { value: 0, unit: '' };
      });
      functions[func] = argParts.length > 1 ? argParts : argParts[0];
    }
    return functions;
  }

  /**
   * Format a number to remove unnecessary decimal places.
   * @param {number} num - The number to format.
   * @returns {string} The formatted number as a string.
   */
  formatNumber(num) {
    return parseFloat(Number(num).toFixed(4)).toString();
  }

  /**
   * Interpolate discrete properties.
   * @param {string} prop - The name of the discrete property.
   * @param {number} percent - The position (0-100) at which to interpolate.
   * @returns {*} The value of the discrete property at the given position.
   */
  interpolateDiscreteProperty(prop, percent) {
    const relevantKeyframes = this.keyframes.filter(kf => prop in kf.styles);
    if (relevantKeyframes.length === 0) return null;

    const activeKeyframe = relevantKeyframes.reduce((prev, curr) =>
      (curr.percent <= percent && curr.percent > prev.percent) ? curr : prev
    );

    return activeKeyframe.styles[prop];
  }

  /**
   * Update the keyframes.
   * @param {Object[]} keyframes - Array of keyframe objects, each containing a percent and styles.
   */
  setKeyframes(keyframes) {
    this.keyframes = keyframes.sort((a, b) => a.percent - b.percent);
  }

  /**
   * Check if a value is a valid color.
   * @param {string} value - The value to check.
   * @returns {boolean} True if the value is a valid color, false otherwise.
   */
  isColor(value) {
    return /^(#[0-9A-Fa-f]{6}|rgb|hsl|rgba|hsla)/.test(value);
  }

  /**
   * Interpolate between two colors.
   * @param {string} start - The starting color.
   * @param {string} end - The ending color.
   * @param {number} factor - The interpolation factor.
   * @returns {string} The interpolated color.
   */
  interpolateColor(start, end, factor) {
    const startRGB = this.colorToRGB(start);
    const endRGB = this.colorToRGB(end);

    const r = Math.round(startRGB[0] + (endRGB[0] - startRGB[0]) * factor);
    const g = Math.round(startRGB[1] + (endRGB[1] - startRGB[1]) * factor);
    const b = Math.round(startRGB[2] + (endRGB[2] - startRGB[2]) * factor);

    return `rgb(${r},${g},${b})`;
  }

  /**
   * Convert a color to RGB values.
   * @param {string} color - The color to convert.
   * @returns {number[]} An array of RGB values.
   */
  colorToRGB(color) {
    if (color.startsWith('#')) {
      return [
        parseInt(color.slice(1, 3), 16),
        parseInt(color.slice(3, 5), 16),
        parseInt(color.slice(5, 7), 16)
      ];
    }
    // Add additional color format handling as needed
    return [0, 0, 0];
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
}
