var storage = window.localStorage,
	tv_keys,
	ctx_channel = {};

function _tv_vendor_init() {
	var d = $.Deferred();
	
	$(HotezaTV).one('splashshow', function () {

		tv_keys = {
      MENU: 27, // Escape
      EXIT: 8, // backspace
      DOWN: 40,
      UP: 38,
      LEFT: 37,
      RIGHT: 39,
      ENTER: 13,
      BACK: 8, // backspace
      RED: 81, // button q
      GREEN: 87, // button w
      YELLOW: 69, // button e
      BLUE: 82, // button r
      CH_UP: "S38", // shift + up
      CH_DOWN: "S40", // shift + down
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
      INPUT: "S90", // shift + z
      STOP: "S86", // shift + v
      PLAY: "S67", // shift + c
      PAUSE: "S88", // shift + x
      FAST_FORWARD: "S39", // shift + ->
      REWIND: "S37", // shift + <-

      VOL_UP: 187, //=
      VOL_DOWN: 189, //-
      MUTE: "S187", //+

      NUMBERS: 144,
    };
	});

	$(HotezaTV).one('final', function () {
		$(document).one('click', _switchOnSoundVideo);

		$('#tv_fullscreen_overlay').on('mousedown', function(e){
			if(e.which>1 && e.ctrlKey !== true){
				$('#tv_fullscreen_overlay').css('z-index', '-1');
				setTimeout(function(){
					$('#tv_fullscreen_overlay').css('z-index', '');
				}, 5000);
			}
		});

		//TODO: добавить в LG или вынести из вендора
		if(isset('config.tv.mouse_control')){
			log.add('Mouse control enabled');
			document.addEventListener('mousemove', function(e){
				var arr = document.elementsFromPoint(e.clientX, e.clientY);
				for(var i in tv_sel_list){

					if(arr.indexOf(tv_sel_list[i]) != -1){
						if(i != tv_cur_pos){
							tv_cur_pos = i;
							tv_sel_cur();
						}
					}
				}
			});
			document.addEventListener('click', function(e){
				var arr = document.elementsFromPoint(e.clientX, e.clientY);

				var back_arr = ['tv_fullscreen_btn_back', 'tv_mosaic_btn_back', 'tv_mosaic_preview_btn_back'];
				for(var o in back_arr){
					if(arr.indexOf($id(back_arr[o])) != -1){
						tv_keydown({keyCode:tv_keys.BACK});
						return true;
					}
				}

				for(var i in tv_sel_list){
					if(arr.indexOf(tv_sel_list[i]) != -1){
						tv_cur_pos = i;
						tv_sel_cur();
						tv_keydown({keyCode:tv_keys.ENTER});
					}
				}
			});
			document.addEventListener('mousewheel', function(event){
				if(event.wheelDelta > 0){
					tv_keydown({keyCode:tv_keys.UP});
				}else{
					tv_keydown({keyCode:tv_keys.DOWN});
				}
			});
		}
	});

	window.onresize = __tv_set_window_size;

	importScript('j/libs/bowser-es5.min.js');

	css_append('tv/vendors/desktop/desktop.css', 'vendor_css');

	//Эмуляция Virtual Standby (ON only)
	$(HotezaTV).one('splashshow', function(){
		document.onvisibilitychange = function(d){
			_get_power_state().done(function(state){
				if(state){
					tv_virtual_standby_on();
					document.onvisibilitychange = null;
				}else{
					//При текущей реализации на видимости страницы - не нужно переходить в Standby режим
				}
			});
		};
	});

	d.resolve();
	return d.promise();
}

var PLAYER_EVENTS = [
	'abort',
	'canplay',
	'emptied',
	'ended',
	'pause',
	'play',
	'timeupdate'
];

function _setHandlerKeydown() {
	document.removeEventListener('keydown', tv_keydown, false);
	document.addEventListener('keydown', tv_keydown, false);
	document.addEventListener('keydown', __tv_help_shower, false);
}
function _add_volume_control(){
	//Hoteza Volume Control Only
}
function _remove_volume_control(){
	//Hoteza Volume Control Only
}

function __tv_help_shower(e){
	if(e.keyCode == 112){
		console.log('Show Help');
		e.preventDefault();
	}
}

var videoMuted = true;
function _switchOnSoundVideo() {
	videoMuted = false;

	var video = document.querySelector('video');
	if (!video) {
		return false;
	}

	video.muted = videoMuted;
}

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
		ctx.media.muted = videoMuted;
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
	ctx.coords = coords ? coords : {
		top: 0,
		left: 0,
		width: 1280,
		height: 720
	};

	$(ctx.media).css({
		position: 'absolute',
		width: ctx.coords.width + 'px',
		height: ctx.coords.height + 'px',
		top: ctx.coords.top + 'px',
		left: ctx.coords.left + 'px'
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
	try {
		d.resolve(player.media.currentTime*1000);
	}
	catch (e) {
		d.reject(e);
	}
	return d.promise();
}
function _set_play_position_video(player) {
	if (player.direct === 'forward') {
		player.media.currentTime = (player.currentTime + player.time)/1000;
	}
	else player.media.currentTime = (player.currentTime - player.time)/1000;
}

function _set_media_subtitle() {

}
function _switch_subtitle() {

}
function _set_media_audio() {

}

function _tv_get_sync_audio() {
	var d = $.Deferred();

	d.resolve(null);

	return d.promise();
}
function _tv_set_audio(index) {
	console.log('Audio set to index: ' + index);
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
function _add_listener_TV(plugin) {
	// document.addEventListener("channel_changed", plugin.event_listener, false);
}
function _remove_listener_TV(plugin) {
	var ctx = Object.assign(ctx_channel, {
		container: document.body,
		eventListener: tv_channellist_type === 'mosaic' ? tv_mosaic.event_listener : null
	});

	_remove_listener_player(ctx);
}

function _tv_channel_show(tune) {
	var channels = getChannels();
	var channel, id;

	if(typeof(tune) === 'object'){
		channel = tune;
		id = 0;
	}else{
		id = tune|0;
		channel = channels[id];
	}

	if(!channel){
		log.add('TV: ERROR! Tried to show nonexistent channel: ' + id);
		return false;
	}

	//Channel Background
	if(channel.background){
		if(!$id('tv_channel_background')){
			$(document.body).prepend('<iframe id="tv_channel_background" style="position:absolute;top:0px;left:0px;width:' + ww + 'px;height:' + wh + 'px;border:0;"></iframe>');
		}
		$id('tv_channel_background').src = channel.background;
	}else{
		if($id('tv_channel_background')){
			$('#tv_channel_background').remove();
		}
	}
	//===

	_player_destroy(ctx_channel).done(function () {
		var ctx = Object.assign(ctx_channel, {
			url: channel.protocol,
			container: document.body,
			loop: true,
			eventListener: tv_channellist_type === 'mosaic' ? tv_mosaic.event_listener : null
		});
		_player_play(ctx);
		_player_resize(ctx);
	});

}
function _tv_channel_stop() {
	//Channel Background
	if($id('tv_channel_background')){
		$('#tv_channel_background').remove();
	}
	//===

	_player_destroy(ctx_channel);
}
function _setVideoSize(coords) {
	_player_resize(ctx_channel, coords);
}

function _tv_bg_prepare() {

}
function _tv_bg_restore() {

}

function _tv_poweroff() {
	console.log('Сработал power off');
}

function _tv_get_network_info(){
	var d = $.Deferred();
	var tmp = storage.getItem('desktop_mac');
	if(!tmp){
		storage.setItem('desktop_mac', '_' + generate_uuid());
	}
	d.resolve({'ip': '127.0.0.1', 'mac': storage.getItem('desktop_mac'), 'type': 'UNKNOWN'});
	return d.promise();
}

function __tv_set_window_size() {
	var d = $.Deferred();
	var winHeight = document.documentElement.clientHeight, winWidth = document.documentElement.clientWidth;
	var zoom = 1;

	if(winWidth == 1920){
		zoom = Math.min(winHeight / wh, winWidth / ww);
		d.resolve('hd720upscaled');
	}else{
		zoom = Math.min((winHeight < wh ? winHeight / wh : 1), (winWidth < ww ? winWidth / ww : 1)) ;
		d.resolve('hd720');
	}

	if (zoom == 1) {
		appUseZoom = false;
		document.documentElement.style.zoom = '';
	}else{
		appUseZoom = zoom;
		document.documentElement.style.zoom = zoom;
	}
	return d.promise();
}

var _desktop_volume = 5, _desktop_mute = false;
function _tv_get_volume(value) {
	var d = $.Deferred();
	d.resolve(_desktop_volume);
	return d.promise();
}
function _tv_set_volume(value) {
	var d = $.Deferred();
	_desktop_volume = parseInt(value).constrain(0, 99);
	_desktop_mute = false;
	d.resolve();
	return d.promise();
}
function _tv_mute(){
	_desktop_mute = !_desktop_mute;
}
function _tv_get_mute(){
	var d = $.Deferred();
	d.resolve(_desktop_mute);
	return d.promise();
}
function _tv_change_mute(){
}

var _tv_get_info = {
	_browser: null,
	_parse: function(){
		if(window.bowser){
			if(!this._browser){
				this._browser = bowser.parse(window.navigator.userAgent);
			}
			this._model = this._browser.os.name + ' ' + (this._browser.os.versionName || this._browser.os.version || '');
			this._firmware = this._browser.browser.name + ' ' + this._browser.browser.version;
		}
	},
	_model: 'PC',
	_firmware: 'Browser',
	model: function () {
		this._parse();
		return this._model;
	},
	firmware: function () {
		this._parse();
		return this._firmware;
	}
};

function _get_media_subtitles(VOD) {
	var d = $.Deferred(),
		subtitles_arr = VOD.structureAssoc.films[VOD.id].subtitles,
		subtitle_obj = {},
		subtitle,
		subtitle_code;

	if (!subtitles_arr || subtitles_arr.length === 0) d.resolve(null);

	for (var i = 0; i < subtitles_arr.length; i++) {
		subtitle = subtitles_arr[i];
		subtitle_code = Object.keys(subtitle)[0];
		subtitle_obj[subtitle_code] = subtitle[subtitle_code];
	}

	d.resolve(subtitle_obj);

	return d.promise();
}


function _tv_bt_on(){
	console.log('BT on');
}
function _tv_bt_off(){
	console.log('BT off');
}
function _get_power_state() {
	var d = $.Deferred();
	if(document.visibilityState == 'visible'){
		d.resolve(true);
	}else{
		d.resolve(false);
	}
	return d.promise();
}

function _tv_get_preloaded_app_list(){
	log.add('NO APPS ON DESKTOP');
	console.log('NO APPS ON DESKTOP');

	//return $.Deferred().reject('No apps on desktop');
	return $.Deferred().resolve([]);
}

// //выбор элемента под крусором (неправильно работает при смещении контента (надо учитывать смещение))
// document.body.addEventListener('mousemove', function(e){
// 	tv_sel_list.each(function(index){
// 		var data = $.data(this);
// 		if(	e.pageX > data.left && 
// 			e.pageX < data.left + data.width &&
// 			e.pageY > data.top &&
// 			e.pageY < data.top + data.height
// 		){
// 			tv_cur_pos = index;
// 		}
// 	}); 
// 	tv_sel_cur();
// })
//
// //перемотка колёсиком
// document.body.addEventListener('wheel', function(e){if(e.deltaY>0){tv_down();}else{tv_up();}});
// //нажатие по клику
// document.body.addEventListener('click', function(e){e.preventDefault();console.log(e.which);if(e.which == 1){tv_ok();}else{console.log('unknown click');}}, false);
// //переход назад по правому клику
// document.body.addEventListener('contextmenu', function(e){e.preventDefault();tv_back();}, false);

var _Media = {
	play: function(param){
		var d = $.Deferred();
		
		if(param.type){
			setTimeout(function(){d.resolve();}, 3000);
		}else{
			setTimeout(function(){d.reject();}, 1000);
		}
		
		return d.promise();
	},
	stop: function(){
		var d = $.Deferred();
		
		d.resolve();
		
		return d.promise();
	},
	pause: function(){
		var d = $.Deferred();
		
		setTimeout(d.resolve, 500);
		
		return d.promise();
	},
	resume: function(){
		var d = $.Deferred();
		
		setTimeout(d.resolve, 500);
		
		return d.promise();
	}
};

function _tv_sources(){
	custom_alert('Display sources list');
}
function _tv_source(param){
	if(typeof(param) != 'string'){
		param = param[0] + (param[1] + 1);
	}
	custom_alert('Change source to ' + param.toUpperCase());
}
function _tv_miracast(){
	custom_alert('Turn on MiraCast/ScreenShare');
}
function _tv_usb(){
	custom_alert('Open USB Browser');
}