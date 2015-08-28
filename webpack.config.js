var webpack = require('webpack');

module.exports = {
    entry: './src/index.js',
    output: {
        libraryTarget: 'umd',
        library: 'mobservable-react',
        path: __dirname,
        filename: 'index.js'
    },
    externals: {
        "mobservable": "mobservable",
        "react": "react"
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
