const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const isDevelopment = process.env.NODE_ENV === 'development' ? true : false;

let configure = {};

configure = {
    entry: {
        'app': [
            './js/app.js',
        ],
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        // publicPath:'', // public path
        filename: 'js/[name].js?[hash:8]', // output file name
    },
    module: {
        loaders: [{
            test: /\.(js|es6)$/,
            use: ['babel-loader'],
            exclude: /node_modules/,
        }, {
            test: /\.(scss|css)$/,
            use: ExtractTextPlugin.extract({
                fallback: `style-loader`,
                use: [
                    'css-loader',
                    'postcss-loader',
                    'sass-loader',
                ],
            }),
        }, {
            test: /\.(woff|ttf|eot|svg|gif|jpg|png|mp3|mp4)$/,
            use: [{
                loader: `url-loader`,
                options: {
                    limit: 5120,
                    name: `images/[name].[ext]`,
                },
            }],
        }, {
            test: /\.json$/,
            use: ['json-loader'],
        }],
    },
    resolve: {
        extensions: ['.js', '.es6', '.scss', '.css'],
    },
    plugins: [
        new webpack.NoEmitOnErrorsPlugin(),
        new ExtractTextPlugin({
            filename: 'css/[name].css',
            disable: false,
            allChunks: true,
        }),
    ],
};

if (!isDevelopment) {
    configure.plugins.push(new webpack.optimize.UglifyJsPlugin({
        compress: {
            warnings: false,
        },
    }));
}

if (process.env.NODE_ENV == 'production') {
    configure.devtool = 'eval';
}

module.exports = configure;
