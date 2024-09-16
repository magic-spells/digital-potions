import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';

const isProd = process.env.NODE_ENV === 'production';


export default {
  input: 'src/tween-calculator.js',
  output: [
    {
      file: 'dist/tween-calculator.min.js',
      format: 'umd',  
      name: 'TweenCalculator',
      sourcemap: !isProd
    },
    {
      file: 'site/tween-calculator.min.js',
      format: 'umd',  
      name: 'TweenCalculator',
      sourcemap: !isProd
    }
  ],
  plugins: [
    resolve(),
    commonjs(),
    isProd && terser({
      mangle: {
        keep_classnames: true,  // Preserve class names during minification
        keep_fnames: false       // Optionally preserve function names
      }
    }),
    serve({
      open: true,
      contentBase: 'site', // The folder to serve files from
      port: 3009,
    }),
    !isProd && livereload({
      watch: 'site', // The folder to watch for changes
    }),
  ],

};