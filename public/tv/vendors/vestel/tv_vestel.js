//mozilla/5.0 (linux ) applewebkit/537.36 (khtml, like gecko) chrome/67.0.3396.99 safari/537.36 opr/46.0.2207.0 omi/4.13.5.431.sierra.165 model/vestel-mb230 vstvb mb200 hbbtv/1.5.1 (+drm; hotel; mb230; 7.37.0.0; ; _tv_nt72671_2019;) smarttva/3.0.0 ; mac: 90:98:77:87:82:f9 ; channellist/v1
var storage = window.localStorage;
var VB;

function _tv_vendor_init(){
	var d = $.Deferred();

	//$(document.body).prepend('<object id="videoPlayer" type="video/mp4" style="position: absolute; display: none;"></object>');
	$(document.body).prepend('<object id="videoBroadcast" type="video/broadcast" style="position: absolute; left:0px; top:0px; width:100%; height:100%; display: none;"></object>');
	VB = document.getElementById('videoBroadcast');

	//не работает в выключенном режиме
//	VB.bindToCurrentChannel();
//	VB.stop();

	VB.getChannelConfig().addEventListener('onChannelListUpdate', function(){console.log('CHANNELLIST UPDATED');});
	VB.addEventListener('ChannelChangeError', function(event){console.log('Tune error');console.log(event.errorState, event.channel);});
	VB.addEventListener('ChannelChangeSucceeded', function(chan){console.log('Tune success');console.log(chan);});
	VB.addEventListener('PlayStateChange', function(event){console.log('PlayStateChange');console.log(event.state, event.error);});

// channel change errors
//Value	Description
// 0	channel not supported by tuner.
// 1	cannot tune to given transport stream (e.g. no signal)
// 2	tuner locked by other object.
// 3	parental lock on channel.
// 4	encrypted channel, key/module missing.
// 5	unknown channel (e.g. can’t resolve DVB or ISDB triplet).
// 6	channel switch interrupted (e.g. because another channel switch was activated before the previous one completed).
// 7	channel cannot be changed, because it is currently being recorded.
// 8	cannot resolve URI of referenced IP channel.
// 9	insufficient bandwidth.
// 10	channel cannot be changed by nextChannel()/prevChannel() methods either because the OITF does not maintain a favourites or channel list or because the video/broadcast object is in the Unrealized state.
// 11	insufficient resources are available to present the given channel (e.g. a lack of available codec resources).
// 12	specified channel not found in transport stream.
// 100	unidentified error.

	__close_extra_windows();

	_tv_get_info.init();

	__tv_virtual_standby_init();

	InputManager.addEventListener('currentAVInputChangeEvent', __source_changed);

	__handle_all_keys();

	if(('tv_key_source' in window) && tv_key_source == 'off') {
		log.add('SOURCE KEY OFF');
		__addKeyItem(444, 'SOURCE');
	} else {
		__removeKeyItem(444, 'SOURCE');
		log.add('SOURCE KEY ON');
	}

	if(('tv_key_menu' in window) && tv_key_menu == 'off') {
		log.add('MENU KEY OFF');
		_add_key_menu();
	} else {
		_remove_key_menu();
		log.add('MENU KEY ON');
	}

	// document.addEventListener("keydown", tv_keydown, false);

	$(HotezaTV).one('final', function() {

		//FullHD обработка
		ServiceCodes.registerListener('1920', function() {
			__get_resolution()
				.done(function(d){
					var cmd;
					if(d == '1920x1080'){
						cmd = 'SETCONTENTRES 0';
					}else{
						cmd = 'SETCONTENTRES 1';
					}
					__tv_command(cmd)
					.done(function(data){
						if(data.match('SUCCESS')){
							if(d == '1920x1080'){
								custom_alert('HD SET');
							}else{
								custom_alert('FULL HD SET');
							}
							setTimeout(tv_reboot, 2000);
						}else{
							custom_alert('Resolution change fail');
						}
					})
					.fail(function(f){
						custom_alert('Resolution chenge error');
					});
				})
				.fail(function(){
					custom_alert('Failed to get resolution');
				});
		});
	});
	d.resolve();
	return d.promise();
}

function __tv_command(cmd){
	var d = $.Deferred();
	
	Rs232LanCommand.addEventListener('executionResultEvent', __result);
	function __result(data){
		Rs232LanCommand.removeEventListener('executionResultEvent', __result);
		d.resolve(data);
	}

	Rs232LanCommand.execute(cmd);

	setTimeout(function(){
		d.reject('timeout');
	}, 1000);

	return d.promise();

}

$(HotezaTV).one('splashshow', function() {
	tv_keys = {
		OK : 13,
		ENTER : 13,

		UP : 38,
		DOWN : 40,
		RIGHT : 39,
		LEFT : 37,

		GREEN : 404,
		RED : 403,
		YELLOW : 405,
		BLUE : 406,

		MENU: 677,
		PLAY : 415,
		PAUSE : 19,
		FW : 417,
		BW : 412,
		STOP : 413,
		LANGUAGE : 312,
		HOME : 407,
		HELP : 156,
		BACK : 461,
		ALARM : 309,

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

		CH_UP: 427,
		CH_DOWN: 428,
		INPUT: 444,
		TV: 679,

		VOL_UP: 447, 
		VOL_DOWN: 448,
		MUTE: 449,

		NUMBERS: 664,
		COLORS: 665
	};
});
//MENU: 677
function _tv_get_network_info(){
	var d = $.Deferred();
	var out = {};

	__tv_command('GETNETWORKTYPE')
	.done(function(data){
		data = data.match(/the network type is (.+)/);
		if(data){
			var mac_type = 0;
			if(data[1] == 'wired'){
				out.type = 'ETH';
			}else if(data[1] == 'wired'){
				out.type = 'WIFI';
				mac_type = 1;
			}else{
				out.type = 'UNKNOWN';
			}

			out.mac = MacId.getMacId(mac_type);

			__tv_command('get_IP_address')
			.done(function(data){
				data = data.match(/IPaddr: (.+)/);
				if(data){
					out.ip = data[1];
					d.resolve(out);
				}else{
					d.reject();
				}
			})
			.fail(function(f){
				d.reject();
			});
		

		}else{
			d.reject();
		}
	})
	.fail(function(f){
		d.reject();
	});

	return d.promise();
}

function _setHandlerKeydown() {
	document.removeEventListener('keydown', tv_keydown, false);
	document.addEventListener('keydown', tv_keydown, false);
}

function __handle_all_keys(){
	var keys = [];
	for(var i=0; i<1000; i++){
		keys.push(i);
	}
	//remove power key
	keys.splice(keys.indexOf(409),1);
	ApplicationManager.getCSPWindow().keySet.setValue(2047, keys);
}

function __close_extra_windows(){
	var windows = ApplicationManager.getWindows();
	var whitelist = ['UI','DEFAULT_CSP','HBBTV','TVSTORE'];
	for(var i = (windows.length-1); i>=0; i--){
		if(whitelist.indexOf(windows[i].name) == -1){
			ApplicationManager.destroyWindow(windows[i]);
		}
	}
}

function _tv_channel_show(tune, coords) {
	var channels = (typeof (_tv_channels) !== 'undefined' && tv_cur_block !== 'tv_welcome') ? _tv_channels : tv_channels;
	var channel, id;

	if(typeof(tune) === 'object'){ //NOT SUPPORTED
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

	var ctx = {
		url: 'udp://' + channel.protocol + ':' + channel.port,
		container: document.body,
	};

	id = __find_channel_index(channel);
	if(id != -1){
		VB.setChannel(VB.getChannelConfig().channelList[id], true);
		setVideoSize(coords);
	}

//	_player_play(ctx);
//	_player_resize(ctx, coords);
}
function _tv_channel_stop() {
//	_player_stop();
	VB.stop();
}
function __find_channel_index(channel){
	for(var index in tv_channels){
		if(tv_channels[index].id == channel.id){
			return index;
		}
	}
	return -1;
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
	// ctx.media.play(1);

	PLAYER_INIT = true;

	function create_video() {
		ctx.media = document.createElement('video');
		// ctx.media = document.createElement('object');

		ctx.media.setAttribute('src', ctx.url);
		// ctx.media.data = ctx.url;
		// ctx.media.style.width = '100%';
		// ctx.media.style.height = '100%';

		ctx.media.setAttribute('type', 'video/mp4');
		ctx.media.setAttribute('id', 'videoPlayer');
		ctx.media.playsinline = true;
		ctx.media.autoplay = true;
		if (ctx.loop) {
			ctx.media.loop = true; //
		}

		ctx.media.classList.add('player');

		ctx.container.classList.add('video');
		ctx.container.appendChild(ctx.media);

		// if (ctx.eventListener) {
		// 	VideoBroadcast.onPlayStateChange = ctx.eventListener;
		// }
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
	
	// ctx.media.data = ctx.url;
	// ctx.media.play(1);
}
function _player_stop(ctx) {
	var d = $.Deferred();

	d.resolve();

	// ctx.media.stop();

	return d.promise();
}
function _player_pause(ctx) {
	ctx.media.pause();
	//ctx.media.play(0);

	ctx.paused = true;
}
function _player_resume(ctx) {
	ctx.media.play();
	// ctx.media.play(1);
	ctx.paused = false;
}
function _player_resize(ctx) {console.log(ctx.coords.left);
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

function _tv_bg_prepare() {

}
function _tv_bg_restore() {

}
function _add_listener_TV() {

}
function _remove_listener_TV() {

}
function _get_duration_video(player) {
	var d = $.Deferred();
	d.resolve(player.media.duration*1000);
	return d.promise();
}

function _get_media_audio() {
	var d = $.Deferred();

	d.resolve(null);

	return d.promise();
}
function _tv_get_sync_audio() {
	var d = $.Deferred();

	d.resolve(null);

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

var _tv_get_info = {
	_model: null,
	_firmware: null,
	_serial_number: null,
	model: function () {
		if (this._model) return this._model;
		this._model = 'MB230';
		return this._model;
	},
	firmware: function () {
		if (this._firmware) return this._firmware;
		this._firmware = '';
		__tv_command('GETSWVERSION')
		.done(function(data){
			data = data.match(/SW_VER: (.+)/);
			if(data){
				_tv_get_info._firmware = data[1];
			}else{
				_tv_get_info._firmware = 'error';
			}
		})
		.fail(function(f){
			_tv_get_info._firmware = 'error';
		});
		return false;
	},
	serial_number_: function(){
		if (this._serial_number) return this._serial_number;
		this._serial_number = '';
		__tv_command('GETSERIALNO')
		.done(function(data){
			data = data.match(/Serial no: (.+)/);
			if(data){
				_tv_get_info._serial_number = data[1];
			}else{
				_tv_get_info._serial_number = 'error';
			}
		})
		.fail(function(f){
			_tv_get_info._serial_number = 'error';
		});
		return false;
	},
	init: function(){
		this.firmware();
	}
};

function _tv_get_volume(){
	var d = $.Deferred();
	d.resolve(SoundSettings.getVolumeLevel());
	return d.promise();
}

function _tv_set_volume(value){
	var d = $.Deferred();
	d.resolve(SoundSettings.setVolumeLevel(value));
	return d.promise();
}
function _tv_mute(){
	__tv_command('SETMUTE')
	.done(function(data){
		data = data.match(/MUTE (.+)/);
		if(data){
			//mute set
		}else{
			log.add('VOLUME: set mute failed');
		}
	})
	.fail(function(f){
		log.add('VOLUME: set mute command failed');
	});
}
function _tv_get_mute(){
	var d = $.Deferred();
	__tv_command('GETMUTE')
	.done(function(data){
		data = data.match(/MUTE (.+)/);
		if(data){
			if(data[1] == 'ON'){
				d.resolve(true);
			}else{
				d.resolve(false);
			}
		}else{
			d.reject('VOLUME: failed to get MUTE status');
		}
	})
	.fail(function(f){
		d.reject('VOLUME: get mute command failed');
	});
	return d.promise();
}

function _tv_change_mute(){}

function _setVideoSize(coords){
	InputManager.setVideoWindow(
		coords.left * 1.5,
		coords.top * 1.5,
		coords.width * 1.5,
		coords.height * 1.5
	);

}

function __tv_set_window_size() {
	var d = $.Deferred();
	var WW = document.documentElement.clientWidth;
	if(WW == 1920){
		d.resolve('hd720upscaled');
	}else{
		d.resolve('hd720');
	}
	return d.promise();
}

function _tv_miracast(){
	var inputs = InputManager.getAVInputs();
	var miracast_input = false;
	for(var i=0; i<inputs.length; i++){
		if(inputs[i].type == 'Wireless Display'){
			miracast_input = inputs[i];
		}
	}

	if(!miracast_input){
		return false;
	}
	InputManager.selectSource(miracast_input);

	//Rs232LanCommand.execute('SELECTSOURCE 21');

	////	Rs232LanCommand.execute('SHW 1');
	
	//!!!ApplicationManager.getCSPWindow().hide();
	var defaultWindow = ApplicationManager.getWindowByName('DEFAULT_CSP');
	defaultWindow.hide();
}

function _tv_usb(){
	//TODO: check USB inserted
	Rs232LanCommand.execute('KEY media_browser');
	ApplicationManager.destroyWindow(ApplicationManager.getCSPWindow());
}

function __get_resolution(){
	var d = $.Deferred();
	
	__tv_command('GETCONTENTRES')
		.done(function(res){
			var tmp = res.match(/content_resolution is (.+)/);
			if(tmp){
				d.resolve(tmp[1]);
			}else{
				d.reject(res);
			}
		})
		.fail(function(e){
			d.reject(e);
		});
	return d.promise();
}

function _tv_reboot() {
	__tv_command('RST')
		.done(function(){
			log.add('REBOOT SUCCESS ????');
		})
		.fail(function(f) {
			log.add('REBOOT Failed ' + f);
		});
}

function _get_power_state(){
	var d = $.Deferred();
	
	// __tv_command('GETSTANDBY')
	// .done(function(data){
	// 	data = data.match(/Standby (.+)/);
	// 	if(data){
	// 		d.resolve(data[1] != 'on');
	// 	}else{
	// 		d.reject();
	// 	}
	// })
	// .fail(function(f){
	// 	d.reject();
	// });
	
	d.resolve(!StandbyController.isDeviceInActiveStandby());

	return d.promise();
}

function _tv_poweroff(){
	if(PowerSettings.isActiveStandbyEnabled()){
		StandbyController.enterActiveStandby();
	}else{
		__tv_command('KEY power');
	}
}

function _tv_poweron(){
	if(PowerSettings.isActiveStandbyEnabled()){
		StandbyController.quitActiveStandby();
	}else{
		__tv_command('KEY power');
	}
}

function __tv_virtual_standby_init(){
	//Реализация события переключения ON/OFF поллингом состояния
	var __power_state = StandbyController.isDeviceInActiveStandby();

	$(window).on('power_mode_changed', function(){
		if(StandbyController.isDeviceInActiveStandby()){
			tv_virtual_standby_off();
		}else{
			tv_virtual_standby_on();
		}
	});

	setInterval(__tv_power_monitor, 2000);

	function __tv_power_monitor(){
		var s = StandbyController.isDeviceInActiveStandby();
		if(__power_state != s){
			__power_state = s;
			console.log('power_mode_changed');
			$(window).trigger('power_mode_changed');
		}
	}
}

function _tv_checkout(){
	//TODO: preserve all storage?
	__tv_command('CLEARPRIVATEDATA')
	.done(function(data){
		setTimeout(function(){
			storage.setItem('room', tv_room, true);
		}, 1000);
	})
	.fail(function(f){
		log.add('Checkout error');
	});
}

//SETSOURCE HDMI1 1
//SETSOURCE HDMI2 1
var Vestel_sources = {
	'TV': ['TV'],
	'HDMI': ['HDMI1', 'HDMI2'],
	'AV': ['BACK AV']
};
function _tv_sources(show_all){
	if(fullscreen === true){
		tv_mode();
	}

	var tmp_arr;
	if(show_all){
		tmp_arr = [['HDMI', 0], ['HDMI', 1], 'AV'];
	}else{
		tmp_arr = config['tv']['allowed_sources']||[];
	}
	var tmp = '';
	for (var i = 0; i < tmp_arr.length; i++) {
		if(typeof(tmp_arr[i]) === 'string'){
			tmp += '' +
				'<div id="tv_source_' + tmp_arr[i] + '_0" ' +
				'onvclick="_tv_source([\''+tmp_arr[i]+'\',0])" ' +
				'style="margin:0px;padding:10px">' + tmp_arr[i] + '</div>';
		}else{
			tmp += '' +
				'<div id="tv_source_' + tmp_arr[i][0] + '_' + tmp_arr[i][1] + '" ' +
				'onvclick="_tv_source([\''+tmp_arr[i][0]+'\','+tmp_arr[i][1]+'])" ' +
				'style="margin:0px;padding:10px">' + tmp_arr[i][0] + (tmp_arr[i][1] + 1) + '</div>';
		}
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

function _tv_source(source){
	var tmp = Vestel_sources[source[0]][source[1]];
	if(tmp){
		var inputs = InputManager.getAVInputs();
		var ext_source = false;
		for(var i=0; i<inputs.length; i++){
			if(inputs[i].name == tmp){
				ext_source = inputs[i];
			}
		}
		if(!ext_source){
			return false;
		}
		if(tmp == 'TV'){
			InputManager.stopCurrentSource();
		}
		InputManager.selectSource(ext_source);
	}else{
		console.log('BAD SOURCE');
	}
}

function __source_changed(data){
	switch(data){
		case InputManager.SourceChanged: //7
			console.log('SOURCE CHANGED TO ' + InputManager.getCurrentAVInput().name);
			if(InputManager.getCurrentAVInput().name == 'TV'){
				tv_keydown_override = null;
				document.body.style.backgroundColor = '';
				$('#container,#tv_cur,#tv_fullscreen_overlay').fadeIn(1000);
				tv_sel_block();
			}else{
				tv_keydown_override = _tv_keydown_external;
				document.body.style.backgroundColor = 'transparent';
				$('#container,#tv_cur,#tv_fullscreen_overlay').fadeOut(1000);
			}
			break;
		default:
			console.log('Source Event, DATA: ' + data);
			break;
	}
}

function _add_key_menu() {
	__addKeyItem(677);
}
function _remove_key_menu() {
	__removeKeyItem(677);
}
function _add_volume_control(){
	//Hoteza Volume Control Only
}
function _remove_volume_control(){
	//Hoteza Volume Control Only
}

function __addKeyItem(key, name) {
	var out = [];
	var keys = ApplicationManager.getCSPWindow().keySet.other_keys;
	for(var i=0; i<keys.length; i++){
		out.push(keys[i]);
	}
	out.push(key);
	ApplicationManager.getCSPWindow().keySet.setValue(2047, out);
}
function __removeKeyItem(key, name){
	var out = [];
	var keys = ApplicationManager.getCSPWindow().keySet.other_keys;
	for(var i=0; i<keys.length; i++){
		if(keys[i] != key){
			out.push(keys[i]);
		}
	}
	ApplicationManager.getCSPWindow().keySet.setValue(2047, out);
}