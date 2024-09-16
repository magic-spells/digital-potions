/**
 * A class to calculate intermediate states (tweens) between keyframes for CSS properties.
 */
export default class TweenCalculator {
  /**
   * Create a TweenCalculator.
   * @param {Object[]} keyframes - Array of keyframe objects, each containing a percent (0-100) and styles.
   */
  constructor(keyframes) {
    const _ = this;
    _.setKeyframes(keyframes);
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
   * Calculate the tween state at a given normalized position.
   * @param {number} position - The normalized position (0-1) at which to calculate the tween. Values outside 0-1 are allowed.
   * @returns {Object} An object containing the interpolated styles.
   */
  calculateTween(position) {
    const _ = this;
    const interpolatedStyles = {};
    
    // Normalize position to percentage (0-100)
    const percent = position * 100;

    // Iterate through all properties across all keyframes
    const allProperties = new Set(_.keyframes.flatMap(kf => Object.keys(kf.styles)));

    for (const prop of allProperties) {
      interpolatedStyles[prop] = _.interpolateProperty(prop, percent);
    }

    return interpolatedStyles;
  }

  /**
   * Interpolate a single property across all keyframes.
   * @param {string} prop - The name of the property to interpolate.
   * @param {number} percent - The position (0-100) at which to interpolate.
   * @returns {*} The interpolated value of the property.
   */
  interpolateProperty(prop, percent) {
    const _ = this;
    
    if (_.discreteProperties.includes(prop)) {
      return _.interpolateDiscreteProperty(prop, percent);
    }

    const relevantKeyframes = _.keyframes.filter(kf => prop in kf.styles);
    if (relevantKeyframes.length === 0) return null;
    if (relevantKeyframes.length === 1) return relevantKeyframes[0].styles[prop];

    // Handle positions below the first keyframe
    if (percent <= relevantKeyframes[0].percent) {
      return relevantKeyframes[0].styles[prop];
    }

    // Handle positions above the last keyframe
    if (percent >= relevantKeyframes[relevantKeyframes.length - 1].percent) {
      return relevantKeyframes[relevantKeyframes.length - 1].styles[prop];
    }

    // Find the two keyframes that surround the current position
    let startFrame = relevantKeyframes[0];
    let endFrame = relevantKeyframes[relevantKeyframes.length - 1];
    for (let i = 0; i < relevantKeyframes.length - 1; i++) {
      if (percent >= relevantKeyframes[i].percent && percent <= relevantKeyframes[i + 1].percent) {
        startFrame = relevantKeyframes[i];
        endFrame = relevantKeyframes[i + 1];
        break;
      }
    }

    const startValue = startFrame.styles[prop];
    const endValue = endFrame.styles[prop];
    const factor = (percent - startFrame.percent) / (endFrame.percent - startFrame.percent);

    if (prop === 'transform') {
      return _.interpolateTransform(startValue, endValue, factor);
    }

    return _.interpolateValue(startValue, endValue, factor);
  }

  /**
   * Interpolate discrete properties.
   * @param {string} prop - The name of the discrete property.
   * @param {number} percent - The position (0-100) at which to interpolate.
   * @returns {*} The value of the discrete property at the given position.
   */
  interpolateDiscreteProperty(prop, percent) {
    const _ = this;
    const relevantKeyframes = _.keyframes.filter(kf => prop in kf.styles);
    if (relevantKeyframes.length === 0) return null;
    
    // Find the last keyframe that's at or before the current position
    const activeKeyframe = relevantKeyframes.reduce((prev, curr) => 
      (curr.percent <= percent && curr.percent > prev.percent) ? curr : prev
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
      const start = startFunctions[func] || (_.isNumericFunction(func) ? { value: 0, unit: 'px' } : { value: 0, unit: '' });
      const end = endFunctions[func] || { value: start.value, unit: start.unit };
      
      if (Array.isArray(start.value)) {
        // Handle functions with multiple arguments
        const interpolatedArgs = start.value.map((arg, index) => {
          const endArg = (end.value[index] !== undefined) ? end.value[index] : { value: arg.value, unit: arg.unit };
          const interpolatedValue = _.interpolateValue(arg.value, endArg.value, factor, true);
          return `${interpolatedValue}${arg.unit || ''}`;
        });
        interpolatedFunctions.push(`${func}(${interpolatedArgs.join(', ')})`);
      } else {
        // Interpolate the numeric value
        const interpolatedValue = _.interpolateValue(start.value, end.value, factor, true);
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
      
      // Handle multiple arguments, e.g., translateX(78.00px) translateY(50.00px)
      const argParts = args.split(/\s*,\s*|\s+/).map(arg => {
        const valueMatch = arg.match(/^(-?\d*\.?\d+)(\D*)$/);
        if (valueMatch) {
          return {
            value: parseFloat(valueMatch[1]),
            unit: valueMatch[2]
          };
        }
        return { value: 0, unit: '' };
      });

      // For functions with multiple arguments, store them as an array
      if (argParts.length > 1) {
        functions[func] = argParts;
      } else {
        functions[func] = argParts[0];
      }
    }
    return functions;
  }

  /**
   * Interpolate between two values.
   * @param {*} start - The starting value.
   * @param {*} end - The ending value.
   * @param {number} factor - The interpolation factor (0-1).
   * @param {boolean} isNumeric - Indicates if the values are numeric.
   * @returns {*} The interpolated value of the property.
   */
  interpolateValue(start, end, factor, isNumeric = false) {
    const _ = this;

    // Handle color interpolation
    if (_.isColor(start) && _.isColor(end)) {
      return _.interpolateColor(start, end, factor);
    }

    // Handle numeric values without units
    if (typeof start === 'number' && typeof end === 'number') {
      const interpolatedValue = start + (end - start) * factor;
      // Format to avoid floating point precision issues
      return parseFloat(interpolatedValue.toFixed(4)).toString();
    }

    // Handle numeric values with units
    const startParsed = _.parseValue(start);
    const endParsed = _.parseValue(end);

    if (startParsed && endParsed && startParsed.unit === endParsed.unit) {
      const interpolatedValue = startParsed.value + (endParsed.value - startParsed.value) * factor;
      
      // Ensure only valid numbers with up to two decimal points
      let formattedValue = interpolatedValue.toFixed(2);
      
      // Remove trailing zeros and decimal if not needed
      formattedValue = formattedValue.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
      
      return `${formattedValue}${startParsed.unit || ''}`;
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
    return /^(#[0-9A-Fa-f]{6}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)|hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)|hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\))$/.test(value);
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
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
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
    const rgbMatch = color.match(/^rgb\s*\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)$/);
    if (rgbMatch) {
      return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
    }
    const rgbaMatch = color.match(/^rgba\s*\(\s*(\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\s*\)$/);
    if (rgbaMatch) {
      return [parseInt(rgbaMatch[1]), parseInt(rgbaMatch[2]), parseInt(rgbaMatch[3])];
    }
    const hslMatch = color.match(/^hsl\s*\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/);
    if (hslMatch) {
      // Convert HSL to RGB
      return _.hslToRGB(color);
    }
    const hslaMatch = color.match(/^hsla\s*\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)$/);
    if (hslaMatch) {
      // Convert HSL to RGB (ignoring alpha)
      return _.hslToRGB(color);
    }
    // Unsupported format; default to black
    return [0, 0, 0];
  }

  /**
   * Convert an HSL color to RGB.
   * @param {string} hsl - The HSL color string.
   * @returns {number[]} An array of RGB values.
   */
  hslToRGB(hsl) {
    const _ = this;
    const hslMatch = hsl.match(/^hsl[a]?\(\s*(\d+),\s*(\d+)%?,\s*(\d+)%?\s*\)$/);
    if (!hslMatch) return [0, 0, 0];

    let h = parseInt(hslMatch[1], 10);
    let s = parseInt(hslMatch[2], 10) / 100;
    let l = parseInt(hslMatch[3], 10) / 100;

    h = h % 360;
    if (h < 0) h += 360;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r1, g1, b1;
    if (0 <= h && h < 60) {
      [r1, g1, b1] = [c, x, 0];
    } else if (60 <= h && h < 120) {
      [r1, g1, b1] = [x, c, 0];
    } else if (120 <= h && h < 180) {
      [r1, g1, b1] = [0, c, x];
    } else if (180 <= h && h < 240) {
      [r1, g1, b1] = [0, x, c];
    } else if (240 <= h && h < 300) {
      [r1, g1, b1] = [x, 0, c];
    } else {
      [r1, g1, b1] = [c, 0, x];
    }

    const r = Math.round((r1 + m) * 255);
    const g = Math.round((g1 + m) * 255);
    const b = Math.round((b1 + m) * 255);

    return [r, g, b];
  }

  /**
   * Update the keyframes.
   * @param {Object[]} keyframes - Array of keyframe objects, each containing a percent and styles.
   */
  setKeyframes(keyframes){
    this.keyframes = keyframes.sort((a, b) => a.percent - b.percent);
  }

  /**
   * Determine if a transform function should be treated as numeric.
   * @param {string} func - The transform function name.
   * @returns {boolean} True if the function is numeric, false otherwise.
   */
  isNumericFunction(func) {
    const numericTransforms = [
      'translate', 'translateX', 'translateY', 'translateZ',
      'scale', 'scaleX', 'scaleY', 'scaleZ',
      'rotate', 'rotateX', 'rotateY', 'rotateZ',
      'skew', 'skewX', 'skewY',
      'perspective'
    ];
    return numericTransforms.includes(func);
  }
}
