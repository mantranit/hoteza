var tmp = ua.match(/applewebkit\/(\d+)/);
if(tmp && ((tmp[1]|0) < 535)){
	log.add('MAG: ES6 shims');
	$(document.body).append('<script type="text/javascript" src="j/libs/es6-shim.min.js"></script>');
}

function _tv_vendor_init(){
	//TODO: консолидировать
	var d = $.Deferred();

	//Отдельный обработчик кнопок громкости
	document.addEventListener('keydown', function(event){
		var code = getKeyCode(event);
		switch (code) {
			case 107: //VOLUP
				__tv_change_volume('up');
				break;
			case 109: //VOLDOWN
				__tv_change_volume('down');
				break;
			default:
				console.log(code);
				break;
		}
	}, false);

	$(HotezaTV).one('splashshow', function(){
		tv_keys = {
			EXIT: 27,
			DOWN: 40,
			UP: 38,
			LEFT: 37,
			RIGHT: 39,
			ENTER: 13,
			BACK: 8568,
			MENU: 122,
			RED: 112,
			GREEN: 113,
			YELLOW: 114,
			BLUE: 115,
			CH_UP: 9,
			CH_DOWN: 'S9',
			VOL_UP: 43,
			VOL_DOWN: 43,
			STOP: 83,
			PLAY: 82,
			FAST_FORWARD: 70,
			REWIND: 66,
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
		};
	});

	d.resolve();
	return d.promise();
}

var stb = gSTB;
stb.SetTopWin(0);

var stbEvent = {
	onEvent : function(data){},
	event : 0
};

var storage = {};

try{
	var storage_text = stb.ReadCFG();

	try{
		storage = JSON.parse(''+storage_text)||{};
	}catch(e){
		storage = {};
		tv_log('Storage parse error');
	}

}catch(e){
	$(document.body).html('<span style="color:White;">Filesystem error</span>');
}

storage.setItem = function(item, val){
	storage[item] = val;
	save_storage();
	return true;
};
storage.removeItem = function(item){
	delete storage[item];
	save_storage();
	return true;
};
storage.getItem = function(item){
	return storage[item]||null;
};

function save_storage(){
	//TODO: через stbStorage
	stb.WriteCFG(JSON.stringify(storage));
}

function _tv_bg_prepare(){
	$(document.body).get(0).style['background'] = 'none';
}
function _tv_bg_restore(){
	if (tv_channellist_type != 'mosaic') {
		$(document.body).get(0).style['background'] = '';
	}
}

function _setHandlerKeydown() {
	document.removeEventListener('keydown', tv_keydown,false);
	document.addEventListener('keydown', tv_keydown,false);
}

function _player_start(ctx) {
	stb.InitPlayer();
	ctx.media = {};
	stbEvent.onEvent = ctx.eventListener;
	PLAYER_INIT = true;
}
function _player_play(ctx) {
	ctx.url = encodeString(ctx.url);
	ctx.url = setLocationURL(ctx.url);

	if (!PLAYER_INIT) _player_start(ctx);

	ctx.started = true;

	stb.Play('auto ' + ctx.url);

	if (ctx.loop) {
		stb.SetLoop(1);
	}
	else {
		stb.SetLoop(0);
	}
}
function _player_resize(ctx) {
	ctx.coords = ctx.coords ? ctx.coords : {
		top: 0,
		left: 0,
		width: 1280,
		height: 720
	};

	stb.SetViewport(ctx.coords.width*1.5, ctx.coords.height*1.5, ctx.coords.left*1.5, ctx.coords.top*1.5);
}
function _player_pause(ctx) {
	stb.Pause();
	ctx.paused = true;
}
function _player_resume(ctx) {
	stb.Continue();
	ctx.paused = false;
}
function _player_destroy() {
	var d = $.Deferred();

	stb.Stop();
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

	d.resolve(stb.GetMediaLenEx());

	return d.promise();
}
function _get_play_position_video() {
	var d = $.Deferred();

	d.resolve(stb.GetPosTimeEx());

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
					stb.SetPosTimeEx(settableTime);
				}

				d.resolve();
			});
	}
	else if (player.direct == 'backward') {
		settableTime = parseInt(player.currentTime) - parseInt(player.time);

		if (settableTime > 0) {
			stb.SetPosTimeEx(settableTime);
		}
		else {
			stb.SetPosTimeEx(0);
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

	var langs = stb.GetAudioPIDs();
	try {
		langs = eval(langs);
	}
	catch (e) {
		log.add('Audio error: ' + e.name + ', ' + e.message);
		d.resolve(null);
	}

	if (langs.length > 1) {
		for (var i = 0; i < langs.length; i++) {
			if(dictionary[langs[i].lang[0]]){
				listLangs.push(dictionary[langs[i].lang[0]]);
			}else{
				listLangs.push(langs[i].lang[0]);
			}
		}

		d.resolve(listLangs);
	}
	else {
		d.resolve(null);
	}

	return d.promise();
}
function _tv_set_audio(index) {
	var langs = stb.GetAudioPIDs();
	try {
		langs = eval(langs);
	}
	catch (e) {
		log.add('Audio error: ' + e.name + ', ' + e.message);
	}

	var settableAudio = langs[index];
	stb.SetAudioPID(parseInt(settableAudio.pid));
}
function _tv_change_audio(){

	_tv_get_sync_audio()
	.done(function(list){
		var tv_cur_channel_audio = list;
		var audio_info = _tv_get_cur_audio();

		if(++audio_info > (tv_cur_channel_audio.length - 1)){
			audio_info = 0;
		}

		_tv_set_audio(audio_info);

		tv_cur_audio_display({index:audio_info, list:tv_cur_channel_audio});
	});


}
function _tv_get_audio(){

}
function _tv_get_cur_audio(){
	var pid = stb.GetAudioPID();
	var index = 0;

	var langs = stb.GetAudioPIDs();
	try {
		langs = eval(langs);
	}
	catch (e) {
		log.add('Audio error: ' + e.name + ', ' + e.message);
	}

	if (langs.length > 1) {
		for (var i = 0; i < langs.length; i++) {
			if(langs[i].pid == pid){
				index = i;
			}
		}
	}

	return index;
}


function _setVideoSize(coords) {
	var ctx = {
		'coords': coords
	};
	_player_resize(ctx);
}

function _tv_channel_show (id){
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

	var url = 'udp://' + channel['protocol'].trim() + ':' + (channel['port']||1234);

	stb.InitPlayer();
	stb.Play(url);

	//TODO: сделать нормально
	if(tv_cur_block == 'tv_channellist'){
//		tv_channellist_fade();
	}
}

function _tv_channel_stop(){
	stb.Stop();
}

function __tv_change_volume(direct){
	var change = direct === 'up' ?
		5 : -5;
	value = parseInt(stb.GetVolume()) + change;
	value = value.constrain(0, 100);
	tv_set_volume(value);
}
function _tv_set_volume(value){
	stb.SetVolume(value);
}
function _tv_change_mute() {}

function _tv_get_sync_cur_audio() {
	var d = $.Deferred();

	d.resolve(null);

	return d.promise();
}

function _tv_get_network_info(){
	var d = $.Deferred();

	var tmp_mac = stb.RDir('MACAddress');
	var tmp_ip = stb.RDir('IPAddress');

	d.resolve({'ip': tmp_ip.trim(), 'mac': tmp_mac.trim()});
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
		if (this._model) return this._model;
		this._model = stb.GetDeviceModel();
		return this._model;
	},
	firmware: function () {
		if (this._firmware) return this._firmware;
		this._firmware = stb.GetDeviceVersionHardware();
		return this._firmware;
	}
};

function _tv_poweroff() {
	stb.StandBy(true);
}

(function() {
	// helpers
	var regExp = function(name) {
		return new RegExp('(^| )'+ name +'( |$)');
	};
	var forEach = function(list, fn, scope) {
		for (var i = 0; i < list.length; i++) {
			fn.call(scope, list[i]);
		}
	};

// class list object with basic methods
	function ClassList(element) {
		this.element = element;
	}

ClassList.prototype = {
		add: function() {
			forEach(arguments, function(name) {
				if (!this.contains(name)) {
					this.element.className += ' '+ name;
				}
			}, this);
		},
		remove: function() {
			forEach(arguments, function(name) {
				this.element.className =
					this.element.className.replace(regExp(name), ' ');
			}, this);
		},
		toggle: function(name) {
			return this.contains(name) ? (this.remove(name), false) : (this.add(name), true);
		},
		contains: function(name) {
			return regExp(name).test(this.element.className);
		},
		// bonus..
		replace: function(oldName, newName) {
			this.remove(oldName);
			this.add(newName);
		}
	};

// IE8/9, Safari
	if (!('classList' in Element.prototype)) {
		Object.defineProperty(Element.prototype, 'classList', {
			get: function() {
				return new ClassList(this);
			}
		});
	}

// replace() support for others
	if (window.DOMTokenList && DOMTokenList.prototype.replace == null) {
		DOMTokenList.prototype.replace = ClassList.prototype.replace;
	}
})();

//TODO: реализовать
function _get_power_state() {
	var d = $.Deferred();
	d.resolve(true);
	return d.promise();
}
