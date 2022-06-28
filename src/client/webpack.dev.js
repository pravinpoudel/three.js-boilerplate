const fs = require("fs");
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const path = require("path");

module.exports = merge(common, {
  mode: "development",
  devtool: "eval-source-map",
  devServer: {
    static: {
      directory: path.join(__dirname, "../../dist/client"),
    },
    https: {
      key: fs.readFileSync(path.join(__dirname, "../../key.pem")),
      cert: fs.readFileSync(path.join(__dirname, "../../cert.pem")),
    },
    hot: true,
  },
});
