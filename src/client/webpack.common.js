//webpack-cli – Enabling us to execute build commands from the command line.

const path = require("path");
module.exports = {
  entry: "./src/client/terrain.ts", //the file from which Webpack’s dependency graph (tree) is constructed
  module: {
    //module configures Webpack to use the ts-loader package which allows the integration with TypeScript.
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader", // Connects ts-node and webpack to support combining transpiled .ts files
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },

  //since we have ts-loader module installed and specified in our webpack configuration file ( i mean this file), we dont
  // need to worry about running the tsc commands to compile our typescript anymore - Webpack will handle everthing !!
  resolve: {
    alias: {
      three: path.resolve("./node_modules/three"), // <----- this ensure that all statements importing from three will
      // be aliased to same location
    },
    extensions: [".tsx", ".ts", ".js"], //File types resolvable by Webpack during
    // bundling — the .js extensions are needed here to ensure a seamless import of the OrbitalControls module.
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "../../dist/client"),
  },
};
