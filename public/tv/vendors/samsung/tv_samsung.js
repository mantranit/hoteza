var DICTIONARY_LANG = {'abk': 'ab','aar': 'aa','afr': 'af','aka': 'ak','alb': 'sq','amh': 'am','ara': 'ar','arg': 'an','arm': 'hy','asm': 'as','ava': 'av','ave': 'ae','aym': 'ay','aze': 'az','bam': 'bm','bak': 'ba','baq': 'eu','bel': 'be','ben': 'bn','bih': 'bh','bis': 'bi','bos': 'bs','bre': 'br','bul': 'bg','bur': 'my','cat': 'ca','cha': 'ch','che': 'ce','nya': 'ny','chi': 'zh','chv': 'cv','cor': 'kw','cos': 'co','cre': 'cr','hrv': 'hr','cze': 'cs','dan': 'da','div': 'dv','dut': 'nl','dzo': 'dz','eng': 'en','epo': 'eo','est': 'et','ewe': 'ee','fao': 'fo','fij': 'fj','fin': 'fi','fre': 'fr','ful': 'ff','glg': 'gl','geo': 'ka','ger': 'de','gre': 'el','grn': 'gn','guj': 'gu','hat': 'ht','hau': 'ha','heb': 'he','her': 'hz','hin': 'hi','hmo': 'ho','hun': 'hu','ina': 'ia','ind': 'id','ile': 'ie','gle': 'ga','ibo': 'ig','ipk': 'ik','ido': 'io','ice': 'is','ita': 'it','iku': 'iu','jpn': 'ja','jav': 'jv','kal': 'kl','kan': 'kn','kau': 'kr','kas': 'ks','kaz': 'kk','khm': 'km','kik': 'ki','kin': 'rw','kir': 'ky','kom': 'kv','kon': 'kg','kor': 'ko','kur': 'ku','kua': 'kj','lat': 'la','ltz': 'lb','lug': 'lg','lim': 'li','lin': 'ln','lao': 'lo','lit': 'lt','lub': 'lu','lav': 'lv','glv': 'gv','mac': 'mk','mlg': 'mg','may': 'ms','mal': 'ml','mlt': 'mt','mao': 'mi','mar': 'mr','mah': 'mh','mon': 'mn','nau': 'na','nav': 'nv','nde': 'nd','nep': 'ne','ndo': 'ng','nob': 'nb','nno': 'nn','nor': 'no','iii': 'ii','nbl': 'nr','oci': 'oc','oji': 'oj','chu': 'cu','orm': 'om','ori': 'or','oss': 'os','pan': 'pa','pli': 'pi','per': 'fa','pol': 'pl','pus': 'ps','por': 'pt','que': 'qu','roh': 'rm','run': 'rn','rum': 'ro','rus': 'ru','san': 'sa','srd': 'sc','snd': 'sd','sme': 'se','smo': 'sm','sag': 'sg','srp': 'sr','gla': 'gd','sna': 'sn','sin': 'si','slo': 'sk','slv': 'sl','som': 'so','sot': 'st','spa': 'es','sun': 'su','swa': 'sw','ssw': 'ss','swe': 'sv','tam': 'ta','tel': 'te','tgk': 'tg','tha': 'th','tir': 'ti','tib': 'bo','tuk': 'tk','tgl': 'tl','tsn': 'tn','ton': 'to','tur': 'tr','tso': 'ts','tat': 'tt','twi': 'tw','tah': 'ty','uig': 'ug','ukr': 'uk','urd': 'ur','uzb': 'uz','ven': 've','vie': 'vi','vol': 'vo','wln': 'wa','wel': 'cy','wol': 'wo','fry': 'fy','xho': 'xh','yid': 'yi','yor': 'yo','zha': 'za','zul': 'zu', 'und': 'und'};

var storage = {};
var fileSystemObj, fileObj;

var SEF_EVENT_TYPE = {
	CONNECTION_FAILED : 1,
	AUTHENTICATION_FAILED : 2,
	STREAM_NOT_FOUND : 3,
	NETWORK_DISCONNECTED : 4,
	NETWORK_SLOW : 5,
	RENDER_ERROR : 6,
	RENDERING_START : 7,
	RENDERING_COMPLETE : 8,
	STREAM_INFO_READY : 9,
	DECODING_COMPLETE : 10,
	BUFFERING_START : 11,
	BUFFERING_COMPLETE : 12,
	BUFFERING_PROGRESS : 13,
	CURRENT_DISPLAY_TIME : 14,
	AD_START : 15,
	AD_END : 16,
	RESOLUTION_CHANGED : 17,
	BITRATE_CHANGED : 18,
	SUBTITLE : 19,
	CUSTOM : 20
};

function _tv_vendor_init(){
	var d = $.Deferred();
	if(!$id('pluginObjectTVMW')){
		$(document.body).append('<!-- Plugins --><object id="pluginObjectTVMW" border=0 classid="clsid:SAMSUNG-INFOLINK-TVMW" style="position:absolute;opacity: 0.0; background-color: #000; width: 0px; height: 0px;"></object><object id="pluginObjectAppCommon" border=0 classid="clsid:SAMSUNG-INFOLINK-APPCOMMON" style="position:absolute;opacity: 0.0; background-color: #000; width: 0px; height: 0px;"></object><object id="pluginObjectSEF" border=0 classid="clsid:SAMSUNG-INFOLINK-SEF" style="position:absolute;opacity: 0.0; background-color: #000; width: 0px; height: 0px;"></object><object id="pluginPlayer" border=0 classid="clsid:SAMSUNG-INFOLINK-SEF" style="position:absolute;opacity: 0.0; background-color: #000; width: 0px; height: 0px;"></object><object id="pluginDownload" border=0 classid="clsid:SAMSUNG-INFOLINK-DOWNLOAD" style="position:absolute;opacity: 0.0; background-color: #000; width: 0px; height: 0px;"></object>');
		$(document.body).append('<object id="pluginTV" border=0 classid="clsid:SAMSUNG-INFOLINK-SEF" style="position:absolute;opacity: 0.0; background-color: #000; width: 0px; height: 0px;"></object><object id="pluginObjectWindow" border=0 classid="clsid:SAMSUNG-INFOLINK-SEF" style="position:absolute;opacity: 0.0; background-color: #000; width: 0px; height: 0px;"></object>');
	}
	$.getScript('$MANAGER_WIDGET/Common/API/Widget.js', function(){
		$.getScript('$MANAGER_WIDGET/Common/API/TVKeyValue.js', function(){
			$.getScript('$MANAGER_WIDGET/Common/API/Plugin.js', function(){

				try{
					var storage_text;
					fileSystemObj = new FileSystem();
					fileObj = fileSystemObj.openCommonFile('hoteza.data', 'r');
			
					if(fileObj != null){
						log.add('FS: DATA read success');
						storage_text = fileObj.readAll();
					}else{
						log.add('FS: DATA read error');
						storage_text = '{}';
					}
					fileSystemObj.closeCommonFile(fileObj);
					try{
						storage = JSON.parse(''+storage_text)||{};
					}catch(e){
						storage = {};
						tv_log('Storage parse error');
					}
					d.resolve();
				}catch(e){
					$(document.body).html('<span style="color:White;">Filesystem error</span>');
					d.reject('storage error');
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

			})
			.fail(function(){
				d.reject('samsung load error');
			});
		})
		.fail(function(){
			d.reject('samsung load error');
		});
	})
	.fail(function(){
		d.reject('samsung load error');
	});

	$(HotezaTV).one('splashshow', function(){

		widgetAPI = new Common.API.Widget();
		tvKey = new Common.API.TVKeyValue();
		pluginObj = new Common.API.Plugin();

		tv_keys = {
			EXIT: tvKey.KEY_EXIT,
			DOWN: tvKey.KEY_DOWN,
			UP: tvKey.KEY_UP,
			LEFT: tvKey.KEY_LEFT,
			RIGHT: tvKey.KEY_RIGHT,
			ENTER: tvKey.KEY_ENTER,
			BACK: tvKey.KEY_RETURN,
			MENU: tvKey.KEY_MENU,
			RED: tvKey.KEY_RED,
			GREEN: tvKey.KEY_GREEN,
			YELLOW: tvKey.KEY_YELLOW,
			BLUE: tvKey.KEY_BLUE,
			CH_UP: tvKey.KEY_CH_UP,
			CH_DOWN: tvKey.KEY_CH_DOWN,
			VOL_UP: tvKey.KEY_VOL_UP,
			VOL_DOWN: tvKey.KEY_VOL_DOWN,
			MUTE: tvKey.KEY_MUTE,
			NUM_0: tvKey.KEY_0,
			NUM_1: tvKey.KEY_1,
			NUM_2: tvKey.KEY_2,
			NUM_3: tvKey.KEY_3,
			NUM_4: tvKey.KEY_4,
			NUM_5: tvKey.KEY_5,
			NUM_6: tvKey.KEY_6,
			NUM_7: tvKey.KEY_7,
			NUM_8: tvKey.KEY_8,
			NUM_9: tvKey.KEY_9,
			INPUT: tvKey.KEY_SOURCE,
			HOME: tvKey.KEY_HOME,
			POWER: tvKey.KEY_POWER,
			STOP: tvKey.KEY_STOP,
			PLAY: tvKey.KEY_PLAY,
			PAUSE: tvKey.KEY_PAUSE,
			FAST_FORWARD: tvKey.KEY_FF,
			REWIND: tvKey.KEY_RW,
			DOOREYE: 2301
		};

		widgetAPI.sendReadyEvent();

		pluginTV = document.getElementById('pluginTV');
		pluginIPTV = document.getElementById('pluginObjectSEF');
		pluginObjectTVMW = document.getElementById('pluginObjectTVMW');
		pluginWindow = document.getElementById('pluginObjectWindow');
		pluginDownload = document.getElementById('pluginDownload');

		//tv_log('ready');
		pluginTV.Open('TV','1.000','TV');
		pluginTV.OnEvent = TVEventHander;
		pluginTV.Execute('SetEvent', PL_TV_EVENT_CHANGE_POWER_STATE);
		//~ pluginTV.Execute("SetEvent", PL_TV_EVENT_CHANNEL_CHANGED);
		//~ pluginTV.Execute("SetEvent", PL_TV_EVENT_NO_SIGNAL);
		pluginTV.Execute('SetEvent', PL_TV_EVENT_TUNE_SUCCESS);
		//~ pluginTV.Execute("SetEvent", PL_TV_EVENT_PROGRAM_CHANGED);
		pluginTV.Execute('SetEvent', PL_TV_EVENT_SOURCE_CHANGED);
		pluginTV.Execute('SetEvent', PL_TV_EVENT_SOURCE_CONNECTED);

		_tv_control_keys();

		if(_tv_samsung_new()){
			log.add('Samsung version: new');
			pluginIPTV.Open('IPTV', '1.010', 'IPTV');
			pluginObjectTVMW.SetSource(48);
			pluginIPTV.Execute('SetPlayerWindow', 0,0, 0, 1920, 1080);
		}else{
			log.add('Samsung version: old');
			pluginIPTV.Open('Player', '1.010', 'Player');
			pluginObjectTVMW.SetSource(45);
		}

		// pluginIPTV.OnEvent = _onEvent_SEF;

		_banner_state_switch_off();

	});

	window.onShow = function(){
		_tv_control_keys();
		_banner_state_switch_off();
	};

	return d.promise();
}

function _tv_samsung_new(){
	return ua.match(/\+201[3,4,5]/);
}

function save_storage(){
	fileObj = fileSystemObj.openCommonFile('hoteza.data', 'w');
	var tmp = fileObj.writeAll(JSON.stringify(storage));
	//log.add('FS: DATA write ' + tmp);
	fileSystemObj.closeCommonFile(fileObj);
}

function _tv_channel_show (tune, coords){
	var channels = getChannels();
	var channel, id;

	if(typeof(tune) === 'object'){
		channel = tune;
		id = 0;
	}
	else{
		id = tune|0;
		channel = channels[id];
	}

	if(!channel){
		log.add('TV: ERROR! Tried to show nonexistent channel: ' + tune);
		return false;
	}

	if (_is_slow_channel_tune()) {_tv_channel_stop();}
	_toggle_source_v2()
		.done(_channel_show);

	//~ _is_slow_channel_tune() ? setTimeout(_channel_show, 1000) :  _channel_show();

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

	function _channel_show() {
		if(channel['type'] === 'rf'){
			var freq = channel['protocol'].toString().split('#');

			if(freq[0] < 1000){
				freq[0] *= 1000000;
			}

			var mainType = 0;
			var ChannelInfo = {};

			//Samsung PTC map
			var PTC = Math.max(1,((freq[0]/1000000)-106)/8|0);

			//TODO: найти мануал по id звуковых систем и сделать разделение нормально
			switch(channel['broadcastType']){
				case 'ANALOG_NTSC':
				case 'ANALOG_PAL_BG':
				case 'ANALOG_PAL_DK':
				case 'ANALOG_PAL_I':
				case 'ANALOG_PAL_M':
				case 'ANALOG_PAL_N':
				case 'ANALOG_SECAM_BG':
				case 'ANALOG_SECAM_DK':
				case 'ANALOG_SECAM_L':
					mainType = 0;
					ChannelInfo = {
						'TYPE':1,
						'ModulationType':6,
						'Frequency':freq[0]/1000000,
						'ProgNum':(id+1),
						'HotelProgramType':1,
						'ChannelName':'',
						'ColorSystem':9,
						'SoundSystem':3
					};
					log.add('TV: tuning to ANALOG (Frequency: ' + ChannelInfo.Frequency + ' )');
					break;

				case 'CABLE':
					//256QAM
					mainType = 1;
					ChannelInfo = {
						'TYPE':4,
						'ModulationType':2,
						'SymbolRate':(freq[2]|0)||6900,
						'Frequency':freq[0]/1000000,
						'PTC':0,
						'ProgNum':(id+1),
						'MINOR_NUMBER_ONE_PART':-2,
						'ProgramNumber':freq[1]|0,
						'HotelProgramType':1,
						'Bandwidth':1
					};
					log.add('TV: tuning to CABLE 256QAM (FREQ: ' + ChannelInfo.Frequency + ', SID: ' + ChannelInfo.ProgramNumber + ' )');
					break;
				case 'CABLE_HRC':
					//64QAM
					mainType = 1;
					ChannelInfo = {
						'TYPE':4,
						'ModulationType':1,
						'SymbolRate':(freq[2]|0)||6875,
						'Frequency':freq[0]/1000000,
						'PTC':0,
						'ProgNum':(id+1),
						'MINOR_NUMBER_ONE_PART':-2,
						'ProgramNumber':freq[1]|0,
						'HotelProgramType':1,
						'Bandwidth':1
					};
					log.add('TV: tuning to CABLE 64QAM (FREQ: ' + ChannelInfo.Frequency + ', SID: ' + ChannelInfo.ProgramNumber + ' )');
					break;
				case 'CABLE_IRC':
				case 'CABLE_STD':

					mainType = 1;
					ChannelInfo = {
						'TYPE':4,
						'ModulationType':2,
						'SymbolRate':(freq[2]|0)||6900,
						'Frequency':0,
						'PTC':PTC,
						'ProgNum':(id+1),
						'MINOR_NUMBER_ONE_PART':-2,
						'ProgramNumber':freq[1]|0,
						'HotelProgramType':1,
						'Bandwidth':1
					};
					log.add('TV: tuning to CABLE (PTC: ' + ChannelInfo.PTC + ', SID: ' + ChannelInfo.ProgramNumber + ' )');
					break;

				case 'TERRESTRIAL':
					//Samsung PTC map for dvb-t
					PTC = Math.max(1,((freq[0]/1000000)-306)/8|0);

					mainType = 2;
					ChannelInfo = {
						'TYPE':2,
						'ModulationType':8, //19 for DVB-T2
						'SymbolRate':0,
						'Frequency':0,
						'PTC':PTC,
						'ProgNum':(id+1),
						'MINOR_NUMBER_ONE_PART':-2,
						'ProgramNumber':freq[1]|0,
						'HotelProgramType':1,
						'Bandwidth':1
					};
					log.add('TV: tuning to TERRESTRIAL (PTC: ' + ChannelInfo.PTC + ', FREQ: ' + freq[0]/1000000 + ', SID: ' + ChannelInfo.ProgramNumber + ' )');
					break;

				case 'TERRESTRIAL2':
					//Samsung PTC map for dvb-t
					PTC = Math.max(1,((freq[0]/1000000)-306)/8|0);

					mainType = 2;
					ChannelInfo = {
						'TYPE':2,
						'ModulationType':19,
						'SymbolRate':0,
						'Frequency':(freq[0]/1000000),
						'PTC':0,
						'ProgNum':(id+1),
						'MINOR_NUMBER_ONE_PART':-2,
						'ProgramNumber':freq[1]|0,
						'HotelProgramType':1,
						'Bandwidth':1
					};
					log.add('TV: tuning to TERRESTRIAL 2 (FREQ: ' + ChannelInfo.Frequency + ', SID: ' + ChannelInfo.ProgramNumber + ' )');
					break;

				case 'SATELLITE':
				case 'SATELLITE_2':
					freq[0] = freq[0]|0;

					//~ if(freq[0] < 10700 || freq[0] > 12750){
					//~ log.add('TV: incorrect satellite frequency');
					//~ return false;
					//~ }

					if(freq[0] < 10000){ //PTC workaround for Samsung
						PTC = freq[0];
					}else{
						if(freq[0] < 10725){ //Assume PTC gap depends on LO/HI
							PTC = Math.round(freq[0]/19 - 340);
						}else{
							PTC = Math.round(freq[0]/19 + 1270);
						}
					}

					PTC = Math.max(1, PTC);

					ChannelInfo =  {
						'TYPE': 7,
						'ModulationType': 5,
						'SymbolRate': 0,
						'Frequency': 0,
						'PTC': PTC,
						'ProgNum': (id+1),
						'MINOR_NUMBER_ONE_PART': -2,
						'ProgramNumber': freq[1]|0,
						'SatelliteId': 'FREE', // !!!!!! Must not be INT!!!
						'Bandwidth': 0,
						'Polarization': 0
					};


					// _tv_channel_stop();

					// if(parseInt(pluginObjectTVMW.GetSource(),10) != 0){
					// 	pluginObjectTVMW.SetSource(0);
					// }

					log.add('TV: tuning to SATELLITE (PTC: ' + ChannelInfo.PTC + ', SID: ' + ChannelInfo.ProgramNumber + ')');

					pluginWindow.Open('Window','1.000','Window');
					pluginWindow.Execute('SetDVBSIChannelDirectEx', JSON.stringify(ChannelInfo));
					pluginWindow.Close();

					//Override default RF tuning
					return true;

					break;//jshint ignore:line

				default:
					mainType = 0;
					ChannelInfo = {
						'TYPE':1,
						'ModulationType':6,
						'Frequency':freq[0]/1000000,
						'ProgNum':(id+1),
						'HotelProgramType':1,
						'ChannelName':'',
						'ColorSystem':9,
						'SoundSystem':3
					};
					log.add('TV: tuning to DEFAULT (Freq: '+ChannelInfo.Frequency+' )');

					break;
			}

			// if (stopping_channel) _tv_channel_stop();

// 			if(parseInt(pluginObjectTVMW.GetSource(),10) != 0){
// //			pluginIPTV.Close();
// 				pluginObjectTVMW.SetSource(0);
// //			tv_log(pluginIPTV.Open("Window","1.000","Window"));
// 			}

			pluginWindow.Open('Window','1.000','Window');
			pluginWindow.Execute('SetChannelHotel',JSON.stringify(ChannelInfo),mainType);
			pluginWindow.Close();

		}
		else {

			//TODO: перенести Source ID в константу
			// if(_tv_samsung_new()){
			// 	if(parseInt(pluginObjectTVMW.GetSource(),10) != 48){
			// 		pluginObjectTVMW.SetSource(48);
			// 	}
			// }
			// else {
			//    if(parseInt(pluginObjectTVMW.GetSource(),10) != 45){
			// 		pluginObjectTVMW.SetSource(45);
			// 	}
			// }

			var url = 'rtp://' + channel['protocol'].trim() + ':' + (channel['port']||1234) + '|HW';
			// if (stopping_channel) _tv_channel_stop();

			//tv_log('Stop ' + pluginIPTV.Execute("Stop"));

			//	tv_log('init ' + pluginIPTV.Execute("InitPlayer", url));
			//	setTimeout(function(){tv_log('StartPlayback ' + pluginIPTV.Execute("StartPlayback"))}, 600);
			//tv_log('play ' + pluginIPTV.Execute("Play", url));

			if(_tv_samsung_new()){
				pluginIPTV.Execute('SIInit');
				pluginIPTV.Execute('SetTuneURL', url, 0);
			}else{
				pluginIPTV.Execute('Play', url);
			}

		}

		setVideoSize(coords);

	}
	function _toggle_source() {
		if (channel.type == 'ip') {
			if(_tv_samsung_new()){
				if(parseInt(pluginObjectTVMW.GetSource(),10) != 48){
					pluginObjectTVMW.SetSource(48);
				}
			}
			else {
				if(parseInt(pluginObjectTVMW.GetSource(),10) != 45){
					pluginObjectTVMW.SetSource(45);
				}
			}
		}
		else {
			if(parseInt(pluginObjectTVMW.GetSource(),10) != 0){
				pluginObjectTVMW.SetSource(0);
			}
		}
	}
	function _toggle_source_v2() {
		if (channel.type == 'ip') {
			if(_tv_samsung_new()){
				return _set_samsung_source(48);
			}
			else {
				return _set_samsung_source(45);
			}
		}
		else {
			return _set_samsung_source(0);
		}
	}
	function _is_stopping() {
		if (_is_slow_channel_tune()) {return true;}

		if ((typeof tv_prev_cur_channel != 'undefined' &&
			channels[tv_prev_cur_channel]['type'] != channels[tv_cur_channel]['type']) ||
			typeof tv_prev_cur_channel == 'undefined') {

			return true;
		}
		else {return false;}
	}
}

function _is_slow_channel_tune() {
	var model = _tv_get_info.model();

	return (
		model.toLowerCase().indexOf('ea590') !== -1 ||
		// следующая строка добавлена после Sofitel from Dubai
		// без сторопения канала не включается следующий
		model.toLowerCase().indexOf('aa690') !== -1
	);
}

var _tv_get_info = {
	_model: null,
	_firmware: null,
	_serial_number: null, //Не поддерживается
	model: function () {
		if (this._model) {return this._model;}

		pluginWindow.Open('TV','1.000','TV');
		this._model = pluginWindow.Execute('GetProductCode' ,1);
		pluginWindow.Close();

		return this._model;
	},
	firmware: function () {
		if (this._firmware) {return this._firmware;}

		pluginWindow.Open('Device','1.000','Device');
		this._firmware = pluginWindow.Execute('Firmware');
		pluginWindow.Close();

		return this._firmware;
	}
};

function _setVideoSize(coords) {
	var channels = (typeof (_tv_channels) !== 'undefined') ? _tv_channels : tv_channels,
		channel = channels[tv_cur_channel];

	if (!channel) {
		return false;
	}

	if (channel.type === 'rf') {
		pluginWindow.Open('Window', '1.000', 'Window');
		pluginWindow.Execute(
			'SetScreenRect',
			coords.left*0.75,
			coords.top*0.75,
			coords.width*0.75,
			coords.height*0.75
		);
		pluginWindow.Close();
	}
	else {
		pluginIPTV.Execute(
			'SetPlayerWindow',
			0,
			coords.left * 1.5,
			coords.top * 1.5,
			coords.width * 1.5 - 1,
			coords.height * 1.5
		);
	}
}

function _tv_channel_stop(){
	if(typeof(tv_cur_channel)!== 'undefined') {
		var channels = (typeof (_tv_channels) !== 'undefined' && tv_cur_block !== 'tv_welcome') ?
			_tv_channels : tv_channels;

		//Channel Background
		if($id('tv_channel_background')){
			$('#tv_channel_background').remove();
		}
		//===

		if (channels[tv_cur_channel]['type'] === 'rf' && fullscreen === false) {
			if (!_is_slow_channel_tune()) {
				pluginObjectTVMW.SetSource(48);
			}
			else {pluginObjectTVMW.SetSource(35);}
		}
		else {
			if (_tv_samsung_new()) {
				pluginIPTV.Execute('StopCurrentChannel', 0);
				pluginIPTV.Execute('FreeNowPlayingInfo', 0);
			} else {
				pluginIPTV.Execute('Stop');

				// ea590, вызывает черный экран, зачем было сделано непонятно. можно удалять
				//if (_is_slow_channel_tune()) pluginObjectTVMW.SetSource(35);
			}
		}
	}
}

function _onEvent_SEF(event, data1, data2) {
	//tv_log("onEvent..._SEF "+event+" p1: "+data1+" p2: "+data2);
	switch (event){
		case 1: //PL_EMP_IPTV_EVENT_MESSAGE:
			//tv_log("SEF_EVENT_TYPE.PL_EMP_IPTV_EVENT_MESSAGE.");
			break;
		case 2: //PL_EMP_PLAYER_EVENTS:
			//tv_log("SEF_EVENT_TYPE.PL_EMP_PLAYER_EVENTS.");
			break;
		case 3: //PL_EMP_IPTV_EVENTS:
			//tv_log("SEF_EVENT_TYPE.PL_EMP_IPTV_EVENTS.");
			switch(data1){
				case '1'://PL_EMP_IPTV_EVENT_AUDIO_ONLY)
					//tv_log(".PL_EMP_IPTV_EVENT_AUDIO_ONLY.");
					break;
				case '2':// PL_EMP_IPTV_EVENT_VIDEO_ONLY)
					//tv_log(".PL_EMP_IPTV_EVENT_VIDEO_ONLY.");
					break;
				case '3':// PL_EMP_IPTV_EVENT_AUDIO_AND_VIDEO)
					//tv_log(".PL_EMP_IPTV_EVENT_AUDIO_AND_VIDEO.");

					//tv_cur_channel_audio = _tv_get_audio();

					break;
				case '4'://PL_EMP_IPTV_EVENT_NO_STREAMINPUT)
					//tv_log(".PL_EMP_IPTV_EVENT_NO_STREAMINPUT.");
					break;
				case '5':// PL_EMP_IPTV_EVENT_STREAM_RECOVERED)
					//tv_log(".PL_EMP_IPTV_EVENT_STREAM_RECOVERED.");
					break;
				default:
					log.add('TV: Unknown IPTV event ' + data1);
					break;
			}
			break;

		case 9:
/*
			var resolution = pluginIPTV.Execute("GetVideoResolution");
			if(resolution != -1){
				resolution = resolution.split('|');
				maxw = 960;
				maxh = 540;
				var tv_ratio = maxw/maxh;
				var image_ratio = resolution[0]/resolution[1];
				if(tv_ratio >= image_ratio){
					y = 0;
					h = maxh;
					w = Math.round(h*image_ratio);
					x = (maxw - w) / 2;
				}else{
					x = 0;
					w = maxw;
					h = Math.round(w/image_ratio);
					y = (maxh - h) / 2;
				}
//				tv_log('SetDisplayArea '+ w + 'x' + h + ' = ' + pluginIPTV.Execute("SetDisplayArea",x,y,w,h));
			}
*/

		default:
			break;
	}
}

function _tv_bg_prepare(){
	if (tv_channellist_type === 'mosaic') {
		$('#container').get(0).style['background'] = 'none';
	}
	$(document.body).get(0).style['background'] = 'none';
}
function _tv_bg_restore(){
	if (tv_channellist_type === 'mosaic') {
		$('#container').get(0).style['background'] = '';
	}
	$(document.body).get(0).style['background'] = '';
}


var widgetAPI;
var tvKey;
var pluginObj;
var pluginIPTV;
var pluginObjectTVMW;
var pluginWindow;
var pluginTV;
var pluginDownload;

var PL_TV_EVENT_CHANGE_POWER_STATE = 211;
var PL_TV_EVENT_CHANNEL_CHANGED = 113;
var PL_TV_EVENT_NO_SIGNAL = 101;
var PL_TV_EVENT_TUNE_SUCCESS = 103;
var PL_TV_EVENT_PROGRAM_CHANGED = 204;
var PL_TV_EVENT_SOURCE_CHANGED = 114;
var PL_TV_EVENT_SOURCE_CONNECTED = 126;

//Отключение баннера "Канал недоступен"
function _banner_state_switch_off() {
	pluginWindow.Open('NNavi','1.000','NNavi');
	pluginWindow.Execute('SetBannerState',1);
	pluginWindow.Close();
}

function TVEventHander(event, id, data){
	//~ tv_log('TV Event: ' + event + ' id:' + id + ' data: ' + data );
	try {
		// eslint-disable-next-line no-eval
		eval('data = ' + data);//jshint ignore:line
	}
	catch (e) {
		tv_log(e.message);
	}

	switch(parseInt(id)){
		case PL_TV_EVENT_CHANGE_POWER_STATE: // 211
			switch(data['param1']){
				case 6:
					tv_virtual_standby_off();
					break;
				case 7:
					tv_virtual_standby_on();
					break;
				default:
					break;
			}
			break;
		case PL_TV_EVENT_SOURCE_CHANGED: // 114
			//~ tv_log('SRC CH ' + data.parm2);
			break;
		case PL_TV_EVENT_SOURCE_CONNECTED: // 126
			//~ tv_log('SRC CON ' + data.parm2 + '/' + data.parm3);
			if(_set_samsung_source_obj.deferred && (typeof(_set_samsung_source_obj.expect) !== 'undefined')){
				//Samsung TV SOURCE hack
				if(data.parm3 < 10){
					data.parm3 = 0;
				}
				//----------------------

				if(_set_samsung_source_obj.expect == data.parm3){
					_set_samsung_source_obj.deferred.resolve('OK');
					_set_samsung_source_obj = {};
				}else{
					log.add('SOURCE: changed source to NOT_EXPECTED = ' + data.parm3);
				}
			}else{
				log.add('SOURCE: changed source without notice');
			}
			break;
		case PL_TV_EVENT_TUNE_SUCCESS: // 103
			$(window).trigger('RFtuned');
			break;
		default:
			log.add('unknown Event ' + id + ' data: ' + JSON.stringify(data) );
			break;
	}
}

var handler = function(event){
	widgetAPI.blockNavigation(event);
	tv_keydown(event);
};
function _setHandlerKeydown() {
	document.removeEventListener('keydown', handler,false);
	document.addEventListener('keydown', handler,false);
}

function _tv_get_audio(){
	pluginWindow.Open('Window','1.000','Window');
	var tmp_info = JSON.parse(pluginWindow.Execute('GetMultiAudioInfo'));

	pluginWindow.Close();
	if(tmp_info.NumOfAudio > 1){
		var out = [];
		var i = tmp_info.NumOfAudio;
		while(i--){
			out[tmp_info.items[i].index] = (hex2a(tmp_info.items[i].lang.toString(16)));
		}
		return out;
	}
	else {
		return null;
	}
}

function _tv_get_sync_audio() {
	var d = $.Deferred(),
		tmp_info;

	pluginWindow.Open('Window','1.000','Window');
	try {
		var info = pluginWindow.Execute('GetMultiAudioInfo');
		if (info !== '') {
			tmp_info= JSON.parse(pluginWindow.Execute('GetMultiAudioInfo'));
		}
		else {
			d.resolve(null);
		}
	}
	catch (e) {
		log.add('Audio error: ' + e.name + ', ' + e.message);
		d.resolve(null);
	}
	pluginWindow.Close();

	if(tmp_info && tmp_info.NumOfAudio > 1){
		var out = [];
		var i = tmp_info.NumOfAudio;
		while(i--){
			out[tmp_info.items[i].index] = (DICTIONARY_LANG[hex2a(tmp_info.items[i].lang.toString(16))]);
		}
		d.resolve(out);
	}
	else {
		d.resolve(null);
	}

	return d.promise();
}
function _tv_get_sync_cur_audio() {
	var d = $.Deferred();
	pluginWindow.Open('Window','1.000','Window');
	var tmp_cur = JSON.parse(pluginWindow.Execute('GetCurrentAudioInfo'));

	pluginWindow.Close();
	d.resolve(tmp_cur.index);
	return d.promise();
}
function _tv_get_cur_audio(){
	pluginWindow.Open('Window','1.000','Window');
	var tmp_cur = JSON.parse(pluginWindow.Execute('GetCurrentAudioInfo'));

	pluginWindow.Close();
	return tmp_cur.index;
}
function _tv_change_audio(){
	var tmp = {index:0, list:['default']};

	try{
		var audio_info = _tv_get_cur_audio();
		tv_cur_channel_audio = _tv_get_audio();

		if(tv_cur_channel_audio){
			if(++audio_info > (tv_cur_channel_audio.length - 1)){
				audio_info = 0;
			}

			_tv_set_audio(audio_info);

			tv_cur_audio_display({index:audio_info, list:tv_cur_channel_audio});
		}else{
			//tv_log('Only one track');
			return false;
		}
	}catch(e){
		log.add('TV: audio change error');
	}

	return true;
}
function _tv_set_audio(index){
	pluginWindow.Open('Window','1.000','Window');
	pluginWindow.Execute('ChangeAudioByIndex', index);
	pluginWindow.Close();
	return true;
}

function _get_media_audio (player) {
	var d = $.Deferred(),
		languages_list = [],
		languages_count = player.media.Execute('GetTotalNumOfStreamID', 1) - 1;

	if (
		languages_count === 0 ||
		languages_count === 1 ||
		languages_count === -1
	) {d.resolve(null);}

	for (var i = 0; i <= languages_count; i++) {
		languages_list.push(
			DICTIONARY_LANG[
				hex2a(player.media.Execute('GetStreamLanguageInfo', 1, i).toString(16))
			]
		);
	}

	d.resolve(languages_list);

	return d.promise();
}
function _get_media_subtitles(VOD) {
	var d = $.Deferred(),
		subtitles_arr = VOD.structureAssoc.films[VOD.id].subtitles,
		subtitle_obj = {},
		subtitle,
		subtitle_code;

	if (typeof subtitles_arr === 'undefined' || subtitles_arr.length === 0) {
		d.resolve(null);
	}
	else {
		for (var i = 0; i < subtitles_arr.length; i++) {
			subtitle = subtitles_arr[i];
			subtitle_code = Object.keys(subtitle)[0];
			subtitle_obj[subtitle_code] = subtitle[subtitle_code];
		}

		d.resolve(subtitle_obj);
	}

	return d.promise();
}
function _set_media_audio(player, index) {
	player.media.Execute('SetStreamID', 1, index);
}
function _set_media_subtitle(player, url) {
	var urlArr = url.split('/'),
		subtitleName = urlArr[urlArr.length - 1];

	pluginDownload.StartDownFile(url, '$TEMP/' + subtitleName);
	pluginDownload.OnComplete = function () {
		player.media.Execute('StartSubtitle', '$TEMP/' + subtitleName);
	};
}
function _switch_subtitle(player, flag) {
	var subtitles = $('#playerSubtitles');

	if (flag) {
		subtitles.show();
	}
	else {
		subtitles.hide();
		subtitles.html('');
	}
}

function _get_duration_video(player) {
	var d = $.Deferred();

	d.resolve(player.media.Execute('GetDuration'));

	return d.promise();
}
function _get_play_position_video(player) {
	var d = $.Deferred();

	d.resolve(player.currentTime);

	return d.promise();
}
function _set_play_position_video(player) {
	var d = $.Deferred();

	if (player.direct === 'forward') {
		player.media.Execute('JumpForward', player.time/1000);
	}
	else if (player.direct === 'backward') {
		player.media.Execute('JumpBackward', player.time/1000);
	}

	d.resolve();

	return d.promise();
}

// плэйер
function _player_start(ctx) {
	if (PLAYER_INIT) {return;}

	if(parseInt(pluginObjectTVMW.GetSource(),10) !== 43){
		pluginObjectTVMW.SetSource(43);
	}
	if (!ctx.media) {ctx.media = document.getElementById('pluginPlayer');}

	ctx.media.Open('Player', '1.000','Player');
	PLAYER_INIT = true;

}
function _player_play(ctx) {
	ctx.url = encodeString(ctx.url);
	ctx.url = setLocationURL(ctx.url);

	if (!ctx.media) {ctx.media = document.getElementById('pluginPlayer');}
	if (!PLAYER_INIT) {_player_start(ctx);}

	ctx.started = true;

	ctx.media.OnEvent = ctx.eventListener;
	ctx.media.Execute('Play', ctx.url);
}
function _player_stop(ctx) {
	var d = $.Deferred();

	if (!ctx.media) {ctx.media = document.getElementById('pluginPlayer');}
	ctx.media.Execute('Stop');

	d.resolve();

	return d.promise();
}
function _player_pause(ctx) {
	if (!ctx.media) {ctx.media = document.getElementById('pluginPlayer');}
	ctx.paused = true;

	ctx.media.Execute('Pause');
}
function _player_resume(ctx) {
	if (!ctx.media) {ctx.media = document.getElementById('pluginPlayer');}
	ctx.paused = false;

	var state = ctx.media.Execute('Resume');
	if (state != 1) {
		if (videoCollection.get()) {
			videoCollection.destroy();
			Loader.stop();
		}
		else {_player_destroy(ctx);}
	}
}
function _player_resize(ctx) {
	if (!ctx.media) {
		return false;
	}

	ctx.media.Execute(
		'SetDisplayArea',
		Math.floor(0.75*ctx.coords.left),
		Math.floor(0.75*ctx.coords.top),
		Math.floor(0.75*ctx.coords.width),
		Math.floor(0.75*ctx.coords.height)
	);
}
function _player_destroy(ctx) {
	var d = $.Deferred();
	if (!ctx.media) {ctx.media = document.getElementById('pluginPlayer');}

	ctx.media.Close();
	ctx.media = undefined;
	PLAYER_INIT = false;

	d.resolve();

	return d.promise();
}
function _player_shutdown() {
	var d = $.Deferred();
	d.resolve();
	return d.promise();
}

function _tv_miracast(){
	try{
		pluginWindow.Open('TaskManager','1.000','TaskManager');
		log.add('TV: Screen Mirroring status: ' + (pluginWindow.Execute('RunWIFIDisplay')));   //RunWIFIDisplay will launch Screen Mirroring App.
		pluginWindow.Close();
	}catch(e){
		log.add('TV: Screen Mirroring failed');
	}
}

function _tv_get_preloaded_app_list(raw) {
	var d = $.Deferred();
	curWidget.onWidgetEvent = function(event){
		switch(event.type){
			case Common.API.EVENT_ENUM.GET_INSTALLED_APP_LIST:
				var list = JSON.parse(event.data.substr(13));
				var out = [];
				for(var index in list){
					var app = list[index];
					out.push({
						id: app.id,
						name: app.name,
						icon: app.icon
					});
				}
				if(raw){
					d.resolve(list);
				}else{
					d.resolve(out);
				}

				curWidget.onWidgetEvent = function () {};
				break;
		}

	};

	widgetAPI.getInstalledWidgetList();

	return d.promise();
}

function _tv_preloaded_app(id){
	//Костыль для запуска Браузера начиная с 2015 года
	if(id == '29_fullbrowser'){
		//TODO: брать параметр из настроек?
		widgetAPI.runSearchWidget(id,'http://google.com/');
	}else{
		widgetAPI.runSearchWidget(id,'');
	}
}


var Samsung_sources = {
	'TV': {0: 0},
	'HDMI': {
		0: 31,
		1: 32,
		2: 33
	},
	'VGA':{
		0: 27
	},
	'AV':{
		0: 15
	},
	'Ext': {
		0: 35
	}
};

function _tv_sources(show_all){

	if(fullscreen === true){
		tv_mode();
	}

	var tmp_arr;
	if(show_all){
		tmp_arr = ['USB', ['HDMI', 0], ['HDMI', 1], ['HDMI', 2], 'VGA', 'Ext', 'AV'];
		// 'RGB', 'SCART', 'SVIDEO', 'TV' not implemented yet
	}else{
		tmp_arr = config['tv']['allowed_sources']||[];
	}
	var tmp = '';
	for (var i = 0; i < tmp_arr.length; i++) {
		if(typeof(tmp_arr[i]) === 'string'){
			tmp += '<div id="tv_source_' + tmp_arr[i] + '_0" onvclick="_tv_source([\''+tmp_arr[i]+'\',0])" style="margin:0px;padding:10px">' + tmp_arr[i] + '</div>';
			//tmp_arr[i] = [tmp_arr[i], 0];
		}else{
			tmp += '<div id="tv_source_' + tmp_arr[i][0] + '_' + tmp_arr[i][1] + '" onvclick="_tv_source([\''+tmp_arr[i][0]+'\','+tmp_arr[i][1]+'])" style="margin:0px;padding:10px">' + tmp_arr[i][0] + (tmp_arr[i][1] + 1) + '</div>';
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

	//Простановка активных входов
	//Выключено до лучших времен
	//~ for (var i = 0; i < tmp_arr.length; i++) {
		//~ if(pluginObjectTVMW.SetSource(Samsung_sources[tmp_arr[i][0]][tmp_arr[i][1]]) != 1){
			//~ $('#tv_source_' + tmp_arr[i][0] + '_' + tmp_arr[i][1]).css('opacity', 0.4);
		//~ }
	//~ }
	//pluginObjectTVMW.SetSource(48);

}

var Samsung_external_source = false;
function _tv_source(param){
	$(window).trigger('analytics', {
		type: 'hitPage',
		target: param[0]
	});

	setVideoSize();

	document.body.style.backgroundColor = 'transparent';

	var tmp = Samsung_sources[param[0]][param[1]];
	if(tmp === 0 && Samsung_external_source === false){
		log.add('SOURCES: WARN source ' + tmp + ' is already active');
		return false;
	}
	if (pluginObjectTVMW.SetSource(tmp) === 1){
		if (tmp > 0){
			tv_keydown_override = _tv_keydown_external;

			videoCollection.destroy().done(function() {
				$('#container,#tv_cur,#tv_fullscreen_overlay').fadeOut(1000);
				_tv_bg_prepare();
			});

			Samsung_external_source = true;
		}
		else {
			tv_keydown_override = null;

			$.when($('#container,#tv_cur,#tv_fullscreen_overlay').fadeIn(1000)).done(function(){
				_tv_channel_stop();
				tv_sel_cur();
			});
			_tv_bg_restore();
			tv_sel_block();

			pluginObjectTVMW.SetSource(48);

			Samsung_external_source = false;
		}

		$('#tv_source_' + param[0] + '_' + param[1]).css('opacity', '');
		log.add('SOURCES: Source ' + param[0] + ':' + param[1] + ' changed');
		return true;
	}
	else {
		$('#tv_source_' + param[0] + '_' + param[1]).css('opacity', 0.4);
		log.add('Source ' + param[0] + ':' + param[1] +  ' inactive');
		return false;
	}
}

function _tv_source_v2(param){
	var d = $.Deferred();
	var tmp;

	if(typeof(param) == 'string'){
		tmp = Samsung_sources[param][0];
	}else{
		tmp = Samsung_sources[param[0]][param[1]];
	}

	_set_samsung_source(tmp)
	.done(function(q){
		d.resolve(q);
	})
	.fail(function(q){
		d.reject(q);
	});
	return d.promise();
}


function _tv_usb(){
	$(window).trigger('analytics', {
		type: 'hitPage',
		target: 'usb'
	});

	pluginObjectWindow.Open('NNavi','1.000','NNavi');
	pluginObjectWindow.Execute('SendEventToDevice', 41, 0); //SMART_APP_ALLSHARE_PANEL
}

function _tv_set_volume(value){
	pluginWindow.Open('Audio','1.000','Audio');
	pluginWindow.Execute('SetVolume',value);
	pluginWindow.Close();
}
function _tv_get_volume(){
	var d = $.Deferred();
	pluginWindow.Open('Audio','1.000','Audio');
	d.resolve(pluginWindow.Execute('GetVolume'));
	pluginWindow.Close();
	return d.promise();
}

function _tv_volup(){
	pluginWindow.Open('AppCommon','1.000','AppCommon');
	pluginWindow.Execute('SendKeyToTVViewer', tv_keys.VOL_UP);
	pluginWindow.Close();
}

function _tv_voldown(){
	pluginWindow.Open('AppCommon','1.000','AppCommon');
	pluginWindow.Execute('SendKeyToTVViewer', tv_keys.VOL_DOWN);
	pluginWindow.Close();
}

function _tv_mute(){
	pluginWindow.Open('Audio','1.000','Audio');
	pluginWindow.Execute('SetUserMute', !pluginWindow.Execute('GetUserMute'));
	pluginWindow.Close();
}
function _tv_get_mute(){
	var d = $.Deferred();
	pluginWindow.Open('Audio','1.000','Audio');
	d.resolve(pluginWindow.Execute('GetUserMute'));
	pluginWindow.Close();
	return d.promise();
}
function _tv_change_mute(mute) {
	/* mute == 1 (set mute)*/
	/* mute == 0 (set unmute)*/
	pluginWindow.Open('Audio','1.000','Audio');
	pluginWindow.Execute('SetUserMute',mute);
	pluginWindow.Close();
}


function _tv_reboot(){
	pluginWindow.Open('HOTEL','1.000','HOTEL');
	if(pluginWindow.Execute('SetPowerReboot') == 1){
		log.add('REBOOT SUCCESS ????');
	}else{
		log.add('REBOOT FAILED (not supported?)');
	}
	pluginWindow.Close();
}

function _tv_poweroff(){
	var tmp = pluginWindow.Open('HOTEL','1.000','HOTEL') && pluginWindow.Execute('SetPowerOff') && pluginWindow.Close();

	//Fallback for EA && EB
	if(tmp == 0){
		_get_power_state()
		.done(function(state){
			if(state != 0){
				pluginWindow.Open('AppCommon','1.000','AppCommon');
				pluginWindow.Execute('SendKeyToTVViewer', tv_keys.POWER);
				pluginWindow.Close();
			}
		});

		log.add('POWEROFF FAILED!!!');
	}
}

function _tv_poweron(){
	var tmp = pluginWindow.Open('HOTEL','1.000','HOTEL') && pluginWindow.Execute('SetPowerOn') && pluginWindow.Close();

	//Fallback for EA && EB
	if(tmp == 0){
		_get_power_state()
		.done(function(state){
			if(state == 0){
				pluginWindow.Open('AppCommon','1.000','AppCommon');
				pluginWindow.Execute('SendKeyToTVViewer', tv_keys.POWER);
				pluginWindow.Close();
			}
		});

		log.add('POWERON FAILED!!!');
	}
}


function _tv_get_network_info(){
	var d = $.Deferred();

	var out = {};

	pluginObjectWindow.Open('Network', '1.000', 'Network');
	var tmp_index = '1';
	out.type = 'ETH';
	out.ip = pluginObjectWindow.Execute('GetIP', tmp_index);
	if(out.ip == ''){
		tmp_index = '0';
		out.type = 'WIFI';
		out.ip = pluginObjectWindow.Execute('GetIP', tmp_index);
	}
	out.mac = pluginObjectWindow.Execute('GetMAC', tmp_index);
	out.mac = out.mac.match(/.{2}/g).join(':');
	pluginObjectWindow.Close();

	d.resolve(out);
	return d.promise();
}

function _tv_control_keys(){
	if (typeof tvKey === 'undefined') {
		return false;
	}

	if(('tv_key_source' in window) && tv_key_source == 'off'){
		log.add('KEYS: SOURCE OFF');
		pluginObj.registKey(tvKey.KEY_SOURCE);
	}else{
		log.add('KEYS: SOURCE ON');
	}

	if(('tv_key_menu' in window) && tv_key_menu == 'off'){
		log.add('KEYS: MENU OFF');
		pluginObj.registKey(tvKey.KEY_MENU);
	}else{
		log.add('KEYS: MENU ON');
	}

	pluginObj.registKey(tvKey.KEY_HOME);
	pluginObj.registKey(tvKey.KEY_ALARM);
	pluginObj.registKey(tvKey.KEY_GREEN);

	//Регистрация доп кнопок
	pluginWindow.Open('AppCommon','1.0000','AppCommon');
	pluginWindow.Execute('RegisterKey',2301);//Кнопка звонка в номер, активирует ДвернойГлазок
	pluginWindow.Close();

}

function _add_key_menu(){
	pluginObj.registKey(tv_keys.MENU);
}
function _remove_key_menu(){
	pluginObj.unregistKey(tv_keys.MENU);
}
function _add_volume_control(){
	pluginObj.registKey(tvKey.KEY_VOL_UP);
	pluginObj.registKey(tvKey.KEY_VOL_DOWN);
	pluginObj.registKey(tvKey.KEY_MUTE);
}
function _remove_volume_control(){
	pluginObj.unregistKey(tvKey.KEY_VOL_UP);
	pluginObj.unregistKey(tvKey.KEY_VOL_DOWN);
	pluginObj.unregistKey(tvKey.KEY_MUTE);
}

function _add_listener_TV(plugin) {
	plugin.detach_listener = pluginIPTV.OnEvent ? pluginIPTV.OnEvent : null;
	pluginIPTV.OnEvent = plugin.event_listener;
}
function _remove_listener_TV(plugin) {
	pluginIPTV.OnEvent = plugin.detach_listener ? plugin.detach_listener : function () {};
	plugin.detach_listener = null;
}

var _set_samsung_source_obj = {};
function _set_samsung_source(num){
	_set_samsung_source_obj.deferred = $.Deferred();

	if(pluginObjectTVMW.GetSource() == num){
		_set_samsung_source_obj.deferred.resolve('already on it');
	}else{

		if(pluginObjectTVMW.SetSource(num) != 1){
			_set_samsung_source_obj.deferred.reject('Failed to change Source');
		}else{
			_set_samsung_source_obj.expect = num;
			//All OK
		}

	}

	return _set_samsung_source_obj.deferred.promise();
}


function _tv_bt_on(){
	if(_tv_get_info.model().match(/ea/i) || _tv_get_info.model().match(/eb/i) || _tv_get_info.model().match(/ec/i)){ //2015+ only
		custom_alert('Bluetooth not supported');
		return false;
	}
	pluginObjectWindow.Open('HOTEL','1.000','HOTEL');
	pluginObjectWindow.Execute('RunHotelApp','BtApp','1');
	pluginObjectWindow.Close();
}
function _tv_bt_off(){
}

function _get_power_state() {
	var d = $.Deferred();

	pluginWindow.Open('TV','1.000','TV');
	var state = pluginWindow.Execute('GetPowerState');
	pluginWindow.Close();

	d.resolve(state !== 0);

	return d.promise();
}
