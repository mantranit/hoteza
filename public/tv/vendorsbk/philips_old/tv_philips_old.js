// "Opera/9.80 (Linux armv7l; HbbTV/1.2.1 (; Philips; 32HFL5009D12; ; PHILIPSTV;  CE-HTML/1.0 NETTV/4.4.1 SmartTvA/3.0.0 Firmware/004.002.024.128
// (PhilipsTV, 3.1.1,)en) ) Presto/2.12.407 Version/12.50"

var storage = window.localStorage;

// определяем переменную для плагина WIXP
var pluginWIXP;

function _tv_vendor_init(){
	var d = $.Deferred();

	$(document.body).append('<object style="visibility: hidden;position:absolute;" type="application/jswebixp" width="0" height="0" id="webixpObject" />');

	pluginWIXP = document.getElementById('webixpObject');
	pluginWIXP.WebIXPOnReceive = WIXPCallbackDispatcher;

	$(HotezaTV).one('splashshow', function(){
		tv_keys = {
			//EXIT: 8536,
			DOWN: 40,
			UP: 38,
			LEFT: 37,
			RIGHT: 39,
			ENTER: 13,
			BACK: 8,
			MENU: 462, // на пульте кнопка Options (справа внизу)
			RED: 403,
			GREEN: 404,
			YELLOW: 405,
			BLUE: 406,
			CH_UP: 33,
			CH_DOWN: 34,
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
			PAUSE: 19,
			STOP: 413,
			BACKWARD: 412,
			FORWARD: 417,
		};
	});

	d.resolve();
	return d.promise();
}
// ============ НАЧАЛО: специальные ф-ии для Philips WIXP Object (управление телеком) =============

function wixpPluginRequest(params){
	var response = null;
	try{
		response = pluginWIXP.WebIxpSend(JSON.stringify(params));
	} catch(wixpError) {
		log.add('wixpPluginRequest Error: ' + wixpError);
	}
	return response;
}

function WIXPCallbackDispatcher(JSONString) {
	var wixpJSON;
	try{
		log.add('Response: ' + JSONString);

		wixpJSON = JSON.parse(JSONString);
	}catch (Error){
		tv_log('WIXPCallbackDispatcher Error: ' + Error);
		log.add('WIXPCallbackDispatcher Error: ' + Error);
	}

	if (wixpJSON.Fun == 'PowerState' && wixpJSON.CmdType == 'Response'){
		tv_log('PowerState: ' + JSON.stringify(wixpJSON));
		log.add('PowerState: ' + JSON.stringify(wixpJSON));

		if(wixpJSON.CommandDetails.CurrentPowerState == 'Standby'){
			tv_virtual_standby_off();
		}else{
			tv_virtual_standby_on();
		}
	}
}
// ============ КОНЕЦ: специальные ф-ии для Philips WIXP Object (управление телеком) =============

//Wrapper blocking default Opera navigation
var handler = function(event){
	event.preventDefault();
	tv_keydown(event);
};

function _setHandlerKeydown() {
	document.removeEventListener('keydown', tv_keydown,false);
	document.addEventListener('keydown', tv_keydown,false);
}

function _tv_channel_params(id, action){
	var channels = (typeof (_tv_channels) != 'undefined' && tv_cur_block != 'tv_welcome') ? _tv_channels : tv_channels;

	var channel;
	if(typeof(id) == 'object'){
		channel = id;
	}else{
		channel = channels[id|0];
	}

	var param = false;
	var tvChannelUrl = 'multicast://127.0.0.1:1234';

	if(action.toLowerCase() == 'stop'){
		param = {
			'Svc': 'WIXP',
			'SvcVer': '1.0',
			'Cookie': 299,
			'CmdType': 'Change',
			'Fun': 'ChannelSelection',
			'CommandDetails': {
				'ChannelTuningDetails': {
					'URL': tvChannelUrl,
					'TrickMode': action,
				}
			}
		};
		return param;
	}

	if(channel['type'] == 'rf'){

		var freq = channel['protocol'].toString().split('#');
		if(freq[0]<1000){
			freq[0]*=1000000;
		}

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

				param = {
					'Svc': 'WIXP',
					'SvcVer': '1.0',
					'Cookie': 299,
					'CmdType': 'Change',
					'Fun': 'ChannelSelection',
					'CommandDetails': {
						'ChannelTuningDetails': {
							'TuningType': 'Analog',
							'Freq': freq[0]|0,
							'System': 'EastEurope',
						}
					}
				};

				log.add('TV: tuning to ANALOG ' + JSON.stringify(param));
				break;

			case 'CABLE':
			case 'CABLE_HRC':
			case 'CABLE_IRC':
			case 'CABLE_STD':
				param = {
					'Svc': 'WIXP',
					'SvcVer': '1.0',
					'Cookie': 299,
					'CmdType': 'Change',
					'Fun': 'ChannelSelection',
					'CommandDetails': {
						'ChannelTuningDetails': {
							'TuningType': 'DVBC',
							'Freq': freq[0]|0,
							'ServiceID': freq[1]|0,
							'ONID': 65535,
							'NID': 65535,
							'TSID': 65535,
							'Modulation': 'Auto'
						}
					}
				};

				log.add('TV: tuning to CABLE ' + JSON.stringify(param));
				break;

			case 'TERRESTRIAL':
				param = {
					'Svc': 'WIXP',
					'SvcVer': '1.0',
					'Cookie': 299,
					'CmdType': 'Change',
					'Fun': 'ChannelSelection',
					'CommandDetails': {
						'ChannelTuningDetails': {
							'TuningType': 'DVBT',
							'Freq': freq[0]|0,
							'ServiceID': freq[1]|0,
							'ONID': 65535,
							'NID': 65535,
							'TSID': 65535,
							'Modulation': 'Auto'
						}
					}
				};

				log.add('TV: tuning to DVBT ' + JSON.stringify(param));
				break;

			case 'TERRESTRIAL2':

				param = {
					'Svc': 'WIXP',
					'SvcVer': '1.0',
					'Cookie': 299,
					'CmdType': 'Change',
					'Fun': 'ChannelSelection',
					'CommandDetails': {
						'ChannelTuningDetails': {
							'TuningType': 'DVBT2',
							'Freq': freq[0]|0,
							'ServiceID': freq[1]|0,
							'ONID': 65535,
							'NID': 65535,
							'TSID': 65535,
							'Modulation': 'Auto'
						}
					}
				};

				log.add('TV: tuning to DVBT2 ' + JSON.stringify(param));
				break;

			default:
				param = {
					'Svc': 'WIXP',
					'SvcVer': '1.0',
					'Cookie': 299,
					'CmdType': 'Change',
					'Fun': 'ChannelSelection',
					'CommandDetails': {
						'ChannelTuningDetails': {
							'URL': tvChannelUrl,
							'TrickMode': action,
						}
					}
				};
				log.add('TV: tuning to DEFAULT '+JSON.stringify(param));

				break;
		}


		/*
		var broadcastType;
		if(channel['broadcastType']){
			broadcastType = channel['broadcastType'];
		}else{
			broadcastType = 'UNKNOWN';
		}

		var freq = channel['protocol'].split('#');

		var param = {
			"channelType":hcap.channel.ChannelType.RF,
			"frequency":freq[0]|0,
			"rfBroadcastType":hcap.channel.RfBroadcastType[broadcastType]
		};
		if(freq.length >= 2){
			param.programNumber = freq[1]|0;
		}
		if(freq.length >= 3){
			param.symbolRate = freq[2]|0;
			log.add('TV: custom symbolRate: ' + freq[2]);
		}
		*/

	}else{

		tvChannelUrl = 'multicast://' + channel['protocol'].trim() + ':' + ((channel['port']|0)||1234);
		param = {
			'Svc': 'WIXP',
			'SvcVer': '1.0',
			'Cookie': 299,
			'CmdType': 'Change',
			'Fun': 'ChannelSelection',
			'CommandDetails': {
				'ChannelTuningDetails': {
					'URL': tvChannelUrl,
					'TrickMode': action,
				}
			}
		};

	}

	return param;
}

function _tv_channel_show (id){
	var params = _tv_channel_params(id, 'Play');
	params.onSuccess = function() {
		tv_channellist_fade();
	};
	params.onFailure = function(e) {
		tv_log('requestChangeCurrentChannel() onFailure(param) - param :', e);
		tv_log('param.errorMessage : ' + e.errorMessage);
	};

	wixpPluginRequest(params);
}

function _tv_source(param){
	//TODO: реализовать сорсы
	return true;
}

function _setVideoSize(coords){
	//TODO: реализовать ресайз
	return true;
}

function _tv_channel_stop(){
	if(typeof(tv_cur_channel)!='undefined'){

		var params = _tv_channel_params(tv_cur_channel, 'Stop');
		params.onSuccess = function() {
			tv_channellist_fade();
		};
		params.onFailure = function(e) {
			tv_log('requestChangeCurrentChannel() onFailure(param) - param :', e);
			tv_log('param.errorMessage : ' + e.errorMessage);
		};

		wixpPluginRequest(params);
	}else{
	}
}

function _tv_bg_prepare(){
	$(document.body).get(0).style['background'] = 'none';
}
function _tv_bg_restore(){
	$(document.body).get(0).style['background'] = '';
}

function _tv_reboot(){
	var params = {
		'Svc': 'WebListeningServices',
		'SvcVer': '1.0',
		'Cookie': 295,
		'CmdType': 'Change',
		'Fun': 'PowerService',
		'CommandDetails': {
			'PowerAction': 'Reboot'
		}
	};

	wixpPluginRequest(params);
}

function _tv_get_network_info(){
	var d = $.Deferred();
	return d.promise();
}

function _tv_set_volume(value){
	return true;
}

function _add_listener_TV() {

}
function _remove_listener_TV() {

}

var _tv_get_info = {
	_model: null,
	_firmware: null,
	model: function(){
		if(!this._model){
			var tmp = ua.match(/philips; (\w+);/);
			if(tmp){
				this._model = ua.match(/philips; (\w+);/)[1];
			}else{
				this._model = 'unknown';
			}
		}

		return this._model;
	},
	firmware: function(){
		if(!this._firmware){
			var tmp = ua.match(/firmware\/([\w\.]+) /);
			if(tmp){
				this._firmware = ua.match(/firmware\/([\w\.]+) /)[1];
			}else{
				this._firmware = 'unknown';
			}
		}

		return this._firmware;
	}
};
// TODO: переписать (реализовать)
function _get_power_state() {
	var d = $.Deferred();
	d.resolve(true);
	return d.promise();
}
