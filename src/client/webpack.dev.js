const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const path = require('path');
const webpack = require('webpack');

module.exports = merge(common, {
    mode: 'development',
    devtool: 'eval-source-map',
    devServer: {
        // host: '192.168.68.100',
        // port: 8080,
        // disableHostCheck:true,
        static: {
            directory: path.join(__dirname, '/../../public'),
        },
        hot: true,
    },
})
