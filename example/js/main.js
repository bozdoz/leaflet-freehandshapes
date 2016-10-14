(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{}],2:[function(require,module,exports){
var map = require('./leaflet-map');

(function () {
	for (var i = 0, len = arguments.length; i < len; i++) {
		(function ($elem) {
			$elem.on('change', 'input', function () {
				$elem.find('input')
					.next()
					.removeClass('active');

				$elem.find('input:checked')
					.next()
					.addClass('active');
			});
		})(arguments[i]);
	}
})($('#draw-tools'), $('#draw-colors'));
},{"./leaflet-map":4}],3:[function(require,module,exports){
var map = require('./leaflet-map'),
	categories = require('./categories'),
	group = new L.FeatureGroup(),
	activetool = $('#draw-tools').find('input:checked').val(),
	activetype = $('#draw-colors').find('input:checked').val(),
	turfworker = require('./turf-worker');

for (var name in categories) {
	var obj = categories[name],
		drawer = new L.FreeHandShapes({
			polygon : {
				color : obj.muted_color,
				fillColor : obj.bright_color,
				weight:3,
				smoothFactor: 1
			},
			polyline : {
			    color: obj.bright_color,
			    smoothFactor: 0
			}
		});

	drawer.category = name;

	group.addLayer( drawer );

	drawer.on('layeradd', function (data) {
		var poly = data.layer;

		subtractOtherLayers.call(this, data );

		turfworker.intersectWithTile(poly);
	});

	drawer.on('layersubtract', subtractOtherLayers);

	function subtractOtherLayers (data) {
		var poly = data.layer,
			_leaflet_id = poly._leaflet_id,
			polys_alt_category = [];

		// collect polygons
		group.eachLayer(function (layer) {
			if (layer === this) return;
			polys_alt_category = polys_alt_category.concat( layer.getLayers() );
		}, this);

		// subtract all other layers
		turfworker.subtract(polys_alt_category, poly);
	}

}

group.addTo(map);

group.getAllAsJSON = function () {
	/*
	returns as defined in simulator's LandUsePlanShapesView
		output = {
          category : (multi) geojson, 
          ...
        }
	*/
	var output = {};

	group.eachLayer(function(layer) {
		var polygons = layer.getLayers() || [],
			coords = polygons.map(function (poly) {
				return poly.toGeoJSON().geometry.coordinates;
			});
		
		if (!coords.length) return;

		output[ layer.category ] = turf.multiPolygon(coords); 
	});

	return output;
};

group.getAllAsPolygons = function () {
	/*
	a debug convenience 

	returns
		{
          category : polygons, 
          ...
        }
	*/
	var output = {};

	group.eachLayer(function(layer) {
		var polygons = layer.getLayers() || [];
			
		if (!polygons.length) return;

		output[ layer.category ] = polygons; 
	});

	return output;
};

group.enablePanTool = function () {
	this.eachLayer(function (layer) {
		layer.setMode('view');
	});
};

group.enableAddTool = function () {

	this.eachLayer(function (layer) {
		if (layer.category === activetype) {
			// enable drawing tool for type
			layer.setMode('add');
		} else {
			// disables other freehand instances
			layer.setMode('view');
		}
	});
	$(map._container).addClass('leaflet-fhs-add');
};

group.enableSubtractTool = function () {

	this.eachLayer(function (layer) {
		if (layer.category === activetype) {
			// enable drawing tool for type
			layer.setMode('subtract');
		} else {
			// disables other freehand instances
			layer.setMode('view');
		}
	});
	$(map._container).addClass('leaflet-fhs-subtract');
};

group.enableDeleteTool = function () {
	this.eachLayer(function (layer) {
		if (layer.category === activetype) {
			// enable drawing tool for type
			layer.setMode('delete');
		} else {
			// disables other freehand instances
			layer.setMode('view');
		}
	});
	$(map._container).addClass('leaflet-fhs-delete');
};

group.clearPolygons = function () {
	this.eachLayer(function (layer) {
		layer.clearLayers();
	});
};

group.handleToolAndType = function () {
	// make sure canvas is on top
	if (map._canvasCtx) {
		map._canvasCtx.canvas.style.zIndex = 1;
	}

	if (activetool === 'pan') {
		group.enablePanTool();

	} else if (activetool === 'add') {

		group.enableAddTool();

	} else if (activetool === 'subtract') {

		group.enableSubtractTool();
		
	} else if (activetool === 'delete') {
		// enable deletion of polygons in chosen land use type
		group.enableDeleteTool();

	} else if (activetool === 'clear') {
		// clear all shapes in each category and enable 'add' tool

		group.clearPolygons();
		$('#draw-tools').find('input').first().trigger('click');
	}
};

group.deactivate = function () {
	// destroy polygons
	this.clearPolygons();

	// reset tools
	$('#draw-tools').find('input').first().trigger('click');
	$('#draw-colors').find('input').first().trigger('click');
};

// handlers
// listen for add, subtract, delete, clear
$('#draw-tools').on('change', 'input', function () {
	activetool = this.value;
	group.handleToolAndType();
});

$('#draw-colors').on('change', 'input', function () {
	activetype = this.value;
	group.handleToolAndType();
});

map.whenReady(function () {
	group.handleToolAndType();
});

// define for Node module pattern loaders, including Browserify
if (typeof module === 'object' && 
    typeof module.exports === 'object') {
    module.exports = group;
    module.exports.setToPan = function () {
    	$('#draw-tools').find('input').first().trigger('click');
    };
}
},{"./categories":1,"./leaflet-map":4,"./turf-worker":7}],4:[function(require,module,exports){
var baseURL = '//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
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
    	center : [54.8766, -115.0158],
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
},{}],5:[function(require,module,exports){
var region = L.geoJson(null, {
	style : {
		color:'black',
		fillOpacity : 0
	}
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
},{}],6:[function(require,module,exports){
var map = require('./leaflet-map'),
    controls = require('./controls'),
    drawcontroller = require('./draw-controller'),
    region = require('./region');

region.addTo(map);
region.on('add', function () {
	map.fitBounds(this.getBounds());
});

window.map = map;
window.drawcontroller = drawcontroller;
},{"./controls":2,"./draw-controller":3,"./leaflet-map":4,"./region":5}],7:[function(require,module,exports){
var turfworker = new function () {},
	region = require('./region'),
	regioncache;

region.on('add', function () {
	regioncache = turf.buffer(polygonToGeoJSON(region), 0.000001);
});

function getBufferedPoly (poly) {
	try {
		return turf.buffer(poly, 0.000001);
	} catch (e) {
		try {
			return turf.buffer(poly, 0.1);
		} catch (e) {
			try {
				return turf.buffer(poly, 1);
			} catch (e) {
				return false;
			}
		}
	}
}

turfworker.intersectWithTile = function (poly) {
	var jsona = getBufferedPoly(polygonToGeoJSON(poly)),
		jsonb = jsona ? turf.intersect(regioncache, jsona) : null;
	try {
		handleNewJson(poly, jsona, jsonb);
	} catch (e) {
		return;
	}
};

turfworker.subtract = function (polyarr, newpoly) {
	/*
	
	polyarr (array of leaflet L.Polygon's)
	newpoly (L.Polygon)

	new poly is drawn, all existing polys (polyarr) 
	must be cut with the new cookie cutter
	*/
	var polyarr = (polyarr || []).slice(), // copy
		jsonb = polygonToGeoJSON( newpoly );

	/* todo: test async for loop */
	for (var i = 0, len = polyarr.length; i < len; i++) {
		var poly = polyarr[i],
			jsona = polygonToGeoJSON(poly),
			diff = turfdiff(jsona, jsonb);

		if (diff === false) {
			// poly is invalid!
			newpoly.destroy(); //?
			break;
		}

		handleNewJson(poly, jsona, diff);
	}
};

function handleNewJson (poly, json_old, json_new) {
	if (json_new === undefined) {
		// polygon has been overwritten
		poly.destroy();
		return; 
	}

	var same_type = (json_old.geometry.type === json_new.geometry.type);

	if (same_type) {
		// no polygon to multipolygon shenanigans
		poly.setLatLngs( geoJSONToLatLngs( json_new ) );
	} else {
		// polygon got split into a multi
		var coords = json_new.geometry.coordinates,
			group = poly.getGroup();

		// destroy and rebuild each?
		poly.destroy();

		/* todo: async for loop, test passing true/false */
		for (var i = 0, len = coords.length; i < len; i++) {
			var singlejson = turf.polygon(coords[i]);
			// pass false so create event doesn't fire again
			group.addPolygon( geoJSONToLatLngs( singlejson ), true );
		}
	}
};

function turfdiff (a, b) {
	try {
		return turf.difference(a, b);
	} catch (e) {
		try {
			return turf.difference(
				turf.buffer(a, 0.000001), 
                turf.buffer(b, 0.000001)
			);
		} catch (e) {
			try {
				console.log('third try');
				return turf.difference(
					turf.buffer(a, 0.1), 
	                turf.buffer(b, 0.1)
				);
			} catch (e) {
				try {
					console.log('last try');
					return turf.difference(
						turf.buffer(a, 1), 
		                turf.buffer(b, 1)
					);
				} catch (e) {
					console.error('turf failed', a, b, e);
					return false;
				}
			}
		}
	}
}

function polygonToGeoJSON (poly) {
	var geojson = poly.toGeoJSON();
	if (geojson.features) {
		return geojson.features[0];
	}
	return geojson;
}

function geoJSONToLatLngs (geojson) {
	var coords = geojson.geometry.coordinates,
		latlngs = L.GeoJSON.coordsToLatLngs(coords, 1, L.GeoJSON.coordsToLatLng);
	return latlngs;
};

// define for Node module pattern loaders, including Browserify
if (typeof module === 'object' && 
    typeof module.exports === 'object') {
    module.exports = turfworker;
}
},{"./region":5}]},{},[6]);
