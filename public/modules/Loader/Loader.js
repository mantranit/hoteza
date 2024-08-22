(function() {
	var loader = "<div id=\"loader_spinner\"><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" preserveAspectRatio=\"xMidYMid\" class=\"lds-double-ring svg_loader\" style=\"background: none;\"><circle cx=\"50\" cy=\"50\" fill=\"none\" stroke-linecap=\"round\" r=\"40\" stroke-width=\"4\" stroke-dasharray=\"63 63\"></circle><circle cx=\"50\" cy=\"50\" fill=\"none\" stroke-linecap=\"round\" r=\"35\" stroke-width=\"4\" stroke-dasharray=\"55 55\" stroke-dashoffset=\"55\"></circle></svg></div>",

	container = null,
	detached = null;

	function manageKeydown(detach) {
		if (detach) {
			detached = tv_keydown_override;
			tv_keydown_override = empty;
		}
		else {
			tv_keydown_override = detached;
			detached = null;
		}
	}
	function empty() {}

	window.Loader = {
		deps: [],
		init: function () {},
		isRunning: false,
		start: function start() {
			if (Loader.isRunning) {
				log.add('Loader already exist');
				console.log('Loader already exist');
				return false;
			}

			if(!system_started){
				console.log('Loader start while booting');
				return false;
			}

			manageKeydown(true);

			Loader.isRunning = true;
			container = container || document.body;
			container.insertAdjacentHTML('beforeend', "<div id=\"loader\" class=\"loader\">".concat(loader, "</div>"));
		},
		stop: function stop() {
			if(!system_started){
				console.log('Loader stop while booting');
				return false;
			}
			if (!Loader.isRunning) {
				console.log('no loader to stop');
				return false;
			}

			manageKeydown(false);

			Loader.isRunning = false;
			var loaders = container.querySelectorAll('.loader');

			if (!loaders.length) {
				return false;
			}

			for (var i = 0; i < loaders.length; i++) {
				var loader = loaders[i];
				container.removeChild(loader);
			}
		}
	};
})();
