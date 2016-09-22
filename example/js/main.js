(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var baseURL = '//{s}.tile.osm.org/{z}/{x}/{y}.png',
    base = L.tileLayer( baseURL, {
            subdomains : 'abc'
        }),
   	baseMaps = {
		'Open Street Map' : L.tileLayer(baseURL, { 
	       subdomains: 'abc'
	    })
	},
    map = L.map('mapid', {
    	layers : [baseMaps[localStorage.baseMap || 'Open Street Map']],
    	zoom : 6,
    	center : [54.87660665410869, -115.01586914062499],
    	attributionControl: false,
        zoomControl : false,
    });

map.on('baselayerchange', function (layer) {
    localStorage.baseMap = layer.name || '';
});

L.control.layers(baseMaps, {}, {
	position : 'bottomleft'
}).addTo(map);

L.control.zoom({
	position : 'bottomleft'
}).addTo(map);

L.control.scale({
    position : 'bottomright'
}).addTo(map);

// define for Node module pattern loaders, including Browserify
if (typeof module === 'object' && 
    typeof module.exports === 'object') {
    module.exports = map;
}
},{}],2:[function(require,module,exports){
var map = require('./leaflet-map'),
    one = new L.FreeHandShapes({
        polygon: {
            color: '#111',
            fillColor: '#911',
            fillOpacity : 1,
            weight:2
        }
    }),
    two = new L.FreeHandShapes({
        polygon: {
            color: '#111',
            fillColor: '#191',
            fillOpacity : 1,
            weight:2
        }
    }),
    setToView = function () {
    	one.setMode(L.FreeHandShapes.MODES.VIEW);
    	two.setMode(L.FreeHandShapes.MODES.VIEW);
    },
    controller = new function () {
    	this.draw1 = function () {
    		setToView();
    		one.setMode(L.FreeHandShapes.MODES.CREATE);
    	};
    	this.edit1 = function () {
    		setToView();
    		one.setMode(L.FreeHandShapes.MODES.EDIT);
    	};
    	this.delete1 = function () {
    		setToView();
    		one.setMode(L.FreeHandShapes.MODES.DELETE);
    	};
    	this.color1 = '#911';
    	this.draw2 = function () {
    		setToView();
    		two.setMode(L.FreeHandShapes.MODES.CREATE);
    	};
    	this.edit2 = function () {
    		setToView();
    		two.setMode(L.FreeHandShapes.MODES.EDIT);
    	};
    	this.delete2 = function () {
    		setToView();
    		two.setMode(L.FreeHandShapes.MODES.DELETE);
    	};
    	this.color2 = '#191';
    },
    gui = (function () {
    	var _gui = new dat.GUI();

    	_gui.add(controller, 'draw1');
    	_gui.add(controller, 'edit1');
    	_gui.add(controller, 'delete1');

    	_gui.addColor(controller, 'color1').onChange(function (newValue) {
    		// update polygon options
    		one.options.polygon.color = newValue;
    		one.polygons.forEach(function (polygon) {
    			polygon.setStyle({
    				color : newValue
    			})
    		});
    	});

    	_gui.add(controller, 'draw2');
    	_gui.add(controller, 'edit2');
    	_gui.add(controller, 'delete2');

    	_gui.addColor(controller, 'color2').onChange(function (newValue) {
    		// update polygon options
    		two.options.polygon.color = newValue;
    		two.polygons.forEach(function (polygon) {
    			polygon.setStyle({
    				color : newValue
    			})
    		});
    	});
    })();

map.addLayer(one);
map.addLayer(two);

window.map = map;
},{"./leaflet-map":1}]},{},[2]);
