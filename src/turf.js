/**
 * Turf is a modular geospatial analysis engine written in JavaScript. It performs geospatial
 * processing tasks with GeoJSON data and can be run on a server or in a browser.
 *
 * @module turf
 * @summary Geospatial analysis for JavaScript
 */
var helpers = require('@turf/helpers');

module.exports = {
    /*isolines: require('@turf/isolines'),
    convex: require('@turf/convex'),
    within: require('@turf/within'),
    concave: require('@turf/concave'),*/
    difference: require('@turf/difference'),
    /*collect: require('@turf/collect'),*/
    flip: require('@turf/flip'),
    /*simplify: require('@turf/simplify'),
    bezier: require('@turf/bezier'),
    tag: require('@turf/tag'),
    sample: require('@turf/sample'),
    envelope: require('@turf/envelope'),
    square: require('@turf/square'),
    circle: require('@turf/circle'),
    midpoint: require('@turf/midpoint'),*/
    buffer: require('@turf/buffer'),
    /*center: require('@turf/center'),
    centerOfMass: require('@turf/center-of-mass'),
    centroid: require('@turf/centroid'),
    combine: require('@turf/combine'),
    distance: require('@turf/distance'),
    explode: require('@turf/explode'),
    bbox: require('@turf/bbox'),
    tesselate: require('@turf/tesselate'),
    bboxPolygon: require('@turf/bbox-polygon'),
    inside: require('@turf/inside'),
    intersect: require('@turf/intersect'),
    nearest: require('@turf/nearest'),
    planepoint: require('@turf/planepoint'),
    random: require('@turf/random'),
    tin: require('@turf/tin'),*/
    union: require('@turf/union'),
    /*bearing: require('@turf/bearing'),
    destination: require('@turf/destination'),
    kinks: require('@turf/kinks'),
    pointOnSurface: require('@turf/point-on-surface'),
    area: require('@turf/area'),
    along: require('@turf/along'),
    lineDistance: require('@turf/line-distance'),
    lineSlice: require('@turf/line-slice'),
    lineSliceAlong: require('@turf/line-slice-along'),
    pointOnLine: require('@turf/point-on-line'),
    pointGrid: require('@turf/point-grid'),
    squareGrid: require('@turf/square-grid'),
    triangleGrid: require('@turf/triangle-grid'),
    hexGrid: require('@turf/hex-grid'),
    idw: require('@turf/idw'),
    point: helpers.point,*/
    polygon: helpers.polygon,
    /*lineString: helpers.lineString,
    multiPoint: helpers.multiPoint,
    multiPolygon: helpers.multiPolygon,
    multiLineString: helpers.multiLineString,
    feature: helpers.feature,
    featureCollection: helpers.featureCollection,
    geometryCollection: helpers.geometryCollection*/
};

// add intersects
module.exports.intersects = function (poly1, poly2) {
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