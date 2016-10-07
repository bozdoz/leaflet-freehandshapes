var map = require('./leaflet-map'),
    controls = require('./controls'),
    drawcontroller = require('./draw-controller'),
    region = require('./region');

region.addTo(map);
region.on('add', function () {
	map.fitBounds(this.getBounds());
});

window.map = map;
window.drawcontroller = drawcontroller;