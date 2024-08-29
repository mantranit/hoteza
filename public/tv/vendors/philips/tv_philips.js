// "Opera/9.80 (Linux armv7l; HbbTV/1.2.1 (; Philips; 32HFL5009D12; ; PHILIPSTV;  CE-HTML/1.0 NETTV/4.4.1 SmartTvA/3.0.0 Firmware/004.002.024.128
// (PhilipsTV, 3.1.1,)en) ) Presto/2.12.407 Version/12.50"
// "mozilla/5.0 (linux; andr0id 9.0; tpm181he build/ptt1.181130.001) applewebkit/537.36 (khtml, like gecko) chrome/49.0.2623.112 safari/537.36 opr/32.0.2128.0 omi/4.8.0.129.sprinter9.19(;philips;philipstv;43hfl5114/12;tpm181he_r.105.001.158.002;_tv_5596;japit-wixp-version-4.7;) nettv/8.1.2"


var storage = window.localStorage;

function _tv_keydown_app(e) {
	if(!e) {e = event;}
	var code = getKeyCode(e);
	switch(code) {
		case tv_keys.INPUT:
		case tv_keys.EXIT:
		case tv_keys.MENU:
			_tv_preloaded_app_close();
			break;

		// case tv_keys.YOUTUBE:
		// 	_tv_preloaded_app('YouTube');
		// 	break;

		// case tv_keys.CAST:
		// 	_tv_miracast();
		// 	break;

		default:
			break;
	}
}

$(document.body).append('<script src="tv/vendors/philips/wixp_plugin.js" defer></script>');

function _tv_vendor_init() {
	var d = $.Deferred();

	_tv_get_info.init();

	$(HotezaTV).one('final', function() {

		_initMiracastName();

		$(document.body).append(
			'<div id="vidDiv" style="position: absolute; width: 125%; height:125%; top:0; right:0; z-index: -1">' +
				'<object id="vidObject" style="position:absolute;" type="video/broadcast" width="100%" height="100%" />' +
			'</div>'
		);

	});

	$(HotezaTV).one('splashshow', function() {
		tv_keys = {
			//EXIT: 8536,
			DOWN: VK_DOWN,
			UP: VK_UP,
			LEFT: VK_LEFT,
			RIGHT: VK_RIGHT,
			ENTER: VK_ENTER,
			BACK: VK_BACK,
			MENU: VK_MENU, // на пульте кнопка Options (справа внизу)
			GUIDE: VK_GUIDE,
			RED: VK_RED,
			GREEN: VK_GREEN,
			YELLOW: VK_YELLOW,
			BLUE: VK_BLUE,
			CH_UP: VK_CHANNEL_UP,
			CH_DOWN: VK_CHANNEL_DOWN,
			NUM_0: VK_0,
			NUM_1: VK_1,
			NUM_2: VK_2,
			NUM_3: VK_3,
			NUM_4: VK_4,
			NUM_5: VK_5,
			NUM_6: VK_6,
			NUM_7: VK_7,
			NUM_8: VK_8,
			NUM_9: VK_9,

			YOUTUBE: VK_YOUTUBE,
			NETFLIX: VK_NETFLIX,
			CAST: VK_CAST,

			// VOD кнопка(и)
			PLAY: 415,
			PAUSE: 19,
			STOP: 413,
			BACKWARD: 412,
			FORWARD: 417,

			VOL_UP: 447,
			VOL_DOWN: 448,
			MUTE: 449,

			TV: VK_TV
		};

		_tv_control_keys();

		//UserData cleared manually on checkout
		__setProperty('ClearUserData', 'Off');
	});

	d.resolve();
	return d.promise();
}

//Wrapper blocking default Opera navigation
var handler = function(event) {
	event.preventDefault();
	tv_keydown(event);
};
var handler2 = function(event) {
	var tmp = event.detail.split(',');
	if(tmp[1] == 2) {
		return false;
	}
	tv_keydown({
		keyCode: parseInt(tmp[0]),
		shiftKey: false
	});
};

function _setHandlerKeydown() {
	document.removeEventListener('keydown', handler, false);
	document.addEventListener('keydown', handler, false);
	document.addEventListener('OnKeyReceived', handler2, false);
}


function _tv_channel_params(id) {
	var channels = (typeof (_tv_channels) != 'undefined' && tv_cur_block != 'tv_welcome') ? _tv_channels : tv_channels;

	var channel;
	if(typeof (id) == 'object') {
		channel = id;
	} else {
		channel = channels[id | 0];
	}

	var param = false;

	if(channel['type'] == 'rf') {

		var freq = channel['protocol'].toString().split('#');
		if(freq[0] < 1000) {
			freq[0] *= 1000000;
		}

		switch(channel['broadcastType']) {
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
					'SvcVer': SvcVer,
					'Cookie': 299,
					'CmdType': 'Change',
					'Fun': 'ChannelSelection',
					'CommandDetails': {
						'ChannelTuningDetails': {
							'TuningType': 'Analog',
							'Freq': freq[0] | 0,
							'System': 'EastEurope',
						}
					}
				};

				//TODO: Реализовать поддержку всех форматов "WestEurope" "EastEurope" "UK" "France"

				log.add('TV: tuning to ANALOG ' + JSON.stringify(param));
				break;

			case 'CABLE':
			case 'CABLE_HRC':
			case 'CABLE_IRC':
			case 'CABLE_STD':
				param = {
					'Svc': 'WIXP',
					'SvcVer': SvcVer,
					'Cookie': 299,
					'CmdType': 'Change',
					'Fun': 'ChannelSelection',
					'CommandDetails': {
						'ChannelTuningDetails': {
							'TuningType': 'DVBC',
							'Freq': freq[0] | 0,
							'ServiceID': freq[1] | 0,
							'SymbolRate': 0, //Auto TODO: подстановка из параметров, как везде
							'ONID': 65535,
							'NID': 65535,
							'TSID': 65535,
							'Modulation': 'Auto' //TODO: подстановка из параметров, как везде (но лучше по-новому)
						}
					}
				};

				log.add('TV: tuning to CABLE ' + JSON.stringify(param));
				break;

			case 'TERRESTRIAL':
				param = {
					'Svc': 'WIXP',
					'SvcVer': SvcVer,
					'Cookie': 299,
					'CmdType': 'Change',
					'Fun': 'ChannelSelection',
					'CommandDetails': {
						'ChannelTuningDetails': {
							'TuningType': 'DVBT',
							'Freq': freq[0] | 0,
							'ServiceID': freq[1] | 0,
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
					'SvcVer': SvcVer,
					'Cookie': 299,
					'CmdType': 'Change',
					'Fun': 'ChannelSelection',
					'CommandDetails': {
						'ChannelTuningDetails': {
							'TuningType': 'DVBT2',
							'Freq': freq[0] | 0,
							'ServiceID': freq[1] | 0,
							'ONID': 65535,
							'NID': 65535,
							'TSID': 65535,
							'Modulation': 'Auto'
						}
					}
				};

				if(freq.length > 2) {
					param['PLP'] = freq[2] | 0;
				}

				log.add('TV: tuning to DVBT2 ' + JSON.stringify(param));
				break;

			default:
				param = {
					'Svc': 'WIXP',
					'SvcVer': SvcVer,
					'Cookie': 299,
					'CmdType': 'Change',
					'Fun': 'ChannelSelection',
					'CommandDetails': {
						'ChannelTuningDetails': {
							'URL': '',
							'TrickMode': 'Play'
						}
					}
				};
				log.add('TV: tuning to DEFAULT ' + JSON.stringify(param));

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

	} else {

		var tvChannelUrl = 'multicast://' + channel['protocol'].trim() + ':' + ((channel['port'] | 0) || 1234);
		param = {
			'Svc': 'WIXP',
			'SvcVer': SvcVer,
			'Cookie': 299,
			'CmdType': 'Change',
			'Fun': 'ChannelSelection',
			'CommandDetails': {
				'ChannelTuningDetails': {
					'URL': tvChannelUrl,
					'TrickMode': 'Play'
				}
			}
		};

	}

	return param;
}

function _tv_channel_show(id, coords) {
	var params = _tv_channel_params(id);
	params.onSuccess = function() {
		tv_channellist_fade();
	};
	params.onFailure = function(e) {
		console.log('requestChangeCurrentChannel() onFailure(param) - param :', e);
		console.log('param.errorMessage : ' + e.errorMessage);
	};

	wixpPluginRequest(params);

	setVideoSize(coords);
}

var Philips_sources = {
	'TV': {0: 'MainTuner'},
	'HDMI': {
		0: 'HDMI1',
		1: 'HDMI2',
		2: 'HDMI3'
	}
};
function _tv_sources(show_all) {

	if(fullscreen === true) {
		tv_mode();
	}

	var tmp_arr = [];

	if(show_all) {
		tmp_arr = [['HDMI', 0], ['HDMI', 1], ['HDMI', 2], 'SideHDMI', 'VGA', 'SideAV'];
	} else {
		tmp_arr = config['tv']['allowed_sources'] || [];
	}
	var tmp = '';
	for(var i = 0; i < tmp_arr.length; i++) {
		if(typeof (tmp_arr[i]) == 'string') {
			tmp += '<div id="tv_source_' + tmp_arr[i] + '_0" onvclick="_tv_source(\'' + tmp_arr[i] + '\')" style="margin:0px;padding:10px">' + tmp_arr[i] + '</div>';
		} else {
			tmp += '<div id="tv_source_' + tmp_arr[i][0] + '_' + tmp_arr[i][1] + '" onvclick="_tv_source(\'' + tmp_arr[i][0] + (tmp_arr[i][1] + 1) + '\')" style="margin:0px;padding:10px">' + tmp_arr[i][0] + (tmp_arr[i][1] + 1) + '</div>';
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
function _tv_source(param) {
	if(typeof param === 'object') {
		param = Philips_sources[param[0]][param[1]];
	}

	wixpAction('Source', 'Change', {
		'TuneToSource': param
	});
}

function _tv_channel_stop() {
	if(typeof (tv_cur_channel) != 'undefined') {

		// wixpAction('ChannelSelection', 'Change', {
		// 	"ChannelTuningDetails": {
		// 		"URL": "multicast://127.0.0.1:1234",
		// 		"TrickMode": 'Stop'
		// 	}
		// })
		// .done(function(){
		// 	tv_channellist_fade();
		// })
		// .fail(function(err){
		// 	console.log("Channel Stop ERROR");
		// });
		var params = {
			'Svc': 'WIXP',
			'SvcVer': SvcVer,
			'Cookie': 299,
			'CmdType': 'Change',
			'Fun': 'ChannelSelection',
			'CommandDetails': {
				'ChannelTuningDetails': {
					'URL': 'multicast://127.0.0.1:1234',
					'TrickMode': 'Stop'
				}
			}
		};

		params.onSuccess = function() {
			tv_channellist_fade();
		};
		params.onFailure = function(e) {
			console.log('requestChangeCurrentChannel() onFailure(param) - param :', e);
			console.log('param.errorMessage : ' + e.errorMessage);
		};

		wixpPluginRequest(params);
	} else {
	}
}

function _tv_bg_prepare() {
	$(document.body).get(0).style['background'] = 'none';
}
function _tv_bg_restore() {
	$(document.body).get(0).style['background'] = '';
}

function _tv_reboot() {
	wixpAction('PowerState', 'Change', {
		'PowerAction': 'Reboot'
	});
}

function _tv_get_network_info() {
	var d = $.Deferred();
	wixpAction('ProfessionalSettingsControl', {
		'ProfessionalSettingsParameters': ['NetworkStatus']
	}).done(function(data) {
		wixpAction('ProfessionalSettingsControl', {
			'ProfessionalSettingsParameters': ['NetworkSettings']
		}).done(function(data2) {
			var out = {
				mac: data.CommandDetails.NetworkStatus.EthernetMACAddress.toLowerCase(),
				ip: data.CommandDetails.NetworkStatus.IPAddress
			};
			switch(data2.CommandDetails.NetworkSettings.NetworkType) {
				case 'Wired':
					out.type = 'ETH';
					break;
				case 'Wireless':
					out.type = 'WIFI';
					break;
				default:
					out.type = 'UNKNOWN';
					break;
			}
			d.resolve(out);

		});

	});
	return d.promise();
}

var calc_volume = (function() {
	// максимально возможная горомкость
	// настраивается в Системном меню
	var maxVolume = 100,
		scaleOnTv = 60;

	wixpAction('ProfessionalSettingsControl', {
		'ProfessionalSettingsParameters': ['VolumeLimits']
	}).done(function(data) {
		maxVolume = data.CommandDetails.VolumeLimits.MaxVolume;
	});

	return function(value, type) {
		var volume;
		if(type === 'absolute') {
			volume = Math.round((value / maxVolume) * scaleOnTv);
		}
		else if(type === 'percent') {
			volume = Math.round((value * maxVolume) / scaleOnTv);
		}

		return volume;
	};
})();
function _tv_get_volume() {
	var d = $.Deferred();

	wixpAction('AudioControl', {
		'AudioControlParameters': ['Volume']
	}).done(function(data) {
		d.resolve(calc_volume(data.CommandDetails.Volume, 'absolute'));
	}).fail(function() {
		d.resolve(null);
	});

	return d.promise();
}
function _tv_set_volume(value) {
	try {
		value = parseInt(value);
	}
	catch(e) {
		log.add('Error: ' + e.message);
		return false;
	}

	wixpAction('AudioControl', 'Change', {
		'Volume': calc_volume(value, 'percent')
	});

	return true;
}

//TODO: do
function _add_listener_TV() {

}
//TODO: do
function _remove_listener_TV() {

}

var _tv_get_info = {
	_model: null,
	_firmware: null,
	_serial_number: null,
	init: function() {
		wixpAction('ProfessionalSettingsControl', {
			'ProfessionalSettingsParameters': ['TVModel']
		}).done(function(data) {
			_tv_get_info._model = data.CommandDetails.TVModel;
		});

		wixpAction('ProfessionalSettingsControl', {
			'ProfessionalSettingsParameters': ['SerialNumber']
		}).done(function(data) {
			_tv_get_info._serial_number = data.CommandDetails.SerialNumber;
		});

		wixpAction('UpgradeControl', {
			'UpgradeControlRequestParameters': ['CurrentMainSoftwareVersion']
		}).done(function(data) {
			var list = data.CommandDetails.UpgradeControlParameters;
			for(var i = 0; i < list.length; i++) {
				var element = list[i];
				if(element.CloneItemName === 'MainFirmware') {
					_tv_get_info._firmware = element.CloneItemVersionNo;
					break;
				}
			}
		});
	},
	model: function() {
		if(this._model === null) {
			_tv_get_info.init();
		}

		return this._model;
	},
	firmware: function() {
		if(this._firmware === null) {
			_tv_get_info.init();
		}

		return this._firmware;
	},
	serial_number: function() {
		if(this._serial_number) {
			return this._serial_number;
		}
	}
};

function _tv_get_preloaded_app_list(raw) {
	var d = $.Deferred();

	wixpAction('ApplicationControl', {
		'RequestListOfAvailableApplications': {
			'Filter': [
				'Native', 'NonNative'
			]
		}
	}).done(function(res) {
		var list = res.CommandDetails.CurrentAvailableApplicationList;

		var out = [];
		for(var i = 0; i < list.length; i++) {
			out.push({
				id: list[i].ApplicationAndroidPackageName ? list[i].ApplicationAndroidPackageName : list[i].ApplicationName + '_ID',
				name: list[i].ApplicationName,
				icon: ''
			});
		}
		d.resolve(out);
	}).fail(function(e) {
		d.reject();
	});

	return d.promise();
}
function _tv_preloaded_app(id) {
	var d = $.Deferred();
	wixpAction(
		'ApplicationControl',
		'Change',
		{
			'ApplicationDetails': {
				'ApplicationAndroidPackageName': id
			},
			'ApplicationState': 'Activate'
		}
	)
	.done(function(){
		d.resolve();
	})
	.fail(function(error){
		if(error == 'timeout'){
			// No success response on application launch
			d.resolve();
		}else{
			d.reject();
		}
	});
	return d.promise();
}
function _tv_preloaded_app_by_name(name) {
	wixpAction(
		'ApplicationControl',
		'Change',
		{
			'ApplicationDetails': {
				'ApplicationName': name
			},
			'ApplicationState': 'Activate'
		}
	);
}
function _tv_preloaded_app_close(id) {
	if(id) {
		wixpAction(
			'ApplicationControl',
			'Change',
			{
				'ApplicationDetails': {
					'ApplicationName': id
				},
				'ApplicationState': 'Deactivate'
			}
		);
	} else {
		_tv_get_active_app().done(function(activeApp) {
			wixpAction(
				'ApplicationControl',
				'Change',
				{
					'ApplicationDetails': {
						'ApplicationName': activeApp
					},
					'ApplicationState': 'Deactivate'
				}
			);
		});
	}
}



function _tv_switch_app(appName) {
	_tv_get_active_app().done(function(activeApp) {
		if(activeApp === null) {
			// ни одно приложение не было запущенно - запускаем
			_tv_preloaded_app(appName);
			tv_keydown_override = _tv_keydown_app;
			return false;
		}

		if(activeApp == 'VolumeControl') {
			log.add('Cant exit from VolumeControl');
			return false;
		}

		// деактивируем активное приложение
		_tv_preloaded_app(activeApp, true);
		tv_keydown_override = null;

		// если было запущенно другое приложение - запускаем
		if(appName && activeApp !== appName) {
			_tv_switch_app(appName);
		}
	});
}
function _tv_get_active_app() {
	var d = $.Deferred();

	wixpAction('ApplicationControl', null, null).done(function(res) {
		var activeApps = res.CommandDetails.ActiveApplications;
		for(var i = 0; i < activeApps.length; i++) {
			var activeApp = activeApps[i];
			if(activeApp.ApplicationName !== 'CustomDashboard') {
				return d.resolve(activeApp.ApplicationName);
			}
		}

		return d.resolve(null);
	});

	return d.promise();
}

function _tv_poweroff() {
	wixpAction('PowerState', 'Change', {
		'ToPowerState': 'Standby'
	});
}
function _tv_poweron() {
	wixpAction('PowerState', 'Change', {
		'ToPowerState': 'On'
	});
}
function _tv_volup() {
	_tv_get_volume().done(function(value) {
		if(!value) {
			return false;
		}

		value += 1;
		value = value > 60 ? 60 : value;

		_tv_set_volume(value);
	});
}
function _tv_voldown() {
	_tv_get_volume().done(function(value) {
		if(!value) {
			return false;
		}

		value -= 1;
		value = value < 0 ? 0 : value;

		_tv_set_volume(value);
	});
}
function _tv_mute() {
	wixpAction('AudioControl', 'Change', {
		'AudioMute': 'On'
	});
}
function _tv_change_mute() {
}
//Треш и угар. Установка стартовой громкости делает mute.
// wixpAction('AudioControl', {
// 	"AudioControlParameters": [
// 		"AudioMute"
// 	]
// }).done(function (data) {
// 	var mute = data.CommandDetails.AudioMute,
// 		nextState = mute === 'On' ? 'Off' : 'On';

// 	wixpAction('AudioControl', 'Change', {
// 		"AudioMute": nextState
// 	});
// });

function _tv_usb() {
	_tv_preloaded_app_by_name('Media');
}
var Miracast = 'Miracast';
function _tv_miracast() {
	_tv_preloaded_app_by_name(Miracast);
}
// В новых моделях ТВ приложение Miracast называется Googlecast или Chromecast,
// Поэтому инициализируем имя в момент загрузки ТВ
function _initMiracastName() {
	wixpAction('ApplicationControl', {
		'RequestListOfAvailableApplications': {
			'Filter': [
				'Native', 'NonNative'
			]
		}
	}).done(function(res) {
		for(var i = 0; i < res.CommandDetails.CurrentAvailableApplicationList.length; i++) {
			var appName = res.CommandDetails.CurrentAvailableApplicationList[i].ApplicationName;
			if(
				appName === 'Googlecast' ||
				appName === 'Chromecast'
			) {
				Miracast = appName;
				break;
			}
		}
	});
}

function _tv_youtube() {
	_tv_preloaded_app('com.google.android.youtube.tv');
}
function _tv_bt_on() {
	custom_alert('Bluetooth not supported');
}
function _tv_bt_off() {
}

var __keys_list = [
	{'vkkey': 'HBBTV_VK_TV'},
	{'vkkey': 'HBBTV_VK_SOURCE'},
	{'vkkey': 'HBBTV_VK_GUIDE'},
	{'vkkey': 'HBBTV_VK_BACK'},
	{'vkkey': 'HBBTV_VK_MENU'},
	{'vkkey': 'HBBTV_VK_INFO'},
	{'vkkey': 'HBBTV_VK_OPTIONS'},
	{'vkkey': 'HBBTV_VK_ALARM'},

	{'vkkey': 'HBBTV_VK_CHANNEL_UP'},
	{'vkkey': 'HBBTV_VK_CHANNEL_DOWN'},

	{'vkkey': 'HBBTV_VK_RED'},
	{'vkkey': 'HBBTV_VK_GREEN'},
	{'vkkey': 'HBBTV_VK_YELLOW'},
	{'vkkey': 'HBBTV_VK_BLUE'},

	{'vkkey': 'HBBTV_VK_0'},
	{'vkkey': 'HBBTV_VK_1'},
	{'vkkey': 'HBBTV_VK_2'},
	{'vkkey': 'HBBTV_VK_3'},
	{'vkkey': 'HBBTV_VK_4'},
	{'vkkey': 'HBBTV_VK_5'},
	{'vkkey': 'HBBTV_VK_6'},
	{'vkkey': 'HBBTV_VK_7'},
	{'vkkey': 'HBBTV_VK_8'},
	{'vkkey': 'HBBTV_VK_9'},

	{'vkkey': 'HBBTV_VK_CHANNELGRID'},
	{'vkkey': 'HBBTV_VK_SMARTINFO'},
	{'vkkey': 'HBBTV_VK_INFO'},
	{'vkkey': 'HBBTV_VK_CLOCK'},
	{'vkkey': 'HBBTV_VK_EXTERNAL_YPBPR'},
	{'vkkey': 'HBBTV_VK_SETTINGS'},
	{'vkkey': 'HBBTV_VK_YOUTUBE'},
	{'vkkey': 'HBBTV_VK_CAST'},
	{'vkkey': 'HBBTV_VK_NETFLIX'}
];

function _tv_control_keys() {
	wixpAction('UserInputControl', 'Change', {
		'VirtualKeyForwardMode': 'SelectiveVirtualKeyForward',
		'VirtualKeyToBeForwarded': __keys_list
	});
}
function _tv_control_keys_off() {
	wixpAction('UserInputControl', 'Change', {
		'VirtualKeyForwardMode': 'DontForwardAnyVirtualKey'
	});
}

function __addKeyItem(key) {
	for(var i = (__keys_list.length - 1); i >= 0; i--) {
		if(__keys_list[i].vkkey == key) {
			return true;
		}
	}
	__keys_list.push({'vkkey': key});
	_tv_control_keys();
}
function __removeKeyItem(key) {
	for(var i = (__keys_list.length - 1); i >= 0; i--) {
		if(__keys_list[i].vkkey == key) {
			__keys_list.splice(i, 1);
			_tv_control_keys();
		}
	}
}

function _add_key_menu() {
	__addKeyItem('HBBTV_VK_MENU');
}
function _remove_key_menu() {
	__removeKeyItem('HBBTV_VK_MENU');
}
function _add_volume_control() {
	__addKeyItem('HBBTV_VK_VOLUME_UP');
	__addKeyItem('HBBTV_VK_VOLUME_DOWN');
}

function _remove_volume_control() {
	__removeKeyItem('HBBTV_VK_VOLUME_UP');
	__removeKeyItem('HBBTV_VK_VOLUME_DOWN');
}

function __getProperty(property) {
	var d = $.Deferred();

	wixpAction('ProfessionalSettingsControl', {
		'ProfessionalSettingsParameters': [property]
	}).done(function(data) {
		d.resolve(data.CommandDetails[property]);
	}).fail(function(err) {
		if(err && err.CommandDetails) {
			d.reject(err.CommandDetails);
		} else {
			d.reject(err);
		}
	});

	return d.promise();
}

function __setProperty(property, value) {
	var d = $.Deferred();

	var ProfessionalSettingsParameters = {};
	ProfessionalSettingsParameters[property] = value;

	wixpAction('ProfessionalSettingsControl', 'Change', ProfessionalSettingsParameters)
		.done(function(data) {
			d.resolve(data.CommandDetails[property]);
		}).fail(function(err) {
			if(err && err.CommandDetails) {
				d.reject(err.CommandDetails);
			} else {
				d.reject(err);
			}
		});

	return d.promise();
}

function _setVideoSize(coords) {
	var width, height, top, left;
	if(coords) {
		width = coords.width;
		//Hack. Philips restarts channel on resize if it was started fullscreen
		if(width == 1280) {
			width = 1279;
		}

		height = coords.height;
		left = typeof coords.left === 'undefined' ? 'auto' : coords.left;
		top = coords.top;
	}
	else {
		width = '125%';
		height = '125%';
		top = 0;
		left = 'auto';
	}

	$('#vidDiv').css({
		'top': top,
		'left': left,
		'width': width,
		'height': height,
	});
}

// плэйер
var PLAYER_EVENTS = [
	'loadstart',
	'playing',
	'error',
	'stalled',
	'seeking',
	'abort',
	'canplay',
	'emptied',
	'ended',
	'pause',
	'play',
	'timeupdate'
];

function _player_start(ctx) {
	console.log('Player start');

	if(PLAYER_INIT) {return;}

	if(typeof ctx.mimeType == 'undefined' || ctx.mimeType === 'video/mp4') {create_video();}
	else if(ctx.mimeType === 'audio/mp3') {create_audio();}

	_add_listener_player(ctx);

	ctx.media.load();
	PLAYER_INIT = true;

	function create_video() {
		ctx.media = document.createElement('video');

		ctx.media.setAttribute('src', ctx.url);
		ctx.media.setAttribute('type', 'video/mp4');
		ctx.media.classList.add('player');

		ctx.container.classList.add('video');
		// ctx.container.appendChild(ctx.media);
		document.body.appendChild(ctx.media);
	}
	function create_audio() {
		ctx.media = document.createElement('video');
		ctx.media.setAttribute('src', ctx.url);
		ctx.media.setAttribute('type', 'audio/mp3');
		ctx.media.setAttribute('autoplay', 'true');

		ctx.container = document.body;
		ctx.container.appendChild(ctx.media);
	}
}
function _player_play(ctx) {
	console.log('Player play');
	console.log(ctx);

	ctx.url = encodeString(ctx.url);
	ctx.url = setLocationURL(ctx.url);

	ctx.started = true;
	ctx.stopped = false;

	if(!PLAYER_INIT) {_player_start(ctx);}
	if(ctx.loop) {ctx.media.setAttribute('loop', 'loop');}
	ctx.media.setAttribute('type', ctx.mimeType ? ctx.mimeType : 'video/mp4');

	if(ctx.mimeType === 'audio/mp3') {return;}

	ctx.media.play();
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
function _player_resize(ctx) {
	if(ctx === null) {
		return false;
	}

	var coords = ctx.coords ? ctx.coords : {
		top: 0,
		left: 0,
		width: 1280,
		height: 720
	};

	var width = coords.width,
		height = coords.height,
		left = coords.left,
		top = coords.top;

	$(ctx.media).css({
		position: 'absolute',
		width: width,
		height: height,
		top: top,
		left: left
	});
}
function _player_destroy(ctx) {
	console.log('Player destroy');
	console.log(ctx);

	var d = $.Deferred();
	ctx.stopped = true;

	if(ctx.container && ctx.media) {
		document.body.removeChild(ctx.media);
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
	d.resolve(player.media.duration * 1000);
	return d.promise();
}
function _get_play_position_video(player) {
	var d = $.Deferred();
	d.resolve(player.media.currentTime * 1000);
	return d.promise();
}
function _set_play_position_video(player) {
	if(player.direct === 'forward') {
		player.media.currentTime = (player.currentTime + player.time) / 1000;
	} else {
		player.media.currentTime = (player.currentTime - player.time) / 1000;
	}
}

function _add_listener_player(player) {
	if(!player.eventListener) {return;}

	for(var i = 0; i < PLAYER_EVENTS.length; i++) {
		player.media.addEventListener(PLAYER_EVENTS[i], player.eventListener);
	}
}
function _remove_listener_player(player) {
	if(!player.eventListener) {return;}

	for(var i = 0; i < PLAYER_EVENTS.length; i++) {
		player.media.removeEventListener(PLAYER_EVENTS[i], player.eventListener);
	}
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

function _get_power_state() {
	var d = $.Deferred();

	wixpAction('PowerState', 'Request')
		.done(function(data) {
			d.resolve(data.CommandDetails.CurrentPowerState != 'Standby');
		})
		.fail(function(err) {
			d.reject(err);
		});

	return d.promise();
}

function _tv_checkin(){
	var d = $.Deferred();
	wixpAction('PMS', 'Change', {
		'PMSParameters': {
			'Action': 'CheckIn'
		}
	})
	.done(function(){
		d.resolve();
	})
	.fail(function(){
		d.reject();
	});
	return d.promise();
}
function _tv_checkout(){
	wixpAction('EssentialControl', 'Change', {
		'Action': [
		'ClearDataNow'
		]
	});
	wixpAction('PMS', 'Change', {
		'PMSParameters': {
			'Action': 'CheckOut'
		}
	});
}

function _tv_netflix(){
	var d = $.Deferred();
	_tv_preloaded_app('com.netflix.ninja')
	.done(function(){
		d.resolve();
	})
	.fail(function(){
		d.reject();
	});
	return d.promise();
}