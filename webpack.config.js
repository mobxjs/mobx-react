var webpack = require('webpack');


function makeConfig(target) {
  return {
    entry: './src/index.js',
    hot: false,
    output: {
      libraryTarget: 'umd',
      library: 'mobxReact',
      path: __dirname,
      filename: (function() {
        switch (target) {
          case 'browser': return 'index.js';
          case 'native': return 'native.js';
          case 'custom': return 'custom.js';
          default: throw new Error('Unexpected target: ' + target);
        }
      }())
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
      'react-dom': (function() {
        if (target === 'browser') return {
          root: 'ReactDOM',
          commonjs: 'react-dom',
          commonjs2: 'react-dom',
          amd: 'react-dom'
        };
        return false; // not external, will use empty-module  alias
      }()),
      mobx: 'mobx'
    },
    plugins: [
      new webpack.DefinePlugin({
        __TARGET__: JSON.stringify(target),
      }),
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          warnings: false
        },
        mangle: {
          except: ['require'], // #127
        },
      })
    ]
  };
}

module.exports = [
  makeConfig('browser'),
  makeConfig('native'),
  makeConfig('custom')
];
