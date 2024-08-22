var log = {
	zero: Date.now()
}; 
var version;

var system_start_timer;
function hoteza_start(){
	var timeout = 60000;
	system_start_timer = setTimeout(function(){
		console.log('CHECK: system NOT loaded in ' + timeout);
		if(typeof(isset) == 'undefined'){
			document.location.reload();
		}else{
			if(isset('config.tv.hacks.notreloadontimeout')){
				console.log('RELOAD SUPPRESSED BY HACK');
			}else{
				document.location.reload();
			}
		}
	}, timeout);

	var importScript = (function (oHead) {

		function loadError (oError) {
			throw new URIError('The script ' + oError.target.src + ' is not accessible.');
		}

		return function (sSrc, fOnload, fOnerror) {
			var oScript = document.createElement('script');
			oScript.type = 'text/javascript';
			oScript.async = false;
			oScript.onerror = loadError;
			if (fOnload) { oScript.onload = fOnload; }
			if (fOnerror) { oScript.onerror = fOnerror; }
			oHead.appendChild(oScript);
			oScript.src = sSrc + (version?'?v='+version.v:'?_noversion');
		};

	})(document.head || document.getElementsByTagName('head')[0]);

	var importStyle = (function (oHead) {

		function loadError (oError) {
			//throw new URIError('The style ' + oError.target.src + ' is not accessible.');
		}

		return function (sSrc, sId, fOnload, fOnerror) {
			var oStyle = document.createElement('link');
			oStyle.type = 'text/css';
			oStyle.rel = 'stylesheet';
			oStyle.onerror = loadError;
			if (sId) { oStyle.id = sId; }
			if (fOnload) { oStyle.onload = fOnload; }
			if (fOnerror) { oStyle.onerror = fOnerror; }
			oHead.appendChild(oStyle);
			oStyle.href = sSrc + (version?'?v='+version.v:'?_noversion');
		};

	})(document.head || document.getElementsByTagName('head')[0]);

	importScript(
		'j/libs/jquery-2.2.4.min.js',
		function(){
			$.getJSON('version.json?_=' + Math.random())
			.done(function(data){
				version = data;
				version.v = version.major + '.' + version.minor + '.' + version.patch;
				importAll();
			})
			.fail(function(){
				document.write('LOAD ERROR'); //jshint ignore: line
				setTimeout(function(){document.location.reload();}, 5000);	
			});
		}
	);

	function importAll(){
		importScript('j/libs/gibberish-aes-1.0.0.min.js');

		importStyle('s/s.css');
		importStyle('tv/tv.css');

		importScript('j/libs/accounting.min.js');

		importScript('j/widgets.js');
		importScript('j/feedback.js');
		importScript('j/util.js');
		importScript('j/dialogs.js');

		importScript('j/shop.js');
		importScript('j/gallery.js');
		importScript('j/map.js');
		importScript('j/services.js');
		importScript('j/parental_lock.js');
		importScript('j/viewbill.js');
		importScript('j/lang.js');
		importScript('j/time_picker.js');
		importScript('j/libs/moment/moment.min.js');
		importScript('j/video.js');

		importScript('j/Modules.js');

		importScript('j/libs/jsrender.min.js');
		importScript('tv/tv.js');

		importScript('j/libs/dynamics.min.js');

		importStyle('s/font/menuicons/style.css');
		importStyle('s/font/ui/style.css');
		importStyle('s/font/weather/style.css');
		importStyle('s/font/guide/style.css');
		importStyle('s/font/sources/style.css');

		importStyle('s/variables.css');

		importScript('tv/main.js');

		importStyle(
			'custom/config.css?_='+Math.random(),
			'customization_css',
			function(){
			},
			function(){
				importStyle('tv/config.css?_='+Math.random(), 'customization_css_old');
			}
		);
	}
}