var PRELOAD_TIMER = null;
var tv_mosaic = {
	// статика
	build: false,
	lng: false,
	timer: {
		preview: false,
		information: false,
		switch_on_channel_in_full_screen: null
	},
	dictionary_lang: {},
	current_channel: undefined,
	current_block: null,
	select_channels_list: null,
	switching_channel: false,
	recursion_count: 0,
	blocks: {},
	smallSize: {
		top: 147,
		left: 820,
		width: 430,
		height: 243
	},
	init: function () {

	},
	deps: ['Epg'],
	// инициализация мозайки из tv_mode()
	open: function () {
		document.body.style.backgroundImage = 'none';
		if (!tv_desktop_mark) {
			document.body.style.backgroundColor = 'transparent';
		}

		_add_listener_TV(tv_mosaic);
		$(window).on('RFtuned', function(){
			tv_mosaic.resize_channel();
		});

		if (tv_lg_mark) {
			_tv_bg_prepare();
		}

		tv_keydown_override = tv_mosaic._server_keydown;

		document.getElementById('tv_fullscreen_overlay').classList.add('tv_mosaic_fullscreen');
		tv_mosaic.blocks.tv_mosaic.style.visibility = 'visible';

		tv_mosaic.blocks.tv_mosaic.classList.remove('displaynone');
		tv_mosaic.blocks.tv_mosaic.classList.add('displayshow');

		set_first_channel();

		tv_sel_cur();
		metro_menu_calc();

		make_scroll($('#tv_channellist'));
		move_scroll(
			parseInt(
				tv_mosaic.blocks.tv_channellist.querySelector('.content').style.top
			),
			'tv_channellist'
		);

		tv_channellist_fade = tv_mosaic.empty;
		tv_channellist_hide = tv_mosaic.empty;

		var index = tv_mosaic.blocks.tv_channellist
			.querySelector('.tv_cur')
			.getAttribute('data-num');
		tv_mosaic.build_preview(_tv_channels[index].name);
		tv_mosaic.channel_show(
			index,
			tv_mosaic.smallSize,
			true
		);

		VirtualScroll.set('tv_mosaic', 'tv_channellist');
		toggleFirstLine(tv_cur_elem);

		function set_first_channel() {
			VirtualScroll.scrollTo(
				'tv_mosaic',
				'tv_channellist',
				first_channel.get(),
				162
			);

			$(tv_mosaic.blocks.tv_channellist).find('li').removeClass('tv_cur');

			var cur_pos = first_channel.get();
			tv_sel_list = $(tv_mosaic.blocks.tv_channellist).find('.content li');
			tv_cur_elem = $(tv_mosaic.blocks.tv_channellist).find('[data-num="'+ cur_pos +'"]');
			tv_max_pos = tv_sel_list.length;

			tv_mosaic.select_channels_list = tv_sel_list;

			tv_cur_elem.addClass('tv_cur');

			tv_sel_list.map(function (index, item) {
				if ($(item).hasClass('tv_cur')) {
					tv_cur_pos = index;
				}
			});
		}
	},
	close: function () {
		if (tv_cur_block === 'channel') {
			clearTimeout(tv_mosaic.timer.information);
			tv_mosaic.server_channel_information._show();
		}
		if (tv_cur_block !== 'tv_channellist') {
			tv_mosaic.show('tv_channellist', null, 'hide');
		}

		clearTimeout(tv_mosaic.timer['preview']);
		_remove_listener_TV(tv_mosaic);
		$(window).off('RFtuned');

		document.getElementById('tv_fullscreen_overlay').classList.remove('tv_mosaic_fullscreen');
		tv_mosaic.hide();

		tv_keydown_override = null;
		tv_mosaic.current_channel = undefined;
	},
	// работа с каналами
	channel: function (index, type) {
		if (
			tv_cur_block !== 'tv_channellist' &&
			tv_cur_block !== 'channel'
		) {
			tv_mosaic.show('tv_channellist');
		}

		VirtualScroll.scrollTo('tv_mosaic', 'tv_channellist', index, 162);
		tv_mosaic.build_preview(_tv_channels[index].name);
		tv_mosaic.channel_show(
			index,
			tv_mosaic.smallSize,
			true
		);

		tv_mosaic.build_bottom_information(index);

		tv_cur_elem = document.querySelector('#tv_channellist [data-num="'+tv_mosaic.current_channel+'"]');
		tv_cur_pos = tv_sel_list.length ? tv_sel_list.index(tv_cur_elem) : -1;
		tv_sel_cur();

		typeof type !== 'undefined' && tv_cur_block !== 'channel' && tv_mosaic.show(type);
		tv_cur_block === 'tv_channellist' && toggleFirstLine(tv_cur_elem);
	},
	channel_show: function (index, coords, init, recursion) {
		if (
			init ||
			typeof (tv_mosaic.current_channel) === 'undefined' ||
			tv_mosaic.current_channel != index
		) {
			if (tv_mosaic.noPost(index, true)) {
				return;
			}

			// механизм рекурсии используется в САМСУНГ и MAG
			if (
				typeof tv_mosaic.current_channel === 'undefined' &&
				tv_mosaic.current_channel !== index
			) {
				tv_mosaic.recursion_count = 0;
			}

			clearTimeout(tv_mosaic.timer.preview);

			tv_mosaic.current_channel = parseFloat(index);
			tv_prev_cur_channel = tv_cur_channel;

			if (typeof (guestData.tv_channels_lang_stream) === 'undefined') {
				guestData.tv_channels_lang_stream = {};
				for (var i = 0; i < _tv_channels.length; i++) {
					guestData.tv_channels_lang_stream[i] = null;
				}
			}

			// запись последнего канала
			if (tv_cur_block === 'tv_channellist') {
				first_channel.set(index);
			}
			else if (tv_cur_block === 'channel') {
				for (var i = 0; i < tv_mosaic.select_channels_list.length; i++) {
					var channel = tv_mosaic.select_channels_list[i];
					if (channel.dataset.num == index) {
						first_channel.set(i);
						break;
					}
				}
			}


			tv_channel_show(index, coords);
			if (tv_mag_mark || tv_samsung_tizen_mark || tv_lg_mark || tv_philips_mark) {
				tv_mosaic.resize_channel(coords);
			}
		}
		else {
			tv_mosaic.resize_channel(coords);
		}

		tv_mosaic.epg.show(index);

		tv_mosaic.switching_channel = false;

		if (tv_cur_block === 'tv_channellist') {
			if (tv_lg_mark) {
				tv_mosaic.blocks.preview_channel.style.backgroundImage = 'url(tv:)';
			}
			if (!tv_desktop_mark) {
				tv_mosaic.blocks.tv_mosaic.style.backgroundColor = 'transparent';
			}
		} else if (tv_cur_block === 'channel') {
			if (tv_lg_mark) {
				tv_mosaic.blocks.tv_mosaic.style.backgroundImage = 'url(tv:)';
				tv_mosaic.blocks.tv_mosaic.style.backgroundColor = 'transparent';
			}
		}
	},
	switch_channel: function (direct) {
		// во избежание быстрого переключения через CH_UP, CH_DOWN
		// переключаем в false в channel_show()
		// if (tv_mosaic.switching_channel) return;
		// tv_mosaic.switching_channel = true;

		var index = tv_mosaic.getIndex(direct);
		tv_mosaic.build_bottom_information(index);
		tv_mosaic.server_channel_information.toggle();

		// для устранения проблемы с черным экраном
		// проявлялась на EE690 в Астории при быстром переключении
		tv_mosaic.current_channel = index;
		clearTimeout(tv_mosaic.timer.switch_on_channel_in_full_screen);
		tv_mosaic.timer.switch_on_channel_in_full_screen = setTimeout(tv_mosaic.channel_show.bind(null, index, null, true), 500);

	},
	set_timer: function (index, type, duration) {
		clearTimeout(tv_mosaic.timer[type]);
		if (index != null && tv_mosaic.noPost(index, false)) {
			return;
		}

		tv_mosaic.timer[type] = setTimeout(function () {

			if (type === 'preview') {
				tv_mosaic.channel_show(index, tv_mosaic.smallSize);
			}
			else if (type === 'information') {
				tv_mosaic.server_channel_information.fade_animation();
			}

		}, duration);
	},
	resize_channel: function (coords) {
		if (!coords || typeof coords === 'undefined') {
			if(tv_cur_block === 'tv_channellist'){
				coords = this.smallSize;
			}else{
				coords = null;
			}
		}
		setVideoSize(coords);
	},
	audio_stream: {
		language_hidden: true,
		switch_on: function () {
			tv_mosaic.audio_stream.get_list().then(function (list) {
				var switchLanguage = document.getElementById('switch_language');

				if (list && list.length > 1) {
					tv_mosaic.server_channel_information.clean_language();
					previousPosition.set(undefined, 'channel');

					_tv_channels[tv_mosaic.current_channel].languages_codes = list;

					tv_mosaic.build_switch_language_list(list);
					tv_mosaic.audio_stream.language_hidden = false;

					tv_sel_list = $('#switch_language li');
					tv_cur_pos = 1;
					tv_max_pos = tv_sel_list.length;

					invisibleLanguageItems(true);

					tv_sel_cur();
					metro_menu_calc();

					switchLanguage.classList.add('transition-all-3');
					// tv_sel_block('channel');
				}
				else {
					tv_mosaic.audio_stream.language_hidden = false;
					switchLanguage.innerHTML = getlang('bill_error');
				}
			});
		},
		setLocationLang: function (lang) {
			tv_mosaic.audio_stream.get_list().then(function (list) {
				if (!list) return;

				var index = list.indexOf(lang);

				if (guestData.tv_channels_lang_stream[tv_mosaic.current_channel] != null) {
					index = guestData.tv_channels_lang_stream[tv_mosaic.current_channel];
				}

				if (index !== -1) {
					_tv_set_audio(parseInt(index));
				}
			});
		},
		setIndex: function (code) {
			var index = isset('config.tv.hacks.allOfLanguageCodesInMosaic') ? code :
				_tv_channels[tv_mosaic.current_channel].languages_codes.indexOf(code);

			guestData.tv_channels_lang_stream[tv_mosaic.current_channel] = index;
			_tv_set_audio(parseInt(index));
		},
		get_list: function () {
			var d = $.Deferred();

			_tv_get_sync_audio().then(function (list) {
				// d.resolve(['en', 'ru', undefined, 'de', 'zh', 'kk', 'xx', 'xx']);
				d.resolve(list);
			});

			return d.promise();
		}
	},
	epg: {
		show: function (channel) {
			if (typeof channel !== 'object') channel = _tv_channels[channel];
			if (
				!channel.epg ||
				!Epg.data ||
				typeof Epg.data[channel.epg] === 'undefined'
			) {
				return tv_mosaic.epg.hide();
			}

			if (tv_cur_block === 'tv_channellist' || tv_cur_block === 'channel') {
				var data = tv_mosaic.epg.get(channel);
				if (!data) return tv_mosaic.epg.hide();

				var to = tv_cur_block === 'tv_channellist' ?
					'preview_epg' : 'preview_bottom_epg';

				tv_mosaic.render(to, 'tv_channel_epg', data);
			}
		},
		hide: function () {
			if (tv_cur_block === 'tv_channellist') {
				$('#preview_epg').html('');
			}
			else if (tv_cur_block === 'channel') {
				$('#preview_bottom_epg').html('');
			}
		},
		get: function (channel) {
			if (!Epg.data) {
				return null;
			}

			var epg = Epg.data[channel.epg],
				data = {},
				nowMoment,
				nowTimestamp;
			if (typeof epg === 'undefined') return null;

			epg = epg.epg;
			// защита от Антона
			if (typeof epg === 'undefined') return null;
			nowMoment = time_picker.get_moment_with_current_time(Date.now());
			nowTimestamp = parseInt(nowMoment.format('X'));
			for (var i = 0; i < epg.length; i++) {
				var program = epg[i];
				if (
					nowTimestamp > program.startTimestamp &&
					nowTimestamp < program.stopTimestamp
				) {
					data.now = program;
					data.next = epg[i + 1];

					data.now.startTime = _setStartTime(data.now.startTimestamp);
					if (typeof data.next === 'object') {
						data.next.startTime = _setStartTime(data.next.startTimestamp);
					}
					else data.next = null;

					break;
				}
			}

			return data.now ? data : null;

			function _setStartTime(start) {
				return moment
					.utc(start * 1000 + time.dof + time.tz)
					.add(30, 's')
					.format('HH:mm');
			}
		}
	},
	// работа с блоками
	show: function (id, type, flag) {
		var index;

		tv_mosaic.current_block = id;
		switch (id) {
			case 'tv_channellist':
				toggleBlocks(id, type);

				var tv_cur = $('#tv_channellist').find('.tv_sel');
				tv_cur ? tv_cur.removeClass('tv_sel tv_cur') : null;

				VirtualScroll.scrollTo(
					'tv_mosaic',
					'tv_channellist',
					tv_mosaic.current_channel,
					162
				);

				tv_cur_elem = $('#tv_channellist').find('[data-num="' + tv_mosaic.current_channel + '"]');

				tv_sel_block(id);
				index = tv_cur_elem.attr('data-num');
				tv_mosaic.select_channels_list = tv_sel_list;

				tv_mosaic.build_preview(_tv_channels[index].name);

				if (flag !== 'hide') {
					tv_mosaic.channel_show(
						index,
						tv_mosaic.smallSize
					);
				}

				toggleFirstLine(tv_cur_elem);

				metro_menu_calc(tv_sel_list, true);

				break;
			case 'choosing_list':
				if (isEmptyChoosingList(type)) {
					break;
				}

				toggleBlocks(id, type);

				tv_mosaic.blocks['filter_' + type].classList.remove('displaynone');
				tv_mosaic.blocks['filter_' + type].classList.add('displayshow');
				tv_mosaic.blocks['filter_' + type].style.visibility = 'visible';

				setTimeout(function () {
					make_scroll($('#' + type));
				}, 20);

				if (tv_mosaic.blocks['filter_' + type].querySelector('.selected')) {
					tv_cur_elem = $(tv_mosaic.blocks['filter_' + type].querySelector('.selected'));
				}

				tv_sel_block(type);
				metro_menu_calc();
				break;
			case 'channel':
				tv_mosaic.audio_stream.language_hidden = true;
				clearTimeout(tv_mosaic.timer.preview);

				index = tv_mosaic.blocks.tv_channellist.querySelector('.tv_cur').getAttribute('data-num');

				if (tv_mosaic.noPost(index, true)) return;

				toggleBlocks(id, type);

				// назначение градиента через класс не работало на LG UW
				$('#tv_channel_header_info')[0].style.cssText = 'background-color: transparent; background-image: linear-gradient(0deg, transparent, black); height: 200px; background-position: initial initial; background-repeat: initial initial;';

				tv_sel_block(id);

				tv_mosaic.build_bottom_information(index);
				tv_mosaic.channel_show(index);
				tv_mosaic.server_channel_information.toggle();


				break;
			case 'language':
				tv_mosaic.epg.hide();
				tv_mosaic.server_channel_information.toggle();
				tv_mosaic.audio_stream.switch_on();

				break;

			case 'programmes':
				if (!Epg.data) {
					log.add('EPG: is not exist');
					return false;
				}

				Epg.open();

				Epg.render('preview_epg', false, 'new_preview_epg');

				toggleBlocks(id);

				tv_sel_block('tv_programmes_list');
				make_scroll($('#tv_programmes_list'));

				break;
		}

		function toggleBlocks(id, type) {
			switch (id) {
				case 'tv_channellist':
					tv_mosaic.blocks.tv_mosaic.style.backgroundImage = 'none';
					tv_mosaic.blocks.canvas.style.display = 'block';

					$(tv_mosaic.blocks.tv_programmes_list).removeClass('displayshow').addClass('displaynone');
					$('#choosing_list').removeClass('displayshow').addClass('displaynone');
					$('#bottom_channel_information').removeClass('displayshow').addClass('displaynone');
					$('#preview').removeClass('displaynone').addClass('displayshow');
					$('#tv_channellist').removeClass('displaynone').addClass('displayshow');

					$('#tv_channel_header_info')[0].style.cssText = '';

					$('#preview_channel_information').removeClass('displaynone').addClass('displayshow');
					$('#preview_epg').removeClass('displaynone').addClass('displayshow');

					$('#new_preview_epg').removeClass('displayshow').addClass('displaynone');

					showBottomBlock('bottom_choosing_channel');

					break;
				case 'choosing_list':
					tv_mosaic.blocks.tv_mosaic.style.backgroundImage = '';

					$('#preview').removeClass('displayshow').addClass('displaynone');
					$('#choosing_list').removeClass('displaynone').addClass('displayshow');

					$('#language').removeClass('displayshow').addClass('displaynone');
					$('#category').removeClass('displayshow').addClass('displaynone');

					if (type === 'language') {
						showBottomBlock('bottom_choosing_language');
					}
					else {
						showBottomBlock('bottom_choosing_category');
					}

					break;
				case 'channel':
					tv_mosaic.blocks.tv_mosaic.style.backgroundImage = 'none';
					tv_mosaic.blocks.canvas.style.display = 'none';

					tv_mosaic.blocks.tv_channellist.classList.remove('displayshow');
					tv_mosaic.blocks.tv_channellist.classList.add('displaynone');
					tv_mosaic.blocks.choosing_list.classList.remove('displayshow');
					tv_mosaic.blocks.choosing_list.classList.add('displaynone');
					tv_mosaic.blocks.preview.classList.remove('displayshow');
					tv_mosaic.blocks.preview.classList.add('displaynone');

					tv_mosaic.blocks.bottom_channel_information.classList.remove('displaynone');
					tv_mosaic.blocks.bottom_channel_information.classList.add('displayshow');

					showBottomBlock('bottom_preview_channel');

					break;

				case 'programmes':

					tv_mosaic.blocks.tv_mosaic.style.backgroundImage = 'none';
					tv_mosaic.blocks.canvas.style.display = 'block';

					$(tv_mosaic.blocks.tv_channellist).removeClass('displayshow').addClass('displaynone');
					$(tv_mosaic.blocks.tv_programmes_list).removeClass('displaynone').addClass('displayshow');

					$('#preview_channel_information').removeClass('displayshow').addClass('displaynone');
					$('#preview_epg').removeClass('displayshow').addClass('displaynone');

					$('#new_preview_epg').removeClass('displaynone').addClass('displayshow');

					$('#choosing_list').removeClass('displayshow').addClass('displaynone');
					$('#bottom_channel_information').removeClass('displayshow').addClass('displaynone');
					$('#preview').removeClass('displaynone').addClass('displayshow');

					showBottomBlock('bottom_programmes');

					break;
			}
		}

		function showBottomBlock(id) {
			var bottom_choosing_channel = document.getElementById('bottom_choosing_channel');
			var bottom_choosing_category = document.getElementById('bottom_choosing_category');
			var bottom_preview_channel = document.getElementById('bottom_preview_channel');
			var bottom_choosing_language = document.getElementById('bottom_choosing_language');
			var bottom_programmes = document.getElementById('bottom_programmes');

			bottom_choosing_channel.classList.remove('displayshow');
			bottom_choosing_category.classList.remove('displayshow');
			bottom_preview_channel.classList.remove('displayshow');
			bottom_choosing_language.classList.remove('displayshow');
			bottom_programmes.classList.remove('displayshow');

			bottom_choosing_channel.classList.add('displaynone');
			bottom_choosing_category.classList.add('displaynone');
			bottom_preview_channel.classList.add('displaynone');
			bottom_choosing_language.classList.add('displaynone');
			bottom_programmes.classList.add('displaynone');

			document.getElementById(id).classList.remove('displaynone');
			document.getElementById(id).classList.add('displayshow');
		}

		function isEmptyChoosingList(type) {
			var directList;
			if (type === 'language') {
				directList = tv_channels_sorted_lang;
			}
			else {
				directList = tv_channels_category_list;
			}

			if (!directList.length) {
				custom_dialog('alert', getlang('list_is_empty'), '', 'closeDialogForMosaic();');
				return true;
			}
			else {
				return false;
			}
		}

	},
	hide: function () {
		tv_mosaic.blocks.tv_mosaic.classList.remove('displayshow');
		tv_mosaic.blocks.tv_mosaic.classList.add('displaynone');
	},
	// построение блоков мозайки
	//TODO: перенести в Module init
	build_container: function () {
		if (tv_mosaic.build) {return;}
		tv_mosaic.render('tv_mosaic', 'tv_channel_container', {});

		tv_mosaic.blocks.tv_mosaic = document.getElementById('tv_mosaic');
		tv_mosaic.blocks.tv_channellist = document.getElementById('tv_channellist');
		tv_mosaic.blocks.tv_programmes_list = document.getElementById('tv_programmes_list');
		tv_mosaic.blocks.preview_channel = document.getElementById('preview_channel');
		tv_mosaic.blocks.preview = document.getElementById('preview');
		tv_mosaic.blocks.choosing_list = document.getElementById('choosing_list');
		tv_mosaic.blocks.bottom_channel_information = document.getElementById('bottom_channel_information');

		tv_mosaic.blocks.filter_language = document.getElementById('language');
		tv_mosaic.blocks.filter_category = document.getElementById('category');

		$(HotezaTV).one('final', function () {
			ServiceCodes.registerListener('3109', tv_mosaic.test);
		});

		var data = {
			elem: document.getElementById('preview_channel'),
			id: 'tv_mosaic',
			container: 'tv_mosaic',
			rect: this.smallSize
		};
		render_canvas(data);

		tv_mosaic.blocks.canvas = document.getElementById('tv_mosaic_canvas');

		tv_mosaic.build = true;
	},
	build_channel_list: function (refresh) {
		if (!_tv_channels.length) {
			return false;
		}

		$(tv_mosaic.blocks.tv_channellist).find('.page_scroll').remove();

		var data = {};
		data.channels = _tv_channels;
		data.quantity = 0;
		data.category_string = getCategorySortedName(false, tv_channels_category_list, 20);
		data.language_string = getCategorySortedName(true, tv_channels_sorted_lang, 20);

		for (var i = 0; i < _tv_channels.length; i++) {
			if (_tv_channels[i].state === 'show') {
				data.quantity += 1;
			}
		}

		// при фильтрации каналов скрываем отфильтрованные вместо перестраивания
		if (!refresh) {
			tv_mosaic.render('tv_channellist', 'tv_channel_list', data);
		}
		else {
			tv_mosaic.blocks.tv_channellist.querySelector('.content').style.top = '0px';
			tv_mosaic.render('tv_channel_list_header', 'tv_channel_list_refresh', data);

			VirtualScroll.set('tv_mosaic', 'tv_channellist', refresh);
		}

		tv_mosaic.blocks.content_wrapper = tv_mosaic.blocks.tv_channellist.querySelector('.content_wrapper');

		make_scroll($(tv_mosaic.blocks.tv_channellist));

		function getCategorySortedName(dict, list, maxLen) {
			var str = '';

			for (var i = 0; i < list.length; i++) {
				var cat = list[i];
				if (cat[Object.keys(cat)[0]].selected) {
					var word = dict ? tv_mosaic.dictionary_lang[Object.keys(cat)[0]].transcription : Object.keys(cat)[0];

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

	},
	build_preview: function (key) {
		var header = tv_mosaic.blocks.preview.querySelector('h1');
		if (header && header.innerHTML === key) return;

		var channel = {};
		for (var i = 0; i < _tv_channels.length; i++) {
			if (_tv_channels[i].name === key) channel = _tv_channels[i];
		}

		// добавляем строку языков
		// делаем здесь, а не в filter_channels_by_groups вместе с рендером category_string
		// так как на тот момент нет tv_mosaic.dictionary_lang (получается ленивый рендеринг строк языка)
		if (!channel.language_string) {
			channel.language_string = '';

			for (i = 0; i < channel.languages_arr.length; i++) {
				// если язык не знаком, продолжаем работу, не прерывая поток
				if (!tv_mosaic.dictionary_lang[channel.languages_arr[i]]) continue;

				// высчитываем длину строки
				var str = channel.language_string + ', ' + tv_mosaic.dictionary_lang[channel.languages_arr[i]].transcription;
				if (tv_mosaic.maxLenString(str, 45)) {
					channel.language_string += ', ...';
					break;
				}

				if (channel.language_string === '') {
					channel.language_string = tv_mosaic.dictionary_lang[channel.languages_arr[i]].transcription;
				}
				else {
					channel.language_string += ', ' + tv_mosaic.dictionary_lang[channel.languages_arr[i]].transcription;
				}
			}
		}

		tv_mosaic.render('preview_channel_information', 'tv_channel_preview', channel);
	},
	build_choosing_list: function (list) {
		var copyList = tv_mosaic.copyArr(list === "language" ? tv_channels_sorted_lang : tv_channels_category_list);

		var data = {};
		data.count = _tv_channels.length;
		data.list = [];
		for (var i = 0; i < copyList.length; i++) {
			var item = {};
			var key = Object.keys(copyList[i])[0];

			item.name = key;
			item.count = copyList[i][key].count;
			item.selected = copyList[i][key].selected;

			if (item.count === 0) continue;

			if (list === 'language') {
				item.lang_code = key;
				item.name = tv_mosaic.dictionary_lang[key].transcription;
				item.image = tv_mosaic.dictionary_lang[key].image;
			}

			data.list.push(item);
		}

		data.list_type = list;
		tv_mosaic.render(list, 'tv_channel_choosing_list', data);

		clearTimeout(PRELOAD_TIMER);
		PRELOAD_TIMER = setTimeout(function () { new PreloadMedia('#choosing_list'); }, 3000);
	},
	build_bottom_information: function (index) {
		if (tv_cur_block !== 'channel') {
			return false;
		}

		var channel = _tv_channels[index];
		var data = {};
		for (var key in channel) {
			data[key] = channel[key];
		}

		data.channel_number = parseInt(index) + 1;

		tv_mosaic.render('bottom_channel_information', 'tv_channel_information', data);
		tv_sel_block('channel');

	},
	build_switch_language_list: function (list) {
		if (!list) return;

		var data = [];
		for (var i = 0; i < list.length; i++) {
			if (
				!isset('config.tv.hacks.allOfLanguageCodesInMosaic') &&
				(
					list[i] === 'xx' ||
					list[i] === 'zz{' || // иногда отдает самсунг
					list[i] === 'qaa' || // иногда отдает самсунг
					list[i] === 'mul' || // иногда отдает самсунг
					typeof list[i] === 'undefined'
				)
			) {
				continue;
			}

			var obj = {};
			obj.lang_code = list[i];
			obj.index = i;
			try {
				if (tv_mosaic.dictionary_lang[list[i]]) {
					obj.transcription = tv_mosaic.dictionary_lang[list[i]].transcription;
				}
				else {
					var translate = getlang(list[i]);
					obj.transcription = translate === 'lang error' ? 'Unknown' : translate;
				}
			}
			catch (e) {
				log.add('Error: ' + e.name + ', ' + e.message);
				log.add('В словаре нет этого языка: ' + list[i]);
				continue;
			}

			data.push(obj);
		}

		if (data.length > 1) {
			tv_mosaic.render('switch_language', 'tv_channel_list_language', {list: data});
		}
	},
	render: function (id, tmp, data) {
		data.lng = getObjectLang();
		data.sleep_timer = isset('config.tv.sleep_timer.enabled');

		var html = templates_cache[tmp].render(data);

		var toAppend = document.getElementById(id);
		if (!toAppend) {
			document.body.insertAdjacentHTML('beforeend', html);
		}
		else {
			toAppend.innerHTML = '';
			toAppend.insertAdjacentHTML('beforeend', html);
		}

		function getObjectLang() {
			if (!tv_mosaic.lng) {
				tv_mosaic.lng = {};

				tv_mosaic.lng.back = getlang('tv_back');
				tv_mosaic.lng.tv_channels = getlang('tv_channels');
				tv_mosaic.lng.anything_category = getlang('anything_category');
				tv_mosaic.lng.anything_language = getlang('anything_language');
				tv_mosaic.lng.category_channel = getlang('category_channel');
				tv_mosaic.lng.language_channel = getlang('language_channel');
				tv_mosaic.lng.navigation = getlang('navigation');
				tv_mosaic.lng.choose_category = getlang('choose_category');
				tv_mosaic.lng.choose_language = getlang('choose_language');
				tv_mosaic.lng.filtering_channel = getlang('filter');
				tv_mosaic.lng.by_category = getlang('by_category_v2');
				tv_mosaic.lng.by_language = getlang('by_language_v2');
				tv_mosaic.lng.language = getlang('language');
				tv_mosaic.lng.watch_channel = getlang('watch_channel');
				tv_mosaic.lng.watch = getlang('watch');
				tv_mosaic.lng.volume = getlang('volume');
				tv_mosaic.lng.switch_channel = getlang('switch_channel');
				tv_mosaic.lng.switch_language = getlang('switch_language');
				tv_mosaic.lng.anything_male = getlang('anything_male');
				tv_mosaic.lng.anything_female = getlang('anything_female');
				tv_mosaic.lng.of = getlang('of');
				tv_mosaic.lng.select_btn = getlang('select_btn');
				tv_mosaic.lng.now = getlang('mobileAppContent-contentPage-button-hotelServiceRequest-now');
				tv_mosaic.lng.next = getlang('next_programme');
				tv_mosaic.lng.channels = getlang('channels');
				tv_mosaic.lng.languages = getlang('languages');

				tv_mosaic.lng.tv_guide = getlang('tv_guide');
				tv_mosaic.lng.day = getlang('day');
				tv_mosaic.lng.jump_to_time = getlang('jump_to_time');

				tv_mosaic.lng.sleep_timer = getlang('sleep_timer');
			}

			return tv_mosaic.lng;
		}
	},
	// сортировка и фильтрация
	// функции предварительной сортировки
	filter_channels_by_groups: function (withoutPrepareMosaic) {
		var copy_tv_channels = tv_mosaic.copyArr(tv_channels);
		if (copy_tv_channels.length !== 0) tv_cur_channel = 0;

		for (var i = 0; i < copy_tv_channels.length; i++) {
			var channel = copy_tv_channels[i];

			if (!withoutPrepareMosaic) {
				tv_mosaic.renderChoosingArr(channel, 'categories_arr');
				tv_mosaic.renderChoosingArr(channel, 'languages_arr');

				// добавляем флаг state для дальнейшего использования
				// при фильтрации и построении
				channel.state = "show";
				channel.statePrev = "show";

				// добавляем строки категорий и языков
				channel.category_string = '';
				if (channel.categories_arr) {
					for (var k = 0; k < channel.categories_arr.length; k++) {
						// высчитываем длину строки
						var str = channel.category_string + ', ' + channel.categories_arr[k];
						if (tv_mosaic.maxLenString(str, 45)) {
							channel.category_string += ', ...';
							break;
						}

						if (channel.category_string === '') {
							channel.category_string = channel.categories_arr[k];
						} else {
							channel.category_string += ', ' + channel.categories_arr[k];
						}
					}
				}
			}

			if (channel.groups && channel.groups.length) {
				if (isset('guestData.groups')) {
					//intersection
					var tmp_intersect = channel.groups.filter(function (n) {
						return guestData.groups.indexOf(n.toString()) !== -1;
					});
					if (tmp_intersect.length) {
						//tv_log(tv_channels[num]["name"]);
					} else {
						copy_tv_channels.splice(i, 1);
						i--;
					}
				}
				else {
					copy_tv_channels.splice(i, 1);
					i--;
				}
			}

		}

		tv_channel_filter.groups = true;

		// сортируем каналы, чтобы каналы с локально выбранным языком шли первыми
		var sorted_channels = [];
		if (!withoutPrepareMosaic) {
			for (i = 0; i < copy_tv_channels.length; i++) {
				if (!isset('config.tv.channel_sorting')) break;

				if (copy_tv_channels[i].languages_arr &&
					copy_tv_channels[i].languages_arr.indexOf(storage["language"]) !== -1) {
					sorted_channels.push(copy_tv_channels.splice(i, 1)[0]);
					i--;
				}
			}
		}
		return sorted_channels.concat(copy_tv_channels);
	},
	sort_languages: function () {
		var tv_channels_languages = tv_mosaic.copyArr(tv_channels_languages_def);

		for (var i = 0; i < tv_channels_languages.length; i++) {
			// пишем словарь языков
			tv_mosaic.dictionary_lang[Object.keys(tv_channels_languages[i])[0]] = tv_channels_languages[i][Object.keys(tv_channels_languages[i])[0]];

			// добавляем количество доступных каналов для языка
			var count = 0;
			for (var j = 0; j < _tv_channels.length; j++) {
				if (_tv_channels[j]["languages_arr"] &&
					_tv_channels[j]["languages_arr"].indexOf(Object.keys(tv_channels_languages[i])[0]) !== -1) {

					count++;
				}
			}

			var _obj = {};
			_obj["count"] = count;
			_obj["selected"] = false;
			tv_channels_languages[i][Object.keys(tv_channels_languages[i])[0]] = _obj;
		}

		var resultList = [];
		for (i = 0; i < tv_channels_languages.length; i++) {
			if (tv_channels_languages[i][Object.keys(tv_channels_languages[i])[0]].count !== 0) {
				resultList.push(tv_channels_languages[i]);
			}
		}

		filter_guest.comparison('language', resultList);

		return resultList;
	},
	// функции динамической сортировки
	category_list: function () {
		var listObj = {};
		var listArr = [];

		for (var i = 0; i < _tv_channels.length; i++) {
			var channel = _tv_channels[i];

			if (channel.categories_arr) {
				for (var j = 0; j < channel.categories_arr.length; j++) {
					var cat = channel.categories_arr[j];

					if (cat in listObj) {
						listObj[cat] = ++listObj[cat];
					}
					else {
						listObj[cat] = 1;
					}
				}
			}
		}

		for (var key in listObj) {
			var obj = {};
			var _obj = {};

			_obj["count"] = listObj[key];
			_obj["selected"] = false;

			obj[key] = _obj;
			listArr.push(obj);
		}

		filter_guest.comparison('category', listArr);

		return listArr;
	},
	filter_channels: function () {
		for (var i = 0; i < _tv_channels.length; i++) {
			var channel = _tv_channels[i];
			setState(channel, calculateState(channel) ? 'show': 'hide');
		}

		sendChannelsToMobile();

		function calculateState(channel) {
			var languagesFilter = tv_channel_filter.language,
				categoriesFilter = tv_channel_filter.category,
				show = true;

			if (languagesFilter.length && categoriesFilter.length) {
				show = comparison(channel, languagesFilter, 'languages_arr');

				if (show) {
					show = comparison(channel, categoriesFilter, 'categories_arr');
				}
			}

			if (languagesFilter.length) {
				show = comparison(channel, languagesFilter, 'languages_arr');
			}

			if (categoriesFilter.length) {
				show = comparison(channel, categoriesFilter, 'categories_arr');
			}

			return show;

			function comparison(channel, filterList, filterType) {
				var show = true;

				for (var i = 0; i < filterList.length; i++) {
					var filterElement = filterList[i];
					if (channel[filterType].indexOf(filterElement) !== -1) {
						return show = true;
					}
					else {
						show = false;
					}
				}

				return show;
			}
		}
		function setState(channel, state) {
			channel.statePrev = channel.state;
			channel.state = state;
		}
	},
	toggle_filter_item: function (item) {
		var code = item ? item.getAttribute('data-code') : null;
		var filter_type = item ? item.getAttribute('data-filter-type') : null;

		if (code === null) {
			return filter_clear(filter_type ? filter_type : ['language', 'category']);
		}

		var catList = filter_type === 'language' ? tv_channels_sorted_lang : tv_channels_category_list;
		var index = tv_channel_filter[filter_type].indexOf(code);
		if (index === -1) {
			tv_channel_filter[filter_type].push(code);
			item.classList.add('selected');

			for (var i = 0; i < catList.length; i++) {
				if (catList[i][code]) {
					catList[i][code].selected = true;
				}
			}
		}
		else {
			tv_channel_filter[filter_type].splice(index, 1);
			item.classList.remove('selected');

			for (var i = 0; i < catList.length; i++) {
				if (catList[i][code]) {
					catList[i][code].selected = false;
				}
			}
		}

		filter_guest.set(filter_type, catList);

		function filter_clear(filter_type) {
			if (typeof filter_type === 'object') {
				for (var j = 0; j < filter_type.length; j++) {
					var filter = filter_type[j];
					filter_clear(filter);
				}

				return;
			}

			var catList = filter_type === 'language' ? tv_channels_sorted_lang : tv_channels_category_list;
			tv_channel_filter[filter_type] = [];
			$(tv_mosaic.blocks.choosing_list).find('li').removeClass('selected');

			for (var i = 0; i < catList.length; i++) {
				catList[i][Object.keys(catList[i])[0]].selected = false;
			}

			filter_guest.set(filter_type, catList);
		}
	},
	// util
	test: function () {
		tv_log('TEST TV_MOSAIC');

		var i;
		var interval = setInterval(checkLanguage, 7000);

		function checkLanguage() {
			if (typeof i === 'undefined') i = 0;
			else i++;

			if (!_tv_channels[i]) {
				clearInterval(interval);
				return;
			}

			tv_mosaic.channel_show(i, tv_mosaic.smallSize);
			setTimeout(check, 4000);

			function check() {
				tv_mosaic.audio_stream.get_list().then(function (list) {
					tv_log(_tv_channels[i]['name'] + ' | ' + list);
					log.add('TEST TV_MOSAIC: ' + _tv_channels[i]['name'] + ' | ' + list);
				});
			}
		}
	},
	getIndex: function (direct, step) {
		var i;

		try {
			_get(direct, step);
		}
		catch (e) {
			log.add("Error: " + e.name + " " + e.message);
			return 0;
		}

		return i;

		function _get(direct, step) {
			if (
				!step ||
				typeof step === 'undefined'
			) step = 1;

			var num = (direct === 'down') ? tv_mosaic.current_channel - step : tv_mosaic.current_channel + step;
			if (sign(num) === -1) num = _tv_channels.length - step;
			if (num > (_tv_channels.length - 1)) num = num - _tv_channels.length;

			// первый IF правит багу при переключении
			// отфильтрованных каналов
			// в полноэкранном режиме
			// CH_DOWN, num === -1
			if (
				typeof _tv_channels[num] === 'undefined' &&
				direct === 'down'
			) {
				tv_mosaic.current_channel = _tv_channels.length - 1;
				_get(direct, 0);
			}
			else if (_tv_channels[num].state === 'hide') {
				_get(direct, (Math.abs(step) + 1));
			}
			else {
				i = num;
			}

			function sign(x) {
				x = +x; // преобразуем в число
				if (x === 0 || isNaN(x)) {
					return x;
				}
				return x > 0 ? 1 : -1;
			}
		}
	},
	copyArr: function (arr) {
		var a = [];
		for (var i = 0; i < arr.length; i++) {
			if (filterRightsContent(arr[i], "video")) continue;

			a.push(Object.assign({}, arr[i]));
		}
		return a;
	},
	move: function (direct) {
		if (tv_cur_block === 'tv_programmes_list') {
			Epg.move(direct);

			Epg.updateView();

			return true;
		}

		var moved = false;
		if (tv_sel_list.length) {
			moved = metro_menu_move(direct);
		}

		if (tv_cur_block === 'tv_channellist') {
			// metro_menu_move и mosaicMenuMove возвращают индекс,
			// если курсор сдвинулся и false если нет
			// mosaicMenuMove используется для перехода с одной строки на другую,
			// когда ты находишься в конце или начале строки и жмешь вправо или влево соответственно
			if (typeof moved !== 'number') {
				moved = mosaicMenuMove(direct);
			}
			if (typeof moved !== 'number') {
				return false;
			}

			var elem = tv_sel_list.eq(moved),
				channelIndex = elem.attr('data-num');

			tv_mosaic.build_preview(_tv_channels[channelIndex].name);

			tv_mosaic.set_timer(channelIndex, 'preview', 1000);
		}

		if (tv_cur_block === 'channel') {
			tv_mosaic.server_channel_information.toggle();

			if (
				!tv_sel_list.length &&
				(
					direct === 'left' ||
					direct === 'right'
				)
			) {
				tv_mosaic.epg.hide();
				tv_mosaic.audio_stream.switch_on();

			}
			else {
				invisibleLanguageItems();
			}
		}

		function mosaicMenuMove(direct) {
			if (direct === 'up' || direct === 'down') return false;

			var prev_cur_pos = tv_cur_pos;

			direct === 'right' ? tv_cur_pos++ : tv_cur_pos--;

			// предотвращаем переход с последнего
			// канала на первый и наоборот
			if (
				(
					direct === 'right' &&
					tv_cur_pos === tv_sel_list.length
				) ||
				(
					direct === 'left' &&
					tv_cur_pos < 0
				)
			) {
				tv_cur_pos = prev_cur_pos;
				return false;
			}

			tv_sel_cur();

			metro_menu_calc();

			return tv_cur_pos;
		}
	},
	maxLenString: function (str, maxLen) {
		return (str.length <= (maxLen - 5)) ? false : true;
	},
	renderChoosingArr: function (channel, type) {
		if (channel[type] && channel[type] != null) return;

		var direct;
		if (type === 'languages_arr') {
			direct = 'language';
		}
		else {
			direct = 'category';
		}

		if (channel[direct] == null) {
			channel[type] = [];
		}
		else {
			if (typeof channel[direct] === 'string') {
				channel[type] = _trim(channel[direct].split(','));
			}
			else {
				channel[type] = channel[direct];
			}
		}

		function _trim(arr) {
			var newArr = [];
			for (var i = 0; i < arr.length; i++) {
				newArr.push(arr[i].trim());
			}

			return newArr;
		}
	},
	noPost: function (index, flag) {
		if (typeof (handlerNopost(_tv_channels, index)) !== 'undefined') {
			if (flag) {
				custom_dialog('alert', getlang('tv_nottelevision'), getlang('not_available_content'));
			}
			return true;
		}

		return false;
	},
	_server_keydown: function (e) {
		if (!e) e = event;
		var code = getKeyCode(e);

		switch (code) {
			case tv_keys.NUM_0:
				tv_mosaic.channel_number_press(0);
				break;
			case tv_keys.NUM_1:
				tv_mosaic.channel_number_press(1);
				break;
			case tv_keys.NUM_2:
				tv_mosaic.channel_number_press(2);
				break;
			case tv_keys.NUM_3:
				tv_mosaic.channel_number_press(3);
				break;
			case tv_keys.NUM_4:
				tv_mosaic.channel_number_press(4);
				break;
			case tv_keys.NUM_5:
				tv_mosaic.channel_number_press(5);
				break;
			case tv_keys.NUM_6:
				tv_mosaic.channel_number_press(6);
				break;
			case tv_keys.NUM_7:
				tv_mosaic.channel_number_press(7);
				break;
			case tv_keys.NUM_8:
				tv_mosaic.channel_number_press(8);
				break;
			case tv_keys.NUM_9:
				tv_mosaic.channel_number_press(9);
				break;

			case tv_keys.ENTER:
				if (tv_cur_block === 'language' || tv_cur_block === 'category') {
					var item = tv_mosaic.blocks.choosing_list.querySelector('.tv_cur');
					tv_mosaic.toggle_filter_item(item);
					tv_mosaic.filter_channels();
					tv_mosaic.build_channel_list(true);
				}
				else if (tv_cur_block === 'tv_channellist') {
					if (tv_mosaic.switching_channel) return;
					tv_mosaic.switching_channel = true;

					tv_mosaic.show('channel');
				}
				else if (tv_cur_block === 'channel') {
					if (tv_mosaic.server_channel_information._tv_channellist_hidden) {
						tv_mosaic.server_channel_information.toggle();
					}

					if (tv_sel_list.length) {
						var langCode = isset('config.tv.hacks.allOfLanguageCodesInMosaic') ?
							tv_cur_elem.attr('data-index') :
							tv_cur_elem.attr('data-code');

						tv_mosaic.audio_stream.setIndex(langCode);
					}
				}
				else if (tv_cur_block === 'dialog') {
					tv_mosaic.show('tv_channellist');
					tv_mosaic.switching_channel = false;
					clearTimeout(tv_mosaic.timer.preview);
				}
				else if (tv_cur_block === 'tv_programmes_list') {
					tv_mosaic.current_channel = Epg.getCurrentChannel();
					tv_mosaic.channel_show(
						tv_mosaic.current_channel,
						tv_mosaic.smallSize,
						true
					);
					tv_mosaic.show('tv_channellist');
					tv_mosaic.show('channel');
				}
				break;
			case tv_keys.UP:
				if (tv_cur_block === 'language' || tv_cur_block === 'category') {
					return tv_up();
				}

				tv_mosaic.move('up');

				if (tv_cur_block === 'tv_programmes_list') {
					return false;
				}

				VirtualScroll.set('tv_mosaic', 'tv_channellist');
				toggleFirstLine(tv_cur_elem);
				break;
			case tv_keys.DOWN:
				if (tv_cur_block === 'language' || tv_cur_block === 'category') {
					return tv_down();
				}

				tv_mosaic.move('down');

				if (tv_cur_block === 'tv_programmes_list') {
					return false;
				}

				VirtualScroll.set('tv_mosaic', 'tv_channellist');
				toggleFirstLine(tv_cur_elem);
				break;
			case tv_keys.LEFT:
				if (tv_cur_block === 'language' || tv_cur_block === 'category') {
					tv_mosaic.show('tv_channellist');
					break;
				}

				tv_mosaic.move('left');

				if (tv_cur_block === 'tv_channellist') {
					VirtualScroll.set('tv_mosaic', 'tv_channellist');
					toggleFirstLine(tv_cur_elem);
				}
				break;
			case tv_keys.RIGHT:
				if (
					tv_cur_block === 'tv_channellist' ||
					tv_cur_block === 'channel' ||
					tv_cur_block === 'tv_programmes_list'
				) {
					tv_mosaic.move('right');

					if (tv_cur_block === 'tv_channellist') {
						VirtualScroll.set('tv_mosaic', 'tv_channellist');
						toggleFirstLine(tv_cur_elem);
					}
				}
				break;
			case tv_keys.CH_UP:
				if (tv_cur_block === 'channel') {
					tv_mosaic.switch_channel('up');
				}
				else if (tv_cur_block === 'tv_channellist') {
					tv_mosaic.move('right');

					VirtualScroll.set('tv_mosaic', 'tv_channellist');
					toggleFirstLine(tv_cur_elem);
				}
				break;
			case tv_keys.CH_DOWN:
				if (tv_cur_block === 'channel') {
					tv_mosaic.switch_channel('down');
				}
				else if (tv_cur_block === 'tv_channellist') {
					tv_mosaic.move('left');

					VirtualScroll.set('tv_mosaic', 'tv_channellist');
					toggleFirstLine(tv_cur_elem);
				}
				break;

			case tv_keys.RED:
				tv_mode();
				break;
			case tv_keys.YELLOW:
				if (tv_cur_block === 'tv_programmes_list') {
					Epg.bounce();
					break;
				}

				if (tv_cur_block === 'category') {
					tv_mosaic.show('tv_channellist');
					break;
				}

				if (tv_cur_block !== 'channel') {
					tv_mosaic.show('choosing_list', 'category');
				}
				break;
			case tv_keys.BLUE:

				if (tv_cur_block === 'tv_programmes_list') {
					Epg.bounce(24);
					break;
				}

				if (tv_cur_block === 'language') {
					tv_mosaic.show('tv_channellist');
					break;
				}

				if (tv_cur_block === 'channel') {
					tv_mosaic.show('language');
				}

				if (tv_cur_block !== 'channel') {
					tv_mosaic.show('choosing_list', 'language');
				}
				break;
			case tv_keys.GREEN:

				if (tv_cur_block === 'tv_programmes_list') {
					return tv_mosaic.show('tv_channellist');
				}

				if (tv_cur_block === 'channel' && isset('config.tv.sleep_timer.enabled')) {
					tv_mosaic.server_channel_information.toggle();
					clearInterval(tv_mosaic.timer.information);

					fullscreen = false;

					return sleep_timer.open($(tv_mosaic.blocks.tv_mosaic), 'closeSleepTimerForMosaic();');
				}

				if (tv_cur_block !== 'channel') {
					tv_mosaic.show('programmes');
				}

				break;

			case tv_keys.PORTAL:
			case tv_keys.GUIDE:
			case tv_keys.Q_MENU:
			case tv_keys.MENU:
			case tv_keys.HOME:
				switch (tv_cur_block) {
					case 'channel':
						// clearTimeout(tv_mosaic.timer.information);
						tv_mosaic.server_channel_information._show();

					case 'language':
					case 'category':
					case 'tv_programmes_list':
						tv_mosaic.show('tv_channellist');

					case 'tv_channellist':
						tv_mode();
						break;
				}

				break;

			case tv_keys.EXIT:
			case tv_keys.BACK:
				switch (tv_cur_block) {
					case 'channel':
						// clearTimeout(tv_mosaic.timer.information);
						tv_mosaic.server_channel_information._show();
					case 'language':
					case 'category':
						tv_mosaic.show('tv_channellist');
						break;
					case 'tv_channellist':
						tv_mode();
						break;

					case 'tv_programmes_list':
						tv_mosaic.show('tv_channellist');
						break;
				}
				break;

			case tv_keys.DOOREYE:

				if(typeof(DoorEye) !== 'undefined'){

					if (tv_cur_block === 'channel') {
						clearTimeout(tv_mosaic.timer.information);
						tv_mosaic.server_channel_information._show();
					}
					if (tv_cur_block !== 'tv_channellist') {
						tv_mosaic.show('tv_channellist', null, 'hide');
					}
					tv_mode();

					DoorEye.ask();
				}else{
					log.add('DoorEye: module not loaded!');
				}
				break;

		}
	},
	event_listener: function (e, data_1) {
		if (tv_samsung_mark) {
			_samsung_event_listener(e, data_1);
		}
		else if (tv_lg_mark) {
			_lg_event_listener(e);
		}
		else if (tv_mag_mark) {
			_mag_event_listener(e);
		}
		else if (tv_sony_mark) {
			_sony_event_listener(e);
		}
		else { // desktop
			_desktop_event_listener(e);
		}

		function _samsung_event_listener(e, data_1) {
			//~ tv_log("onEvent..._SEF "+e+" p1: "+data_1);
			switch (e) {
				case 2:
					// tv_log("SEF_EVENT_TYPE.PL_EMP_PLAYER_EVENTS.");

					switch (data_1) {
						case '0': // CHANNEL_STOP
							if (_tv_channels[tv_mosaic.current_channel].type === 'rf') {
								tv_mosaic.resize_channel();
							}
							break;
						case '7': // RENDER OK
							tv_mosaic.resize_channel();
							break;
					}
					break;
				case 3: //PL_EMP_IPTV_EVENTS:
					switch (data_1) {
						case '3': // PL_EMP_IPTV_EVENT_AUDIO_AND_VIDEO)
							// tv_log("PL_EMP_IPTV_EVENT_AUDIO_AND_VIDEO");

							// пришлось продублировать здесь
							// case: двойное нажатие ОК из меню
							tv_mosaic.resize_channel();

							tv_mosaic.recursion_count = 0;
							tv_mosaic.audio_stream.setLocationLang(get_language());
							break;
						case '1': //PL_EMP_IPTV_EVENT_AUDIO_ONLY)
						// tv_log(".PL_EMP_IPTV_EVENT_AUDIO_ONLY.");
						case '2': // PL_EMP_IPTV_EVENT_VIDEO_ONLY)
						// tv_log("PL_EMP_IPTV_EVENT_VIDEO_ONLY");
						case '4': // PL_EMP_IPTV_EVENT_NO_STREAMINPUT)
						// tv_log("PL_EMP_IPTV_EVENT_NO_STREAMINPUT");
						case '5': // PL_EMP_IPTV_EVENT_STREAM_RECOVERED)
						// tv_log("PL_EMP_IPTV_EVENT_STREAM_RECOVERED");
						case '6': // RENDERER ERROR
							if (_do_recursion()) {
								tv_mosaic.channel_show(
									tv_mosaic.current_channel,
									undefined,
									true,
									true
								);
							}

							break;
						default:
							log.add('TV: Unknown IPTV event ' + data_1);
							break;
					}
					break;
				default:
					break;
			}
		}

		function _lg_event_listener(e) {
			// {Boolean} param.result - true if the current channel is changed successfully, else false.
			// {String} param.errorMessage - in case of failure, this message provides the details.
			if (e.result) {
				// пришлось продублировать здесь
				// case: двойное нажатие ОК из меню
				tv_mosaic.resize_channel();

				setTimeout(function() {
					tv_mosaic.audio_stream.setLocationLang(get_language());
				}, 1000);
			}
		}

		function _mag_event_listener(e) {
			switch (e) {
				case 4: // Начало отображаться видео и/или воспроизводиться звук
					// пришлось продублировать здесь
					// case: двойное нажатие ОК из меню
					tv_mosaic.resize_channel();

					tv_mosaic.recursion_count = 0;
					tv_mosaic.audio_stream.setLocationLang(get_language());
					break;
				case 5: // Ошибка открытия контента: нет такого контента на сервере или произошёл отказ при соединении с сервером
					if (_do_recursion()) {
						tv_mosaic.channel_show(
							tv_mosaic.current_channel,
							undefined,
							true,
							true
						);
					}
					break;
			}
		}

		function _sony_event_listener(e) {
			// {Boolean} param.result - true if the current channel is changed successfully, else false.
			// {String} param.errorMessage - in case of failure, this message provides the details.
			if (e.type == 'channel_changed') {
				// пришлось продублировать здесь
				// case: двойное нажатие ОК из меню
				tv_mosaic.resize_channel();

				setTimeout(function() {
					tv_mosaic.audio_stream.setLocationLang(get_language());
				}, 1000);
			}
		}

		function _desktop_event_listener(event) {
			switch (event.type) {
				case 'canplay':
					tv_mosaic.resize_channel();
					break;
				case 'ended':
					break;
				case 'abort':
					break;
			}
		}

		function _do_recursion() {
			if (tv_mosaic.recursion_count >= 2) return false;
			else return ++tv_mosaic.recursion_count;
		}
	},
	event_listener_tizen: {
		onbufferingstart: function () {
			// console.log("buffering start " + tv_mosaic.current_channel);log.add("buffering start " + tv_mosaic.current_channel);
		},
		onbufferingprogress: function (percent) {
			// console.log("buffering progress.. "  + tv_mosaic.current_channel);
		},
		onbufferingcomplete: function () {
			// log.add("buffering complete.. "  + tv_mosaic.current_channel);
			// console.log("buffering complete.. "  + tv_mosaic.current_channel);
		},
		oncurrentplaytime: function (currentTime) {
			//$("#test").prepend("currentTime=="+currentTime);
			//console.log("current playtime :: " + currentTime);
		},
		onevent: function (eventType, eventData) {
			// log.add("CHANNEL: "+ tv_mosaic.current_channel +" onevent " + eventType + " data " + eventData);
			// console.log("CHANNEL: "+ tv_mosaic.current_channel +" onevent " + eventType + " data " + eventData);

			/*if (eventType === 'PLAYER_MSG_RENDER_DONE') {
				var stream = webapis.avplay.getCurrentStreamInfo();
				for (var i = 0; i < stream.length; i++) {
					var streamElement = stream[i];
					if (streamElement.type !== 'AUDIO') continue;

					var info = JSON.parse(streamElement.extra_info);
					console.log('Channel name: ' + _tv_channels[tv_mosaic.current_channel].name + ', number: ' + tv_mosaic.current_channel);
					console.log('Channel language: ' + info.language);
					console.log('Channel sample_rate: ' + info.sample_rate);
					console.log('Channel bit_rate: ' + info.bit_rate);

					log.add('Channel name: ' + _tv_channels[tv_mosaic.current_channel].name + ', number: ' + tv_mosaic.current_channel);
					log.add('Channel language: ' + info.language);
					log.add('Channel sample_rate: ' + info.sample_rate);
					log.add('Channel bit_rate: ' + info.bit_rate);

				}
			}
			else {
				log.add('Listener Tizen TV: event type - ' + eventType);
			}*/
		},
		onstreamcompleted: function () {
			// log.add("stream completed.. " + tv_mosaic.current_channel);
			// console.log("stream completed.. " + tv_mosaic.current_channel);
		},
		onerror: function (eventType) {
			// log.add("error has occured.. "  + tv_mosaic.current_channel + " event " + eventType);
			// console.log("error has occured.. "  + tv_mosaic.current_channel);
		},
		onsubtitlechange: function (duration, text, data3, data4) {
			// console.log("subtitle changed..");
		},
		ondrmevent: function (drmEvent, drmData) {
			// console.log("on drm event..");
		}
	},
	channel_number_press: function (num) {
		if (tv_cur_block === 'channel') {

			if (tv_channel_number.length < 4) {
				tv_channel_number += '' + num;
			}
			if (!$('#tv_channel_number').length) {
				$(document.body).append($('<div id="tv_channel_number" style="color:#fff; z-index:100; left:20px;"></div>'));
			}
			$('#tv_channel_number').html(tv_channel_number + '-');
			if (tv_channel_number_entered) {
				clearTimeout(tv_channel_number_entered);
			}

			tv_channel_number_entered = setTimeout(function () {
				tv_channel_number = tv_channel_number | 0;
				if (_tv_channels[tv_channel_number - 1]) {
					$('#tv_channel_number').html(tv_channel_number);

					tv_mosaic.channel_show(tv_channel_number - 1);

					tv_mosaic.build_bottom_information(tv_mosaic.current_channel);
					tv_mosaic.server_channel_information.toggle();
				} else {
					$('#tv_channel_number').html('<span style="color:Red;">' + tv_channel_number + '</span>');
				}

				tv_channel_number = '';
				setTimeout(function () {
					$('#tv_channel_number').remove();
				}, 3000);
			}, 1000);

		} else {
			tv_channel_number += '' + num;
			if (tv_channel_number_entered) {
				clearTimeout(tv_channel_number_entered);
			}
			tv_channel_number_entered = setTimeout(function () {
				ServiceCodes.evaluate(tv_channel_number);
				tv_channel_number = '';
			}, 1000);

			if(tv_channel_number.length === 4){
				ServiceCodes.evaluate(tv_channel_number);
				tv_channel_number = '';
			}
		}
	},
	server_channel_information: {
		_tv_channellist_hidden: false,
		toggle: function () {
			if (tv_cur_block !== 'channel') {
				return false;
			}

			tv_mosaic.server_channel_information.time_line();

			if (tv_mosaic.server_channel_information._tv_channellist_hidden) {
				tv_mosaic.server_channel_information._show();
			}

			tv_mosaic.set_timer(null, 'information', 5000);
		},
		fade_animation: function () {
			if (tv_lg_mark) {
				document.body.style.backgroundImage = 'url(tv:)';
			}

			tv_mosaic.current_block = 'channel';

			$(tv_mosaic.blocks.tv_mosaic).animate({opacity: 0}, 500, function () {
				$('#tv_fullscreen_overlay').css({visibility: 'hidden'});

				tv_mosaic.server_channel_information.clean_language();

				// Сделано для кейса, когда открыто диалоговое окно
				// Предупреждение о скором выключении ТВ
				if (tv_cur_block === 'channel') {
					$('#tv_cur').hide();
					tv_sel_list = [];
				}

				tv_mosaic.server_channel_information._tv_channellist_hidden = true;
				tv_mosaic.audio_stream.language_hidden = true;

				tv_mosaic.epg.show(tv_mosaic.current_channel);

				if (isset('config.tv.mosaic_clock.enabled')) {
					$('#tv_fullscreen_mosaic_time').css({
						opacity: 0.0,
						visibility: 'visible'
					}).animate(
						{ opacity: 1.0 },
						3000
					);
				}
			});
		},
		_show: function () {
			clearTimeout(tv_mosaic.timer.information);
			$(tv_mosaic.blocks.tv_mosaic).stop().animate({opacity: 1}, 100, function () {
				document.getElementById('tv_fullscreen_overlay').style.visibility = 'visible';
				tv_mosaic.server_channel_information._tv_channellist_hidden = false;

				if (isset('config.tv.mosaic_clock.enabled')) {
					$('#tv_fullscreen_mosaic_time').css({
						opacity: 0.0,
						visibility: 'hidden'
					});
				}
			});
		},
		clean_language: function () {
			var switchLanguage = $('#switch_language');
			switchLanguage.html('');
			switchLanguage.css({ left: '' });
			switchLanguage.removeClass('transition-all-3');
		},
		time_line: function () {
			var
				containerWidth = document.getElementById('progress_line_wrap').clientWidth,
				nowTimestamp = parseInt(
					time_picker
						.get_moment_with_current_time(Date.now())
						.format('X')
				),
				epg = tv_mosaic.epg.get(
					_tv_channels[tv_mosaic.current_channel]
				),
				progress_line = document.getElementById('progress_line');

			if (!epg) return __hide();

			var offset = parseFloat(
				containerWidth * ((nowTimestamp - epg.now.startTimestamp) / (epg.now.stopTimestamp - epg.now.startTimestamp))
			);
			__show();

			function __show() {
				progress_line.style.width = offset + 'px';
			}
			function __hide() {
				progress_line.style.width = '0px';
			}
		}
	},
	empty: function () {
		return false;
	}
};

function invisibleLanguageItems(init) {
	var prevIndex = tv_cur_pos - 1,
		couplePrevIndex = tv_cur_pos - 2,

		nextIndex = tv_cur_pos + 1,
		coupleNextIndex = tv_cur_pos + 2;

	if (!init) {
		setClassName(tv_cur_pos);
		setClassName(prevIndex);
		setClassName(nextIndex);
		setClassName(couplePrevIndex);
		setClassName(coupleNextIndex);
	}

	toggleVisible(prevIndex, true);
	toggleVisible(nextIndex, true);
	toggleVisible(couplePrevIndex, false);
	toggleVisible(coupleNextIndex, false);

	toggleTextAlign(tv_cur_pos);
	toggleTextAlign(prevIndex, 'right');
	toggleTextAlign(nextIndex, 'left');

	function toggleVisible(index, switchOn) {
		var item = tv_sel_list[index];
		if (!item) {
			return false;
		}

		item.style.opacity = switchOn ? 1 : 0;
	}
	function toggleTextAlign(index, direct) {
		var item = tv_sel_list[index];
		if (!item) {
			return false;
		}

		item = item.querySelector('span');
		var width = item.clientWidth;

		if (direct === 'left') {
			item.style.marginLeft = 0;
		}
		else if (direct === 'right') {
			item.style.marginLeft = 130 - width + 'px';
		}
		else {
			item.style.marginLeft = (130 - width) / 2 + 'px';
		}
	}
	function setClassName(index) {
		var item = tv_sel_list[index];
		if (!item) {
			return false;
		}

		item = item.querySelector('span');
		if ($(item).hasClass('transition-all-3')) {
			return false;
		}

		$(item).addClass('transition-all-3');
	}
}
function toggleFirstLine(elem) {
	var topElem = elem[0].getBoundingClientRect().top,
		topWrapper = tv_mosaic.blocks.content_wrapper.getBoundingClientRect().top,
		shift = 5;

	if (Math.abs(topElem - topWrapper) < shift) {
		return elem.addClass('tv_channellist_first_line');
	}

	elem.removeClass('tv_channellist_first_line');
}
function closeSleepTimerForMosaic() {
	fullscreen = true;

	tv_cur_block = 'channel';

	tv_mosaic.server_channel_information.toggle();
	$('#tv_cur').hide();

	active_page = HotezaTV.history.lastpage;
	active_page_id = active_page.replace('#', '');
}
function closeDialogForMosaic() {
	tv_mosaic.show('tv_channellist');
	tv_mosaic.switching_channel = false;
	clearTimeout(tv_mosaic.timer.preview);
}
