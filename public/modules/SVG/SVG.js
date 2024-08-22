var SVG = {
	deps: [],
	urls: {
		config: 'modules/SVG/config.json',
		pathToIcons: 'modules/SVG/icons/'
	},
	icons: {},
	iconsValue: {},
	container: null,
	init: function () {
		var d = $.Deferred();

		if (tv_manufacturer === 'mag') {
			log.add('SVG: svg module doesn\'t work on MAG');
			return false;
		}

		this.container = this.__createSVGContainer();
		document.body.appendChild(this.container);

		SVG.loadSystemIcons()
		.done(function(){
			css_append('modules/SVG/style.css', 'svg_icon_style');
			SVG.loadConfig(SVG.urls.config)
			.done(function (svg_config) {
				if (!svg_config) {
					return false;
				}

				SVG.icons = svg_config;

				var SVGIconsInstance;
				if(isset('config.production')){
					SVGIconsInstance = SVG.loadPackedIcons(SVG.icons);
				}else{
					SVGIconsInstance = SVG.loadIcons(SVG.icons);
				}
				SVGIconsInstance
				.done(function () {
					if(isset('structv2.config.icon_library')){
						SVG.loadContentIcons()
						.done(function(res){
							//Module init end
							d.resolve();
						})
						.fail(function(e){
							d.reject('content icons failed');
						});
					}else{
						//Module init end
						d.resolve();
					}
				});
			});
		})
		.fail(function(){
			d.reject('system icons failed');
		});
		return d.promise();
	},
	load: function (url, key) {
		var d = $.Deferred();

		$.ajax(url + '?v=' + version.v)
			.done(function (res) {
				d.resolve(key ? {icon: res, id: key} : res);
			})
			.fail(function () {
				log.add('SVG: ERROR: SVG icon error ' + url);
				d.resolve('');
			});

		return d.promise();
	},
	loadConfig: function (url) {
		var d = $.Deferred();

		$.getJSON(url + '?v=' + version.v)
			.done(function (res) {
				d.resolve(res);
			})
			.fail(function () {
				log.add('SVG: something wrong with config loading');
				d.resolve(null);
			});

		return d.promise();
	},
	loadIcons: function (icons) {
		var d = $.Deferred();
		var load_starttime = Date.now();

		var promises = [];
		for (var key in icons) {
			promises.push(SVG.load(SVG.urls.pathToIcons + icons[key] + '.html', key));
		}

		$.when.apply(null, promises).done(function () {

			log.add('SVG: loaded ' + arguments.length + ' icons in ' + (Date.now() - load_starttime) + 'ms');

			for (var i = 0; i < arguments.length; i++) {
				var argument = arguments[i];
				SVG.iconsValue[argument.id] = argument.icon;
			}

			d.resolve();
		});

		return d.promise();
	},
	loadPackedIcons: function () {
		var d = $.Deferred();
		var load_starttime = Date.now();

		$.getJSON(SVG.urls.pathToIcons + 'icons.json')
		.done(function(icons){
			SVG.iconsValue = icons;
			log.add('SVG: loaded ' + Object.keys(icons).length + ' packed icons in ' + (Date.now() - load_starttime) + 'ms');
			d.resolve();
		})
		.fail(function(e){log.add('SVG: failed to load packed icons');});

		return d.promise();
	},
	loadSystemIcons: function () {
		var d = $.Deferred();
		var load_starttime = Date.now();

		$.getJSON(SVG.urls.pathToIcons + 'icons_system.json')
		.done(function(icons){
			var tmp = '';
			for (var i in icons) {
				tmp += icons[i];
			}
			$(SVG.container).append(tmp);
			log.add('SVG: loaded ' + Object.keys(icons).length + ' system icons in ' + (Date.now() - load_starttime) + 'ms');
			d.resolve();
		})
		.fail(function(e){
			log.add('SVG: failed to load system icons');
			d.reject('json load error');
		});

		return d.promise();
	},
	loadContentIcons: function () {
		var d = $.Deferred();
		var load_starttime = Date.now();

		$.getJSON(tv_content_url + 'iconlist.json')
		.done(function(icons){
			for (var i in icons) {
				SVG.iconsValue[i] = icons[i];
			}
			log.add('SVG: loaded ' + Object.keys(icons).length + ' content icons in ' + (Date.now() - load_starttime) + 'ms');
			d.resolve();
		})
		.fail(function(){
			log.add('SVG: failed to load content icons');
			d.reject('no icons in content');
		});

		return d.promise();
	},
	setIcons: function () {
		var icons_replaced = 0, replace_starttime = Date.now();
		for (var key in SVG.icons) {
			if (key.indexOf('/*') !== -1) {
				continue;
			}

			var items = document.querySelectorAll('.' + key);
			if (!items.length) continue;

			for (var i = 0; i < items.length; i++) {
				var item = items[i];

				item.insertAdjacentHTML('beforeend', SVG.iconsValue[key]);
				// item.appendChild(__createSVG(SVG.icons[key]));
				$(item).removeClass(key).addClass('svg_icon');
			}
			icons_replaced += items.length;
		}
		log.add('SVG: replaced ' + icons_replaced + ' icons in ' + (Date.now() - replace_starttime) + 'ms');
	},
	__createSVGContainer: function () {
		// используется createElement
		// так как у Ноды созданной через createElementNS
		// нет метода insertAdjacentHTML
		var svg = document.createElement('svg');

		svg.setAttribute('id', 'svg_container');
		svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
		svg.setAttribute('style', 'position: absolute; width: 0; height: 0; top: 10000px;');

		return svg;
	},
	tests: function(){
		var tests_list = [
			{'name': 'Test All Icons', 'method': 'test_icons'}
		];
		return tests_list;
	},
	test_icons: function(index){
		if(!index){
			index = 0;
		}

		var icons = Object.keys(SVG.iconsValue);
		if(icons[index]){
			var name = icons[index];
			var icon = SVG.iconsValue[name];
			custom_confirm({
				title: name,
				text: '<div class="svg_icon" style="width:100%;height:190px;">' + icon + '</div>',
				onConfirm: function(){
					SVG.test_icons(++index);
				}
			});
		}else{
			custom_alert('End of list');
		}

	}

};
