import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";

export default {
	input: "src/index.js", // Entry point file
	output: {
		file: "dist/collapsible-component.min.js", // Output file
		format: "iife", // Immediately Invoked Function Expression (browser-friendly)
		name: "CollapsibleComponent", // Global name for the bundle
	},
	plugins: [
		resolve(), // Resolves Node.js-style module imports for the browser
		terser(), // Minifies the output for production
	],
};
