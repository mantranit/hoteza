var MOD = {
	deps: [
		'ServiceCodes'
	],
	current_playlist: null,
	current_shuffle_playlist: null,
	current_playlist_id: null,
	current_block: null, // возможные значения: panel, list
	duration: 0,
	paused: false,
	play_btn: null,
	pause_btn: null,
	init: function () {
		var d = $.Deferred();
		ServiceCodes.registerListener({
			'5100': function() {
				MOD.open('MOD');
			}
		});

		css_append('s/font/player/style.css', 'cssVODcontrols');

		MOD.loadStructure()
		.done(function (data) {
			MOD.build_categories(MOD.data.categories, null);

			for (var i = 0; i < MOD.data.categories.length; i++) {
				MOD.build_playlist(MOD.data.categories[i].id);
			}

			d.resolve();
		})
		.fail(function () {
			d.reject('structure failed');
		});
		return d.promise();
	},
	loadStructure: function () {
		var d = $.Deferred();
		$.getJSON('mod/data/mod.json?_=' + Math.random(),
			function (data) {
				if (!isValidData(data)){
					d.reject('incorrect data');
				}

				MOD.data = {
					audio: data.audio,
					categories: data.categories
				};
				log.add('MOD: structure loaded.');

				d.resolve();
			},
			'json')
		.fail(function () {
			log.add('MOD: structure not found');
			d.reject('not found');
		});
		return d.promise();

		function isValidData(data) {
			if (typeof data.categories === 'undefined' || typeof data.audio === 'undefined') {
				log.add('MOD: data invalid');
				return false;
			}

			if (data.audio.length === 0) {
				log.add('MOD: data is empty');
				return false;
			}

			return true;
		}
	},
	open: function(id, parentId) {
		if (typeof parentId !== 'undefined') {
			document.querySelector('#MOD .header').insertAdjacentHTML(
				'afterbegin',
				'<div class="back" onvclick="navigate(\''+ parentId +'\')" href_type="back">' +
						getlang('mobileAppContent-default-label-back') +
					'</div>'
			);
		}

		var to = document.getElementById(id);
		if (to.classList.contains('mod_playlist')) {
			open_playlist(id);
		}
		else {
			var video = videoCollection.get();
			if (video) clip(null, video.page);

			navigate('#' + id, null, null, true);
			setTimeout(videoCollection.destroy, 50);
		}

		function open_playlist(id) {
			MOD.set_current_playlist(id);

			navigate('#' + id, null, null, true);
			tv_keydown_override = MOD.server_keydown;

			MOD.current_block = 'list';
			// metro_menu_calc();

			MOD.play(null, 'init');
			MOD.substrate();
		}
	},
	close: function () {
		var d = $.Deferred();

		MOD.nav('list');
		MOD.stop().done(function () {
			tv_keydown_override = null;
			MOD.paused = false;
			d.resolve();
		});

		return d.promise();
	},
	nav: function(target, flag) {

		if (
			(
				target === 'list' &&
				MOD.current_block !== 'list'
			) || (
				target === 'list' &&
				flag
			)
		) {
			MOD.current_block = target;
			MOD.toggle_control_btn(true);

			tv_sel_list = $('#' + MOD.current_playlist_id).find('li');
			tv_cur_elem = $('#' + MOD.audio.id);
			tv_cur_pos = tv_sel_list.index(tv_cur_elem);
			tv_max_pos = tv_sel_list.length;
			tv_sel_cur();

			MOD.substrate('panel', 'remove');
			MOD.substrate();
		}
		else if (
			target === 'panel' &&
			MOD.current_block !== 'panel' ||
			(target === 'panel' && flag)
		) {
			MOD.current_block = target;
			MOD.toggle_control_btn();

			tv_sel_list = $('#'+ MOD.current_playlist_id +' .control_panel').find('[onvclick]').filter(function() {
				return $(this).is(':visible');
			});
			tv_cur_pos = 1;
			tv_max_pos = tv_sel_list.length;

			tv_cur_elem = tv_sel_list.eq(tv_cur_pos);

			metro_menu_calc();
			// tv_sel_cur();

			MOD.substrate('list', 'remove');
			MOD.substrate();
		}
	},
	build_playlist: function(id, data) {
		if (!data) { // начальное построение плэйлиста
			data = {};
			data.lang = MOD.get_lang();

			for (var i = 0; i < MOD.data.categories.length; i++) {
				var category = MOD.data.categories[i];
				if (category.id === id) {
					data.title = category.title;
					data.backBtn = 1;
					data.parentId = category.parent ? category.parent : 'MOD';
					data.audio = category.childs.items;
					data.id = id;
					break;
				}
			}

			// MOD.current_playlist = data.audio;
			MOD.render('#' + id, 'mod_playlist', data);
		}
		else { // перестроение плэйлиста при перемешивании (shuffle)
			MOD.render('#' + id, 'mod_audio_list', {audio: data});
		}
	},
	build_categories: function(list, cat) {
		var data = {};
		set_data();

		for (var i = 0; i < list.length; i++) {
			var category = list[i];
			if (category.parent === data.id) data.categories.push(category);
			if (category.childs.type === 'category') MOD.build_categories(category.childs.items, category);
		}

		MOD.render('#' + data.parent, 'mod_category', data);

		function set_data() {
			data.categories = [];
			data.title = cat ? cat.title : getlang('mod_title');
			data.id = cat ? cat.id : cat;

			if (cat) {
				data.parent = cat.parent ? cat.parent : 'MOD';
			}
			else {
				data.parent = null;
			}
		}
	},
	build_preview: function(action) {
		var data = {
			audio: MOD.audio,
			title: (MOD.get_lang())[action]
		};

		MOD.render('#' + MOD.current_playlist_id + ' .preview_audio', 'mod_preview', data);
	},
	build_title: function(action) {
		var title = $('#' + MOD.current_playlist_id + ' #preview_audio_title')[0];
		lang = MOD.get_lang();

		title.innerHTML = lang[action];
	},
	play: function(audio, flag) {
		Media.set({ directType: 'music' });

		if (!audio) {
			audio = MOD.get_audio();
		}

		if (
			MOD.audio &&
			audio.id === MOD.audio.id &&
			flag !== 'init'
		) {
			if (MOD.paused) {
				MOD.resume();
			}
			else {
				MOD.pause();
			}

			MOD.toggle_control_btn();
			return;
		}

		MOD.audio = audio;
		MOD.build_preview('downloading');

		MOD.stop(true).done(function() {
			if (audio.id !== (MOD.get_audio()).id && flag !== 'init') return;

			var ctx = Object.assign(MOD, {
				url: MOD.audio.path,
				mimeType: 'audio/mp3',
				eventListener: tv_samsung_tizen_mark ?
					MOD.event_listener_tizen : MOD.event_listener
			});
			_player_play(ctx);

			set_play_icon();
			MOD.toggle_control_btn(flag);
		});

		function set_play_icon() {
			for (var i = 0; i < MOD.current_playlist.length; i++) {
				var audio = document.getElementById(MOD.current_playlist[i].id);
				audio.querySelector('.listener').classList.remove('player-icon-listener');
			}

			var li = document.getElementById(MOD.audio.id);
			li.querySelector('.listener').classList.add('player-icon-listener');
		}
	},
	get_audio: function() {
		var id = tv_cur_elem[0].id;
		var audio;

		for (var i = 0; i < MOD.current_playlist.length; i++) {
			audio = MOD.current_playlist[i];
			if (id == audio.id) break;
		}

		return audio;
	},
	set_current_playlist: function(id) {
		if (MOD.current_playlist_id !== id) MOD.current_playlist_id = id;
		else return;

		for (var i = 0; i < MOD.data.categories.length; i++) {
			var category = MOD.data.categories[i];
			if (category.id === id) {
				MOD.current_playlist = category.childs.items;
				break;
			}
		}
	},
	pause: function() {
		_player_pause(MOD);
		MOD.paused = true;

		if (MOD.current_block === 'panel') {
			MOD.toggle_control_btn();
			MOD.nav('panel', true);
		}

		MOD.build_title('pause');

	},
	resume: function() {
		_player_resume(MOD);
		MOD.paused = false;

		if (MOD.current_block === 'panel') {
			MOD.toggle_control_btn();
			MOD.nav('panel', true);
		}

		MOD.build_title('playing');

	},
	stop: function(download) {
		var d = $.Deferred();

		if (!download) {
			MOD.build_title('pause');
		}

		clearInterval(MOD.progress_timer);
		MOD.duration = 0;

		var ctx = Object.assign(MOD, {
			eventListener: tv_samsung_tizen_mark ?
				MOD.event_listener_tizen : MOD.event_listener
		});
		_player_destroy(ctx).done(d.resolve);

		return d.promise();
	},
	fwd: function(time) {

		if(!time){
			time = 20000;
		}

		MOD.set_time(time, 'forward');
	},
	rwd: function(time) {

		if(!time){
			time = 20000;
		}

		MOD.set_time(time, 'backward');
	},
	shuffle: function() {
		MOD.current_playlist = MOD.current_playlist.sort(compareRandom);
		MOD.build_playlist(MOD.current_playlist_id + ' #mod_audio_list', MOD.current_playlist);
		MOD.paused = false;

		MOD.play(MOD.current_playlist[0], 'init');
		MOD.nav('panel', true);

		function compareRandom(a, b) {
			return Math.random() - 0.5;
		}

	},
	set_time: function(time, direct){
		var ctx = Object.assign(MOD, {time: time, direct: direct});
		_set_play_position_video(ctx);
	},
	next_audio: function() {
		if (MOD.current_block !== 'list') {
			MOD.nav('list');
		}

		tv_cur_elem = $('#' + MOD.audio.id);
		tv_cur_pos = tv_sel_list.index(tv_cur_elem);

		if ((tv_cur_pos + 1) === tv_max_pos) {
			tv_cur_pos = 0;
			tv_sel_cur();
		}
		else {
			tv_down();
		}

		MOD.play();
		MOD.substrate();
	},
	get_duration: function() {
		var d = $.Deferred();

		_get_duration_video(MOD).done(function(response) {
			MOD.duration = response;
			d.resolve();
		});

		return d.promise();
	},
	time_update: function() {
		_get_play_position_video(MOD)
			.then(
				function(response) {
					var tmp_time = response | 0;

					if (MOD.cur_time != tmp_time) {
						MOD.cur_time = tmp_time;
						MOD.currentTime = tmp_time;

						$('#' + MOD.current_playlist_id + ' .preview_audio .player_timer').html(toHHMMSS((MOD.currentTime / 1000), true));
					}
				},
				function(e) {
					log.add("Error message: " + e.message);
					clearInterval(MOD.progress_timer);
				});
	},
	toggle_control_btn: function(pause) {
		var play_btn = $('#'+ MOD.current_playlist_id +' #audio_play')[0];
		var pause_btn = $('#'+ MOD.current_playlist_id +' #audio_pause')[0];

		if (
			(
				pause_btn.style.display === 'none' &&
				!MOD.paused &&
				tv_cur_elem[0].id == MOD.audio.id
			) ||
			(
				MOD.current_block === 'panel' &&
				!MOD.paused
			) ||
			(
				pause && !MOD.paused
			)
		) {

			pause_btn.style.display = 'block';
			play_btn.style.display = 'none';
		}
		else if (tv_cur_elem[0].id != MOD.audio.id) {
			pause_btn.style.display = 'none';
			play_btn.style.display = 'block';
		}
		else if (MOD.paused) {
			pause_btn.style.display = 'none';
			play_btn.style.display = 'block';
		}
	},
	substrate: function(list, action) {
		tv_cur.style.display = 'none';

		if (typeof action === 'undefined') {
			tv_sel_list.removeClass('substrate');
			tv_cur_elem.addClass('substrate');

			return;
		}
		else if (list === 'list') {
			list = $('#' + MOD.current_playlist_id + ' .content').find('li');
		}
		else if (list === 'panel') {
			list = $('#'+ MOD.current_playlist_id +' .control_panel').find('[onvclick]')/*.filter(function() { return $(this).is(':visible') })*/;
		}

		if (action === 'add') {
			tv_cur_elem.addClass('substrate');
		}
		else if (action === 'remove') {
			list.removeClass('substrate');
		}
	},
	render: function(id, tmp, data) {
		data.lang = MOD.get_lang();

		if (tmp === 'mod_category' && data.backBtn) {
			data.parentId = data.parent;
		}

		var tpl = $.templates({
			markup: templates[tmp],
			allowCode: true
		});
		var html = tpl.render(data);

		var toAppend = document.querySelector(id);
		if (!toAppend) {
			document.getElementById('container').insertAdjacentHTML('beforeend', html);
		}
		else {
			toAppend.innerHTML = '';
			toAppend.insertAdjacentHTML('beforeend', html);
		}
	},
	get_lang: function() {
		if (typeof MOD.lang == 'undefined') {
			MOD.lang = {};

			MOD.lang.back = getlang('mobileAppContent-default-label-back');
			MOD.lang.number = getlang('mod_number');
			MOD.lang.artist = getlang('mod_artist');
			MOD.lang.duration = getlang('mod_duration');
			MOD.lang.title_audio = getlang('mod_title_audio');
			//
			// MOD.lng.listen_radio = getlang('listen_radio');
			// MOD.lng.filtering = getlang('filtering');
			// MOD.lng.by_genre = getlang('by_genre');
			// MOD.lng.all_genres = getlang('all_genres');
			// MOD.lng.radio_list = getlang('radio_list');
			// MOD.lng.genres = getlang('genres');
			// MOD.lng.radio_stop_playing = getlang('radio_stop_playing');
			//
			MOD.lang.downloading = getlang('downloading');
			MOD.lang.playing = getlang('playing');
			MOD.lang.pause = getlang('pause');
			MOD.lang.error = getlang('bill_error');
		}

		return MOD.lang;
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
				if (MOD.current_block !== 'list') {

				}
				else if (MOD.current_block === 'list' && tv_cur_pos === 0) {
					return MOD.nav('panel');
				}

				if (MOD.current_block === 'list') {
					tv_up();
					MOD.substrate();
					MOD.toggle_control_btn();
				}
				break;
			case tv_keys.DOWN:
				if (MOD.current_block === 'list') {
					tv_down();
					MOD.substrate();
					MOD.toggle_control_btn();
				}
				else if (MOD.current_block === 'panel') {
					MOD.nav('list');
				}

				break;
			case tv_keys.LEFT:
				if (MOD.current_block === 'panel') {
					tv_left();
					MOD.substrate();
				}
				else if (!MOD.paused && MOD.current_block === 'list') {
					MOD.rwd();
				}

				break;
			case tv_keys.RIGHT:
				if (MOD.current_block === 'panel') {
					tv_right();
					MOD.substrate();
				}
				if (!MOD.paused && MOD.current_block === 'list') {
					MOD.fwd();
				}

				break;
			case tv_keys.ENTER:
				if (MOD.current_block === 'list') {
					MOD.play();
				}
				else if (MOD.current_block === 'panel') {
					tv_ok();
				}

				break;
			case tv_keys.PLAY:
				if (MOD.paused) {
					MOD.resume();
				}
				else {
					MOD.pause();
				}
				break;
			case tv_keys.PAUSE:
				if (!MOD.paused) {
					MOD.pause();
				}
				break;
			case tv_keys.FAST_FORWARD:
				if (!MOD.paused) {
					MOD.fwd();
				}
				break;
			case tv_keys.REWIND:
				if (!MOD.paused) {
					MOD.rwd();
				}
				break;
			case tv_keys.EXIT:
			case tv_keys.BACK:
				navigate('#MOD');

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
				break;
			case tv_keys.BLUE:
				navigate('#language_select');

				break;

			case tv_keys.PORTAL:
			case tv_keys.GUIDE:
			case tv_keys.Q_MENU:
			case tv_keys.MENU:
			case tv_keys.HOME:
				navigate('#menu');

				break;

			case tv_keys.STOP:
				break;

			default:
				//tv_log('code ' + code);
				break;

		}
	},
	event_listener: function (event, data) {

		if (tv_lg_mark) {
			event = event.eventType;

			switch (event) {
				case 'play_start':
					if (!MOD.duration) {
						_playing_start();
					}
					break;
				case 'play_end':
					_play_end();
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
					if (!MOD.duration) {
						_playing_start();
					}
					break;
				case 8:
					_play_end();
					break;
				case 6:
				case 1:
					_error_start();
					break;
				case 14:
					MOD.currentTime = data;
			}
		}
		else if (tv_mag_mark) {
			switch (event) {
				case '4':
					if (!MOD.duration) {
						_playing_start();
					}
					break;
				case '1':
					_play_end();
					break;
				case '5':
					_error_start();
					break;
			}
		}
		else { // desktop
			switch (event.type) {
				case 'canplay':
					if (!MOD.duration) {
						_playing_start();
					}
					break;
				case 'ended':
					_play_end();
					break;
				case 'abort':
					_error_start();
					break;
			}
		}

		function _playing_start() {
			MOD.get_duration().done(function() {
				MOD.progress_timer = setInterval(MOD.time_update, 1000);

				MOD.playing = true;
				MOD.build_title('playing');

			});
		}
		function _error_start() {
			MOD.playing = false;
			MOD.build_title('error');
		}
		function _play_end() {
			clearInterval(MOD.progress_timer);
			MOD.next_audio();
		}
	},
	event_listener_tizen: {
		onbufferingstart: function() {
			// console.log('Buffering start');
		},
		onbufferingprogress: function(percent) {
			// console.log("Buffering progress data : " +   percent);
		},
		onbufferingcomplete: function() {
			// console.log("Buffering complete.");
			if (MOD.duration) return;

			MOD.get_duration().done(function() {
				MOD.progress_timer = setInterval(MOD.time_update, 1000);

				MOD.playing = true;
				MOD.build_title('playing');

			});
		},
		oncurrentplaytime: function(currentTime) {
			MOD.currentTime = currentTime;
			if (!MOD.duration) return;

			var different = MOD.duration - MOD.currentTime;
			if (different < 1000 && different !== 0) _play_end();

			function _play_end() {
				clearInterval(MOD.progress_timer);
				MOD.next_audio();
			}
		},
		onevent: function(eventType, eventData) {
			console.log("Event type error : " + eventType + ", eventData: " + eventData);
		},
		onerror: function(errorData) {
			// console.log("Event type error : " + errorData);
			MOD.playing = false;
			MOD.build_title('error');
		},
		onsubtitlechange: function(duration, text, data3, data4)   {

		},
		ondrmevent: function(drmEvent, drmData) {
			// console.log("DRM callback: " + drmEvent + ", data: " + drmData);
		}
	}
};
