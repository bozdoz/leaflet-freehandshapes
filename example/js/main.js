(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{}],2:[function(require,module,exports){
var map = require('./leaflet-map'),
	$inputs = $('#draw-container').find('input');

toggleinputs();

$('#draw-container').on('change', 'input', toggleinputs);

function toggleinputs () {
	$inputs.next().removeClass('active');
	$inputs.filter(':checked').next().addClass('active');
}
},{"./leaflet-map":4}],3:[function(require,module,exports){
var map = require('./leaflet-map'),
	categories = require('./categories'),
	group = new L.FeatureGroup(),
	activetool = $('#draw-tools').find('input:checked').val(),
	activetype = $('#draw-colors').find('input:checked').val(),
	modes = L.FreeHandShapes.MODES,
	turfworker = require('./turf-worker');

for (var name in categories) {
	var obj = categories[name],
		drawer = new L.FreeHandShapes({
			attemptMerge : false,
			createExitMode : false,
			hullAlgorithm : false,
			polygon : {
				color : obj.muted_color,
				fillColor : obj.bright_color,
				fillOpacity: 1,
				smoothFactor: 2
			}
		});

	drawer.category = name;

	group.addLayer( drawer );

	drawer.on('polygon-created', function (data) {
		var poly = data.polygon,
			_leaflet_id = poly._leaflet_id,
			polygons = [];

		// subtract all other layers
		group.eachLayer(function (layer) {
			polygons = polygons.concat(layer.polygons);
		});

		// polygons includes itself
		polygons = polygons.filter(function(a) {
			return a._leaflet_id != _leaflet_id;
		});

		turfworker.subtract(polygons, poly);
		turfworker.intersectWithTile(poly);
	});
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
		var polygons = layer.polygons || [],
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
		var polygons = layer.polygons || [];
			
		if (!polygons.length) return;

		output[ layer.category ] = polygons; 
	});

	return output;
};

group.enablePanTool = function () {
	this.eachLayer(function (layer) {
		layer.setMode(modes.VIEW);
	});
};

group.enableAddTool = function () {

	this.eachLayer(function (layer) {
		if (layer.category === activetype) {
			// enable drawing tool for type
			layer.setMode(modes.CREATE);
		} else {
			// disables other freehand instances
			layer.setMode(modes.VIEW);
		}
	});
	$(map._container).addClass('mode-create');
};

group.enableDeleteTool = function () {
	this.eachLayer(function (layer) {
		if (layer.category === activetype) {
			// enable drawing tool for type
			layer.setMode(modes.DELETE);
		} else {
			// disables other freehand instances
			layer.setMode(modes.VIEW);
		}
	});
	$(map._container).addClass('mode-delete');
};

group.clearPolygons = function () {
	this.eachLayer(function (layer) {
		layer.clearPolygons();
	});
};

group.handleToolAndType = function () {
	// make sure canvas is on top
	if (map._canvasCtx) {
		map._canvasCtx.canvas.style.zIndex = 1;
	}

	if (activetool === 'pan') {
		// normal use of freedraw: create polygons in chosen land use type
		group.enablePanTool();

	} else if (activetool === 'add') {
		// normal use of freedraw: create polygons in chosen land use type
		group.enableAddTool();

	} else if (activetool === 'subtract') {
		// drawing tool is subtractive (requires TURF)
		// group.enableSubtractTool();
		console.log('not implemented');
		$('#draw-tools').find('input').first().trigger('click');
		
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
},{"./categories":1,"./leaflet-map":4,"./turf-worker":6}],4:[function(require,module,exports){
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
},{}],5:[function(require,module,exports){
var map = require('./leaflet-map'),
    controls = require('./controls'),
    drawcontroller = require('./draw-controller');
},{"./controls":2,"./draw-controller":3,"./leaflet-map":4}],6:[function(require,module,exports){
var turfworker = new function () {},
	tilecache = {};

/*turfworker.intersectWithTile = function (poly) {
	getTileJSON(function (tile_as_json) {
		var jsona = polygonToGeoJSON(poly),
			jsonb = turf.intersect(tile_as_json, jsona);
		handleNewJson(poly, jsona, jsonb);
	});
};*/

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
		handleNewJson(poly, jsona, diff);
	}
};

function turfdiff (a, b) {
	try {
		return turf.difference(a, b);
	} catch (e) {
		try {
			return turf.difference(
				turf.buffer(a, 0), 
				turf.buffer(b, 0)
				);
		} catch (e) {
			console.trace('turfdiff', a, b);
			// somehow the polygons 
			// are turning into
			// three identical coordinates
			// so I'd say return undefined (kill it)
			return undefined;
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

function geoJSONToPolygon (geojson) {
	return L.GeoJSON.geometryToLayer( geojson );
};

function handleNewJson (poly, json_old, json_new) {
	if (json_new === undefined) {
		// polygon has been overwritten
		poly.destroy();
		return; 
	}

	try {
		var same_type = (json_old.geometry.type === json_new.geometry.type);
	} catch (e) {
		debugger;
	}

	if (same_type) {
		// no polygon to multipolygon shenanigans
		poly.setLatLngs( geoJSONToPolygon( json_new ).getLatLngs() );
	} else {
		// polygon got split into a multi
		var coords = json_new.geometry.coordinates,
			group = poly.getFreeHandShapes();

		// destroy and rebuild each?
		poly.destroy();

		/* todo: async for loop, test passing true/false */
		for (var i = 0, len = coords.length; i < len; i++) {
			var singlejson = turf.polygon(coords[i]);
			// pass false so create event doesn't fire again
			group._createPolygon( geoJSONToPolygon( singlejson ).getLatLngs(), true );
		}
	}
};

// define for Node module pattern loaders, including Browserify
if (typeof module === 'object' && 
    typeof module.exports === 'object') {
    module.exports = turfworker;
}
},{}]},{},[5]);
