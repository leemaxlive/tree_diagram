var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
module.exports = {
    plugins:[
        new ExtractTextPlugin('[name].css')
    ],
    entry:{
        app:['./src/app']
    },
    output: {
        path: './build',
        filename: '[name].js'
    },
    resolve: {
        extensions: ['','.js','.ts']
    },
    module: {
        loaders: [
             { 
                test: /\.ts$/, 
                loader: 'babel?presets[]=es2015!ts' 
            },
            {
                test: /\.css$/,
                exclude: /^node_modules$/,
                loader: ExtractTextPlugin.extract('style', 'css!autoprefixer')
            },
            { 
                test: /\.(png|jpg)$/, 
                loader: 'url?limit=20000&name=[name].[ext]' 
            },
            {
                test: /\.(eot|woff|svg|ttf|woff2|gif|appcache)(\?|$)/,
                exclude: /^node_modules$/,
                loader: 'file?name=[name].[ext]' 
            }
        ]
    },
    devtool:'sourcemap'
}