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