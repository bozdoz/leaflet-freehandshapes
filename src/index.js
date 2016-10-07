var touch_extend = require('./leaflet-touch-extend'),
    _turf = require('./turf');

L.FreeHandShapes = L.FeatureGroup.extend({
    statics: {
        MODES: {
            NONE: 0,
            VIEW: 1,
            CREATE: 2,
            DELETE: 4
        }
    },

    options: {
        polygon: {
            className: 'leaflet-free-hand-shapes',
            smoothFactor: 1
        },
        simplify_tolerance : 0.005,
        merge_polygons : true,
        svgClassName: 'tracer'
    },

    initialize: function(options) {
        var _this = this;

        if (typeof d3 === 'undefined') {
            console.error('D3 is a required library', 'http://d3js.org/');
            return;
        }

        L.Util.setOptions(this, options);

        this._layers = {};
        
        this.Polygon = L.Polygon.extend({
            getParentInstance : function () {
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

        this.tracer = L.polyline([], {
            color:'pink'
        });

        this.fromPoint = { x: 0, y: 0 };
        
        this._latLngs = [];
    },

    onAdd: function(map) {
        var _this = this;

        this._map = map;

        // Memorise the preferences so we know how to revert.
        this.defaultPreferences = {
            dragging: map.dragging._enabled,
            touchZoom: map.touchZoom._enabled,
            doubleClickZoom: map.doubleClickZoom._enabled,
            scrollWheelZoom: map.scrollWheelZoom._enabled
        };

        this.tracer.addTo(map);
        this.element = map._container;

        // Define the line function for drawing the polygon from the user's mouse pointer.
        this.lineFunction = d3.line()
            .x(function pointX(d) {
                return d.x;
            })
            .y(function pointY(d) {
                return d.y;
            });

        // Create a new instance of the D3 free-hand tracer.
        this.d3elem = d3.select(this.options.element || this.element);
        this.createD3();

        // Attach all of the events.
        map.on('mousedown touchstart', this.mouseDown, this);
        map.on('mousemove touchmove', this.mouseMove, this);
        map.on('mouseup touchend', this.mouseUpLeave, this);

        document.body
            .addEventListener('mouseleave', this.mouseUpLeave.bind(this));

        this.setMode(this.mode || L.FreeHandShapes.MODES.VIEW);
    },

    onRemove: function (map) {

        this.clearLayers();

        map.removeLayer(this.tracer);

        map.off('mousedown touchstart', this.mouseDown, this);
        map.off('mousemove touchmove', this.mouseMove, this);
        map.off('mouseup touchend', this.mouseUpLeave, this);

        document.body
            .removeEventListener('mouseleave', this.mouseUpLeave.bind(this));
    },

    // events

    mouseDown: function(event) {
        var RIGHT_CLICK = 2,
            originalEvent = event.originalEvent;

        if (this.creating || 
            originalEvent.button === RIGHT_CLICK) {
            return;
        }

        originalEvent.stopPropagation();
        originalEvent.preventDefault();

        /*
        todo:
        create a L.polyline and add to it
        */

        this.latLngs = [];
        this.fromPoint = this._map.latLngToContainerPoint(event.latlng);

        if (this.mode & L.FreeHandShapes.MODES.CREATE) {

            // Place the user in create polygon mode.
            this.creating = true;
            this.setMapPermissions('disable');

        }

    },

    mouseMove: function(event) {
        if (!this.creating) {

            // We can't do anything else if the user is not in the process of creating a brand-new
            // polygon.
            return;

        }

        var latlng = event.latlng,
            point = this._map.latLngToContainerPoint(latlng),
            lineData = [this.fromPoint, point];

        // Draw SVG line based on the last movement of the mouse's position.
        this.svg.append('path').classed('drawing-line', true).attr('d', this.lineFunction(lineData))
            .attr('stroke', '#D7217E').attr('stroke-width', 2).attr('fill', 'none');

        this.fromPoint = point;
        this.latLngs.push(latlng);

    },

    mouseUpLeave: function() {

        this._createMouseUp();

    },

    touchStart: function(point) {
        if (this.creating) {
            return;
        }

        d3.event.stopPropagation();
        d3.event.preventDefault();

        this.latLngs = [];
        this.fromPoint = L.point(point);

        if (this.mode & L.FreeHandShapes.MODES.CREATE) {

            // Place the user in create polygon mode.
            this.creating = true;
            this.setMapPermissions('disable');

        }
    },

    touchMove: function(point) {

        if (!this.creating) {

            // We can't do anything else if the user is not in the process of creating a brand-new
            // polygon.
            return;

        }

        var newpoint = L.point(point),
            latLng = this._map.containerPointToLatLng(newpoint),
            lineData = [this.fromPoint, newpoint];

        // Draw SVG line based on the last movement of the mouse's position.
        this.svg.append('path').classed('drawing-line', true).attr('d', this.lineFunction(lineData))
            .attr('stroke', '#D7217E').attr('stroke-width', 2).attr('fill', 'none');

        // Take the pointer's position from the event for the next invocation of the mouse move event,
        // and store the resolved latitudinal and longitudinal values.
        this.fromPoint = newpoint;
        this.latLngs.push(latLng);
    },

    _createMouseUp: function() {

        if (!this.creating) {
            return;
        }

        // User has finished creating their polygon!
        this.creating = false;

        if (this.latLngs.length <= 2) {
            // User has failed to drag their cursor enough to create a valid polygon.
            return;
        }

        // Required for joining the two ends of the free-hand drawing to create a closed polygon.
        this.latLngs.push(this.latLngs[0]);

        // Physically draw the Leaflet generated polygon.
        this.createPolygon(this.latLngs);

        // done
        this.setMapPermissions('enable');
    },

    polygonClick: function(polygon, event) {
        if (this.mode & L.FreeHandShapes.MODES.DELETE) { 
            this.removeLayer(polygon);
        }
    },

    createPolygon: function(latlngs, force) {
        var latlngs = force ? latlngs : this.getSimplified(latlngs),
            polygon = new this.Polygon(latlngs, this.options.polygon);

        if (this.options.merge_polygons) {
            this.merge(polygon);
        }

        this.addLayer( polygon );

        // Begin to create a brand-new polygon.
        this.destroyD3().createD3();

        return polygon;
    },

    getSimplified : function (latlngs) {
        var latlngs = latlngs || [];
        if (latlngs.length &&
            this.options.simplify_tolerance) {
            points = latlngs.map(function (a) {
                return {x : a.lat, y : a.lng};
            });
            simplified = L.LineUtil.simplify(points, this.options.simplify_tolerance);

            latlngs = simplified.map(function (a) {
                return {lat : a.x, lng : a.y};
            });
        }
        return latlngs;
    },

    merge : function (polygon) {
        var polys = this.getLayers(),
            newjson = polygon.toGeoJSON(),
            _tryunion = this._tryunion;

        for (var i = 0, len = polys.length; i < len; i++) {
            var poly = polys[i],
                siblingjson = poly.toGeoJSON(),
                union = _tryunion(newjson, siblingjson);

            if (union === false ||
                union.geometry.type === "MultiPolygon") {
                // do not union non-contiguous polys
                continue;
            }

            // destroy the old, merge into new
            this.removeLayer( poly );
            newjson = union;
        }
        polygon.setLatLngs( L.GeoJSON.geometryToLayer( newjson ).getLatLngs() );
    },

    _tryunion : function (a, b) {
        try {
            return _turf.union(a, b);
        } catch (_) {
            // buffer non-noded intersections
            try {
                return _turf.union(
                    _turf.buffer(a, 0.000001), 
                    _turf.buffer(b, 0.000001)
                    );
            } catch (_) {
                // try buffering again
                try {
                    return _turf.union(
                        _turf.buffer(a, 0.1), 
                        _turf.buffer(b, 0.1)
                        );
                } catch (_) {
                    // give up
                    return false;
                }
            }
        }
    },

    // methods
    
    setMapPermissions: function(method) {
        var map = this._map,
            preferences = this.defaultPreferences;

        map.dragging[method]();
        map.touchZoom[method]();
        map.doubleClickZoom[method]();
        map.scrollWheelZoom[method]();

        if (method === 'enable') {

            // Inherit the preferences assigned to the map instance by the developer.

            if (!preferences.dragging) {
                map.dragging.disable();
            }

            if (!preferences.touchZoom) {
                map.touchZoom.disable();
            }

            if (!preferences.doubleClickZoom) {
                map.doubleClickZoom.disable();
            }

            if (!preferences.scrollWheelZoom) {
                map.scrollWheelZoom.disable();
            }

        }

    },

    setMode: function(mode) {
        // Prevent the mode from ever being defined as zero.
        var mode = mode || L.FreeHandShapes.MODES.VIEW;

        // Set the current mode and emit the event.
        this.mode = mode;
        this.fire('mode', {
            mode: mode
        });

        if (!this._map) {
            return;
        }

        // Enable or disable dragging according to the current mode.
        var isCreate = !!(mode & L.FreeHandShapes.MODES.CREATE),
            method = !isCreate ? 'enable' : 'disable';
        this._map.dragging[method]();

        /**
         * Responsible for applying the necessary classes to the map based on the
         * current active modes.
         *
         * @method defineClasses
         * @return {void}
         */
        (function defineClasses(modes, map, addClass, removeClass) {

            removeClass(map, 'mode-create');
            removeClass(map, 'mode-delete');
            removeClass(map, 'mode-view');
            removeClass(map, 'mode-append');

            if (mode & modes.VIEW) {
                addClass(map, 'mode-view');
            }

            if (mode & modes.CREATE) {
                addClass(map, 'mode-create');
            }

            if (mode & modes.DELETE) {
                addClass(map, 'mode-delete');
            }

        }(L.FreeHandShapes.MODES, this._map._container, L.DomUtil.addClass, L.DomUtil.removeClass));

    },

    unsetMode: function(mode) {
        this.setMode(this.mode ^ mode);
    },

    createD3: function() {

        this.svg = this.d3elem
            .append('svg')
            .attr('class', this.options.svgClassName)
            .attr('width', 200).attr('height', 200);

    },

    destroyD3: function() {
        this.svg.remove();
        this.svg = {};
        return this;
    },
});
