var map = require('./leaflet-map'),
	$inputs = $('#draw-container').find('input');

toggleinputs();

$('#draw-container').on('change', 'input', toggleinputs);

function toggleinputs () {
	$inputs.next().removeClass('active');
	$inputs.filter(':checked').next().addClass('active');
}