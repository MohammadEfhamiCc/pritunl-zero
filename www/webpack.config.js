const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  devtool: 'inline-source-map',
  entry: {
    app: {
      import: './app/App.js',
    },
    uapp: {
      import: './uapp/App.js',
    },
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  },
  output: {
    path: path.resolve(__dirname, 'dist', 'static'),
    publicPath: '',
    filename: '[name].js',
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': JSON.stringify({}),
    }),
  ],
};
