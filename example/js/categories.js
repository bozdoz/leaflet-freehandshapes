var categories = { 
		wetland: {
		    category: 1,
			muted_color : '#2e6da4',
		    bright_color: '#337ab7'
		},
		settlement: {
		    category: 2,
			muted_color : '#46b8da',
		    bright_color: '#5bc0de'
		},
		grassland: {
		    category : 3,
			muted_color : '#eea236',
		    bright_color : '#f0ad4e'
		},
		agriculture: {
		    category: 4,
			muted_color : '#ac2925',
		    bright_color: '#c9302c'
		},
		forest: {
		    category: 5,
			muted_color : '#4cae4c',
		    bright_color: '#5cb85c'
		},
	};

// define for Node module pattern loaders, including Browserify
if (typeof module === 'object' && 
    typeof module.exports === 'object') {
    module.exports = categories;
}