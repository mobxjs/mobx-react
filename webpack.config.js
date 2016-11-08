var webpack = require('webpack');


function makeConfig(target, minify) {
  var targetExt = minify ? '.min.js' : '.js';

  return {
    entry: './src/index.js',
    hot: false,
    output: {
      libraryTarget: 'umd',
      library: 'mobxReact',
      path: __dirname,
      filename: (function () {
        switch (target) {
          case 'browser': return 'index' + targetExt;
          case 'native': return 'native' + targetExt;
          case 'custom': return 'custom' + targetExt;
          default: throw new Error('Unexpected target: ' + target);
        }
      } ())
    },
    resolve: {
      extensions: ['', '.js'],
      alias: {
        'react-dom': 'empty-module'
      }
    },
    module: {
      loaders: [{
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['es2015'],
          plugins: ['transform-class-properties'],
        }
      }]
    },
    externals: {
      'react': {
        root: 'React',
        commonjs: 'react',
        commonjs2: 'react',
        amd: 'react'
      },
      'react-dom': (function () {
        if (target === 'browser') return {
          root: 'ReactDOM',
          commonjs: 'react-dom',
          commonjs2: 'react-dom',
          amd: 'react-dom'
        };
        return false; // not external, will use empty-module  alias
      } ()),
      mobx: 'mobx'
    },
    plugins: [
      new webpack.DefinePlugin({
        __TARGET__: JSON.stringify(target),
      })
    ].concat(
      minify
        ? [new webpack.optimize.UglifyJsPlugin({
          compressor: {
            screw_ie8: true,
            warnings: false
          }
        })]
        : []
    )
  };
}

module.exports = [
  makeConfig('browser'),
  makeConfig('native'),
  makeConfig('custom'),
  makeConfig('browser', true)
];
