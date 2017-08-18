const webpack = require('webpack');
const vendors = [
  'react',
  'react-dom',
  'mermaid',
  'echarts',
  'semantic-ui-react',
  'electron',
  'codemirror'
];

module.exports = {
  node: {
    fs: "empty"
  },
  output: {
    filename: "vendors.js",
    path: __dirname + "/dist",
    library: 'vendors'
  },
  entry: {
    "lib": vendors,
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compress: {
        warnings: false,
      },
    }),
    new webpack.DllPlugin({
      path: __dirname + '/dist/manifest.json',
      name: 'vendors',
      context: __dirname,
    }),
    new webpack.DefinePlugin({
      "process.env": { 
         NODE_ENV: JSON.stringify("production") 
       }
    })
  ],
};
