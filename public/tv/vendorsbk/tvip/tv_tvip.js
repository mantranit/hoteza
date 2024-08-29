var tmp = ua.match(/applewebkit\/(\d+)/);
if(tmp && ((tmp[1]|0) < 535)){
	log.add('TVIP: ES6 shims');
	$(document.body).append('<script type="text/javascript" src="j/libs/es6-shim.min.js"></script>');
}

var storage = localStorage;

function save_storage(){}

function _tv_vendor_init() {
	var d = $.Deferred();

	//Перехват служебных кнопок
	TvipStb.setPassKeyKeyboard(true);
	TvipStb.setPassKeySysInfo(true);
	_add_key_menu();

	//Поддержка Virtual Standby
	__tv_virtual_standby_init();

	//Отдельный обработчик кнопки POWER
	document.addEventListener('keydown', function(event){
		var code = getKeyCode(event);
		switch (code) {
			case tv_keys.POWER:
				_tv_power_switch();
				break;
			default:
				break;
		}
	}, false);

	//Реагирование на CEC
	if(isset('config.tv.hacks.tvip_handle_cec')){
		TvipEvent.onSystemEvent = __cec_handler;
	}

	//Принудительное включение приставки при установленном флаге hack
	if(isset('config.tv.hacks.tvip_always_on')){
		tv_power(true);
	}

	$(HotezaTV).one('splashshow', function(){
		tv_keys = {
			EXIT: 27,
			DOWN: 40,
			UP: 38,
			LEFT: 37,
			RIGHT: 39,
			ENTER: 13,
			BACK: 8,
			SETTINGS: 120,
			MENU: 122,
			RED: 112,
			GREEN: 113,
			YELLOW: 114,
			BLUE: 115,
			CH_UP: 9,
			CH_DOWN: 'S9',
			VOL_UP: 107,
			VOL_DOWN: 109,
			MUTE: 192,
			STOP: 83,
			PLAY: 82,
			FAST_FORWARD: 70,
			REWIND: 66,
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
			POWER: 85
		};
	});
	d.resolve();
	return d.promise();
}

function _tv_bg_prepare(){
	document.body.style.background = 'none';
}
function _tv_bg_restore(){
	if (tv_channellist_type != 'mosaic') {
		document.body.style.background = '';
	}
}

function _setHandlerKeydown() {
	document.removeEventListener('keydown', tv_keydown,false);
	document.addEventListener('keydown', tv_keydown,false);
}
function _add_key_menu(){
	TvipStb.setPassKeySettings(true);
	TvipStb.setPassKeyMenu(true);
}
function _remove_key_menu(){
	TvipStb.setPassKeySettings(false);
	TvipStb.setPassKeyMenu(false);
}
function _add_volume_control(){
	//Hoteza Volume Control Only
}
function _remove_volume_control(){
	//Hoteza Volume Control Only
}

function _player_start(ctx) {
	gSTB.InitPlayer();
	ctx.media = {};
	stbEvent.onEvent = ctx.eventListener;
	PLAYER_INIT = true;
}
function _player_play(ctx) {
	ctx.url = encodeString(ctx.url);
	ctx.url = setLocationURL(ctx.url);

	if (!PLAYER_INIT) {
		_player_start(ctx);
	}

	ctx.started = true;

	gSTB.Play('auto ' + ctx.url);
}
function _player_resize(ctx) {
	ctx = ctx ? ctx : {};
	ctx.coords = ctx.coords ? ctx.coords : {
		top: 0,
		left: 0,
		width: 1280,
		height: 720
	};

	gSTB.SetViewport(ctx.coords.width*1.5, ctx.coords.height*1.5, ctx.coords.left*1.5, ctx.coords.top*1.5);
}
function _player_pause(ctx) {
	gSTB.Pause();
	ctx.paused = true;
}
function _player_resume(ctx) {
	gSTB.Continue();
	ctx.paused = false;
}
function _player_destroy() {
	var d = $.Deferred();

	gSTB.Stop();
	stbEvent.onEvent = function() {};
	PLAYER_INIT = false;

	d.resolve();

	return d.promise();
}
function _player_shutdown() {
	var d = $.Deferred();
	d.resolve();
	return d.promise();
}
function _get_duration_video() {
	var d = $.Deferred();

	d.resolve(gSTB.GetMediaLenEx());

	return d.promise();
}
function _get_play_position_video() {
	var d = $.Deferred();

	d.resolve(gSTB.GetPosTimeEx());

	return d.promise();
}
function _set_play_position_video(player) {
	var d = $.Deferred();
	var settableTime;

	if (player.direct == 'forward') {
		_get_duration_video()
			.then(function(duration) {
				settableTime = parseInt(player.currentTime) + parseInt(player.time);

				if (settableTime < duration) {
					gSTB.SetPosTimeEx(settableTime);
				}

				d.resolve();
			});
	}
	else if (player.direct == 'backward') {
		settableTime = parseInt(player.currentTime) - parseInt(player.time);

		if (settableTime > 0) {
			gSTB.SetPosTimeEx(settableTime);
		}
		else {
			gSTB.SetPosTimeEx(0);
		}

		d.resolve();
	}

	return d.promise();
}

function _tv_get_sync_audio() {
	var dictionary = {
			'abk': 'ab','ava': 'av','ave': 'ae','aze': 'az','aym': 'ay','aka': 'ak','sqi': 'sq','amh': 'am','eng': 'en','ara': 'ar','asm': 'as','aar': 'aa','afr': 'af','bam': 'bm','eus': 'eu','bak': 'ba','bel': 'be','ben': 'bn','mya': 'my','bis': 'bi','bul': 'bg','bos': 'bs','bre': 'br','cym': 'cy','hun': 'hu','ven': 've','vol': 'vo','wol': 'wo','vie': 'vi','glg': 'gl','lug': 'lg','her': 'hz','kal': 'kl','ell': 'el','kat': 'ka','grn': 'gn','guj': 'gu','gla': 'gd','dan': 'da','dzo': 'dz','div': 'dv','zul': 'zu','heb': 'he','ibo': 'ig','yid': 'yi','ind': 'id','ina': 'ia','ile': 'ie','iku': 'iu','ipk': 'ik','gle': 'ga','isl': 'is','spa': 'es','ita': 'it','yor': 'yo','kaz': 'kk','kan': 'kn','kau': 'kr','cat': 'ca','kas': 'ks','que': 'qu','kik': 'ki','kua': 'kj','kir': 'ky','zho': 'zh','kom': 'kv','kon': 'kg','kor': 'ko','cor': 'kw','cos': 'co','xho': 'xh','kur': 'ku','khm': 'km','lao': 'lo','lat': 'la','lav': 'lv','lin': 'ln','lit': 'lt','lub': 'lu','ltz': 'lb','mkd': 'mk','mlg': 'mg','msa': 'ms','mal': 'ml','mlt': 'mt','mri': 'mi','mar': 'mr','mah': 'mh','mon': 'mn','glv': 'gv','nav': 'nv','nau': 'na','nde': 'nd','nbl': 'nr','ndo': 'ng','deu': 'de','nep': 'ne','nld': 'nl','nor': 'no','nya': 'ny','nno': 'nn','oji': 'oj','oci': 'oc','ori': 'or','orm': 'om','oss': 'os','pli': 'pi','pan': 'pa','fas': 'fa','pol': 'pl','por': 'pt','pus': 'ps','roh': 'rm','kin': 'rw','ron': 'ro','run': 'rn','rus': 'ru','smo': 'sm','sag': 'sg','san': 'sa','srd': 'sc','ssw': 'ss','srp': 'sr','sin': 'si','snd': 'sd','slk': 'sk','slv': 'sl','som': 'so','sot': 'st','swa': 'sw','sun': 'su','tgl': 'tl','tgk': 'tg','tha': 'th','tah': 'ty','tam': 'ta','tat': 'tt','twi': 'tw','tel': 'te','bod': 'bo','tir': 'ti','ton': 'to','tsn': 'tn','tso': 'ts','tur': 'tr','tuk': 'tk','uzb': 'uz','uig': 'ug','ukr': 'uk','urd': 'ur','fao': 'fo','fij': 'fj','fil': 'fl','fin': 'fi','fra': 'fr','fry': 'fy','ful': 'ff','hau': 'ha','hin': 'hi','hmo': 'ho','hrv': 'hr','chu': 'cu','cha': 'ch','che': 'ce','ces': 'cs','zha': 'za','chv': 'cv','swe': 'sv','sna': 'sn','ewe': 'ee','epo': 'eo','est': 'et','jav': 'jv','jpn': 'ja',
			'pri': 'xx', 'sec': 'xx'
		},
		listLangs = [],
		d = $.Deferred();

	var langs = gSTB.GetAudioPIDs();
	try {
		// eslint-disable-next-line no-eval
		langs = eval(langs);
	}
	catch (e) {
		log.add('Audio error: ' + e.name + ', ' + e.message);
		d.resolve(null);
	}

	if (langs.length > 1) {
		for (var i = 0; i < langs.length; i++) {
			listLangs.push(dictionary[langs[i].lang[0]]);
		}

		d.resolve(listLangs);
	}
	else {
		d.resolve(null);
	}

	return d.promise();
}
function _tv_set_audio(index) {
	var langs = gSTB.GetAudioPIDs();
	try {
		// eslint-disable-next-line no-eval
		langs = eval(langs);
	}
	catch (e) {
		log.add('Audio error: ' + e.name + ', ' + e.message);
	}

	var settableAudio = langs[index];
	gSTB.SetAudioPID(parseInt(settableAudio.pid));
}

function _setVideoSize(coords) {
	if (coords && !coords.coords) {
		coords.coords = coords;
	}
	_player_resize(coords);
}

function _tv_channel_show (id){
	var channels = getChannels();

	var channel;
	if(typeof(id) == 'object'){
		channel = id;
	}else{
		channel = channels[id|0];
	}

	var url = 'udp://' + channel.protocol.trim() + ':' + (channel.port||1234);

	gSTB.InitPlayer();
	gSTB.Play(url);

	//TODO: сделать нормально
	if(tv_cur_block == 'tv_channellist'){
//		tv_channellist_fade();
	}
}

function _tv_channel_stop(){
	gSTB.Stop();
}
function __tv_change_volume(direct){
	var change = direct === 'up' ?
		5 : -5;
	value = parseInt(TvipPlayer.getVolume()) + change;
	value = value.constrain(0, 100);
	tv_set_volume(value);
}
function _tv_set_volume(value){
	tv_mute(false);
	TvipPlayer.setVolume(value);
}
function _tv_get_volume(){
	var d = $.Deferred();
	d.resolve(TvipPlayer.getVolume());
	return d.promise();
}
function _tv_mute(){
	TvipPlayer.setMute(!TvipPlayer.getMute());
}
function _tv_get_mute(){
	var d = $.Deferred();
	d.resolve(TvipPlayer.getMute());
	return d.promise();
}
function _tv_change_mute() {}

function _tv_get_sync_cur_audio() {
	var d = $.Deferred();

	d.resolve(null);

	return d.promise();
}

function _tv_get_network_info(){
	var d = $.Deferred();
	var out = {};

	var tmp_interface = TvipStb.getNetworkDefaultRouteConfig();
	tmp_interface = tmp_interface.interface;
	
	if(tmp_interface.indexOf('eth') != -1){
		out.type = 'ETH';
	}else if(tmp_interface.indexOf('wlan') != -1){
		out.type = 'WIFI';
	}else{
		out.type = 'UNKNOWN';
	}

	var tmp_info = TvipStb.getNetworkInterfaceStatus(tmp_interface);

	out.mac = tmp_info.mac.toLowerCase();
	out.ip = tmp_info.ipaddress;
	
	d.resolve(out);
	return d.promise();
}

function _add_listener_TV(plugin) {
	plugin.detach_listener = stbEvent.onEvent ? stbEvent.onEvent : null;
	stbEvent.onEvent = plugin.event_listener;
}
function _remove_listener_TV(plugin) {
	stbEvent.onEvent = plugin.detach_listener ? plugin.detach_listener : null;
	plugin.detach_listener = null;
}

var _tv_get_info = {
	_model: null,
	_firmware: null,
	model: function () {
		if (this._model) {
			return this._model;
		}
		this._model = TvipStb.getDeviceId();
		return this._model;
	},
	firmware: function () {
		if (this._firmware) {
			return this._firmware;
		}
		this._firmware = TvipStb.getSoftwareVersion();
		return this._firmware;
	}
};

function _tv_poweron() {
	TvipStb.setStandBy(false);
}
function _tv_poweroff() {
	TvipStb.setStandBy(true);
}
function _tv_reboot() {
	TvipStb.rebootSystem();
}

function _get_power_state() {
	var d = $.Deferred();
	var state = !TvipStb.getStandBy();
	d.resolve(state);

	return d.promise();
}

function _tv_power_switch(){
	if(isset('config.tv.hacks.tvip_handle_power_button')){
		_get_power_state().done(function (state) {
			if(state){
				_tv_poweroff();
			} else {
				_tv_poweron();
			}
		});
	}
}

function __cec_handler(event){
	switch(event){
		case 'cec_sleep':
			//TODO: возможно приставка сама реагирует на CEC
			_tv_poweroff();
			break;
		case 'cec_wake':
			_tv_poweron();
			break;
		default:
			break;
	}
}

function __tv_virtual_standby_init(){
	//Реализация события переключения ON/OFF поллингом состояния
	var __power_state = TvipStb.getStandBy();

	$(window).on('power_mode_changed', function(){
		if(TvipStb.getStandBy()){
			tv_virtual_standby_off();
		}else{
			tv_virtual_standby_on();
		}
	});

	setInterval(__tv_power_monitor, 2000);

	function __tv_power_monitor(){
		var s = TvipStb.getStandBy();
		if(__power_state != s){
			__power_state = s;
			console.log('power_mode_changed');
			$(window).trigger('power_mode_changed');
		}
	}
}

function _tv_get_preloaded_app_list(){
	var d = $.Deferred();
	
	d.resolve([{id: 'youtube', name: 'YouTube'}]);
	
	return d.promise();
}

function _tv_preloaded_app(app){
	log.add('APPS: launching ' + app);
	TvipStb.execSystemUri(app);
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