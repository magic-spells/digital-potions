import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

const isProd = process.env.NODE_ENV === 'production';


export default {
  input: 'src/dp-animate-x-pos.js',
  output: [
    {
      file: 'dist/dp-animate-x-pos.min.js',
      format: 'es',  // ES module format
      sourcemap: !isProd
    },
    {
      file: 'dist/dp-animate-x-pos.umd.js',
      format: 'umd',  // UMD format
      name: 'DPAnimateXPos',  // Global variable name in browsers
      sourcemap: !isProd
    }
  ],
  plugins: [
    resolve(),
    commonjs(),
    isProd && terser({
      mangle: {
        keep_classnames: true,  // Preserve class names during minification
        keep_fnames: true       // Optionally preserve function names
      }
    })
  ]
};