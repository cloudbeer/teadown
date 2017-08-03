module.exports = {
  entry : "./src/index.tsx",
  output: {
    filename: "bundle.js",
    path    : __dirname + "/dist"
  },

  devtool: "source-map",

  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json"]
  },

  module: {
    rules: [
      {
        test   : /\.css$/,
        exclude: /node_modules/,
        use    : [{loader: 'style-loader'},
          {
            loader : 'css-loader',
            options: {
              importLoaders: 1,
            }
          },
          {
            loader: 'postcss-loader'
          }]
      },
      {test: /\.tsx?$/, loader: "awesome-typescript-loader"},
      {enforce: "pre", test: /\.js$/, loader: "source-map-loader"}
    ]
  },


  externals: {
    "react"    : "React",
    "react-dom": "ReactDOM"
  },
};
