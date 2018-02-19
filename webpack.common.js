const path = require('path');

const APP_DIR = path.resolve(__dirname, 'src/main/js');

module.exports = {
  entry: { app: APP_DIR + '/app.js' },
  module : {
    loaders : [
      {
        test : /\.jsx?/,
        include: APP_DIR,
        loader: 'eslint-loader'
      },
      {
        test : /\.jsx?/,
        include : APP_DIR,
        loader : 'babel-loader',
        query: { presets: ['es2015', 'react'] }
      },
      {
        test: /\.css$/,
        loader: "style-loader!css-loader"
      },
      {
        test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
        loader: 'url-loader',
        options: { limit: 10000 }
      }
    ]
  }
};
