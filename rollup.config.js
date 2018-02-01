import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import buble from 'rollup-plugin-buble';
import uglify from 'rollup-plugin-uglify';
import filesize from 'rollup-plugin-filesize';

const isProd = process.env.NODE_ENV === 'production';

const file = `build/scrollama${isProd ? '.min' : ''}.js`;

const plugins = [
  resolve({
    jsnext: true,
    main: true
  }),
  commonjs({
    sourceMap: false
  }),
  buble(),
  filesize()
];

isProd && plugins.push(uglify());

export default {
  input: 'index.js',
  output: {
    file,
    format: 'umd',
    name: 'scrollama'
  },
  plugins
};
