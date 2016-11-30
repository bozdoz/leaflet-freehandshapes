var region = L.geoJson(null, {
	style : {
		color:'black',
		fillOpacity : 0,
		noClip : true,
		clickable : false,
		smoothFactor : 0
	},

});

$.ajax({
	url : 'https://gist.githubusercontent.com/anonymous/4626846f5f223a433199a347ce7e0620/raw/86459ac8f5996e2745d3f8e297d3c3a746992215/map.geojson',
	dataType : 'json',
	success : function (json) {
		region.addData(json);
		region.fire('add');
	}
})

// define for Node module pattern loaders, including Browserify
if (typeof module === 'object' && 
    typeof module.exports === 'object') {
    module.exports = region;
}