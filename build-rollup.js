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

function build(target, minify) {
  var targetExt = minify ? '.min.js' : '.js';
  var filename = (function() {
    switch (target) {
      case 'browser':
        return 'index' + targetExt;
      case 'native':
        return 'native' + targetExt;
      case 'custom':
        return 'custom' + targetExt;
      default:
        throw new Error('Unexpected target: ' + target);
    }
  })();

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
      var options = {
        dest: path.resolve(__dirname, filename),
        format: 'umd',
        moduleName: 'mobxReact',
        exports: 'named',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react-native': 'ReactNative',
          mobx: 'mobx',
        },
      };

      return bundle.write(options);
    })
    .catch(function(reason) {
      console.error(reason);
      process.exit(-1);
    });
}

build('browser')
  .then(build('native'))
  .then(build('custom'))
  .then(build('browser', true))
  ;
