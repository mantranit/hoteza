var widgetObserver = new (function WidgetObserver() {
	var OBSERVER = this;
	OBSERVER.observers = {};
	OBSERVER.widgets = {
//TODO: заменить на T_MIN константы. Пока грузится раньше, ломает систему
		"weather": {
			constructor: WidgetWeather,
			duration: 30*60*1000,
			name: 'Weather',
			type: 'constructor'
		},
		"gorkiGorodData": {
			constructor: WidgetGorkiGorod,
			duration: 1000*60*10,
			name: 'GorkiGorod',
			type: 'constructor'
		},
		"airportSchedule": {
			constructor: null,
			duration: null,
			name: 'Flights',
			type: 'module'
		}
	};

	OBSERVER.get_list = function(target) {
		var widgets = Object.keys(OBSERVER.observers);
		if (widgets.length === 0) return null;
		if (target === 'id') return widgets;

		var types = {};
		for (var i = 0; i < widgets.length; i++) {
			types[OBSERVER.observers[widgets[i]].type] = [];
			types[OBSERVER.observers[widgets[i]].type].push(OBSERVER.observers[widgets[i]].subscriber);
		}

		return types;
	};
	OBSERVER.get = function(widget_type, id) {
		if (isUndefined(widget_type, 'type')) return null;

		var list = OBSERVER.get_list();
		if (!list) return null;

		var list_arr = Object.keys(list);

		if (list_arr.indexOf(widget_type) === -1) {
			console.log('This type widget is not find:' + widget_type);
			return null;
		}

		if (list[widget_type].length === 1) {
			return list[widget_type][0];
		}
		else {
			if (isUndefined(id, 'id')) {
				console.log('Widgets type ' + widget_type + ' more than one');
				return null;
			}

			for (var i = 0; i < list[widget_type].length; i++) {
				var widget = list[widget_type][i];

				if (widget.id == id) {
					return widget;
				}
			}

			console.log('Widget ' + widget_type + ' with id ' + id + 'is not find');
			return null;
		}

		function isUndefined(v, param) {
			if (typeof v === 'undefined') {
				console.log('Please enter ' + param + ' widget');
				return true;
			}
			else return false;
		}
	};

	OBSERVER.open = function(subscriber) {
		OBSERVER.observers[subscriber].subscriber.open();
	};
	OBSERVER.eval = function(subscriber, fn, data) {
		OBSERVER.observers[subscriber].subscriber[fn](data);
	};

	OBSERVER.add = function(id, item) {
		if (
			!item.widget ||
			typeof item.widget.type === 'undefined' ||
			typeof OBSERVER.widgets[item.widget.type] === 'undefined'
		) {
			return false;
		}

		if (OBSERVER.widgets[item.widget.type].type === 'module') {
			Modules.load(OBSERVER.widgets[item.widget.type].name).done(function () {
				OBSERVER.observers[id] = {
					type: item.widget.type,
					// example: window['Flights']
					subscriber: window[OBSERVER.widgets[item.widget.type].name].init(id, item),
					duration: OBSERVER.widgets[item.widget.type].duration,
					interval: false
				};
			});
		}
		else {
			OBSERVER.observers[id] = {
				type: item.widget.type,
				subscriber: new OBSERVER.widgets[item.widget.type].constructor(id, item),
				duration: OBSERVER.widgets[item.widget.type].duration,
				interval: false
			};
		}

	};
	OBSERVER.init = function(subscriber) {
		if (typeof subscriber !== 'undefined') {
			_init(subscriber);
		}
		else {
			for (var id in OBSERVER.observers) {
				_init(id);
			}
		}

		function _init(id) {
			// если период обновления равен null
			if (!OBSERVER.observers[id].duration) {
				return false;
			}

			clearInterval(OBSERVER.observers[id].interval);

			OBSERVER.observers[id].subscriber.init();
			if (OBSERVER.observers[id].duration) {
				OBSERVER.observers[id].interval = setInterval(OBSERVER.refresh, OBSERVER.observers[id].duration, id);
			}
		}
	};
	OBSERVER.refresh = function(id) {
		OBSERVER.observers[id].subscriber.init();
	};
	OBSERVER.destroy = function(id) {
		clearInterval(OBSERVER.observers[id].interval);
		delete OBSERVER.observers[id];
	};
})();

function WidgetGorkiGorod(id, additionalData) {
	var WIDGET = this;
	WIDGET.id = id;
	WIDGET.build = false;
	WIDGET.data = null;
	WIDGET.additionalData = additionalData;

	WIDGET.init = function () {
		if (!WIDGET.build) {
			WIDGET.render('page');
			WIDGET.build = true;
		}

		WIDGET.getData();
	};
	WIDGET.render = function (type) {
		if (type === 'page') {
			UI.register_page({id: WIDGET.id, images: ['i/gorki-elevators.jpg', 'i/gorki-slopes.jpg', 'i/gorki-tracks.jpg']});
			renderPageOnTheStructv2(
				WIDGET.id,
				{
					title: "Рабочие трассы",
					listItemsArray: [
						{
							title: "Канатная дорога",
							onvclick: 'widgetObserver.eval('+ WIDGET.id +', \'open\', \'elevators\');',
							type: "listItem",
							image: "i/gorki-elevators.jpg"
						},
						{
							title: "Горнолыжные трассы",
							onvclick: 'widgetObserver.eval('+ WIDGET.id +', \'open\', \'slopes\');',
							type: "listItem",
							image: "i/gorki-slopes.jpg"
						},
						{
							title: "Пешие тропы",
							id: "tracks",
							type: "listItem",
							image: "i/gorki-tracks.jpg"
						}
					]
				},
				"information_list"
			);

			UI.register_page({id: 'tracks', images: ['i/gorki-bike-park.jpg', 'i/gorki-rope.jpg', 'i/gorki-hiking.jpg']});
			renderPageOnTheStructv2(
				'tracks',
				{
					title: "Рабочие трассы",
					listItemsArray: [
						{
							title: "Байк парк",
							onvclick: 'widgetObserver.eval('+ WIDGET.id +', \'open\', \'bike\');',
							type: "listItem",
							image: "i/gorki-bike-park.jpg"
						},
						{
							title: "Веревочный парк",
							onvclick: 'widgetObserver.eval('+ WIDGET.id +', \'open\', \'rope\');',
							type: "listItem",
							image: "i/gorki-rope.jpg"
						},
						{
							title: "Эко-маршруты",
							onvclick: 'widgetObserver.eval('+ WIDGET.id +', \'open\', \'hiking\');',
							type: "listItem",
							image: "i/gorki-hiking.jpg"
						}
					],
					backBtn: true,
					parentId: WIDGET.id
				},
				"information_list"
			);

			//TODO: правка структуры. (Убрать после улучшения модуля (UI register))
			for(var i in structv2.menu){
				if(structv2.menu[i].id == WIDGET.id){
					structv2.menu[i].title = WIDGET.additionalData.title;
					structv2.menu[i].image = WIDGET.additionalData.image;
				}
			}
		}
		else {
			var backBtns = {
				bike: 'tracks',
				rope: 'tracks',
				hiking: 'tracks',
				elevators: WIDGET.id,
				slopes: WIDGET.id
			};
			var titles = {
				bike: 'Байк парк',
				elevators: 'Канатные дороги',
				hiking: 'Эко-маршруты',
				rope: 'Веревочный парк',
				slopes: 'Горнолыжные трассы'
			};
			var data = {
				id: type,
				data: WIDGET.data[type],
				lang: {
					title: titles[type]
				},
				backBtn: '#' + backBtns[type],
				tpl: true,
				tplType: 'popup_list',
				klass: '',
				to: '#' + type
			};

			UI.popup_list_page(data, true);
		}
	};
	WIDGET.getData = function () {
		var request = {
			type: 'gorkiGorodData',
			hotelId: get_hotelId()
		};

		$.post(
			api_url + 'widget', request, function(response) {
				switch(response.result){
					case 0:
						if(response.data) {
							WIDGET.data = objectToMap(response.data);
						}
						else {
							log.add('GORKI GOROD: data is empty');
						}

						break;
					case 1:
						log.add('GORKI GOROD DATA: Invalid data');
						break;
					case 2:
						log.add('GORKI GOROD DATA: not activated');
						break;
					default:
						log.add('WEATHER: response unknown');
						// widgetObserver.destroy(WIDGET.id);
						break;
				}
			}, "json"
		).fail(function(err){
			log.add('WEATHER WIDGET: error ' + err.status + '|' + err.statusText);
		});

		function objectToMap(data) {
			var returningData = {};
			for (var key in data) {
				if (data[key].type !== 'tracks') {
					if (typeof returningData[data[key].type] === 'undefined') returningData[data[key].type] = [];
					returningData[data[key].type].push(data[key]);
				}
				else {
					if (typeof returningData[data[key].subType] === 'undefined') returningData[data[key].subType] = [];
					returningData[data[key].subType].push(data[key]);
				}
			}

			return returningData;
		}
	};
	WIDGET.open = function (target) {
		if (typeof target === 'undefined') return navigate('#' + WIDGET.id);

		WIDGET.render(target);
		navigate('#' + target);
	};
}
function WidgetWeather(id) {
	var WIDGET = this;
	WIDGET.id = id;
	WIDGET.started = false;
	WIDGET.url = undefined;
	WIDGET.locations = undefined;
	WIDGET.location = undefined;
	WIDGET.menuItem = null;
	WIDGET.template = null;
	WIDGET.timer = null;
	WIDGET.lang = null;

	WIDGET.build = {
		selectedLocation: false
	};

	WIDGET.init = function() {
		if (!this.started) {
			WIDGET.getData(WIDGET.renderItemMenu);
		}
		else {
			this.refresh();
		}
	};

	WIDGET.open = function() {
		WIDGET.getData(WIDGET.renderPage);
		tv_keydown_override = WIDGET.serverKeydown;
	};
	WIDGET.openSelectLocation = function() {
		var data = {
			id: 'weather_select_location',
			data: WIDGET.getLocations('json'),
			lang: {
				title: WIDGET.getLang().change_location,
				itemName: null
			},
			backBtn: '#settings',
			tpl: true,
			tplType: 'popup_list',
			klass: '',
			to: null
		};


		if (data.data.length <= 1) return;

		data.klass = classic_menu ? 'weather_select_location classic_menu' : 'weather_select_location';

		if (!WIDGET.build.selectedLocation) {
			UI.popup_list_page(data);
			WIDGET.build.selectedLocation = true;
		}
		else {
			document.getElementById('weather_select_location').style.display = 'block';
		}

		document.querySelector('.weather_btn').style.display = 'none';
		tv_sel_block('weather_select_location');
		make_scroll($('#weather_select_location #substrate'));

		var selected = false;
		for (var i = 0; i < tv_sel_list.length; i++) {
			if (tv_sel_list[i].classList.contains('selected')) {
				selected = true;
				tv_cur_pos = i;
			}
		}

		if (!selected) {
			tv_sel_list[0].classList.add('selected');
		}

		tv_sel_cur();
	};
	WIDGET.closeSelectLocation = function(rerender) {
		$(tv_cur).hide();
		document.getElementById('weather_select_location').style.display = 'none';

		if (rerender) {
			return WIDGET.open();
		}

		active_page = undefined;
		navigate('#' + WIDGET.id);

		document.querySelector('.weather_btn').style.display = 'block';
	};

	WIDGET.getURL = function() {
		if (typeof WIDGET.url === "undefined") {
			// return WIDGET.url = 'http://admin.blacknova.co/jsonapi/weather?forecast=1&hotelId=7';
			WIDGET.url = api_url + (
				isset('config.widgets.weather.url') ?
					isset('config.widgets.weather.url') :
					'weather?forecast=1&hotelId=' + get_hotelId()
			);
			return WIDGET.url;
		}
		else {
			return WIDGET.url;
		}
	};
	WIDGET.getLocations = function(type) { // type == 'json' or 'string'
		var locations;
		if (typeof WIDGET.locations === 'undefined') {
			locations = structv2.menu['id_' + WIDGET.id].widget.data;
			WIDGET.locations = reductionData(locations);
		}
		else {
			locations = WIDGET.locations;
		}

		return type === 'string' ? JSON.stringify(locations) : locations;

		function reductionData(locations) {
			for (var i = 0; i < locations.length; i++) {
				var location = locations[i];
				location.item = location.name;
				location.itemName = false;
				location.onvclick = 'widgetObserver.eval('+ WIDGET.id +', \'setLocation\', '+ location.id +')';
			}

			return locations;
		}
	};
	WIDGET.getData = function(fn) {
		var request = isset('config.widgets.weather.type') ?
			{
				type: isset('config.widgets.weather.type'),
				hotelId: get_hotelId(),
				data: WIDGET.getLocations('json')
			} :
			{ data: WIDGET.getLocations('json') };

		$.post(
			WIDGET.getURL(), request, function(response) {
				switch(response.result){
					case 0:
						var weather = (response.weather || response.data.weather || response.data);

						if(weather && weather[0].timestamp|0) {
							var tmp = (time.now(true) - response.timestamp*1000)/1000;
							if(tmp > (12*T_HOUR)){ //12h
								//TODO: weather hide
								log.add('WEATHER: outdated: ' + tmp + ' seconds');
								var data = {
									cmd: 'log',
									id: '!!',
									text: 'ERROR: hotel ' + get_hotelId() + ': weather outdated: ' + tmp
								};
								log.post(data);
							}
							else {
								if (weather.length) {
									fn(weather);
									// log.add('WIDGET WEATHER: OK');
								}
								else {
									log.add("WIDGET WEATHER: data is empty");
									// widgetObserver.destroy(WIDGET.id);
								}
							}
						}
						else {
							log.add('WIDGET WEATHER: data invalid');
							// widgetObserver.destroy(WIDGET.id);
						}

						break;
					case 1:
						log.add('WEATHER: Invalid hotel');
						// widgetObserver.destroy(WIDGET.id);
						break;
					case 2:
						log.add('WEATHER: not activated');
						// widgetObserver.destroy(WIDGET.id);
						break;
					default:
						log.add('WEATHER: response unknown');
						// widgetObserver.destroy(WIDGET.id);
						break;
				}
			}, "json"
		).fail(function(err){
			log.add('WEATHER WIDGET: error ' + err.status + '|' + err.statusText);
		});
	};
	WIDGET.getLang = function() {
		if (!WIDGET.lang) {
			WIDGET.lang = {};
			WIDGET.lang.today = getlang('today');
			WIDGET.lang.tomorrow = getlang('tomorrow');

			WIDGET.lang.monday = getlang('monday');
			WIDGET.lang.tuesday = getlang('tuesday');
			WIDGET.lang.wednesday = getlang('wednesday');
			WIDGET.lang.thursday = getlang('thursday');
			WIDGET.lang.friday = getlang('friday');
			WIDGET.lang.saturday = getlang('saturday');
			WIDGET.lang.sunday = getlang('sunday');

			WIDGET.lang.wind = getlang('wind');
			WIDGET.lang.humidity = getlang('humidity');
			WIDGET.lang.pressure = getlang('pressure');
			WIDGET.lang.cloudiness = getlang('cloudiness');

			WIDGET.lang.metr_per_second = getlang('metr_per_second');
			WIDGET.lang.pressure_dimension = getlang('pressure_dimension');

			WIDGET.lang.change_location = getlang('change_location');
			WIDGET.lang.select_btn = getlang('select_btn');

			WIDGET.lang.night = getlang('night');
			WIDGET.lang.now = getlang('just-now');
		}

		return WIDGET.lang;
	};
	WIDGET.getCurrentLocation = function(data) {
		if (typeof WIDGET.location === 'undefined' || data.weather.length === 1) {
			WIDGET.location = data.weather[0].id;

			data.weather = data.weather[0];
			data.locations = data.locations[0];
		}
		else {
			for (var i = 0; i < data.weather.length; i++) {
				if (data.weather[i].id == WIDGET.location) data.weather = data.weather[i];
				if (data.locations[i].id == WIDGET.location) data.locations = data.locations[i];
			}
		}
	};

	WIDGET.renderItemMenu = function(response) {
		var data = {};
		data.weather = response;
		data.locations = WIDGET.getLocations('json');
		data.language = WIDGET.getLang();

		if (isset('config.widgets.weather.howInterfaceSwitches') === 'rotate') {
			data.animation = 'rotate';
		} else {
			data.animation = 'fade';
		}

		setGuestData();
		data.config = guestData.weather;
		WIDGET.setMetrics(data.weather);

		if (!WIDGET.menuItem) {
			WIDGET.menuItem = document.querySelector('[data-id="'+ WIDGET.id +'"]');

			// виджет есть в меню, но не используется в сетке
			if (!WIDGET.menuItem) {
				log.add('WIDGET WEATHER: menuItem not included in the grid');
				widgetObserver.destroy(WIDGET.id);
				return;
			}
		}
		if (!WIDGET.template) {
			if (metro_menu) {
				if (WIDGET.menuItem.className.indexOf('s2x2') !== -1) WIDGET.template = 'menu_weather_s2x2';
				else if (WIDGET.menuItem.className.indexOf('s2x1') !== -1) WIDGET.template = 'menu_weather_s2x1';
				else WIDGET.template = 'menu_weather_s1x1';
			}
			else if (scandic_menu) {
				WIDGET.template = 'menu_weather_scandic';
			}
			else {
				WIDGET.template = 'menu_weather_classic';
			}
		}

		WIDGET.menuItem.innerHTML = '';
		renderPageOnTheStructv2(null, data, WIDGET.template, 'widget_menu', WIDGET.menuItem);

		WIDGET.fitText.start();
		WIDGET.setTimer();

		WIDGET.started = true;

		function setGuestData() {
			if (!isset('guestData.weather')) {

				if (!isset('config.widgets.weather')) {
					if (!isset('config.widgets')) config.widgets = {};

					config.widgets.weather = {};
					config.widgets.weather.valueTemperature = 'C';
					config.widgets.weather.valueWind = 'Kmph';
					config.widgets.weather.howInterfaceSwitches = 'rotate';
				}

				config.widgets.weather.plus = isset('config.weather.plus');

				guestData.weather = config.widgets.weather;

			}
		}
	};
	WIDGET.renderPage = function (response) {
		var classPage = metro_menu || scandic_menu ? 'weather' : 'weather classic_menu';
		var data = {};
		data.weather = response;
		data.locations = WIDGET.getLocations('json');
		data.language = WIDGET.getLang();

		data.daysQnt = metro_menu || scandic_menu ? 5 : 3;

		data.config = guestData.weather;
		WIDGET.setMetrics(data.weather);
		WIDGET.getCurrentLocation(data);

		renderPageOnTheStructv2(WIDGET.id, data, 'weather_forecast', classPage);
		if (WIDGET.getLocations('json').length <= 1) {
			document.getElementById('btn_change_location').style.display = 'none';
		}

		if (active_page_id === WIDGET.id) {
			active_page = undefined;
		}
		navigate('#' + WIDGET.id);
	};
	WIDGET.refresh = function() {
		WIDGET.fitText.count = 0;

		WIDGET.getData(WIDGET.renderItemMenu);
	};

	WIDGET.setMetrics = function(list) {

		for (var i = 0; i < list.length; i++) {
			var day = typeof list[i].current !== 'undefined' ? list[i].current : list[i];

			if (i >= 5 && typeof day.forecast === 'undefined') {
				break;
			}

			if (typeof day.wind !== 'undefined') {
				day.windSpeed = Math.round(day.wind.speed); // скорость м/с
				day.windDirect = day.wind.direction.toLowerCase();
			}

			day.pressure = typeof day.pressure !== 'undefined' ?
				Math.round(day.pressure*0.75) : null;

			day.humidity = typeof day.humidity !== 'undefined' ?
				day.humidity : null;

			if (
				typeof day.temp !== 'undefined' &&
				typeof day.temp.day !== 'undefined' &&
				typeof day.temp.night !== 'undefined'
			) {
				day.temperature = {};
				day.temperature.day = day.temp.day['temp' + guestData.weather.valueTemperature];
				day.temperature.night = day.temp.night['temp' + guestData.weather.valueTemperature];
				if (day.temperature.day > 0 && guestData.weather.plus) {
					day.temperature.day = '+' + day.temperature.day;
				}
				if (day.temperature.night > 0 && guestData.weather.plus) {
					day.temperature.night = '+' + day.temperature.night;
				}
			}

			day.windDirectFullTranscript = getlang('wind_direct_full_' + day.windDirect);
			day.windDirectTranscript = getlang('wind_direct_' + day.windDirect);

			var icon = day.weatherIconTxt;
			day.icon = icon.replace(' ', '-');

			day.description = getlang('icon-' + day.icon);

			if (typeof (day.forecast) !== 'undefined') {
				WIDGET.setMetrics(day.forecast);
			}
			else {
				// var strDate = list[i].datetime.split(' ');
				var date = new Date(day.timestamp*1000);

				day.date = {};
				day.date.day = getlang(DAYSOFWEEK[(date.getDay())]);
				day.date.month = getlang(MONTHOFYEAR[date.getMonth()]);
				day.date.dayOfMonth = date.getDate();
			}
		}
	};
	WIDGET.setTimer = function() {
		if (WIDGET.template === 'menu_weather_s1x1') return;

		clearInterval(WIDGET.timer);
		WIDGET.timer = setInterval(WIDGET.switchInterface, 10000);
	};
	WIDGET.setLocation = function(id) {
		var rerender = true;

		if (WIDGET.location != id) {
			WIDGET.location = id;

			if (tv_cur_block === 'weather_select_location') {
				tv_sel_list.removeClass('selected');
				tv_cur_elem.addClass('selected');
			}
		}
		else {
			rerender = false;
		}


		WIDGET.closeSelectLocation(rerender);
	};

	WIDGET.switchInterface = function() {
		if (WIDGET.template === 'menu_weather_s1x1') return;

		if (isset('config.widgets.weather.howInterfaceSwitches') === 'rotate') {
			$(WIDGET.menuItem).find('.animation_rotate').toggleClass('invert');
		}else{
			$(WIDGET.menuItem).find('.animation_fade').toggleClass('invert');
		}

		WIDGET.fitText.start();
	};
	WIDGET.switchDimension = function() {
		guestData.weather.valueTemperature = guestData.weather.valueTemperature === 'C' ? 'F' : 'C';

		widgetObserver.init(WIDGET.id);
		widgetObserver.open(WIDGET.id);
	};
	WIDGET.fitText = {
		count: 0,
		start: function() {
			if (WIDGET.template.indexOf('classic') !== -1 && WIDGET.fitText.count <= 2) {

				var blocks = $('.block_bottom_4_cell, .block_bottom_6_cell');

				if (blocks.is('visible')) {
					fit_text(blocks);
				}
				else {
					return;
				}

				WIDGET.fitText.count++;
			}
		}
	};

	WIDGET.serverKeydown = function(e) {
		if (!e) e = event;
		var code = (e.keyCode ? e.keyCode : e.which);

		if(e.shiftKey){
			code = 'S'+code;
		}

		switch(code){
			case 0:
				break;
			case tv_keys.NUM_0:
				tv_channel_number_press(0);
				break;
			case tv_keys.NUM_1:
				tv_channel_number_press(1);
				break;
			case tv_keys.NUM_2:
				tv_channel_number_press(2);
				break;
			case tv_keys.NUM_3:
				tv_channel_number_press(3);
				break;
			case tv_keys.NUM_4:
				tv_channel_number_press(4);
				break;
			case tv_keys.NUM_5:
				tv_channel_number_press(5);
				break;
			case tv_keys.NUM_6:
				tv_channel_number_press(6);
				break;
			case tv_keys.NUM_7:
				tv_channel_number_press(7);
				break;
			case tv_keys.NUM_8:
				tv_channel_number_press(8);
				break;
			case tv_keys.NUM_9:
				tv_channel_number_press(9);
				break;

			case tv_keys.INPUT:
				navigate('#sources_page');
				break;

			case tv_keys.UP:
				if (tv_cur_block === 'weather_select_location') {
					tv_up();
				}
				break;
			case tv_keys.DOWN:
				if (tv_cur_block === 'weather_select_location') {
					tv_down();
				}
				break;
			case tv_keys.LEFT:
				if (tv_cur_block !== 'weather_select_location' && classic_menu) {
					tv_keydown_override = null;
					tv_left();
				}
				break;
			case tv_keys.RIGHT:
				// tv_right();
				break;
			case tv_keys.ENTER:
				tv_ok();
				if(e.stopPropagation){
					e.stopPropagation();
				}
				break;
			case tv_keys.EXIT:
			case tv_keys.BACK:
				if (tv_cur_block === 'weather_select_location') {
					WIDGET.closeSelectLocation();
				}
				else {
					tv_keydown_override = null;
					tv_back();
				}
				break;
			case tv_keys.CH_UP:
				tv_chup();
				break;
			case tv_keys.CH_DOWN:
				tv_chdown();
				break;

			case tv_keys.RED:
				if (tv_cur_block === 'weather_select_location') {
					WIDGET.closeSelectLocation();
				}

				tv_keydown_override = null;
				tv_back();
				tv_mode();
				break;
			case tv_keys.GREEN:
			case 81: // десктоп версия. клавиша W
				if (tv_cur_block !== 'weather_select_location') {
					WIDGET.switchDimension();
				}

				break;
			case tv_keys.YELLOW:
			case 87: // key E // управление в браузере
				if (tv_cur_block === 'weather_select_location') {
					WIDGET.closeSelectLocation();
				}
				else {
					WIDGET.openSelectLocation();
				}
				break;
			case tv_keys.BLUE:
				if (tv_cur_block === 'weather_select_location') {
					WIDGET.closeSelectLocation();
				}

				tv_keydown_override = null;

				navigate('#language_select');
				break;

			case tv_keys.PORTAL:
			case tv_keys.GUIDE:
			case tv_keys.Q_MENU:
			case tv_keys.MENU:
			case tv_keys.HOME:
				if (tv_cur_block === 'weather_select_location') {
					WIDGET.closeSelectLocation();
				}

				tv_keydown_override = null;

				navigate('#menu');
				break;

			default:
				//tv_log('code ' + code);
				break;

		}
	};
}
