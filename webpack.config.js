var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var webpack = require('webpack');

var config = {
	entry : {
		main: ['./src/index.js', './example/js/script.js']
	},
	output: {
		path: path.resolve(__dirname, 'example', 'dist'),
		filename: '[name].js',
		publicPath: '/example'
	},
	module: {
		rules: [
			{ 
				test: /\.(js)$/, 
				use: 'babel-loader' 
			},
			{ 
				test: /\.css$/, 
				use: ['style-loader', 'css-loader']
			}
		]
	}, 
	devServer: {
		historyApiFallback: true,
		hot: true
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: 'example/index.html'
		}),
		new webpack.HotModuleReplacementPlugin()
	]
}

module.exports = config;

/*new webpack.DefinePlugin({
  'process.env': {
    NODE_ENV: JSON.stringify('production')
  }
}),
new webpack.optimize.UglifyJsPlugin()*/