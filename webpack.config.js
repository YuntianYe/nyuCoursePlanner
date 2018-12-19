const webpack = require('webpack');
const path = require('path');

module.exports = { 
  entry: './tls/src/core.js', 
  output: {
    path: path.resolve(__dirname, './tls/js'), 
    filename: 'bundle.js', 
  }, 
  module: { 
    loaders: [{ 
      test: /\.js$/, 
      exclude: /node_modules/, 
      loader: 'babel-loader'
    }]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
      sourceMap: false,
      mangle: true,
      output: {
        comments: false,
      },
    }),
  ]
}
