const path = require("path")

module.exports = {
  entry: {
    bundle: "./src/web/index.ts"
  },
  module: {
    rules: [
      {
        test: /\.tsx?/,
        use: [
          {
            loader: "ts-loader",
            options: {
              transpileOnly: true,
              experimentalWatchApi: true
            }
          }
        ],
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    plugins: [],
    extensions: [".ts", ".js"]
  },
  plugins: [],
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "loopmetrics-browser.js"
  }
}
