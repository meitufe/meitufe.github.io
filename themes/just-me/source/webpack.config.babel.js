import path from 'path';
import webpack from 'webpack';
import ExtractTextPlugin from 'extract-text-webpack-plugin';

let isDevelopment = process.env.NODE_ENV === 'development' ? true : false,
    configure = {};

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
            loader: 'babel-loader',
            exclude: /node_modules/,
        }, {
            test: /\.(scss|css)$/,
            loader: ExtractTextPlugin.extract({
                fallback: 'style-loader',
                use: 'css-loader',
            }),
        }, {
            test: /\.(woff|ttf|eot|svg|gif|jpg|png|mp3|mp4)$/,
            loader: 'url-loader?limit=5120&name=[path][name].[ext]?[hash:8]', // Images which less than 5K turn into base64.
        }, {
            test: /\.json$/,
            loader: 'json-loader',
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
