var RADIO = {
	deps: [
		'ServiceCodes'
	],
	parentId: '#menu',
	blocks: {},
	media: undefined,
	detachedContent: null,
	timer: {},
	genre_filter: [],
	station: undefined,
	playing: false,
	isCanPlaying: function() {
		if (RADIO.playing) {
			return true;
		}
		else if (typeof RADIO.station !== 'undefined') {
			return true;
		}
		else {
			return false;
		}
	},
	init: function(){
		ServiceCodes.registerListener({
			'4100': function() {
				RADIO.open();
			}
		});

		//UI.register_page({id: 'radio', action: RADIO.open_new});

		RADIO.loadStructure();
	},
	open: function(block, parentId) {
		if (
			typeof block === 'undefined' &&
			typeof parentId !== 'undefined'
		) {
			RADIO.parentId = parentId;
		}

//		не работает, lastpage уже radio
//		if(classic_menu){
//			RADIO.parentId = HotezaTV.history.lastpage;
//		}

		if (isEmptyList(block)) return;

		switch (block) {
			case undefined:
				navigate('#radio_page').done(openRadio);
				function openRadio() {
					RADIO.blocks.radio.classList.remove('displaynone');
					RADIO.blocks.radio.classList.add('displayshow');
					RADIO.blocks.tv_cur_id = document.getElementById('tv_cur');

					if(classic_menu){
						$('#menu_wrapper').hide();
					}

					document.getElementById('tv_fullscreen_overlay').classList.add('tv_mosaic_fullscreen');
					tv_keydown_override = RADIO.server_keydown;

					tv_sel_block('tv_radiolist');

					if (typeof Analytics !== 'undefined') {
						Analytics.hitsPages('radio');
					}

					RADIO.blocks.tv_cur_id.style.display = 'none';

					make_scroll($(RADIO.blocks.tv_radiolist));

					RADIO.play(true);

					if (tv_lg_mark) { // костыль
						document.getElementById('tv_fullscreen_btns').style.display = 'none';
						metro_menu_calc();
						RADIO.scroll_opacity('#tv_radiolist_scroll', 'tv_radiolist');
					}
				}

				break;

			case 'tv_radiolist':
				RADIO.blocks.preview.classList.remove('displaynone');
				RADIO.blocks.preview.classList.add('displayshow');
				RADIO.blocks.genre_list.classList.remove('displayshow');
				RADIO.blocks.genre_list.classList.add('displaynone');

				var tv_cur = $(RADIO.blocks.tv_radiolist).find('[data-num="'+ RADIO.station_index +'"]');
				if (!tv_cur.hasClass('displaynone')) tv_cur_elem = tv_cur;

				tv_sel_block(block);
				RADIO.blocks.tv_cur_id.style.display = 'none';

				RADIO.play();

				break;

			case 'genre':
				RADIO.blocks.preview.classList.remove('displayshow');
				RADIO.blocks.preview.classList.add('displaynone');
				RADIO.blocks.genre_list.classList.remove('displaynone');
				RADIO.blocks.genre_list.classList.add('displayshow');

				make_scroll($('#genre'));

				tv_sel_block(block);

				$(RADIO.blocks.tv_radiolist).find('.tv_sel').removeClass('tv_cur tv_sel');
				$(RADIO.blocks.tv_radiolist).find('.tv_cur').removeClass('tv_cur tv_sel');

				break;
		}

		document.getElementById('tv_fullscreen_btns').style.display = 'none';
		metro_menu_calc();
		RADIO.scroll_opacity('#tv_radiolist_scroll', 'tv_radiolist');

		function isEmptyList(type) {
			var list;
			if (typeof type === 'undefined' || type === 'tv_radiolist') {
				list = 'list';
			}
			else {
				list = 'genre';
			}

			if (!RADIO[list] || RADIO[list].length === 0 || $.isEmptyObject(RADIO[list])) {
				var cb = list === 'genre' ? 'RADIO.open' : null;
				custom_dialog('alert', getlang('list_is_empty'), '', cb);
				return true;
			}
			else {
				return false;
			}
		}

	},
	close: function() {
		var d = $.Deferred();

		document.getElementById('tv_fullscreen_overlay').classList.remove('tv_mosaic_fullscreen');
		RADIO.destroy().done(function () {

			Media.set({ directType: null });

			tv_keydown_override = null;
			RADIO.blocks.radio.classList.remove('displayshow');
			RADIO.blocks.radio.classList.add('displaynone');

			if (scandic_menu) {
				document.getElementById('tv_fullscreen_btns').style.display = 'block';
			}
			//TODO: удалить после нормальной реализации переходов
			if (classic_menu) {
				document.getElementById('tv_fullscreen_btns').style.display = 'block';
				$('#menu_wrapper').show();
				//убрать кошмар
				$(first_page_in_classic_menu.get_page()).trigger(event_link);
				tv_sel_block('menu');
			}

			d.resolve();
		});

		return d.promise();
	},
	loadStructure: function() {
		$.getJSON(tv_content_url + 'radiolist.json?_=' + Math.random(),
			function(data){
				if (!data || !data.stations || !data.stations.length) {
					log.add("RADIO: structure is not exist");
					return false;
				}

				RADIO.list = data.stations;
				RADIO.genre = getGenre(data.categories);

				RADIO.build();

				css_append('s/font/player/style.css', 'cssVODcontrols');

				log.add('RADIO: structure loaded.');
			},
			'json')
			.fail(function(){
				log.add('RADIO: structure not found');
			});

		function getGenre(categories) {
			categories = categories ? categories : [];
			var genreObj = renderGenreListObj(categories);
			var station;

			for (var i = 0; i < RADIO.list.length; i++) {
				station = RADIO.list[i];
				station.state = 'show';
				station.name = station.name[get_language()];

				for (var j = 0; j < station.categories.length; j++) {
					var category = station.categories[j];
					category = genreObj[category];
				}
			}

			// подсчитываем количество станций в каждом жанре
			for (var key in genreObj) {
				var count = 0;

				for (var o = 0; o < RADIO.list.length; o++) {
					station = RADIO.list[o];
					if (station.categories.indexOf(key) !== -1){
						count++;
					}
				}

				genreObj[key].count = count;
				genreObj[key].name = genreObj[key].name[get_language()];
			}

			return genreObj;

			function renderGenreListObj(genres) {
				var obj = {};

				for (var i = 0; i < genres.length; i++) {
					var genre = genres[i];

					genre.selected = false;
					obj[genre.id] = genre;
				}

				return obj;
			}
		}
	},
	move: function(direct) {
		metro_menu_move(direct);

		if (tv_cur_block === 'tv_radiolist') {
			RADIO.blocks.tv_cur_id.style.display = 'none';
			toggle_first_line(tv_cur_elem[0]);
		}

		function toggle_first_line(elem) {
			//TODO: нет слов 
			var top = elem.getBoundingClientRect().top;
			if (top === 130 || top === 129 | top === 128) {
				elem.classList.add('tv_channellist_first_line');
			}
			else {
				elem.classList.remove('tv_channellist_first_line');
			}
		}
	},
	play: function(init) {
		var index = getIndex();

		if (
			init ||
			typeof RADIO.station === 'undefined' ||
			RADIO.station_index !== index ||
			RADIO.playing === false
		) {
			RADIO.station = RADIO.list[index];
			RADIO.station_index = index;

			RADIO.build_preview();
			RADIO.build_title('downloading');
			RADIO.stop(true).done(function() {
				if (index !== getIndex()) return;

				var ctx = Object.assign(RADIO, {
					url: RADIO.station.src,
					eventListener: tv_samsung_tizen_mark ?
						RADIO.eventListenerTizen : RADIO.eventListener,
					mimeType: 'audio/mp3',
					loop: false
				});
				_player_play(ctx);
			});
		}

		function getIndex() {
			if (tv_cur_block === 'tv_radiolist') {
				return tv_cur_elem[0].getAttribute('data-num');
			}
			else {
				return RADIO.station_index;
			}
		}
	},
	stop: function(download) {
		var d = $.Deferred();

		RADIO.playing = false;
		if (!download) RADIO.build_title('pause');
		var ctx = Object.assign(RADIO, {
			eventListener: tv_samsung_tizen_mark ?
				RADIO.eventListenerTizen : RADIO.eventListener
		});
		_player_destroy(ctx).done(d.resolve);

		return d.promise();
	},
	destroy: function() {
		var d = $.Deferred();

		RADIO.build_title();
		RADIO.station = undefined;
		RADIO.playing = false;

		var ctx = Object.assign(RADIO, {
			eventListener: tv_samsung_tizen_mark ?
				RADIO.eventListenerTizen : RADIO.eventListener
		});
		_player_destroy(ctx).done(d.resolve);

		return d.promise();
	},
	toggle_filter_item: function(item) {
		var code = item.getAttribute('data-code');
		var index = RADIO.genre_filter.indexOf(code);

		if (code == null) {
			RADIO.genre_filter = [];
			$(RADIO.blocks.genre_list).find('li').removeClass('selected');

			for (var key in RADIO.genre) RADIO.genre[key].selected = false;

			return;
		}

		if (index === -1) {
			RADIO.genre_filter.push(code);
			item.classList.add('selected');

			RADIO.genre[code].selected = true;
		}
		else {
			RADIO.genre_filter.splice(index, 1);
			item.classList.remove('selected');

			RADIO.genre[code].selected = false;
		}
	},
	toggle_bottom: function(block) {
		var watch = document.getElementById('bottom_choosing_radio');
		var stop = document.getElementById('bottom_choosing_genre');

		if (block === 'stop') {
			watch.classList.remove('displaynone');
			watch.classList.add('displayshow');
			stop.classList.remove('displayshow');
			stop.classList.add('displaynone');
		}
		else if (block === 'playing') {
			watch.classList.remove('displayshow');
			watch.classList.add('displaynone');
			stop.classList.remove('displaynone');
			stop.classList.add('displayshow');
		}
	},
	filter_stations: function() {
		for (var i = 0; i < RADIO.list.length; i++) {
			_filter(RADIO.list[i]);
		}

		//TODO: сделать нормальную фильтрацию любого контента (переделать filter_content_by_device_for_struct)
		function _filter(station) {
			if (RADIO.genre_filter.length > 0) {
				for (var j = 0; j < RADIO.genre_filter.length; j++) {
					var filter = RADIO.genre_filter[j];

					if (station.categories.indexOf(filter) !== -1) {
						station.state = 'show';
						break;
					}
					else {
						station.state = 'hide';
					}

				}
			}
			else {
				station.state = 'show';
			}
		}
	},
	build: function() {
		RADIO.render('radio_page', 'mosaic', {});

		RADIO.blocks.radio = document.getElementById('radio_page');
		RADIO.blocks.tv_radiolist = document.getElementById('tv_radiolist');
		RADIO.blocks.preview = document.getElementById('radio_preview');
		RADIO.blocks.genre_list = document.getElementById('radio_choosing_list');

		if (RADIO.list.length !== 0) {
			RADIO.build_radio_list();
			RADIO.build_preview();
			RADIO.build_genre_list();
		}

		new PreloadMedia('#tv_radiolist');
	},
	build_radio_list: function(refresh) {
		$(RADIO.blocks.tv_radiolist).find('.page_scroll').remove();

		var data = {};
		data.stations = RADIO.list;
		data.quantity = 0;
		data.category_string = _getSortedGenresName(RADIO.genre, 30);

		for (var i = 0; i < RADIO.list.length; i++) {
			if (RADIO.list[i].state === 'show') {
				data.quantity += 1;
			}
		}

		// при фильтрации станций скрываем отфильтрованные вместо перестраивания
		if (!refresh) {
			RADIO.render('tv_radiolist', 'tv_station_list', data);
			_addStyleChannel(data);
		}
		else {
			RADIO.blocks.tv_radiolist.querySelector('.content').style.top = '0px';
			_refresh(data);
		}

		make_scroll($(RADIO.blocks.tv_radiolist));

		RADIO.scroll_opacity('#tv_radiolist_scroll', 'tv_radiolist');

		function _getSortedGenresName(list, maxLen) {
			var str = '';

			for (var key in list) {
				var cat = list[key];
				if (cat.selected) {
					var word = cat.name;

					// обрезаем строку
					if ((str.length + word.length) > (maxLen - 5)) {
						str += ', ...';
						break;
					}

					if (str === '') {
						str = word;
					}
					else {
						str += ', ' + word;
					}
				}
			}

			return str === '' ? null : str;
		}
		function _refresh(data) {
			var qnt = 0;

			for (var i = 0; i < data.stations.length; i++) {
				var station = data.stations[i];
				var elem = RADIO.blocks.tv_radiolist.querySelector('[data-num="'+ i +'"]');
				if (station.state === 'hide') {
					elem.classList.add('displaynone');
				}
				else {
					elem.classList.remove('displaynone');

					qnt += 1;
					_addStyleChannel(elem, qnt);
				}
			}

			RADIO.render('tv_station_list_header', 'tv_station_list_refresh', data);
		}
		function _addStyleChannel(data, qnt) {
			if (typeof (qnt) === 'undefined') {
				for (var i = 0; i < data.stations.length; i++) {
					var station = RADIO.blocks.tv_radiolist.querySelector('[data-num="'+ i +'"]');

					if (((i+1)%4) == 0) {
						station.classList.add('noMarginRight');
					}

					// первая линия
					if (i < 4) {
						station.classList.add('tv_channellist_first_line');
					}
				}
			}
			else {
				if (qnt%4 === 0) {
					data.classList.add('noMarginRight');
				}
				else {
					data.classList.remove('noMarginRight');
				}
			}
		}
	},
	build_preview: function() {
		//if (tv_cur_block !== 'tv_radiolist') return;
		if (RADIO.station === undefined) RADIO.station = RADIO.list[0];

		RADIO.render('radio_preview', 'radio_preview', {
			name: RADIO.station.name,
			genreName: RADIO.station.categories.length && RADIO.genre[RADIO.station.categories[0]] ?
				RADIO.genre[RADIO.station.categories[0]].name : null,
			image: RADIO.station.image
		});
	},
	build_genre_list: function() {
		RADIO.render('genre', 'tv_station_choosing_list', {
			genre: $.map(RADIO.genre, function (value) {
				return value;
			})
		});
	},
	build_title: function(title) {
		if (!title){
			$id('radio_action').innerHTML = '';
			return;
		}

		var data = {};
		var lang = RADIO.getObjectLang();

		data.title = lang[title];
		data.action = title;

		RADIO.render('radio_action', 'radio_action', data);
		RADIO.toggle_bottom(title);
	},
	render: function(id, tmp, data) {
		data.lng = RADIO.getObjectLang();

		var tpl = $.templates({
			markup: templates[tmp],
			allowCode: true
		});
		var html = tpl.render(data);

		var toAppend = document.getElementById(id);
		if (!toAppend) {
			document.body.insertAdjacentHTML('beforeend', html);
		}
		else {
			toAppend.innerHTML = '';
			toAppend.insertAdjacentHTML('beforeend', html);
		}

	},
	scroll_opacity: function(scrollId, current_block) {
		var scroll = document.querySelector(scrollId);

		if (scroll) {
			if (tv_cur_block !== current_block) scroll.style.opacity = '0.2';
			else scroll.style.opacity = '1';
		}
	},
	getObjectLang: function() {
		if (typeof RADIO.lng === 'undefined') {
			RADIO.lng = {};

			RADIO.lng.back = getlang('mobileAppContent-default-label-back');
			RADIO.lng.navigation = getlang('navigation');
			RADIO.lng.anything_male = getlang('anything_male');
			RADIO.lng.anything_female = getlang('anything_female');
			RADIO.lng.of = getlang('of');

			RADIO.lng.listen_radio = getlang('listen_radio');
			RADIO.lng.filtering = getlang('filtering_channel_by');
			RADIO.lng.by_genre = getlang('by_genre_v2');
			RADIO.lng.all_genres = getlang('all_genres');
			RADIO.lng.radio_list = getlang('radio_list');
			RADIO.lng.genres = getlang('genres');
			RADIO.lng.radio_stop_playing = getlang('radio_stop_playing');

			RADIO.lng.downloading = getlang('downloading');
			RADIO.lng.playing = getlang('playing');
			RADIO.lng.pause = getlang('pause');
			RADIO.lng.error = getlang('bill_error');
		}

		return RADIO.lng;
	},
	server_keydown: function(e) {
		if (!e) e = event;
		var code = (e.keyCode ? e.keyCode : e.which);

		//Обработка shift для MAG
		if(e.shiftKey){
			code = 'S'+code;
		}

		switch(code){
			case 0:
				break;
			case tv_keys.UP:
				RADIO.move('up');
				break;
			case tv_keys.DOWN:
				RADIO.move('down');
				break;
			case tv_keys.LEFT:
				if (tv_cur_block === 'tv_radiolist') {
					RADIO.move('left');
				}
				else if (tv_cur_block === 'genre') {
					RADIO.open('tv_radiolist');
				}

				break;
			case tv_keys.RIGHT:
				RADIO.move('right');
				break;
			case tv_keys.ENTER:
				if (tv_cur_block === 'tv_radiolist') {
					RADIO.play();
				}
				else if (tv_cur_block === 'genre') {
					var item = tv_cur_elem[0];
					RADIO.toggle_filter_item(item);
					RADIO.filter_stations();
					RADIO.build_radio_list(true);
				}
				else if (tv_cur_block === 'dialog') tv_ok();


				break;

			case tv_keys.PORTAL:
			case tv_keys.GUIDE:
			case tv_keys.Q_MENU:
			case tv_keys.MENU:
			case tv_keys.HOME:
			case tv_keys.EXIT:
			case tv_keys.BACK:
				if (tv_cur_block === 'tv_radiolist') {
					RADIO.close().done(navigate.bind(null, RADIO.parentId));
				}
				else if (tv_cur_block === 'genre') {
					RADIO.open('tv_radiolist');
				}
				break;

			case tv_keys.CH_UP:
				tv_chup();
				break;
			case tv_keys.CH_DOWN:
				tv_chdown();
				break;

			case tv_keys.RED:
				tv_mode();
				break;
			case tv_keys.GREEN:
				break;
			case tv_keys.YELLOW:
				if (tv_cur_block === 'tv_radiolist') {
					RADIO.open('genre');
				}
				else if (tv_cur_block === 'genre') {
					RADIO.open('tv_radiolist');
				}

				break;
			case tv_keys.BLUE:
				RADIO.close().done(navigate.bind(null, '#language_select'));

				break;

			case tv_keys.STOP:
			case 32: // пробел в браузере
				RADIO.destroy();
				break;

			default:
				//tv_log('code ' + code);
				break;

		}
	},
	eventListener: function(event) {
		if (tv_lg_mark) {
			event = event.eventType;

			switch (event) {
				case 'play_start':
					_playing_start();
					break;
				case 'file_not_found':
				case 'error_in_playing':
				case 'network_disconnected':
					_error_start();
					break;
			}
		}
		else if (tv_samsung_mark) {
			switch (event) {
				case 7:
					_playing_start();
					break;
				case 6:
				case 1:
					_error_start();
					break;
			}
		}
		else if (tv_mag_mark) {
			switch (event) {
				case '4':
					_playing_start();
					break;
				case '5':
					_error_start();
					break;
			}
		}
		else { // desktop
			switch (event.type) {
				case 'canplay':
					_playing_start();
					break;
				case 'abort':
					_error_start();
					break;
			}
		}

		function _playing_start() {
			RADIO.playing = true;
			RADIO.build_title('playing');
		}
		function _error_start() {
			RADIO.playing = false;
			RADIO.build_title('error');
		}
	},
	eventListenerTizen: {
		onbufferingstart: function() {
			// console.log('Buffering start');
		},
		onbufferingprogress: function(percent) {
			// console.log("Buffering progress data : " +   percent);
		},
		onbufferingcomplete: function() {
			RADIO.playing = true;
			RADIO.build_title('playing');
		},
		oncurrentplaytime: function(currentTime) {

		},
		onevent: function(eventType, eventData) {
			console.log("Event type error : " + eventType + ", eventData: " + eventData);
		},
		onerror: function(errorData) {
			console.log("Event type error : " + errorData);
			RADIO.playing = false;
			RADIO.build_title('error');
		},
		onsubtitlechange: function(duration, text, data3, data4)   {

		},
		ondrmevent: function(drmEvent, drmData) {
			// console.log("DRM callback: " + drmEvent + ", data: " + drmData);
		}
	}
};
