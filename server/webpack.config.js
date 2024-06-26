let path = require('path');
let webpack = require('webpack');

module.exports = {
  devtool: 'source-map',
  mode: 'production',
  entry: {
    widget: [
        path.join(__dirname, 'src', 'widget', 'widget-index.js')
    ],
    chat: [
        path.join(__dirname, 'src', 'chat', 'chat-index.js')
    ],
  },  
  output: {
    path: path.join(__dirname, 'dist', 'js'),
    filename: '[name].js',
    publicPath: '/js/'
  },
  module: {
    rules: [
        {
          test: /\.(jsx|js)$/,
          include: path.resolve(__dirname, 'src'),
          exclude: /node_modules/,
          use: [{
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  "targets": "defaults" ,
                  modules: 'auto',
                }],
                ['@babel/preset-react'] 
              ]
            }
          }]
        },
        {
          test: /\.(jsx|js|mjs)$/,
          include: /node_modules/,
          type: "javascript/auto",
          use: [{
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  "targets": "defaults" ,
                  modules: 'auto',
                }],
                ['@babel/preset-react'] 
              ]
            }
          }]
        }
      ]
    },
};
