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
			return false;
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
		handleNewJson(poly, jsona, diff);
		if (!diff) {
			// poly was destroyed
			break;
		}
	}
};

turfworker.union = function (polyarr, newpoly) {
	/*
	
	polyarr (array of leaflet L.Polygon's)
	newpoly (L.Polygon)

	new poly is drawn, all polys in polyarr
	must be unioned
	*/
	var polyarr = (polyarr || []).slice(), // copy
		jsonb = polygonToGeoJSON( newpoly );

	/* todo: test async for loop */
	for (var i = 0, len = polyarr.length; i < len; i++) {
		var poly = polyarr[i],
			jsona = polygonToGeoJSON(poly),
			union = turfunion(jsona, jsonb);

		if (union.geometry.type === "MultiPolygon") {
			// do not union non-contiguous polys
			continue;
		}

		handleNewJson(newpoly, jsonb, union);
		
		// destroy the unioned, merged into newpoly
		poly.destroy();
		jsonb = union;
	}
};

function handleNewJson (poly, json_old, json_new) {
	if (!json_new) {
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
			group = poly.getParentInstance();

		// destroy and rebuild each?
		poly.destroy();

		/* todo: async for loop, test passing true/false */
		for (var i = 0, len = coords.length; i < len; i++) {
			var singlejson = turf.polygon(coords[i]);
			// pass false so create event doesn't fire again
			group.createPolygon( geoJSONToPolygon( singlejson ).getLatLngs(), true );
		}
	}
};

function turfdiff (a, b) {
	try {
		return turf.difference(a, b);
	} catch (e) {
		try {
			return turf.difference(
				getBufferedPoly(a), 
				getBufferedPoly(b)
				);
		} catch (e) {
			console.trace('turfdiff', a, b);
			// somehow the polygons 
			// are turning into
			// three identical coordinates
			// so I'd say return undefined (kill it)
			// return undefined;

			// maybe not
			return a;
		}
	}
}

function turfunion (a, b) {
	try {
		return turf.union(a, b);
	} catch (e) {
		try {
			return turf.union(
				getBufferedPoly(a), 
				getBufferedPoly(b)
				);
		} catch (e) {
			console.trace('turfunion', a, b);
			return a;
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

// define for Node module pattern loaders, including Browserify
if (typeof module === 'object' && 
    typeof module.exports === 'object') {
    module.exports = turfworker;
}