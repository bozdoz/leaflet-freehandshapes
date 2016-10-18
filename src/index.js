var touch_extend = require('./leaflet-touch-extend'),
    _turf = require('./turf');

L.FreeHandShapes = L.FeatureGroup.extend({
    options: {
        polygon: {
            className: 'leaflet-free-hand-shapes',
            smoothFactor: 1,
            fillOpacity : 0.5
        },
        polyline : {
            color:'#5cb85c',
            opacity:1,
            smoothFactor: 0,
            weight:2
        },
        simplify_tolerance : 0.005,
        merge_polygons : true
    },

    initialize: function(options) {
        var _this = this,
            options = options || {};

        options.polygon = L.extend({}, this.options.polygon, options.polygon);
        options.polyline = L.extend({}, this.options.polyline, options.polyline);
        
        L.Util.setOptions(this, options);

        this._layers = {};
        
        this.Polygon = L.Polygon.extend({
            getGroup : function () {
                return _this;
            },
            destroy : function () {
                _this.removeLayer(this);
            },
            onAdd : function (_map) {
                this.on('click', this._onClick, this);
                L.Polygon.prototype.onAdd.call(this, _map);
            },
            _onClick : function (e) {
                _this.polygonClick(this, e);
            }
        });

        this.tracer = L.polyline([], L.extend({}, this.options.polyline));
    },

    onAdd: function(map) {
        var _this = this;

        this._map = map;

        // Memorise the preferences so we know how to revert.
        this.defaultPreferences = {
            dragging: map.dragging._enabled,
            doubleClickZoom: map.doubleClickZoom._enabled,
            scrollWheelZoom: map.scrollWheelZoom._enabled
        };

        this._events('on');

        this.creating = false;

        this._map.addLayer( this.tracer );

        this.setMode(this.mode || 'view');
    },

    onRemove: function (map) {
        this.setMapPermissions('enable');
        this._events('off');
        this._map.removeLayer( this.tracer );
    },

    // events

    _events : function (onoff) {
        var onoff = onoff || 'on',
            map = this._map;

        // map events
        map[ onoff ]('mousedown touchstart', this.mouseDown, this);
        map[ onoff ]('mousemove touchmove', this.mouseMove, this);
        map[ onoff ]('mouseup touchend', this.mouseUpLeave, this);
        map[ onoff ]('zoomstart movestart', this.zoomMoveStart, this);

        // body events
        L.DomEvent[ onoff ](document.body, 'mouseleave', this.mouseUpLeave.bind(this));
    },

    zoomMoveStart : function () {
        if (!this.creating) return;
        this.creating = false;
        this.resetTracer();
        this.setMapPermissions('enable');
    },

    mouseDown: function(event) {
        var RIGHT_CLICK = 2,
            originalEvent = event.originalEvent;

        if (this.creating ||
            originalEvent.button === RIGHT_CLICK ||
            originalEvent.ctrlKey ||
            originalEvent.shiftKey) {
            // 1. prevent right click
            // 2. allows ctrl key to toggle view mode
            // 3. allows shift key to boxzoom
            return;
        }

        if (L.Path.CANVAS) {
            // canvas bringToFront needs to reset the 
            // leaflet id before adding to map 
            this.tracer._leaflet_id = 0;
            L.stamp( this.tracer );
            this._map.addLayer( this.tracer );
        } 

        this.tracer.setLatLngs([ event.latlng ]);
        
        if (!L.Path.CANVAS) {
            // bringToFront works for SVG
            this.tracer.bringToFront();
        }

        if (this.mode === 'add' || 
            this.mode === 'subtract') {

            this.creating = true;
            this.setMapPermissions('disable');

        }

    },

    mouseMove: function(event) {
        if (!this.creating) return;

        this.tracer.addLatLng(event.latlng);
    },

    mouseUpLeave: function() {
        var latlngs;

        if (!this.creating) return;

        this.creating = false;

        latlngs = this.getSimplified( this.tracer.getLatLngs() );

        this.resetTracer();

        // User has failed to drag their cursor 
        // enough to create a valid polygon (triangle).
        if (latlngs.length < 3) return;

        // convert tracer polyline into polygon
        if (this.mode === 'add') {
            this.addPolygon( latlngs );
        } else if (this.mode === 'subtract') {
            this.subtractPolygon( latlngs );
        }

        // enable map functionality
        this.setMapPermissions('enable');
    },

    polygonClick: function(polygon, event) {
        if (this.mode === 'delete') { 
            this.removeLayer(polygon);
        }
    },

    // polygon creation methods

    addPolygon: function(latlngs, force) {
        var latlngs = force ? latlngs : this.getSimplified(latlngs),
            polyoptions = L.extend({}, this.options.polygon),
            polygon = new this.Polygon(latlngs, polyoptions);

        if (this.options.merge_polygons) {
            this.merge(polygon);
        }

        // todo:
        // styles for modes

        /*polygon.on({
            mouseover: highlightFeature.bind(this),
            mouseout: resetHighlight.bind(this)
        });*/

        this.addLayer( polygon );

        return polygon;
    },

    subtractPolygon : function (latlngs) {
        var latlngs = this.getSimplified(latlngs),
            polygon = new L.Polygon(latlngs);

        this.subtract(polygon);

        // emit event:
        // suppose a controller wants to 
        // subtract all instances
        this.fire('layersubtract', {
            layer : polygon
        });
    },

    getSimplified : function (latlngs) {
        var latlngs = latlngs || [],
            points,
            simplified,
            tolerance = this.options.simplify_tolerance;

        if (latlngs.length &&
            tolerance) {

            // latlng to x/y
            points = latlngs.map(function (a) {
                return {x : a.lat, y : a.lng};
            });

            // simplified points (needs x/y keys)
            simplified = L.LineUtil.simplify(points, tolerance);

            // x/y back to latlng
            latlngs = simplified.map(function (a) {
                return {lat : a.x, lng : a.y};
            });

        }

        return latlngs;
    },

    merge : function (polygon) {
        var polys = this.getLayers(),
            newjson = polygon.toGeoJSON(),
            fnc = this._tryturf.bind(this, 'union');

        for (var i = 0, len = polys.length; i < len; i++) {
            var poly = polys[i],
                siblingjson = poly.toGeoJSON(),
                union = fnc(newjson, siblingjson);

            if (union === false ||
                union.geometry.type === "MultiPolygon") {
                // do not union non-contiguous polys
                continue;
            }

            // destroy the old, merge into new
            this.removeLayer( poly );
            newjson = union;
        }

        // reset the new polygon with the 
        // cumulatively unioned polygons
        polygon.setLatLngs( this.getLatLngsFromJSON( newjson ) );
    },

    subtract : function (polygon) {
        var polys = this.getLayers(),
            newjson = polygon.toGeoJSON(),
            fnc = this._tryturf.bind(this, 'difference');

        for (var i = 0, len = polys.length; i < len; i++) {
            var poly = polys[i],
                siblingjson = poly.toGeoJSON(),
                diff = fnc(siblingjson, newjson);

            if (diff === false) {
                // turf failed
                continue;
            } 

            if (diff === undefined) {
                // poly was removed
                this.removeLayer( poly );
                continue;
            }

            if (diff.geometry.type === "MultiPolygon") {
                // poly was split into multi
                // destroy and rebuild
                this.removeLayer( poly );

                var coords = diff.geometry.coordinates;

                for (var j = 0, lenj = coords.length; j < lenj; j++) {
                    var polyjson = _turf.polygon( coords[ j ] ),
                        latlngs = this.getLatLngsFromJSON( polyjson );
                    this.addPolygon(latlngs, true);
                }
            } else {
                // poly wasn't split: reset latlngs
                poly.setLatLngs( this.getLatLngsFromJSON( diff ) );
            }
        }
    },

    getLatLngsFromJSON : function (json) {
        var coords = json.geometry.coordinates;
        return L.GeoJSON.coordsToLatLngs(coords, 1, L.GeoJSON.coordsToLatLng);
    },

    _tryturf : function (method, a, b) {
        var fnc = _turf[method];
        try {
            return fnc(a, b);
        } catch (_) {
            // buffer non-noded intersections
            try {
                return fnc(
                    _turf.buffer(a, 0.000001), 
                    _turf.buffer(b, 0.000001)
                    );
            } catch (_) {
                // try buffering again
                try {
                    return fnc(
                        _turf.buffer(a, 0.1), 
                        _turf.buffer(b, 0.1)
                        );
                } catch (_) {
                    // try buffering one more time
                    try {
                        return fnc(
                            _turf.buffer(a, 1), 
                            _turf.buffer(b, 1)
                            );
                    } catch (_) {
                        // give up
                        console.error('turf failed', a, b);
                        return false;
                    }
                }
            }
        }
    },

    // helper methods

    resetTracer : function () {
        // remove tracer polyline by setting empty points
        this.tracer.setLatLngs([]);
    },
    
    setMapPermissions: function(method) {
        var map = this._map,
            preferences = this.defaultPreferences;

        map.dragging[method]();
        map.doubleClickZoom[method]();
        map.scrollWheelZoom[method]();

        if (method === 'enable') {

            // Inherit the preferences assigned to the map instance by the developer.

            if (!preferences.dragging) {
                map.dragging.disable();
            }

            if (!preferences.doubleClickZoom) {
                map.doubleClickZoom.disable();
            }

            if (!preferences.scrollWheelZoom) {
                map.scrollWheelZoom.disable();
            }

        } else {
            // disable events
            
        }

    },

    setMode: function(mode) {
        var mode = mode || 'view';

        mode = mode.toLowerCase();

        this.mode = mode;
        this.fire('mode', {
            mode: mode
        });

        if (mode === 'subtract') {
            this.tracer.setStyle({
                color : '#d9534f'
            });
        } else if (mode === 'add') {
            this.tracer.setStyle({
                color : this.options.polyline.color
            });
        }

        if (!this._map) {
            return;
        }

        if (mode === 'add' || mode === 'subtract') {
            this._map.dragging.disable();
        } else {
            this._map.dragging.enable();
        }

        this.setMapClass();
    },

    setMapClass : function () {
        var map = this._map._container,
            util = L.DomUtil,
            removeClass = util.removeClass;

        removeClass(map, 'leaflet-fhs-add');
        removeClass(map, 'leaflet-fhs-subtract');
        removeClass(map, 'leaflet-fhs-delete');
        removeClass(map, 'leaflet-fhs-view');

        util.addClass(map, 'leaflet-fhs-' + this.mode);
    }
});

L.freeHandShapes = function (options) {
    return new L.FreeHandShapes(options);
};