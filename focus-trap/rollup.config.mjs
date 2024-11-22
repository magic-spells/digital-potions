import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import serve from 'rollup-plugin-serve';
import copy from 'rollup-plugin-copy';

const dev = process.env.ROLLUP_WATCH;

export default [
	// Development build (UMD)
	{
		input: 'src/focus-trap.js',
		output: {
			file: 'dist/focus-trap.js',
			format: 'umd',
			name: 'MagicSpellsFocusTrap',
			sourcemap: true,
		},
		plugins: [
			resolve(),
			dev &&
				serve({
					contentBase: ['dist', 'demo'],
					open: true,
					port: 3000,
				}),
			copy({
				targets: [{ src: 'dist/focus-trap.js', dest: 'demo' }],
			}),
		],
	},
	// Production UMD (minified)
	{
		input: 'src/focus-trap.js',
		output: {
			file: 'dist/focus-trap.min.js',
			format: 'umd',
			name: 'MagicSpellsFocusTrap',
			sourcemap: true,
		},
		plugins: [
			resolve(),
			terser({
				format: {
					comments: false,
				},
			}),
		],
	},
	// ESM build (unminified)
	{
		input: 'src/focus-trap.js',
		output: {
			file: 'dist/focus-trap.esm.js',
			format: 'esm',
			sourcemap: true,
		},
		plugins: [resolve()],
	},
];
