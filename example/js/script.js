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