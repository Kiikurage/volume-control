const path = require("node:path");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
	cache: true,
	mode: process.env.NODE_ENV === "production" ? "production" : "development",
	entry: {
		popup: path.resolve(__dirname, "./src/popup.tsx"),
		serviceWorker: path.resolve(__dirname, "./src/serviceWorker.ts"),
		contentScript: path.resolve(__dirname, "./src/contentScript.ts"),
	},
	output: {
		publicPath: "/",
		path: path.resolve(__dirname, "build"),
		filename: "[name].js",
	},
	resolve: {
		extensions: [".ts", ".tsx", ".js", ".jsx"],
	},
	devtool: "source-map",
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				exclude: /node_modules/,
				use: "babel-loader",
			},
		],
	},
	devServer: {
		port: 3001,
	},
	plugins: [
		new ForkTsCheckerWebpackPlugin(),
		new CopyWebpackPlugin({
			patterns: [{ from: "src/static", to: "./" }],
		}),
	],
};
