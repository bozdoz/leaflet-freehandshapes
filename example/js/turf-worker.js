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
				}
				catch (e) {
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