const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HTMLWebpackPlugin = require('html-webpack-plugin');

const path = require('path');

const paths = {
  src: path.resolve(__dirname, 'src'),
  dist: path.resolve(__dirname, 'dist'),
  public: path.resolve(__dirname, 'public', 'baby-gru'),
  pixmaps: path.resolve(__dirname, 'public', 'baby-gru', 'pixmaps'),
}

module.exports = {
  plugins:[
   
    new HTMLWebpackPlugin({
      filename: 'index.html',
      template: path.join(__dirname, '/src/index.html'),
      favicon: path.join(__dirname, 'public', 'favicon.ico')
    }),
    
    new MiniCssExtractPlugin({
      filename: '[name][contenthash].css',
      chunkFilename: '[id].css',
      ignoreOrder: false,
    }),

    new CopyWebpackPlugin({
      patterns: [
        {
          from: paths.public,
          to: paths.dist + '/baby-gru/',
          toType: 'dir',
        },
      ],
    }),
],
  entry: path.join(paths.src, 'index.js'),
  mode: 'production',
  cache: false,
  relativeUrls: true,
  output: {
    clean: true,
    filename: '[name].js',
    path: paths.dist,
    publicPath: paths.dist
  },
    module:{
        rules:[
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
            },
            {
              test: /\.(?:ico|gif|png|jpg|jpeg|svg|xpm)$/,
              loader: 'file-loader',
              type: 'asset/resource',
            },
            {
                test: /\.css$/,
                sideEffects: true,
                use: [ MiniCssExtractPlugin.loader, 'css-loader'],
            }
        ]
    },
    resolve: {
        fallback: {
          fs: false
        }
      }
}
