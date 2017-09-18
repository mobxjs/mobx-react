var path = require('path');
var filesize = require('rollup-plugin-filesize');
var babel = require('rollup-plugin-babel');

var commonjs = require('rollup-plugin-commonjs');
var resolve = require('rollup-plugin-node-resolve');

var replace = require('rollup-plugin-replace');
var uglify = require('rollup-plugin-uglify');
var alias = require('rollup-plugin-alias');

var {rollup} = require('rollup');

var reactDomModulePath = require.resolve('react-dom');
var emptyModulePath = path.resolve(__dirname, 'empty.js');

function build(target, filename, minify) {
  var namedExports = {};
  namedExports[emptyModulePath] = ['unstable_batchedUpdates'];
  namedExports[reactDomModulePath] = ['unstable_batchedUpdates'];

  var aliases = {};

  if (target === 'native' || target === 'custom')
    aliases['react-dom'] = emptyModulePath;
  if (target === 'browser' || target === 'custom')
    aliases['react-native'] = emptyModulePath;

  var plugins = [
    replace({
      __TARGET__: JSON.stringify(target),
    }),
    babel({
      exclude: 'node_modules/**',
      presets: ['es2015-rollup', 'react'],
      plugins: ['transform-decorators-legacy', 'transform-class-properties'],
    }),
    alias({
      'react-dom': emptyModulePath,
      'react-native': emptyModulePath,
    }),
    resolve({
      module: true,
      main: true,
    }),
    commonjs({
      exclude: [
        'node_modules/react/**',
        'node_modules/react-dom/**',
        'node_modules/react-native/**',
        'node_modules/mobx/**',
      ],
      namedExports: namedExports,
    }),
  ];

  if (minify) {
    plugins.push(
      uglify({
        compressor: {
          screw_ie8: true,
          warnings: false,
        },
      })
    );
  }

  plugins.push(filesize());

  var trueFn = function() {
    return true;
  };
  var falseFn = function() {
    return false;
  };

  return rollup({
    entry: 'src/index.js',
    external: function(moduleId) {
      return ({
        react: trueFn,
        'react-dom': function() {
          return target === 'browser';
        },
        'react-native': function() {
          return target === 'native';
        },
        mobx: trueFn,
      }[moduleId] || falseFn)();
    },
    plugins: plugins,
  })
    .then(function(bundle) {

      var baseOptions = {
        moduleName: 'mobxReact',
        exports: 'named',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react-native': 'ReactNative',
          mobx: 'mobx',
        },
      };

      var options = [];
      options.push(Object.assign({}, baseOptions, {
        format: 'umd',
        dest: path.resolve(__dirname, filename + (minify ? '.min.js' : '.js'))
      }));
      if (!minify) {
        options.push(Object.assign({}, baseOptions, {
          format: 'es',
          dest: path.resolve(__dirname, filename + '.module.js')
        }));
      }

      return Promise.all(options.map(function(option) { return bundle.write(option); }));
    })
    .catch(function(reason) {
      console.error(reason);
      process.exit(-1);
    });
}

Promise.all([
    build('browser', 'index'),
    build('native', 'native'),
    build('custom', 'custom'),
    build('browser', 'index', true),
]);
