importScripts('https://npmcdn.com/@turf/turf@3.5.1/turf.min.js');

addEventListener('message', function (e) {
	var data = e.data,
		mode = data.mode,
		primary = data.primary,
		secondary = data.secondary,
		geojson;

	if (!turf.intersects(primary, secondary)) {
		if (mode === 'intersect') {
			// intersect without intersects = empty
			postMessage({
				_leaflet_id : data._leaflet_id || 0,
				geojson : null
			});
		}
		return;
	}

	geojson = aggregate(primary, secondary, mode);

	if (geojson) {
		// ready for leaflet
		geojson = turf.flip(geojson);
	}

	postMessage({
		_leaflet_id : data._leaflet_id || 0,
		geojson : geojson
	});
});

function aggregate ( primary, secondary, _mode ) {
	if (!turf[_mode]) {
		console.error("invalid mode: ", _mode);
		return null;
	}
	try {
		primary = turf[ _mode ](primary, secondary);
	} catch (e) {
		console.log( e.message );
		console.log('trying to buffer');
		try {
			primary = turf[ _mode ](turf.buffer( primary, 0.000001 ), turf.buffer( secondary, 0.000001 ));
		} catch (e) {
			console.log( e.message );
			console.log('trying to buffer X2');
			try {
				primary = turf[ _mode ](turf.buffer( primary, 0.001 ), turf.buffer( secondary, 0.001 ));
			} catch (e) {
				console.log( e.message );
				console.warn('trying to buffer last time');
				try {
					primary = turf[ _mode ](turf.buffer( primary, 0.1 ), turf.buffer( secondary, 0.1 ));
				} catch (e) {
					console.error('failed', e);
				}
			}
		}
	}

	if (primary && !primary.geometry.type.match(/Polygon/)) {
		throw new Error(primary.geometry.type + ' is not a poly');
	}

	/*	if (primary && 
		primary.geometry.type === 'GeometryCollection') {
		// remove points because that's crazy
		for (var geometries = primary.geometry.geometries,
				copies = geometries.slice(), 
				i = copies.length - 1; i > -1; i--) {
			var type = copies[ i ].type;
			if (type === 'Point') {
				geometries.splice(i, 1);
			}
		}
	}*/
	
	return primary || null;
}

// add intersects
turf.intersects = function (poly1, poly2) {
    var jsts = require('jsts'),
        geom1, geom2,
        reader = new jsts.io.GeoJSONReader(),
        a, b;

    if (poly1.type === 'Feature') {
        geom1 = poly1.geometry;
    } else {
        geom1 = poly1;
    }
    if (poly2.type === 'Feature') {
        geom2 = poly2.geometry;
    } else {
        geom2 = poly2;
    }

    a = reader.read(JSON.stringify(geom1));
    b = reader.read(JSON.stringify(geom2));

    return !!a.intersects(b);
};