var webpack = require('webpack');

module.exports = {
    entry: './index.js',
    output: {
        libraryTarget: 'umd',
        library: 'mobservableReact',
        path: __dirname,
        filename: 'dist/index.js'
    },
    externals: {
        "mobservable": "mobservable",
        "react": {
            root: 'React',
            commonjs2: 'react',
            commonjs: 'react',
            amd: 'react'
        }
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            compressor: {
              screw_ie8: true,
              warnings: false
            }
        })
    ]
}
