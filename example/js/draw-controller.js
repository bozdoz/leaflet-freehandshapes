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