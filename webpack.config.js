const path = require("path")

module.exports = {
  mode: "production",
  entry: {
    bundle: "./src/index.ts"
  },
  module: {
    rules: [
      {
        test: /\.ts?/,
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
