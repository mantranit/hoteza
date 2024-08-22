var IMAGE_TIMER, MUSIC_TIMER;
var Wakeupcall = {
	tracks: [],
	serviceId: null,
	mode: null,
	type: null,
	audio: {},
	modeChanging: false,
	modeChanged: true,
	opened: false,
	deps: ['ServiceCodes'],
	init: function () {
		ServiceCodes.registerListener('1201', function(){
			tv_wakeup();
		});

		if (
			!isset('structv2.wakeupcall') ||
			$('#services_wakeup').length === 0
		) {
			return log.add('WAKEUPCALL doesn\'t exist in structv2');
		}

		$('#services_wakeup').remove();

		Wakeupcall.tracks = __getData('tracks');
		Wakeupcall.serviceId = __getData('serviceId');

		Wakeupcall.render('choose_wakeup');

		//TODO: правка структуры. (Убрать после улучшения модуля (UI register))
		for(var i in structv2.menu){
			if(structv2.menu[i].link == '#services_wakeup'){
				structv2.menu[i].link = '';
				structv2.menu[i].onvclick = 'Wakeupcall.open(\'choose_wakeup\');';
			}
		}
		$('#menu LI[href="#services_wakeup"]')
		.attr('onvclick', 'Wakeupcall.open(\'choose_wakeup\');')
		.attr('href', '');

		document.addEventListener("webkitAnimationEnd", Wakeupcall.serverChangesModeEnd, false);

		var images = [];
		for(var index in Wakeupcall.tracks){
			images.push(Wakeupcall.tracks[index].image);
		}
		_PreloadMedia(images);

		function __getData(type) {
			var queryStrFromStruct = 'structv2.wakeupcall.' + type,
				queryStrFromConfig = 'config.widgets.wakeup.' + type;

			switch (type) {
				case 'tracks':
					return (
						isset(queryStrFromStruct) &&
						isset(queryStrFromStruct).length
					) ?
						__setBaseURL(isset(queryStrFromStruct)) :
						__setBaseURL(isset(queryStrFromConfig));

				case 'serviceId':
					return isset(queryStrFromStruct);
			}

			//TODO: аккуратно удалить это
			function __setBaseURL(data) {
				for (var i = 0; i < data.length; i++) {
					var item = data[i];
					item.image = item.image;
					item.audio = item.audio;
					item.video = item.video;
				}

				return data;
			}
		}
	},
	open: function (type) {
		// механизм проверки уже установленного будильника
		var time = Wakeupcall.get('time'),
			orderId = Wakeupcall.get('orderId');

		if (type === 'choose_wakeup' && time) {
			return Wakeupcall.changeWakeup(time, orderId);
		}

		Wakeupcall.type = type;
		Wakeupcall.opened = true;

		switch (type) {
			case 'choose_wakeup':

				// Media.stop({ directType: 'wakeup' }).done(function () {
				navigate('#services_wakeup');
				// });

				break;

			case 'wakeup':
				//TODO: автовыключение
				Wakeupcall.render('wakeup');

				document.getElementById('tv_fullscreen_overlay').style.display = 'none';
				clip(null);

				// Media.stop({ directType: 'wakeup' }).done(function () {
				tv_wakeup_volume(isset('config.tv.wakeup.start_volume')|0);
				navigate('#wakeup');
				// });

				tv_task_answer({ answer: 'tvwolon' });

				break;
		}

	},
	close: function (type, fromMedia) {
		if (!Wakeupcall.opened) {
			return false;
		}
		Wakeupcall.opened = false;

		var d = $.Deferred();
		type = type ? type : Wakeupcall.type;

		Media.set({ directType: null });

		switch (type) {
			case 'choose_wakeup':

				_player_destroy(Wakeupcall.audio).done(function () {
					if (!fromMedia) {
						navigate('#menu');
					}
					d.resolve();
				});

				break;

			case 'wakeup':

				document.getElementById('tv_fullscreen_overlay').style.display = 'block';

				tv_wakeup_volume_cancel();
				tv_task_answer({answer: 'tvwolok'});

				videoCollection.destroy().done(function () {
					if (!fromMedia) {
						navigate('#menu');
					}

					_tv_bg_restore();
					d.resolve();
				});

				break;
		}

		Wakeupcall.mode = null;
		return d.promise();
	},
	get: function (type) {
		var ret = '';
		switch (type) {
			case 'savedMode':
				if (typeof storage.wakeupMode === 'undefined') {
					storage.setItem('wakeupMode', 0);
					ret = 0;
				} else {
					ret = parseInt(storage.wakeupMode);
				}
				break;

			case 'time':
			case 'orderId':
				ret = wakeup_status.get(type);
				break;
		}
		return ret;
	},
	set: function (data) {

		switch (data.type) {
			case 'mode':
				Wakeupcall.opened = true;

				if (!data.save) {

					if (__isModeEqualIndex(data)) return false;

					var prevIndex = Wakeupcall.mode;
					Wakeupcall.mode = data.index;

					if (__notChangeMode(data)) return false;

					Wakeupcall.modeChanging = true;
					Wakeupcall.modeChanged = false;

					clearTimeout(IMAGE_TIMER);
					clearTimeout(MUSIC_TIMER);
					IMAGE_TIMER = setTimeout(__setImage.bind(null, data), 200);
					MUSIC_TIMER = setTimeout(__setMusic.bind(null, data), 1000);

				}
				else __saveMode(data);

				break;

			case 'time':

				if (data.time) {
					service_post(
						undefined,
						data.time,
						false,
						'wakeup_status.bind(null, true);'
					);

					break;
				}

				Services.setProduct({
					id: 'services_wakeup',
					amount: 1
				});

				time_picker.open(
					'services_wakeup',
					'Wakeupcall.close(\'choose_wakeup\', true);Wakeupcall.set({type:\'time\',time:$(this).attr(\'time\')})',
					undefined,
					undefined,
					'Services.deleteProduct();deleteFeaturesSubstrate(\'time_picker\');'
				);
				Wakeupcall.render('choose_time');

				break;

			case 'savedMode':

				Wakeupcall.mode = -1;
				Wakeupcall.set({
					type: 'mode',
					index: Wakeupcall.get('savedMode'),
					save: false
				});

				break;
		}

		function __setImage(data) {
			if (prevIndex === data.index) return false;

			var index = parseInt(tv_cur_elem.attr('data-mode'));
			if (index !== Wakeupcall.mode) return false;

			var modeContainer = $('#features_services_wakeup'),
				next = modeContainer.find('.next');

			next.css('backgroundImage', 'url("'+ Wakeupcall.tracks[index].image +'")');
			next.attr('data-mode', index);

			modeContainer.addClass('animated');

			clip(null);
		}
		function __setMusic(data) {
			if (prevIndex === data.index) return false;

			var index = parseInt(tv_cur_elem.attr('data-mode'));
			if (index !== Wakeupcall.mode) return false;

			_player_destroy(Wakeupcall.audio).done(function () {

				var ctx = Object.assign(Wakeupcall.audio, {
					url: Wakeupcall.tracks[index].audio,
					mimeType: 'audio/mp3',
					loop: true,
					eventListener: tv_samsung_tizen_mark ?
						Wakeupcall.eventListenerTizen : Wakeupcall.eventListener
				});

				_player_play(ctx);

			});

		}
		function __saveMode(data) {
			storage.setItem('wakeupMode', data.index);

			$('#services_wakeup .button').attr('data-mode', data.index);

			tv_sel_list.removeClass('selected');
			tv_cur_elem.addClass('selected');
		}
		function __isModeEqualIndex(data) {
			return (
				Wakeupcall.mode === data.index &&
				!data.doit
			);
		}
		function __notChangeMode(data) {
			return data.doit && !Wakeupcall.modeChanging;
		}
	},
	render: function (type) {
		var html;

		switch (type) {
			case 'choose_time':

				html = templates_cache["features_substrate"].render(__getData('image'));
				document.getElementById('time_picker').insertAdjacentHTML('afterbegin', html);

				break;

			case 'choose_wakeup':

				html = templates_cache["list_items"].render(__getData(type));
				document.getElementById('container').insertAdjacentHTML('beforeend', html);

				var servicesWakeupPage = document.getElementById('services_wakeup');
				html = templates_cache["features_services_wakeup"].render({});
				servicesWakeupPage.insertAdjacentHTML('afterbegin', html);

				html = templates_cache["features_services_wakeup_legend"].render(__getData('legend'));
				servicesWakeupPage.insertAdjacentHTML('beforeend', html);

				servicesWakeupPage.setAttribute(
					'onopen',
					'Services.setShopId(\''+ Wakeupcall.serviceId +'\');Media.set({ directType: \'wakeup\' });'
				);

				break;

			case 'wakeup':
				$('#wakeup').remove();

				html = templates_cache["wakeup_new"].render(__getData('wakeup'));

				$('#container').append(html);

				break;
		}

		function __getData(type) {
			switch (type) {
				case 'choose_wakeup':
					var items = [],
						savedMode = Wakeupcall.get('savedMode');

					for (var i = 0; i < Wakeupcall.tracks.length; i++) {
						var track = Wakeupcall.tracks[i];

						items.push({
							id: null,
							className: savedMode === i ? 'selected tv_sel' : null,
							title: getlang(track.title),
							action: 'Wakeupcall.set({type: \'mode\', index: '+ i +', save: true})',
							onvMove: 'Wakeupcall.set({type: \'mode\', index: '+ i +', save: false})',
							dataset: [
								{
									name: 'mode',
									value: i
								}
							]
						});
					}

					return {
						id: 'services_wakeup',
						className: 'without_border',
						backBtn: 0,
						metro_menu: true,
						title: isset('structv2.wakeupcall.title'),
						content: {
							list: items,
							buttons: [{
								title: getlang('mobileAppContent-contentPage-input-hotelServiceRequest-selectTime'),
								type: 'onvclick',
								action: 'Wakeupcall.set({type:\'time\'})',
								onvMove: 'Wakeupcall.set({type:\'savedMode\'})',
								dataset: [{
									name: 'mode',
									value: savedMode
								}]
							}]
						},
						lang: {
							back: getlang('mobileAppContent-default-label-back')
						}
					};

				case 'wakeup':
					var weather = tv_set_weather(true);

					var welcome_text;

					if(isset('structv2.wakeupcall.welcome_text')){
						welcome_text = tv_set_welcome_guest_greeting(isset('structv2.wakeupcall.welcome_text'));
					}else{
						welcome_text = tv_set_welcome_guest_greeting(getlang(isset('config.widgets.wakeup.welcome_text')));
					}

					return {
						backBtn: 1,
						onvclick: 'Wakeupcall.close(\'wakeup\');',
						title: welcome_text,
						content: {
							video: Wakeupcall.tracks[Wakeupcall.get('savedMode')].video,
							weather: {
								temperature: weather.temp,
								icon: weather.icon,
								desc: weather.desc
							},
							buttons: [{
								title: getlang('radio_stop_playing'),
								type: 'onvclick',
								action: 'Wakeupcall.close(\'wakeup\');'
							}]
						},
						lang: {
							back: getlang('mobileAppContent-default-label-back')
						}
					};

				case 'image':
					return {
						image: Wakeupcall.tracks[Wakeupcall.get('savedMode')].image
					};

				case 'legend':
					return {
						select_track: (getlang('select_btn') + ' ' + getlang('track')),
						confirm_track: (getlang('confirm') + ' ' + getlang('track'))
					};
			}
		}
	},
	serverChangesModeEnd: function (e) {
		if (e.animationName !== 'fadeExit') return false;

		var modeContainer = $(e.target).closest('#features_services_wakeup');

		__animationEnd(modeContainer);

		// проверяем на том ли пункте еще пользователь,
		// или перешел на другой
		if (Wakeupcall.modeChanging) {
			return __checkSwitchedOn(
				Wakeupcall.set,
				{
					type: 'mode',
					index: Wakeupcall.mode,
					save: false,
					doit: true
				}
			);
		}
		else {
			Wakeupcall.modeChanged = true;
		}

		function __isCheckMode() {
			var currentMode = parseInt(modeContainer.find('.current').attr('data-mode'));
			return currentMode !== Wakeupcall.mode;
		}
		function __checkSwitchedOn(fn, data) {
			if (
				!Wakeupcall.modeChanging &&
				__isCheckMode()
			) {
				fn(data);
				Wakeupcall.modeChanged = true;
			}
			else if (
				Wakeupcall.modeChanging &&
				__isCheckMode()
			) {
				setTimeout(__checkSwitchedOn.bind(null, fn, data), 500);
			}
		}
		function __animationEnd(container) {

			var modes = container.find('div');

			for (var i = 0; i < modes.length; i++) {
				var mode = modes[i];

				if (mode.classList.contains('current')) {
					mode.classList.remove('current');
					mode.classList.add('next');
				}
				else {
					mode.classList.remove('next');
					mode.classList.add('current');
				}
			}

			container.removeClass('animated');

		}
	},
	eventListener: function (event, data) {
		//TODO: удалить после переделки Media
		if (tv_lg_mark) {
			event = event.eventType;

			switch (event) {
				case 'play_start':
					Wakeupcall.modeChanging = false;

					break;
				case 'play_end':
					break;
				case 'file_not_found':
				case 'error_in_playing':
				case 'network_disconnected':
					// _error_start();
					break;
			}
		}
		else if (tv_samsung_mark) {
			switch (event) {
				case 7:
					Wakeupcall.modeChanging = false;

					break;
				case 8:
					break;
				case 6:
				case 1:
					// _error_start();
					break;
				case 14:
			}
		}
		else if (tv_mag_mark) {
			switch (event) {
				case '4':
					Wakeupcall.modeChanging = false;

					break;
				case '1':
					break;
				case '5':
					// _error_start();
					break;
			}
		}
		else { // desktop
			switch (event.type) {
				case 'canplay':
					Wakeupcall.modeChanging = false;

					break;
				case 'ended':

					break;
				case 'abort':
					// _error_start();

					break;
			}
		}
	},

	changeWakeup: function (time, orderId) {
		/**
			* Оставить в системе возможность установки только ОДНОГО будильника.
			* Если будильник не установлен, то сценарий такой как сейчас.
			* Если будильник уже установлен, то при входе в раздел будильника, гость получает Alert-сообщение в стандартном формате со словами:
			*      "Your wake-up service is set to xx:xx" и две кнопки Delete и Change Time.
			*      После нажатия Delete отображается Alert c текстом "Wake-up cancelled" и кнопка OK.
			* Если Change Time, то запускаем стандартный сценарий.
			* */

		return custom_confirm({
			title: getlang('alert'),
			text: getlang('wakeup_set_to') + ' ' + time,

			confirm: getlang('cancel') + ' ' + getlang('just_wakeup'),
			cancel: getlang('change_time'),
			closeNotCancel: true,
			onConfirm: function () {
				if (orderId) {
					try {
						shop_cancel_order(orderId, deleteCallback);
					}
					catch(e) {
						log.add('WakeupCall exception: ' + e);
						deleteCallback();
					}
				}
				else {
					deleteCallback();
				}
			},
			onCancel: function () {
				if (orderId) {
					try {
						shop_cancel_order(orderId, changeCallback);
					}
					catch (e) {
						log.add('WakeupCall exception: ' + e);
						changeCallback();
					}
				}
				else {
					changeCallback();
				}
			}
		});

		function deleteCallback() {
			wakeup_status(false, null, null);

			custom_confirm({
				title: getlang('alert'),
				text: getlang('wakeup_cancelled'),

				confirm: 'Ok',
				cancel: null,

				onConfirm: tv_menu
			});
		}
		function changeCallback() {
			wakeup_status(false, null, null);
			Wakeupcall.open('choose_wakeup');
		}
	},
	tests: function(){
		return [
			{'name': 'Wake me up', 'method': 'test'}
		];
	},
	test: function(){
		tv_wakeup();
	}
};
