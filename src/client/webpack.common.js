const path = require('path');


console.log(__dirname);
module.exports = {
    entry: './src/client/main.js',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        fallback: { "os": false },
        alias: {
            three: path.resolve('./node_modules/three'),
            // three: path.resolve('./src/client/libs/three.js'),
            threeCSG: path.resolve('./src/client/libs/ThreeCSG'),
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
        path: path.resolve(__dirname, './../../public/'),
    }
};