const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const WriteFilePlugin = require('write-file-webpack-plugin');

module.exports = {
  entry: {
    ponkan3: './src/ponkan3.ts'
  },  
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: '/assets',
    filename: '[name].js'
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist')
  },
  module: {
    rules: [
      { test: /\.ts$/, loader:'ts-loader' },
      { test: /\.html$/, loader:'html-loader' },
    ]
  },
  resolve: {
    extensions:['.ts', '.js', '.json']
  },
  plugins: [
    // new UglifyJSPlugin(),
    new HtmlWebpackPlugin({
      template: "./src/index.html"
    }),
    new CopyWebpackPlugin(
      [ { from: '', to: 'gamedata/', }, ],
      { context: 'src/gamedata' }
    ),
    new WriteFilePlugin(),
  ]
}
