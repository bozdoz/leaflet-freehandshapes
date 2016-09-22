var baseURL = '//{s}.tile.osm.org/{z}/{x}/{y}.png',
    base = L.tileLayer( baseURL, {
            subdomains : 'abc'
        }),
   	baseMaps = {
		'Open Street Map' : L.tileLayer(baseURL, { 
	       subdomains: 'abc'
	    })
	},
    map = L.map('mapid', {
    	layers : [baseMaps[localStorage.baseMap || 'Open Street Map']],
    	zoom : 6,
    	center : [54.87660665410869, -115.01586914062499],
    	attributionControl: false,
        zoomControl : false,
    });

map.on('baselayerchange', function (layer) {
    localStorage.baseMap = layer.name || '';
});

L.control.layers(baseMaps, {}, {
	position : 'bottomleft'
}).addTo(map);

L.control.zoom({
	position : 'bottomleft'
}).addTo(map);

L.control.scale({
    position : 'bottomright'
}).addTo(map);

// define for Node module pattern loaders, including Browserify
if (typeof module === 'object' && 
    typeof module.exports === 'object') {
    module.exports = map;
}