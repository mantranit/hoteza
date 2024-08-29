//"mozilla/5.0 (linux; bravia 2015 build/nrd91n.s34) applewebkit/537.36 (khtml, like gecko) chrome/53.0.2785.143 safari/537.36 opr/40.0.2207.0 omi/4.9.0.59.e9103576.125 sonycebrowser/1.0 (kdl-43w808c; ctv/pkg5.433.0183eua; rus)"

var storage = window.localStorage;

function _tv_vendor_init() {
	var d = $.Deferred();

	$(document.body).prepend('<object id="sonytv" type="application/x-multicast-video" style="position:absolute;width:1280px;height:720px;display:none;"></object>');

	//Стоп канала при загрузке системы
	_tv_channel_stop();

	_tv_get_info.init();

	sony.tv.systemevents.addListener('powerStatusChanged', __powerStatusChanged);
	d.resolve();
	return d.promise();
}

function _tv_channel_show (id){
	var obj = $id('sonytv');

	var channels = getChannels();

	var channel;
	if(typeof(id) == 'object'){
		channel = id;
	}else{
		channel = channels[id|0];
	}

	if(!channel){
		log.add('TV: ERROR! Tried to show nonexistent channel: ' + id);
		return false;
	}

	// порядок событий 2(3) -> 4 -> show0 -> 5
	obj.onshow = function(result){
		//console.log('result ' + result);
	};

	obj.onstatechange = function(state){
		// STATE_CLOSE: 0
		// STATE_OPEN: 1
		// STATE_PREPARE_TO_PLAY: 2
		// STATE_SRC_CHANGING: 3
		// STATE_WAIT_FOR_DATA: 4
		// STATE_PLAYING: 5
		// STATE_CLOSING: 6
		//console.log('state ' + state);
	};

	if(channel['type'] == 'rf'){
		log.add('TV: unsupported channel type RF!!!');
	}else if(channel['type'] == 'ip'){
		var url;
		if(channel['broadcastType'] == 'RTP') {
			url = 'rtp://';
		}else{
			url = 'udp://';
		}

		url = url + channel['protocol'].trim() + ':' + (channel['port']||1234);
		var tmp = obj.show(url);
		//console.log(url + ' show is ' + tmp);

		//Support for mosaic handlers
		document.dispatchEvent(new Event('channel_changed'));
	}
}

//TODO: вынести obj
function _tv_channel_stop(){
	var obj = $id('sonytv');
	if(obj.close){
		obj.close();
	}
}

function _tv_bg_prepare(){
	var obj = $id('sonytv');
	$(obj).show();
	if(obj.open() != 0){
		log.add('TV: Sony object open failed');
		return false;
	}else{
		obj.opened = true;
		setVideoSize();
		//tv_log('Success');
	}
}
function _tv_bg_restore(){
	var obj = $id('sonytv');
	if(obj && obj.opened){
		obj.close();
		$(obj).hide();
		obj.opened = false;
	}else{
		log.add('TV: Sony object close failed');
	}
}

$(HotezaTV).one('splashshow', function(){
	tv_keys = {
		EXIT: 27,
		DOWN: 40,
		UP: 38,
		LEFT: 37,
		RIGHT: 39,
		ENTER: 13,
		BACK: 461,
		MENU: 122,
		HOME: 110,
		RED: 403,
		GREEN: 404,
		YELLOW: 405,
		BLUE: 406,
		CH_UP: 427,
		CH_DOWN: 428,
		VOL_UP: 43,
		VOL_DOWN: 43,
		MUTE: 192,
		NUM_0: 48,
		NUM_1: 49,
		NUM_2: 50,
		NUM_3: 51,
		NUM_4: 52,
		NUM_5: 53,
		NUM_6: 54,
		NUM_7: 55,
		NUM_8: 56,
		NUM_9: 57,
		// VOD кнопка(и)
		PLAY: 415,
		PAUSE: 463,
		STOP: 413,
		BACKWARD: 412,
		FORWARD: 417,
	};
});

function _setHandlerKeydown() {
	document.removeEventListener('keydown', tv_keydown,false);
	document.addEventListener('keydown', tv_keydown,false);
}

function _tv_get_network_info(){
	var d = $.Deferred();

	//TODO: network type
	$.post({
		url: 'http://127.0.0.1/sony/system',
		data: JSON.stringify({
			'method': 'getNetworkSettings',
			'version': '1.0',
			'params': [{'netif': ''}],
			'id': 1
		})
	})
	.done(function(data){
		if(data.result && data.result.length && data.result[0].length){
			var tmp_mac = data.result[0][0].hwAddr;
			var tmp_ip = data.result[0][0].ipAddrV4;
			d.resolve({'ip': tmp_ip, 'mac': tmp_mac});
		}else{
			log.add('ERROR: failed to get MAC and IP');
		}
	})
	.fail(function(err){
		log.add('getNetworkSettings: error ' + err.statusText);
		d.reject(err.statusText);
	});

	return d.promise();
}

var _tv_get_info = {
	_model: '',
	_firmware: '',
	_serial_number: '',
	model: function(){
		if (this._model) return this._model;
	},
	serial_number: function(){
		if (this._serial_number) return this._serial_number;
	},
	firmware: function(){
		if (this._firmware) return this._firmware;
	},
	init: function(){
		var fw = ua.match(/ctv\/pkg(.+)\./);
		if(fw && fw[1]){
			_tv_get_info._firmware = fw[1];
		}else{
			_tv_get_info._firmware = 'unknown';
		}

		$.post({
			url: 'http://127.0.0.1/sony/system',
			data: JSON.stringify({
				'method': 'getSystemInformation',
				'version': '1.0',
				'params': [],
				'id': 33
			})
		})
		.done(function(data){
			if(data && data.result){
				_tv_get_info._model = data.result[0].model;
				_tv_get_info._serial_number = data.result[0].serial;
			}else{
				_tv_get_info._model = 'fail';
				_tv_get_info._serial_number = 'fail';
			}
		})
		.fail(function(err){
			log.add('INIT: ERROR: ' + err.statusText);
			_tv_get_info._model = 'fail';
			_tv_get_info._serial_number = 'fail';
		});

	}
};

function _setVideoSize(coords){
	var coef = 1.5;
	//TODO: сделать нормальное задание коэффициента
	if($('html').hasClass('hd720upscaled')) {
		coef = 1;
	}

	$('#sonytv').css({
		width: coords.width * coef + 'px',
		height: coords.height * coef + 'px',
		top: coords.top * coef + 'px',
		left: coords.left * coef + 'px'
	});
}

function _tv_reboot(){
	$.post({
		url: 'http://127.0.0.1/sony/system',
		data: JSON.stringify({
			'method': 'requestReboot',
			'version': '1.0',
			'params': ['1.0'],
			'id': 1
		})
	})
	.done(function(d){
		log.add('REBOOT SUCCESS ????');
	})
	.fail(function(err){
		log.add('REBOOT FAILED: ' + err.statusText);
	});
}

function _tv_poweroff(){
	$.post({
		url: 'http://127.0.0.1/sony/system',
		data: JSON.stringify({
			'method': 'setPowerStatus',
			'version': '1.0',
			'params': [{'status': false}],
			'id': 1
		})
	})
	.done(function(){
		log.add('POWEROFF SUCCESS ????');
	})
	.fail(function(err){
		log.add('POWEROFF FAILED: ' + err.statusText);
	});
}

function _add_listener_TV(plugin) {
	document.addEventListener('channel_changed', plugin.event_listener, false);
}
function _remove_listener_TV(plugin) {
	document.removeEventListener('channel_changed', plugin.event_listener, false);
}

function _tv_sources(show_all){

	if(fullscreen === true){
		tv_mode();
	}

	$.post({
		url: 'http://127.0.0.1/sony/avContent',
		data: JSON.stringify({
			'method': 'getCurrentExternalInputsStatus',
			'version': '1.0',
			'params': [],
			'id': 103
		})
	})
	.done(function(data){
		if(data.error){
			log.add('SOURCES: error - ' + data.error);
		}else{

			//TODO: неправильное построение, переделать
			var tmp_arr;
			if(show_all){
				tmp_arr = data.result[0];
			}else{
				tmp_arr = config['tv']['allowed_sources']||[];
			}
			var tmp = '';
			for (var i = 0; i < tmp_arr.length; i++) {
				tmp += '<div id="tv_source_' + tmp_arr[i].title + '_0" onvclick="_tv_source([\''+tmp_arr[i].title+'\',0])" style="margin:0px;padding:10px">' + tmp_arr[i].title + '</div>';
			}
			UI.build_page({
				id: 'sources_list',
				title: getlang('tv_sources'),
				content: '<div style="margin:0px 20px;">' + tmp + '</div>',
				back: {
					href: '#sources_page'
				}
			});
			navigate('#sources_list');

		}
	})
	.fail(function(err){
		log.add('SOURCES: error - ' + err.statusText);
	});

	return true;
}


//--- html5 player video
var PLAYER_EVENTS = [
	'abort',
	'canplay',
	'emptied',
	'ended',
	'pause',
	'play',
	'timeupdate'
];

function _player_start(ctx) {
	if (PLAYER_INIT) return;

	ctx.started = true;

	if (typeof ctx.mimeType === 'undefined' || ctx.mimeType === 'video/mp4') {
		create_video();
	}
	else if (ctx.mimeType === 'audio/mp3') {
		create_audio();
	}

	_add_listener_player(ctx);

	ctx.media.load();
	PLAYER_INIT = true;

	function create_video() {
		ctx.media = document.createElement('video');

		ctx.media.setAttribute('src', ctx.url);
		ctx.media.setAttribute('type', 'video/mp4');
		ctx.media.playsinline = true;
		ctx.media.autoplay = true;
		if (ctx.loop) {
			ctx.media.loop = true;
		}

		ctx.media.classList.add('player');

		ctx.container.classList.add('video');
		ctx.container.appendChild(ctx.media);
	}
	function create_audio() {
		ctx.media = document.createElement('audio');
		ctx.media.setAttribute('src', ctx.url);
		ctx.media.autoplay = true;
		ctx.media.setAttribute('type', 'audio/mp3');

		ctx.container = document.body;
		ctx.container.appendChild(ctx.media);
	}
}
function _player_play(ctx) {
	ctx.url = encodeString(ctx.url);
	ctx.url = setLocationURL(ctx.url);

	if (!PLAYER_INIT) _player_start(ctx);

	ctx.media.addEventListener('canplay', ctx.media.play);

}
function _player_stop(ctx) {
	var d = $.Deferred();

	d.resolve();

	return d.promise();
}
function _player_pause(ctx) {
	ctx.media.pause();
	ctx.paused = true;
}
function _player_resume(ctx) {
	ctx.media.play();
	ctx.paused = false;
}
function _player_resize(ctx, coords) {
	var coef = 1.5;
	//TODO: сделать нормальное задание коэффициента
	if($('html').hasClass('hd720upscaled')) {
		coef = 1;
	}

	ctx.coords = coords ? coords : {
		top: 0,
		left: 0,
		width: 1280,
		height: 720
	};

	$(ctx.media).css({
		position: 'absolute',
		width: ctx.coords.width * coef + 'px',
		height: ctx.coords.height * coef + 'px',
		top: ctx.coords.top * coef + 'px',
		left: ctx.coords.left * coef + 'px'
	});
}
function _player_destroy(ctx) {
	var d = $.Deferred();

	if (ctx.container && ctx.media) {
		ctx.container.removeChild(ctx.media);
		ctx.container.classList.remove('video');

		_remove_listener_player(ctx);

		ctx.container = null;
		ctx.media = null;
	}

	PLAYER_INIT = false;

	d.resolve();

	return d.promise();
}
function _player_shutdown() {
	var d = $.Deferred();
	d.resolve();
	return d.promise();
}

function _get_duration_video(player) {
	var d = $.Deferred();
	d.resolve(player.media.duration*1000);
	return d.promise();
}
function _get_play_position_video(player) {
	var d = $.Deferred();
	d.resolve(player.media.currentTime*1000);
	return d.promise();
}
function _set_play_position_video(player) {
	if (player.direct === 'forward') {
		player.media.currentTime = (player.currentTime + player.time)/1000;
	}
	else player.media.currentTime = (player.currentTime - player.time)/1000;
}

function _tv_get_sync_audio() {
	var d = $.Deferred();

	d.resolve(null);

	return d.promise();
}
function _tv_change_audio() {

}
function _get_media_audio() {
	var d = $.Deferred();

	d.resolve(null);

	return d.promise();
}

function _add_listener_player(player) {
	if (!player.eventListener) return;

	for (var i = 0; i < PLAYER_EVENTS.length; i++) {
		player.media.addEventListener(PLAYER_EVENTS[i], player.eventListener);
	}
}
function _remove_listener_player(player) {
	if (!player.eventListener) return;

	for (var i = 0; i < PLAYER_EVENTS.length; i++) {
		player.media.removeEventListener(PLAYER_EVENTS[i], player.eventListener);
	}
}
//--------------------------------------------------



//заглушки
function _tv_get_audio(){}
function _tv_get_cur_audio(){}
function _tv_get_sync_cur_audio(){}
function _tv_set_audio(){}
function _get_media_subtitles(){}
function _set_media_audio(){}
function _set_media_subtitle(){}
function _switch_subtitle(){}
function _get_duration_video(){}
function _get_play_position_video(){}
function _set_play_position_video(){}
function _tv_set_volume(value){}
function _tv_volup(){}
function _tv_voldown(){}
function _tv_change_mute(){}


//service commands
function __get_commands(service){
	if(!service){
		service = 'system';
	}
	$.post({
		url: 'http://127.0.0.1/sony/' + service,
		data: JSON.stringify({
			'method': 'getVersions',
			'version': '1.0',
			'params': [],
			'id': 103
		})
	})
	.done(function(d){
		if(d.error){
			console.log('Error 1: ', d.error);
		}else{
			for(var key in d.result[0]){
var tmp_i = 5;
//---------
				$.post({
					url: 'http://127.0.0.1/sony/' + service,
					data: JSON.stringify({
						'method': 'getMethodTypes',
						'version': '1.0',
						'params': [d.result[0][key].toString()],
						'id': tmp_i++
					})
				})
				.done(function(d){
					if(d.error){
						console.log('Error 2: ', d.error);
					}else{
						for(var key in d.results){
							console.log(d.results[key]);
						}
					}
				})
				.fail(function(d){
					console.log('Error 0: ', d);
				});
//--------

			}
		}
	})
	.fail(function(d){
		console.log('Error 0: ', d);
	});
}
// TODO: переписать (реализовать)
function _get_power_state() {
	var d = $.Deferred();
	$.post({
		url: 'http://127.0.0.1/sony/system',
		data: JSON.stringify({
			'method': 'getPowerStatus',
			'version': '1.0',
			'params': [],
			'id': 33
		})
	})
	.done(function(data){
		if(data && data.result){
			d.resolve(data.result[0].status != 'standby');
		}else{
			d.reject(JSON.stringify(data));
		}
	})
	.fail(function(err){
		log_add('POWER: ERROR: ' + err.statusText);
		d.reject('fail');
	});
	return d.promise();
}
function __powerStatusChanged(d){
	console.log('power status changed', d);
}


function __tv_set_window_size() {
	var d = $.Deferred();
	if($(window).width() == 1920){
		d.resolve('hd720upscaled');
	}else{
		d.resolve('hd720');
	}
	return d.promise();
}

//VK_UNDEFINED, VK_CANCEL, VK_BACK_SPACE, VK_TAB, VK_CLEAR, VK_ENTER, VK_SHIFT, VK_CTRL, VK_ALT, VK_PAUSE, VK_CAPS_LOCK, VK_KANA, VK_FINAL, VK_KANJI, VK_ESCAPE, VK_CONVERT, VK_NONCONVERT, VK_ACCEPT, VK_MODE_CHANGE, VK_SPACE, VK_PAGE_UP, VK_PAGE_DOWN, VK_END, VK_HOME, VK_LEFT, VK_UP, VK_RIGHT, VK_DOWN, VK_PRINT_SCREEN, VK_INSERT, VK_DELETE, VK_HELP, VK_0, VK_1, VK_2, VK_3, VK_4, VK_5, VK_6, VK_7, VK_8, VK_9, VK_A, VK_B, VK_C, VK_D, VK_E, VK_F, VK_G, VK_H, VK_I, VK_J, VK_K, VK_L, VK_M, VK_N, VK_O, VK_P, VK_Q, VK_R, VK_S, VK_T, VK_U, VK_V, VK_W, VK_X, VK_Y, VK_Z, VK_META, VK_NUMPAD0, VK_NUMPAD1, VK_NUMPAD2, VK_NUMPAD3, VK_NUMPAD4, VK_NUMPAD5, VK_NUMPAD6, VK_NUMPAD7, VK_NUMPAD8, VK_NUMPAD9, VK_MULTIPLY, VK_ADD, VK_SEPARATOR, VK_SUBTRACT, VK_DECIMAL, VK_DIVIDE, VK_F1, VK_F2, VK_F3, VK_F4, VK_F5, VK_F6, VK_F7, VK_F8, VK_F9, VK_F10, VK_F11, VK_F12, VK_NUM_LOCK, VK_SCROLL_LOCK, VK_OEM_SEMICOLON, VK_OEM_EQUALS, VK_OEM_COMMA, VK_OEM_MINUS, VK_OEM_PERIOD, VK_OEM_SLASH, VK_OEM_LEFT_QUOTE, VK_OEM_OPEN_BRACKET, VK_OEM_BACKSLASH, VK_OEM_CLOSE_BRACKET, VK_OEM_RIGHT_QUOTE, VK_RED, VK_GREEN, VK_YELLOW, VK_BLUE, VK_GREY, VK_BROWN, VK_POWER, VK_DIMMER, VK_WINK, VK_REWIND, VK_STOP, VK_EJECT_TOGGLE, VK_PLAY, VK_RECORD, VK_FAST_FWD, VK_PLAY_SPEED_UP, VK_PLAY_SPEED_DOWN, VK_PLAY_SPEED_RESET, VK_RECORD_SPEED_NEXT, VK_GO_TO_START, VK_GO_TO_END, VK_TRACK_PREV, VK_TRACK_NEXT, VK_RANDOM_TOGGLE, VK_CHANNEL_UP, VK_CHANNEL_DOWN, VK_STORE_FAVORITE_0, VK_STORE_FAVORITE_1, VK_STORE_FAVORITE_2, VK_STORE_FAVORITE_3, VK_RECALL_FAVORITE_0, VK_RECALL_FAVORITE_1, VK_RECALL_FAVORITE_2, VK_RECALL_FAVORITE_3, VK_CLEAR_FAVORITE_0, VK_CLEAR_FAVORITE_1, VK_CLEAR_FAVORITE_2, VK_CLEAR_FAVORITE_3, VK_SCAN_CHANNELS_TOGGLE, VK_PINP_TOGGLE, VK_SPLIT_SCREEN_TOGGLE, VK_DISPLAY_SWAP, VK_SCREEN_MODE_NEXT, VK_VIDEO_MODE_NEXT, VK_VOLUME_UP, VK_VOLUME_DOWN, VK_MUTE, VK_SURROUND_MODE_NEXT, VK_BALANCE_RIGHT, VK_BALANCE_LEFT, VK_FADER_FRONT, VK_FADER_REAR, VK_BASS_BOOST_UP, VK_BASS_BOOST_DOWN, VK_INFO, VK_GUIDE, VK_TELETEXT, VK_SUBTITLE, VK_BACK, VK_MENU, VK_PLAY_PAUSE, VK_CLOSED_CAPTIONS, VK_CSP_KEY_1, VK_CSP_KEY_2, VK_CSP_KEY_3, 
//VK_CSP_KEY_4, VK_CSP_KEY_5, VK_BROWSER_SEARCH, VK_TV_NETWORK, VK_TV_TERRESTRIAL_DIGITAL, VK_TV_SATELLITE_BS, VK_TV_SATELLITE_CS, VK_TV_SATELLITE_SERVICE, VK_TV_DATA_SERVICE, VK_TV_SATELLITE, VK_TV_RADIO_SERVICE, VK_TV_TELETEXT, VK_BUTTON_1, VK_11, VK_12, VK_MEDIA_AUDIO_TRACK, VK_HOME_BUTTON, VK_NEXT, VK_PREV, VK_EXIT, VK_CH_UP, VK_CH_DOWN, VK_DIGITAL, VK_DATA_BROADCAST, VK_DIGITAL_ANALOG, VK_BS_CS, VK_BS, VK_CS, VK_SATELLITE, VK_LAST_CH, VK_AUDIO_CHANGE, VK_PERIOD, VK_RADIO, VK_REC, VK_10KEY