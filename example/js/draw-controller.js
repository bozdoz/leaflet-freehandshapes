var map = require('./leaflet-map'),
	categories = require('./categories'),
	group = new L.LayerGroup(),
	activetool = $('#draw-tools').find('input:checked').val(),
	activetype = $('#draw-colors').find('input:checked').val(),
	turfwebworker = new Worker('./js/turf-web-worker.min.js'),
	region = require('./region'),
	regioncache;

region.on('add', function () {
	regioncache = turf.buffer(region.toGeoJSON(), 0.000001);
});

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
		
		console.log('layeradd');
		subtractOtherLayers.call(this, data);
		intersectWithStudyArea( poly );
	});

	drawer.on('layersubtract', subtractOtherLayers);
}

function intersectWithStudyArea (polya) {

	turfwebworker.postMessage({
		_leaflet_id : polya._leaflet_id,
		primary : polya.toGeoJSON(),
		mode : 'intersect',
		secondary : regioncache,
	});

}

function subtractOtherLayers (data) {
	var polyb = data.layer.toGeoJSON();

	// collect polygons
	group.eachLayer(function (layer) {
		if (layer === this) return;

		layer.eachLayer(function (polya) {
			// difference each layer
			turfwebworker.postMessage({
				_leaflet_id : polya._leaflet_id,
				primary : polya.toGeoJSON(),
				mode : 'difference',
				secondary : polyb,
			});
		});
	}, this);
}

// listen to worker
turfwebworker.addEventListener('message', function (e) {
	var data = e.data,
		geojson = data.geojson, // or false
		geometry = geojson ? geojson.geometry : null,
		_leaflet_id = data._leaflet_id,
		_layer = map._layers[ _leaflet_id ],
		coords,
		group;

	if (_layer)	 {
		if (!geometry) {
			// removed
			_layer.destroy();
		} else if (geometry.type === "Polygon") {
			// my word, it worked
			_layer.setLatLngs( geometry.coordinates );
		} else if (geometry.type === "MultiPolygon") {
			group = _layer.getGroup();
			coords = geometry.coordinates;

			// destroy and make new singles from the multi
			_layer.destroy();

			for (var i = 0, len = coords.length; i < len; i++) {
				var newpoly = coords[i];
				// no simplify, no merge, no event
				group.addPolygon(newpoly, true, true, true);
			}
		}
	}
});

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
		$('#draw-tools').find('input').eq(1).trigger('click');
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