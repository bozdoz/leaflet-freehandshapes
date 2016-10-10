var map = require('./leaflet-map');

(function () {
	for (var i = 0, len = arguments.length; i < len; i++) {
		(function ($elem) {
			$elem.on('change', 'input', function () {
				$elem.find('input')
					.next()
					.removeClass('active');

				$elem.find('input:checked')
					.next()
					.addClass('active');
			});
		})(arguments[i]);
	}
})($('#draw-tools'), $('#draw-colors'));