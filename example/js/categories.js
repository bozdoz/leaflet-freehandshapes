var categories = { 
		wetland: {
		    category: 1,
			muted_color : '#0A0A8D',
		    bright_color: '#0000FF'
		},
		settlement: {
		    category: 2,
			muted_color : '#9B34A0',
		    bright_color: '#FF00FF'
		},
		grassland: {
		    category : 3,
			muted_color : '#A8A200',
		    bright_color : '#FFFF00'
		},
		agriculture: {
		    category: 4,
			muted_color : '#A8501E',
		    bright_color: '#FF6600'
		},
		forest: {
		    category: 5,
			muted_color : '#1C8F3C',
		    bright_color: '#00FF00'
		},
	};

// define for Node module pattern loaders, including Browserify
if (typeof module === 'object' && 
    typeof module.exports === 'object') {
    module.exports = categories;
}