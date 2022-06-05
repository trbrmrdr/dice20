const path = require('path');
const webpack = require('webpack');

// console.log(__dirname);
module.exports = {
    entry: [
        // "./src/client/saves.js",
        // "./src/client/helper.js",
        // "./src/client/vars.js",
        "./src/client/main.js"],


    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            // {
            //     test: /\.js$/,
            //     exclude: /node_modules/,
            //     use: {
            //         loader: 'babel-loader',
            //         options: {
            //             presets: ['@babel/preset-env'],
            //         },
            //     },
            // },
            {
                test: /\.scss$/,
                use: ['style-loader', 'css-loader', 'sass-loader'],
            },
        ],
    },
    resolve: {
        fallback: { "os": false },
        alias: {
            // three: path.resolve('./node_modules/three'),
            // three: path.resolve('./src/client/libs/three.js'),
            // threeCSG: path.resolve('./src/client/libs/ThreeCSG'),
        },
        extensions: ['.tsx', '.ts', '.js'],

        // modules: [
        //     './dev/tree.js-master/'
        // ]
    },
    output: {
        publicPath: '/',
        // clean: true,

        filename: 'bundle.js',
        // filename: '[name].js',
        path: path.resolve(__dirname, './../../public/'),
    },


    // optimization: {
    //     runtimeChunk: true
    //     // splitChunks: {
    //     //     chunks: 'all',
    //     // },
    // },

    // optimization: {
    //     minimize: true,
    //     splitChunks: {
    //         minChunks: Infinity,
    //         chunks: 'all'
    //     }
    // }
};