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