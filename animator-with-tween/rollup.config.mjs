import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';

const isProd = process.env.NODE_ENV === 'production';


export default {
  input: 'src/index.js',
  output: [
    {
      file: 'site/script.min.js',
      format: 'iife',  
      name: 'PhysicsAnimator',
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
      port: 3010,
    }),
    !isProd && livereload({
      watch: 'site', // The folder to watch for changes
    }),
  ],

};