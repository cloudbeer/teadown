const webpack = require('webpack');

module.exports = {
  entry : "./src/index.jsx",
  output: {
    filename: "bundle.js",
    path    : __dirname + "/dist"
  },
  target: 'electron-main',
  //devtool: "source-map",

  resolve: {
    extensions: [".js", ".jsx"]
  },

  plugins: [
    //new webpack.optimize.UglifyJsPlugin({minimize: true})
  ],
  module: {
    rules: [
      {
        test: /\.less$/,
        use: [{
            loader: "style-loader" // creates style nodes from JS strings
        }, {
            loader: "css-loader" // translates CSS into CommonJS
        }, {
            loader: "less-loader" // compiles Less to CSS
        }]
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.jsx$/,loader: 'babel-loader', exclude: /node_modules/
      },
      { test: /\.(png|woff|woff2|eot|ttf|svg)$/, loader: 'url-loader?limit=100000' },
      //{enforce: "pre", test: /\.js$/, loader: "source-map-loader"}
    ]
  },


  externals: {
    "react"    : "React",
    "react-dom": "ReactDOM"
  },
};
