const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const path = require('path');
const BUILD_DIR = path.resolve(__dirname, 'src/main/resources/static/build');

module.exports = merge(common, {
  devtool: 'inline-source-map',
  devServer: {
    inline: true,
    contentBase: './src/main/resources/static',
    proxy: [{ context: ["/api/**","/libs/**"],target: 'http://localhost:8090' }],
    hot: true
  },
  output: {
    path: BUILD_DIR,
    filename: 'bundle.js',
    publicPath: 'build/'
  },
  plugins: [
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin()
  ]
});
