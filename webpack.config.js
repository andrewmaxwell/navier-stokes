module.exports = {
	entry: "./src/main.js",
	output: {
		filename: "bundle.js"
	},
	module: {
		preLoaders: [
			{
				test: /\.js$/,
				loader: "eslint-loader?{extends:'eslint:recommended',parserOptions:{sourceType:'module'},rules:{indent:[2,'tab'],quotes:[2,'single'],semi:[2,'always'],'no-console':[0],'no-unused-vars':[1]},env:{es6:true,browser:true}}",
				exclude: /node_modules/,
			},
		],
		loaders: [
			{
	      test: /\.js$/,
	      exclude: /(node_modules|bower_components)/,
	      loader: 'babel',
	      query: {
	        presets: ['es2015']
	      }
	    }
		]
	},
	// devtool: 'cheap-module-source-map'
};
