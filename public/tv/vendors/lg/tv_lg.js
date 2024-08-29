var storage = window.localStorage;
var currentExternalInput = 1;

function _tv_vendor_init() {
	var d = $.Deferred();

	var hcap_version;
	if(isset('config.tv.hacks.lg_old')){
		hcap_version = '20';
		log.add('LG: loading old hcap (20)');
	}else{
		hcap_version = '24';
	}

	css_append('tv/vendors/lg/lg.css', 'vendor_css');

	//TODO: проверить замену на importScript
	$.cachedScript('tv/lib/lg/hcap_' + hcap_version + '.js')
	.done(function(){

		//Отключение No signal на ТВ
		__setProperty('tv_channel_attribute_floating_ui', '0')
			.done(function() {
			})
			.fail(function(error) {
				log.add('INIT: failed to remove floating ui: ' + error);
			});

		//Стоп канала при загрузке системы
		_tv_channel_stop();

		//Установка пустого стартового канала
		__tv_blank_startup_channel();

		//Поддержка Virtual Standby
		__tv_virtual_standby_init();

		//Быстрое выключение ТВ
		__tv_on_destroy_init();
		//-------------------

		//Инициализация прослушки событий Bluetooth
		__tv_bt_init();
		//-------------------

		//Инициализация прослушки переключения сорцов
		document.addEventListener('external_input_changed', _listenerExternalInputChanged, false);

		tv_keys = hcap.key.Code;

		_tv_get_info.init();
		d.resolve();
	});

	$(HotezaTV).one('final', function() {
		//Прослушка порта на получение комманд на выключение ТВ по SDAP
		//__sdap_emulation_init(); //Нужно ли уже вообще?
		//------------------

		// Установка соотношения сторон
		if(isset('config.tv.aspect_ratio')) {
			_tv_set_aspect_ratio(config.tv.aspect_ratio);
		}
		//-------------------

		// Перехват управления LG скринсейвера
		_tv_screensaver_control();
		//-------------------

		//Установка имени ТВ для BT и WiFi
		__setProperty('tv_name', 'Room ' + tv_room);
		//-------------------

		//FullHD обработка
		ServiceCodes.registerListener('1920', function() {
			__getProperty('display_resolution')
				.done(function(d) {
					if(d == '1920x1080') {
						__setProperty('display_resolution', '1280x720')
							.done(function() {
								custom_alert('HD720 SET');
								setTimeout(tv_reboot, 2000);
							});
					} else {
						if(__hcap_compare('1.20') >= 0){
							__setProperty('display_resolution', '1920x1080')
								.done(function() {
									custom_alert('FULLHD SET');
									setTimeout(tv_reboot, 2000);
								})
								.fail(function() {
									custom_alert('FULLHD failed');
								});
						}else{
							custom_alert('FULLHD not supported (hcap)');
						}
					}
				});
		});
		if(isset('config.tv.hacks.lg_fullhd_on') == true){
			if(__hcap_compare('1.20') >= 0){
				__getProperty('display_resolution')
					.done(function(d) {
						if(d == '1280x720') {
							__setProperty('display_resolution', '1920x1080')
								.done(function() {
									log.add('FULLHD turned on');
									tv_reboot();
								})
								.fail(function() {
									log.add('FULLHD unable to turn on');
								});
						}
					});
			}else{
				log.add('FULLHD not supported (hcap)');
			}
		}
		//---------------------

	});
	return d.promise();
}

function _tv_channel_show(id, coords) {
	var channels = getChannels();

	var channel;
	if(typeof (id) === 'object') {
		channel = id;
	} else {
		channel = channels[id | 0];
	}

	if(!channel) {
		log.add('TV: ERROR! Tried to show nonexistent channel: ' + id);
		return false;
	}

	//Channel Background
	if(channel.background) {
		if(!$id('tv_channel_background')) {
			$(document.body).prepend('<iframe id="tv_channel_background" style="position:absolute;top:0px;left:0px;width:' + ww + 'px;height:' + wh + 'px;border:0;"></iframe>');
		}
		$id('tv_channel_background').src = channel.background;
	} else {
		if($id('tv_channel_background')) {
			$('#tv_channel_background').remove();
		}
	}
	//===

	var param = _tv_channel_params(channel);

	if(param === false) {
		log.add('Channel show error: false response');
		return false;
	}

	param.onSuccess = function() {
		if(tv_cur_block === 'tv_channellist') {
			tv_channellist_fade();
		}
	};
	param.onFailure = function(e) {
		log.add('requestChangeCurrentChannel() onFailure(param) - param :', e);
		log.add('param.errorMessage : ' + e.errorMessage);
		// tv_log("requestChangeCurrentChannel() onFailure(param) - param :", e);
		// tv_log("param.errorMessage : " + e.errorMessage);
	};

	hcap.channel.requestChangeCurrentChannel(param);

	// при переходе на каналы растягиваем видео на весь экран,
	// иначе каналы будут проигрываться в теге HTML5.video
	setVideoSize(coords);
}

function _setVideoSize(coords) {
	coords.width = isset('config.tv.hacks.lg_magic_pixel') ?
		coords.width - 1 : coords.width;

	var coef = 1;
	//TODO: сделать нормальное задание коэффициента
	if($('html').hasClass('hd720upscaled')) {
		coef = 1.5;
	}

	hcap.video.setVideoSize({
		'x': coords.left * coef,
		'y': coords.top * coef,
		'width': coords.width * coef,
		'height': coords.height * coef,
		'onSuccess': function() {
			//log.add("onSuccess resize video");
		},
		'onFailure': function(e) {
			log.add('Error setting LG video size: ' + e.errorMessage);
		}
	});
}

function _tv_channel_stop() {

	//Channel Background
	if($id('tv_channel_background')) {
		$('#tv_channel_background').remove();
	}
	//===

	hcap.channel.stopCurrentChannel({
		'onSuccess': function() {
		},
		'onFailure': function(f) {
			log.add('TV: ChannelStop failure: ' + f.errorMessage);
		}
	});
}

function _tv_bg_prepare() {
	document.body.style.background = 'url(tv:)';
}
function _tv_bg_restore() {
	document.body.style.background = '';
}

function _setHandlerKeydown() {
	document.removeEventListener('keydown', tv_keydown, false);
	document.addEventListener('keydown', tv_keydown, false);

	//Обработка доп кнопок
	hcap.key.clearKeyTable({
		'onSuccess': function() {
		},
		'onFailure': function(f) {
			log.add('KEYS: failed to clear key table - ' + f.errorMessage);
		}
	});

	if(('tv_key_source' in window) && tv_key_source == 'off') {
		log.add('SOURCE KEY OFF');
		__addKeyItem(hcap.key.Code.INPUT, 'SOURCE');
	} else {
		log.add('SOURCE KEY ON');
	}

	if(('tv_key_menu' in window) && tv_key_menu == 'off') {
		log.add('MENU KEY OFF');
		__addKeyItem(hcap.key.Code.MENU, 'MENU');
	} else {
		log.add('MENU KEY ON');
	}

	//LG Wallpaper
	__addKeyItem(hcap.key.Code.SMART_HOME, 'SMART_HOME');
	window.removeEventListener('mousemove', _setPointerOn);
	window.addEventListener('mousemove', _setPointerOn);

	//buttons block
	__addKeyItem(hcap.key.Code.AD, 'AD');
	__addKeyItem(hcap.key.Code.ALARM, 'ALARM');
	__addKeyItem(hcap.key.Code.APPS, 'APPS');
	__addKeyItem(hcap.key.Code.LIST, 'LIST');
	__addKeyItem(hcap.key.Code.ENERGY_SAVING, 'ENERGY SAVING');
	//-------------

	function _setPointerOn() {
		if(hcap.mouse) {
			hcap.mouse.setPointerOn({
				'isOn': false,
				'onSuccess': function() {
				},
				'onFailure': function() {
				}
			});
		}
	}
}

function __sdap_emulation_init() {
	hcap.socket.openUdpDaemon({
		'port': 30002,
		'onSuccess': function() {
			log.add('SDAP: UDP SOCKET Success');
		},
		'onFailure': function(f) {
			log.add('SDAP: UDP SOCKET Failure : ' + f.errorMessage);
		}
	});
	document.addEventListener(
		'udp_data_received',
		function(param) {
			log.add('SDAP: received ' + param.data);
			switch(param.data) {
				case '<SDAP/1.0>SERVER 100 SYSTEM FULL_POWEROFF </SDAP/1.0>':
					_tv_poweroff();
					break;
				case '<SDAP/1.0>SERVER 100 REBOOT INSTANT </SDAP/1.0>':
					tv_reboot();
					break;
				default:
					break;
			}
		},
		false
	);
}

function _tv_set_startup_channel(id) {
	param = _tv_channel_params(id);
	param.onSuccess = function() {
		log.add('TV: startup channel set');
	};
	param.onFailure = function(e) {
		log.add('TV: startup channel fail. param: ' + e.errorMessage);
	};
	hcap.channel.setStartChannel(param);
}
function __tv_blank_startup_channel() {
	var param = {
		'channelType': hcap.channel.ChannelType.IP,
		'ip': '230.0.0.0',
		'port': 1234,
		'ipBroadcastType': hcap.channel.IpBroadcastType.UDP
	};

	param.onSuccess = function() {
		log.add('TV: startup channel set BLANK');
	};
	param.onFailure = function(e) {
		log.add('TV: startup blank channel fail. param: ' + e.errorMessage);
	};
	hcap.channel.setStartChannel(param);
}

function _tv_channel_params(channel) {
	var param = {};
	if(channel['type'] === 'rf') {

		var broadcastType;
		if(channel['broadcastType']) {
			broadcastType = channel['broadcastType'];
		} else {
			broadcastType = 'UNKNOWN';
		}

		//terrestrial2 patch
		if(broadcastType === 'TERRESTRIAL2') {
			broadcastType = 'TERRESTRIAL_2';
		}

		var freq = channel['protocol'].toString().split('#');
		if(freq[0] < 1000) {
			freq[0] *= 1000000;
		}

		param = {
			'channelType': hcap.channel.ChannelType.RF,
			'frequency': freq[0] | 0,
			'rfBroadcastType': hcap.channel.RfBroadcastType[broadcastType]
		};
		if(freq.length >= 2) {
			param.programNumber = freq[1] | 0;
		}
		//TODO: передеалть на обратную логику, от типа к параметрам
		if(freq.length >= 3) {
			if(broadcastType === 'TERRESTRIAL_2') {
				param.plpId = freq[2] | 0;
			} else if(broadcastType === 'SATELLITE' || broadcastType === 'SATELLITE_2') {
				param.satelliteId = freq[2] | 0;
				param.polarization = hcap.channel.Polarization.UNKNOWN;
			} else {
				param.symbolRate = freq[2] | 0;
				log.add('TV: custom symbolRate: ' + freq[2]);
			}
		}

	} else {

		param = {
			'channelType': hcap.channel.ChannelType.IP,
			'ip': channel['protocol'].trim(),
			'port': (channel['port'] | 0) || 1234
		};

		if(channel['broadcastType'] == 'RTP') {
			param['ipBroadcastType'] = hcap.channel.IpBroadcastType.RTP;
		} else {
			param['ipBroadcastType'] = hcap.channel.IpBroadcastType.UDP;
		}

	}

	return param;
}
var _Media = {
	play: function(data){
		var d = $.Deferred();

		var param = _tv_channel_params({type: data.type, protocol: data.param.protocol, port: data.param.port, broadcastType: data.param.broadcastType});

		param.onSuccess = function() {
			d.resolve();
		};
		param.onFailure = function(f) {
			d.reject(f.errorMessage);
		};

		hcap.channel.requestChangeCurrentChannel(param);
		return d.promise();
	},
	stop: function(){
		var d = $.Deferred();
		hcap.channel.stopCurrentChannel({
			'onSuccess': function() {
				d.resolve();
			},
			'onFailure': function(f) {
				d.reject(f.errorMessage);
			}
		});
		return d.promise();
	}
};
function _tv_time_set() {
	var d = new Date(time.now());
	hcap.time.setLocalTime({
		'year': d.getUTCFullYear(),
		'month': d.getUTCMonth() + 1,
		'day': d.getUTCDate(),
		'hour': d.getUTCHours(),
		'minute': d.getUTCMinutes(),
		'second': d.getSeconds(),
		'gmtOffsetInMinute': Math.round(time.tz / 1000 / 60),
		'isDaylightSaving': false,
		'onSuccess': function() {
			log.zero += time.dof;
			time.dof = 0;
			time.set();
		},
		'onFailure': function(f) {
			log.add('TV: clock set error = ' + f.errorMessage);
		}
	});
}

function _tv_get_sync_cur_audio() {
	var d = $.Deferred();

	hcap.channel.getCurrentChannelAudioLanguageIndex({
		'onSuccess': function(s) {
			d.resolve(s.index);
		},
		'onFailure': function(f) {
			log.add('onFailure getCurrentChannelAudioLanguageIndex : errorMessage = ' + f.errorMessage);
		}
	});

	return d.promise();
}
function _tv_get_sync_audio() {
	var d = $.Deferred();
	hcap.channel.getCurrentChannelAudioLanguageList({
		'onSuccess': function(s) {
			d.resolve(s.list.split(','));
			log.add('onSuccess : list = ' + s.list);
		},
		'onFailure': function(f) {
			d.resolve(null);
			// if (trace == 'bottom_info') {
			// 	tv_mosaic.build_bottom_information(channel);
			// }
		}
	});
	return d.promise();
}
function _tv_get_audio() {
	hcap.channel.getCurrentChannelAudioLanguageList({
		'onSuccess': function(s) {
			// tv_log("onSuccess : list = " + s.list);
		},
		'onFailure': function(f) {
			tv_log('onFailure getCurrentChannelAudioLanguageList: errorMessage = ' + f.errorMessage);
		}
	});
}
function _tv_change_audio() {
	var tmp = {index: 0, list: ['default']};

	try {
		hcap.channel.getCurrentChannelAudioLanguageList({
			'onSuccess': function(s) {
				tv_cur_channel_audio = s.list.split(',');
				if(tv_cur_channel_audio.length < 2) {
					tv_cur_channel_audio = null;
				}

				hcap.channel.getCurrentChannelAudioLanguageIndex({
					'onSuccess': function(s) {
						audio_info = s.index;

						if(tv_cur_channel_audio) {
							if(++audio_info > (tv_cur_channel_audio.length - 1)) {
								audio_info = 0;
							}

							_tv_set_audio(audio_info);

							tv_cur_audio_display({index: audio_info, list: tv_cur_channel_audio});
						} else {
							//tv_log('Only one track');
							return false;
						}

					},
					'onFailure': function(f) {
						//tv_log("onFailure : errorMessage = " + f.errorMessage);
					}
				});

			},
			'onFailure': function(f) {
				//tv_log("onFailure : errorMessage = " + f.errorMessage);
			}
		});
	} catch(e) {
		log.add('TV: audio change error');
	}
}
function _tv_set_audio(index) {
	hcap.channel.setCurrentChannelAudioLanguageIndex({
		'index': index|0,
		'onSuccess': function() {
			//console.log("onSuccess");
		},
		'onFailure': function(f) {
			//console.log("onFailure : errorMessage = " + f.errorMessage);
		}
	});
}

function _get_media_audio(player) {
	var d = $.Deferred();

	player.media.getAudioLanguage({
		'onSuccess': function(s) {
			d.resolve(s.list.split(','));
		},
		'onFailure': function(f) {
			log.add('onFailure : errorMessage = ' + f.errorMessage);
		}
	});

	return d.promise();
}
function _get_media_subtitles(VOD) {
	var d = $.Deferred(),
		subtitles_arr = VOD.structureAssoc.films[VOD.id].subtitles,
		subtitle_obj = {},
		subtitle,
		subtitle_code;

	if(typeof subtitles_arr === 'undefined' || subtitles_arr.length === 0) {
		d.resolve(null);
	}
	else {
		for(var i = 0; i < subtitles_arr.length; i++) {
			subtitle = subtitles_arr[i];
			subtitle_code = Object.keys(subtitle)[0];
			subtitle_obj[subtitle_code] = subtitle[subtitle_code];
		}

		d.resolve(subtitle_obj);
	}

	return d.promise();
}
function _set_media_audio(player, index) {
	player.media.setAudioLanguage({
		'index': index,
		'onSuccess': function() {},
		'onFailure': function(f) {
			log.add('onFailure : errorMessage = ' + f.errorMessage);
		}
	});
}
function _set_media_subtitle(player, url) {
	player.media.setSubtitleUrl({
		'subtitleUrl': url,
		'onSuccess': function() {},
		'onFailure': function(f) {
			log.add('onFailure : errorMessage = ' + f.errorMessage);
		}
	});
}
function _switch_subtitle(player, flag) {
	player.media.setSubtitleOn({
		'subtitleOn': flag,
		'onSuccess': function() {},
		'onFailure': function(f) {
			log.add('onFailure : errorMessage = ' + f.errorMessage);
		}
	});
}

function _get_duration_video(player) {
	var d = $.Deferred();

	player.media.getInformation({
		'onSuccess': function(s) {
			d.resolve(s.contentLengthInMs);
		},
		'onFailure': function(f) {
			tv_log('onFailure getInformation: errorMessage = ' + f.errorMessage);
		}
	});

	return d.promise();
}
function _get_play_position_video(player) {
	var d = $.Deferred();

	if(!player.media) {
		log.add('media is undefined');
		clearInterval(player.progress_timer);
		return d.reject({message: '_get_play_position_video() failed'});
	}

	player.media.getPlayPosition({
		'onSuccess': function(s) {
			player.currentTime = s.positionInMs;
			d.resolve(s.positionInMs);
		},
		'onFailure': function(f) {
			log.add('onFailure getPlayPosition: errorMessage = ' + f.errorMessage);
			d.reject(f);
		}
	});

	return d.promise();
}
function _set_play_position_video(player) {
	if(typeof player.currentTime === 'undefined') {
		player.currentTime = 0;
	}
	if(player.direct === 'backward' && player.currentTime < player.time) {
		player.play(null, 'init');
	}
	var currentTime = player.direct === 'forward' ? player.currentTime + player.time : player.currentTime - player.time;

	player.media.setPlayPosition({
		'positionInMs': currentTime,
		'onSuccess': function() {},
		'onFailure': function(f) {
			log.add('onFailure setPlayPosition : errorMessage = ' + f.errorMessage);
		}
	});
}

// плэйер
function _player_start(ctx) {
	if(PLAYER_INIT) {
		if(typeof ctx.callback !== 'undefined') {
			ctx.callback();
		}

		return;
	}

	hcap.Media.startUp({
		onSuccess: function() {
			PLAYER_INIT = true;

			if(typeof ctx.callback !== 'undefined') {
				ctx.callback();
			}
		},
		onFailure: function(e) {
			tv_log('Error message: ' + e.errorMessage);
			tv_log('fail startup');
		}
	});
}
function _player_play(ctx) {
	ctx.url = encodeString(ctx.url);
	ctx.url = setLocationURL(ctx.url);

	ctx.started = true;

	ctx.mimeType = (!ctx.mimeType) ? 'video/mp4' : ctx.mimeType;
	ctx.stopped = false;
	if(!PLAYER_INIT) {
		_player_start({callback: _play.bind(null, ctx)});
		return;
	}

	_play(ctx);

	function _play(ctx) {
		var media_obj = {
			url: ctx.url,
			mimeType: ctx.mimeType
		};

		if(ctx.drm == 'PROIDIOM'){
			media_obj.drmType = 'PROIDIOM';
			media_obj.sessionId = __createSessionId();
		}

		ctx.media = hcap.Media.createMedia(media_obj);

		document.addEventListener('media_event_received', ctx.eventListener);

		ctx.media.play({
			repeatCount: ctx.loop ? 0 : 1,
			onSuccess: function() {},
			onFailure: function(e) {
				tv_log('Error message: ' + e.errorMessage);
				tv_log('fail play media');
			}
		});

		function __createSessionId(){
			return a2hex('HOT' + lz(get_hotelId(), 3) + lz(time.date.getUTCDate()) + lz((time.date.getUTCMonth() + 1)) + lz(time.date.getUTCFullYear().toString().slice(2)) + lz(time.date.getUTCHours()) + lz(time.date.getUTCMinutes())).toUpperCase();
		}
	}
}
function _player_stop(ctx) {
	var d = $.Deferred();

	ctx.media.stop({
		onSuccess: function() {
			d.resolve();
		},
		onFailure: function(f) {
			tv_log('onFailure stop: errorMessage = ' + f.errorMessage);
			d.reject(f.errorMessage);
		}
	});

	return d.promise();
}
function _player_pause(ctx) {
	// case: navigate VS onvclick
	// navigate => pause VS onvclick => stop
	// pause throw error
	if(ctx.stopped) {
		return false;
	}

	ctx.paused = true;
	ctx.media.pause({
		'onSuccess': function() {
			// tv_log("onSuccess pause");
		},
		'onFailure': function(f) {
			tv_log('onFailure : errorMessage = ' + f.errorMessage);
		}
	});
}
function _player_resume(ctx) {
	ctx.paused = false;
	ctx.media.resume({
		'onSuccess': function() {
			// tv_log("onSuccess resume");
		},
		'onFailure': function(f) {
			tv_log('onFailure : errorMessage = ' + f.errorMessage);
		}
	});
}
function _player_resize(ctx) {
	if(ctx.stopped) {
		return false;
	}
	setVideoSize(ctx.coords);
}
function _player_destroy(ctx) {
	var d = $.Deferred();

	// case: navigate VS onvclick
	// navigate => pause VS onvclick => stop
	// pause throw error
	ctx.stopped = true;

	if(ctx.media) {
		ctx.media.stop({
			onSuccess: function() {
				ctx.media.destroy({
					onSuccess: function() {
						ctx.media = undefined;

						document.removeEventListener('media_event_received', ctx.eventListener);

						d.resolve();
						/*hcap.Media.shutDown({
							onSuccess : function() {
							},
							onFailure : function(f) {
								tv_log("onFailure shutDown: errorMessage = " + f.errorMessage);
							}
						});*/
					},
					onFailure: function(f) {
						tv_log('onFailure destroy: errorMessage = ' + f.errorMessage);
					}
				});
			},
			onFailure: function(f) {
				tv_log('onFailure stop: errorMessage = ' + f.errorMessage);
			}
		});
	}
	else {
		// PLAYER_INIT = false;
		document.removeEventListener('media_event_received', ctx.eventListener);
		d.resolve();
	}

	return d.promise();
}
function _player_shutdown() {
	var d = $.Deferred();

	hcap.Media.shutDown({
		onSuccess: function() {
			PLAYER_INIT = false;
			d.resolve();
		},
		onFailure: function(f) {
			PLAYER_INIT = false;
			log.add('onFailure shutDown: errorMessage = ' + f.errorMessage);
			d.resolve();
		}
	});

	return d.promise();
}

function _tv_miracast() {
	try {
		__tv_preloaded_app_by_name('miracast');//for 760
		__tv_preloaded_app_by_name('Screen Share');//for 761
	} catch(e) {
		log.add('TV: Miracast failed');
	}
}

function _tv_preloaded_app(id) {
	hcap.preloadedApplication.launchPreloadedApplication({
		'id': id.toString(),
		'onSuccess': function() {},
		'onFailure': function(f) {
			tv_log('Application with id - ' + id + ' is not available');
			log.add('TV: failed to launch app: ' + id + ' ' + f.errorMessage);
		}
	});
}

//TODO: переделать получение списка
function __tv_preloaded_app_by_name(name) {
	hcap.preloadedApplication.getPreloadedApplicationList({
		'onSuccess': function(s) {
			for(var i = 0; i < s.list.length; i++) {
				//log.add(s.list[i].title + ' / ' + s.list[i].id);
				if(s.list[i].title.toLowerCase() === name.toLowerCase()) {
					//tv_log(s.list[i].id);
					Apps.launch({
						id: s.list[i].id,
						name: s.list[i].title
					});
				}
			}
		},
		'onFailure': function(f) {
			log.add('TV: failed to get APP list');
		}
	});
}
function _tv_sources(show_all) {
	var tmp_arr = [];
	if(show_all) {
		tmp_arr = ['USB', ['HDMI', 0], ['HDMI', 1], ['HDMI', 2], 'COMPONENT', 'RGB', 'SCART', 'SVIDEO', 'TV'];
	} else {
		tmp_arr = config['tv']['allowed_sources'] || [];
	}
	var tmp = '';
	for(var i = 0; i < tmp_arr.length; i++) {
		if(typeof (tmp_arr[i]) == 'string') {
			tmp += '<div id="tv_source_' + hcap.externalinput.ExternalInputType[tmp_arr[i]] + '_0" onvclick="_tv_source([\'' + tmp_arr[i] + '\',0])" style="margin:0px;padding:10px">' + tmp_arr[i] + '</div>';
			tmp_arr[i] = [tmp_arr[i], 0];
		} else {
			tmp += '<div id="tv_source_' + hcap.externalinput.ExternalInputType[tmp_arr[i][0]] + '_' + tmp_arr[i][1] + '" onvclick="_tv_source([\'' + tmp_arr[i][0] + '\',' + tmp_arr[i][1] + '])" style="margin:0px;padding:10px">' + tmp_arr[i][0] + (tmp_arr[i][1] + 1) + '</div>';
		}

		//Connected check and mark
		hcap.externalinput.isExternalInputConnected({
			'type': hcap.externalinput.ExternalInputType[tmp_arr[i][0]],
			'index': tmp_arr[i][1],
			'onSuccess': function(s) {
				var param = JSON.parse(this.param_text);
				if(s.isConnected) {
				} else {
					$('#tv_source_' + param.type + '_' + param.index).css('opacity', 0.4);
				}
			},
			'onFailure': function(f) {
				var param = JSON.parse(this.param_text);
				$('#tv_source_' + param.type + '_' + param.index).css('text-decoration', 'line-through');
				log.add('Source ' + param.type + ':' + param.index + ' not supported');
			}
		});
		//------------------------

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
	$(window).trigger('analytics', {
		type: 'hitPage',
		target: param[0]
	});

	setVideoSize();

	hcap.externalinput.setCurrentExternalInput({
		'type': hcap.externalinput.ExternalInputType[param[0]],
		'index': param[1],
		'onSuccess': function() {
			log.add('Source ' + param[0] + ':' + param[1] + ' changed');
			//tv_log("Source changed");
		},
		'onFailure': function(f) {
			log.add('Source ' + param[0] + ':' + param[1] + ' change error = ' + f.errorMessage);
			//tv_log("Source change error = " + f.errorMessage);
		}
	});

	return true;
}

function _listenerExternalInputChanged() {
	hcap.externalinput.getCurrentExternalInput({
		'onSuccess': function(s) {
			if(s.type == 8) return;

			if(s.type != currentExternalInput) {
				currentExternalInput = s.type;

				if(s.type > 1) {
					tv_keydown_override = _tv_keydown_external;

					videoCollection.destroy().done(function() {
						_tv_bg_prepare();
						$('#container,#tv_cur,#tv_fullscreen_overlay').fadeOut(1000);
					});

				}else{
					tv_keydown_override = null;
					_tv_bg_restore();
					tv_sel_block();
					$.when($('#container,#tv_cur,#tv_fullscreen_overlay').fadeIn(1000)).done(function() {
						_tv_channel_stop();
					});
				}
			}
		},
		'onFailure': function(f) {
			log.add('SOURCE: can\'t get current input ' + f.errorMessage);
		}
	});
}

function _tv_usb() {

	hcap.preloadedApplication.getPreloadedApplicationList({
		'onSuccess': function(s) {
			var apps_ids = [];
			for(var i = 0; i < s.list.length; i++) {
				apps_ids.push(s.list[i].id);
			}
			//Список USB приложений расставленных по приоритету запуска, установленные приложения зависят от модели ТВ
			var usb_apps = [
				'244115188075859007',// External Connector
				'144115188075855882',// SmartShare
				'144115188075855874',// LT SmartShare
				'201604211753030001'// Photo & Video
			];
			usb_apps = usb_apps.filter(function(n) {
				return apps_ids.indexOf(n) !== -1;
			});
			if(usb_apps.length) {
				var tmp = usb_apps[0];
				log.add('USB: launching USB app ' + tmp);
				Apps.launch({
					id: tmp,
					name: 'USB'
				});
			} else {
				log.add('USB: unable to get suitable USB app');
			}
		},
		'onFailure': function(f) {
			console.log('USB: failed to get APPS list');
		}
	});

}

function _tv_netflix(){
	var d = $.Deferred();

	if(__hcap_compare('1.24') >= 0){
		__tv_netflix_prepare()
		.done(function(){
			__tv_netflix_run()
			.done(function(){
				d.resolve();
			})
			.fail(function(f){
				d.reject(f);
			});
		})
		.fail(function(f){
			d.reject(f);
		});
	}else{
		d.reject('hcap too low');
	}

	return d.promise();
}

function __tv_netflix_prepare(){
	// eslint-disable-next-line 
	function _0x4f5f(_0x5041f8,_0x2cbf8e){var _0x2fc055=_0x329e();return _0x4f5f=function(_0x3a3ce2,_0xda0bf4){_0x3a3ce2=_0x3a3ce2-0x1ec;var _0x329ec8=_0x2fc055[_0x3a3ce2];return _0x329ec8;},_0x4f5f(_0x5041f8,_0x2cbf8e);}var _0x39f60b=_0x4f5f;function _0x329e(){var _0x2a1e7d=['830194JVZRVn','1477145qxCnbo','toString','5656752JYkQpY','13017732QJzhOA','243228hJIhDb','(((.+)+)+)+$','12RPoHUN','395460RQzVcV','1105','dec','U2FsdGVkX1/oDzjTyA16okE6TweMuCfhht4Vs/F7nWjZ5GCQq5XTQ/p4gVwQmnV5\x0aavnvAfRZIcVNOdTWSAkYHs+4s5WYLYyeIFV9SRIbFziAr7Gx3lfF+prm0HkEtYcV\x0a/nS7zK15MIg8x4gvxQRORomDqEeNXs4nTaYEC5wXkmPIMSurC1ey2oeiIUjr12kM\x0aOcA3Sr/Q3LnJx0rimMaqaodD8L9vqiSv/H0m9sjDNNOAaZ1iGlotB3Va4e7mvj9t\x0aeUOqLUACi8bBU3oSF8PpjXoY+gvjLmpeRZdFNrJnpJDY6pILfFKQ8577baW8Tz3v\x0aYJpAmKWxoTI0Qjs+TUBzm0hccr1YWJp5VynLgTPWmgl5DzNlmTh7u1BRqPSR3mw+\x0ab2Em+TwztEt9SNEMhCQRy/tx5BlIfEZ/G6WsSXshJ+TkuPWFJBtk3Jad2mbTOsYP\x0agIBz4NVxpIWnYnzsLAH1cVUrrKPy69NHNFBAMYg8Mp0=','constructor','99xhtsVF','search','443024UqxRUW'];_0x329e=function(){return _0x2a1e7d;};return _0x329e();}(function(_0x5e7d67,_0x459a32){var _0x1db6ab=_0x4f5f,_0x3d1e95=_0x5e7d67();while(!![]){try{var _0x4c6e29=-parseInt(_0x1db6ab(0x1f8))/0x1+parseInt(_0x1db6ab(0x1f7))/0x2+-parseInt(_0x1db6ab(0x1ec))/0x3*(parseInt(_0x1db6ab(0x1ee))/0x4)+parseInt(_0x1db6ab(0x1ef))/0x5+parseInt(_0x1db6ab(0x1fa))/0x6+parseInt(_0x1db6ab(0x1fb))/0x7+-parseInt(_0x1db6ab(0x1f6))/0x8*(parseInt(_0x1db6ab(0x1f4))/0x9);if(_0x4c6e29===_0x459a32)break;else _0x3d1e95['push'](_0x3d1e95['shift']());}catch(_0x3ceb50){_0x3d1e95['push'](_0x3d1e95['shift']());}}}(_0x329e,0xec1d6));var _0xda0bf4=(function(){var _0x185929=!![];return function(_0x2ec5b9,_0xa70b02){var _0x2dec85=_0x185929?function(){if(_0xa70b02){var _0x7348a4=_0xa70b02['apply'](_0x2ec5b9,arguments);return _0xa70b02=null,_0x7348a4;}}:function(){};return _0x185929=![],_0x2dec85;};}()),_0x3a3ce2=_0xda0bf4(this,function(){var _0x49a5ae=_0x4f5f;return _0x3a3ce2['toString']()[_0x49a5ae(0x1f5)](_0x49a5ae(0x1ed))[_0x49a5ae(0x1f9)]()[_0x49a5ae(0x1f3)](_0x3a3ce2)[_0x49a5ae(0x1f5)](_0x49a5ae(0x1ed));});_0x3a3ce2(); //jshint ignore: line
	var d = $.Deferred();
	Apps.check('netflix')
	.done(function(data){
		d.resolve();
	})
	.fail(function(){
		try {
			__tv_netflix_register(GibberishAES[_0x39f60b(0x1f1)](_0x39f60b(0x1f2),_0x39f60b(0x1f0)))
			.done(function(){
				d.resolve();
			})
			.fail(function(f){
				d.reject(f);
			});
		}catch(e){
			d.reject(e);
		}

/*
		Loader.stop();

		custom_input({
			title: 'Enter CODE',
			onConfirm: function(input){
				Loader.start();
				try {
					__tv_netflix_register()
					.done(function(){
						d.resolve();
					})
					.fail(function(f){
						d.reject(f);
					});
				}catch(e){
					d.reject(e);
				}
			},
			onCancel: function(){
				Loader.start();
			}
		});
*/
	});
	return d.promise();
}

function __tv_netflix_register(token){
	var d = $.Deferred();
	hcap.application.RegisterSIApplicationList({
		'tokenList': [{'id': 'netflix','token': token}],
		'onSuccess': function(s) {
			window.addEventListener(
				'application_registration_result_received', function(data){
					if(data.tokenResult == 'success'){
						d.resolve();
					}else{
						d.reject(data.errorText);
					}
				},
				{'once': true}
			);
		},
		'onFailure': function(f) {
			d.reject(f.errorMessage);
		}
	});
	return d.promise();
}
function __tv_netflix_params(){
	var out = {
		'reason': 'launcher',
		'params': {
			'hotel_id': 'h' + get_hotelId(),
			'launcher_version': '1.0'
		}
	};
	return out;
}
function __tv_netflix_run(){
	var d = $.Deferred();
	
	hcap.preloadedApplication.launchPreloadedApplication({
		'id': '244115188075859013',
		'parameters': JSON.stringify(__tv_netflix_params()),
		'onSuccess': function() {
			d.resolve();
		},
		'onFailure': function(f) {
			d.reject(f.errorMessage);
		}
	});
	
	return d.promise();
}

function _tv_get_preloaded_app_list(raw) {
	var d = $.Deferred();

	hcap.preloadedApplication.getPreloadedApplicationList({
		'onSuccess': function(s) {
			var out = [];
			for(var index in s.list) {
				var app = s.list[index];
				out.push({
					id: app.id,
					name: app.title,
					icon: app.iconFilePath
				});
			}
			if(raw) {
				d.resolve(s.list);
			} else {
				d.resolve(out);
			}
		},
		'onFailure': function(f) {
			console.log('_tv_get_preloaded_app_list: onFailure');
			log.add('_tv_get_preloaded_app_list: onFailure');

			d.reject('failure');
		}
	});

	return d.promise();
}

function _tv_set_volume(value) {
	var d = $.Deferred();
	hcap.volume.setVolumeLevel({
		'level': value,
		'onSuccess': function() {
			if(value != -1){
				__tv_last_volume = value;
			}
			d.resolve();
		},
		'onFailure': function(f) {
			log.add('TV: volume change failure = ' + f.errorMessage);
			d.reject();
		}
	});
	return d.promise();
}
function _tv_get_volume(){
	var d = $.Deferred();
	hcap.volume.getVolumeLevel({
		'onSuccess': function(data) {
			d.resolve(data.level);
		},
		'onFailure': function(f) {
			log.add('TV: get volume failure = ' + f.errorMessage);
		}
	});
	return d.promise();
}

function _tv_volup() {

	hcap.key.sendKey({
		'virtualKeycode': hcap.key.Code.VOL_UP,
		'onSuccess': function() {
		},
		'onFailure': function(f) {
			log.add('volup send failed: ' + f.errorMessage);
		}
	});
}

function _tv_voldown() {
	hcap.key.sendKey({
		'virtualKeycode': hcap.key.Code.VOL_DOWN,
		'onSuccess': function() {
		},
		'onFailure': function(f) {
			log.add('voldown send failed: ' + f.errorMessage);
		}
	});
}

//NOTE: not working on LT760. volume set is 1 less than expected, set -1 do not work
var __tv_last_volume = 5;
function _tv_mute() {
	var d = $.Deferred();
	_tv_get_mute()
	.done(function(data){
		if(data){
			_tv_set_volume(__tv_last_volume)
			.done(function(){
				d.resolve();
			})
			.fail(function(){
				d.reject();
			});
		}else{
			_tv_get_volume()
			.done(function(_data){
				__tv_last_volume = _data;
				_tv_set_volume(-1)
				.done(function(){
					d.resolve();
				})
				.fail(function(){
					d.reject();
				});
			})
			.fail(function(){
				log.add('VOLUME: get volume failed when mute');
				d.reject();
			});
		}
	})
	.fail(function(){
		log.add('VOLUME: failed to get mute');
	});
	return d.promise();
}
function _tv_get_mute(){
	var d = $.Deferred();
	_tv_get_volume()
	.done(function(data){
		if(data == -1){
			d.resolve(true);
		}else{
			d.resolve(false);
		}
	})
	.fail(function(){
		log.add('VOLUME: get volume for mute failed');
		d.reject('get volume failed');
	});
	return d.promise();
}

function _tv_change_mute(mute) {
	if(mute){
		_tv_get_volume()
		.done(function(data){
			if(data != '-1'){
				_tv_mute();
			}
		});
	}else{
		_tv_get_volume()
		.done(function(data){
			if(data == '-1'){
				_tv_mute();
			}
		});
	}
}
function _tv_reboot() {
	hcap.power.reboot({
		'onSuccess': function() {
			log.add('REBOOT SUCCESS ????');
		},
		'onFailure': function(f) {
			log.add('REBOOT Failed ' + f.errorMessage);
		}
	});
}
function _tv_poweroff() {
	var d = $.Deferred();

	__tv_get_virtual_standby()
		.done(function(standby_status) {
			if(standby_status != 0) {
				hcap.power.setPowerMode({
					'mode': hcap.power.PowerMode.WARM,
					'onSuccess': function() {
						console.log('POWEROFF: to WARM');
						d.resolve();
					},
					'onFailure': function(f) {
						console.log('POWEROFF: onFailure - ' + f.errorMessage);
						d.reject(f.errorMessage);
					}
				});
			} else {
				hcap.power.powerOff({
					'onSuccess': function() {
						console.log('POWEROFF: to OFF');
						d.resolve();
					},
					'onFailure': function(f) {
						console.log('POWEROFF: onFailure - ' + f.errorMessage);
						d.reject(f.errorMessage);
					}
				});
			}
		})
		.fail(function(e) {
			log.add('POWEROFF: failed to get virtual standby mode');

			hcap.power.powerOff({
				'onSuccess': function() {
					console.log('POWEROFF: to OFF');
					d.resolve();
				},
				'onFailure': function(f) {
					console.log('POWEROFF: onFailure - ' + f.errorMessage);
					d.reject(f.errorMessage);
				}
			});

		});

	return d.promise();

	//~ hcap.key.sendKey({
	//~ "virtualKeycode" : hcap.key.Code.POWER,
	//~ "onSuccess" : function() {
	//~ },
	//~ "onFailure" : function(f) {
	//~ log.add("mute send failed: " + f.errorMessage);
	//~ }
	//~ });
}
function _tv_poweron() {
	var d = $.Deferred();
	hcap.power.setPowerMode({
		'mode': hcap.power.PowerMode.NORMAL,
		'onSuccess': function() {
			console.log('onSuccess');
			d.resolve();
		},
		'onFailure': function(f) {
			console.log('onFailure : errorMessage = ' + f.errorMessage);
			d.reject(f.errorMessage);
		}
	});
	return d.promise();
}

function __tv_get_virtual_standby() {
	return __getProperty('instant_power');
}
function __tv_set_virtual_standby(state) {
	if(typeof (state) == 'undefined') {
		state = true;
	}

	state = state ? '2' : '0';

	var d = $.Deferred();
	__setProperty('instant_power', state)
		.fone(function() {
			d.resolve(s.value);
		})
		.fail(function(error) {
			d.reject(error);
		});
	return d.promise();
}
function __tv_virtual_standby_init() {
	__tv_get_virtual_standby()
		.done(function(standy_state) {

			if(standy_state != 0) {
				log.add('Virtual Standby: ON ' + standy_state);

				document.addEventListener(
					'power_mode_changed',
					function(param) {
						hcap.power.getPowerMode({
							'onSuccess': function(s) {
								log.add('power mode ' + s.mode);
								switch(s.mode) {
									case 1: //NORMAL
										tv_virtual_standby_on();
										break;
									case 2: //WARM
										setTimeout(tv_virtual_standby_off, 1000);
										break;
									default:
										break;
								}
							},
							'onFailure': function(f) {
								log.add('getPowerMode failed after power_mode_changed - ' + f.errorMessage);
							}
						});
					},
					false
				);
			} else {
				log.add('Virtual Standby: OFF ');
			}

		});
}

function _tv_get_network_info() {
	var d = $.Deferred();

	hcap.network.getNetworkInformation({
		'onSuccess': function(s) {

			var tmp_ip = s.ip_address;

			hcap.network.getNumberOfNetworkDevices({
				'onSuccess': function(s) {
					//console.log("onSuccess : the number of network devices = " + s.count);
					for(var i = 0; i < s.count; i++) {
						(function(k) { //jshint ignore:line
							hcap.network.getNetworkDevice({
								'index': k,
								'onSuccess': function(r) {
									if(tmp_ip === r.ip) {
										var out = {'ip': r.ip, 'mac': r.mac};
										switch(r.networkMode) {
											case hcap.network.NetworkMode.WIRE:
												out.type = 'ETH';
												break;
											case hcap.network.NetworkMode.WIRELESS:
												out.type = 'WIFI';
												break;
											default:
												out.type = 'UNKNOWN';
												break;
										}
										d.resolve(out);
									}
								},
								'onFailure': function(r) {
									log.add('getNetworkDevice: onFailure : errorMessage = ' + r.errorMessage);
									d.reject(f.errorMessage);
								}
							});
						})(i);
					}
				},
				'onFailure': function(f) {
					log.add('getNumberOfNetworkDevices: onFailure : errorMessage = ' + f.errorMessage);
					d.reject(f.errorMessage);
				}
			});

		},
		'onFailure': function(f) {
			log.add('getNetworkInformation: onFailure : errorMessage = ' + f.errorMessage);
			d.reject(f.errorMessage);
		}
	});

	return d.promise();
}

function _add_listener_TV(plugin) {
	document.addEventListener('channel_changed', plugin.event_listener, false);
}
function _remove_listener_TV(plugin) {
	document.removeEventListener('channel_changed', plugin.event_listener, false);
}

var _tv_get_info = {
	_model: null,
	_firmware: null,
	_serial_number: null,
	_extra: {},
	model: function() {
		if(this._model) return this._model;
	},
	firmware: function() {
		if(this._firmware) return this._firmware;
	},
	serial_number: function() {
		if(this._serial_number) return this._serial_number;
	},

	hcap: function() {
		return this._extra.hcap;
	},
	extra: function() {
		return this._extra;
	},
	init: function() {
		__getProperty('model_name').then(function(res) {
			_tv_get_info._model = res;
		});
		__getProperty('platform_version').then(function(res) {
			_tv_get_info._firmware = res;
		});
		__getProperty('serial_number').then(function(res) {
			_tv_get_info._serial_number = res;
		});

		__getProperty('micom_version').then(function(res) {
			_tv_get_info._extra.micom = res;
		});
		__getProperty('hcap_middleware_version').then(function(res) {
			res = res.split('.');
			_tv_get_info._extra.hcap = res[0] + '.' + res[1];
		});
	}
};

function __getProperty(key) {
	var d = $.Deferred();

	hcap.property.getProperty({
		'key': key,
		'onSuccess': function(s) {
			d.resolve(s.value);
		},
		'onFailure': function(f) {
			console.log('ERROR: get TV property \'' + key + '\' (' + f.errorMessage + ')');
			d.reject(f.errorMessage);
		}
	});

	return d.promise();
}

function __setProperty(key, value) {
	var d = $.Deferred();

	hcap.property.setProperty({
		'key': key,
		'value': value,
		'onSuccess': function() {
			d.resolve();
		},
		'onFailure': function(f) {
			log.add('ERROR: set TV property \'' + key + '\' (' + f.errorMessage + ')');
			d.reject(f.errorMessage);
		}
	});

	return d.promise();
}
function __sendKey(key){
	hcap.key.sendKey({
		'virtualKeycode': hcap.key.Code[key],
		'onSuccess': function() {
		},
		'onFailure': function(f) {
			log.add('key send failed: ' + f.errorMessage);
		}
	});
}


function _add_key_menu() {
	__addKeyItem(tv_keys.MENU, 'MENU');
}
function _remove_key_menu() {
	__removeKeyItem(tv_keys.MENU, 'MENU');
}
function _add_volume_control(){
	__addKeyItem(tv_keys.VOL_UP, 'VOL_UP');
	__addKeyItem(tv_keys.VOL_DOWN, 'VOL_DOWN');
	__addKeyItem(tv_keys.MUTE, 'MUTE');

	//TODO: volume OSD control
	__setProperty('tv_volume_ui', '0');
}
function _remove_volume_control(){
	__removeKeyItem(tv_keys.VOL_UP, 'VOL_UP');
	__removeKeyItem(tv_keys.VOL_DOWN, 'VOL_DOWN');
	__removeKeyItem(tv_keys.MUTE, 'MUTE');
	
	//TODO: volume OSD control
	__setProperty('tv_volume_ui', '1');
}

function __addKeyItem(key, name) {
	hcap.key.addKeyItem({
		'keycode': 0,
		'virtualKeycode': key,
		'attribute': 2,
		'onSuccess': function() {
		},
		'onFailure': function(f) {
			log.add('KEYS: failed to add key ' + name || key + ' = ' + f.errorMessage);
		}
	});
}
function __removeKeyItem(key, name) {
	hcap.key.addKeyItem({
		'keycode': 0,
		'virtualKeycode': key,
		'attribute': 0,
		'onSuccess': function() {
		},
		'onFailure': function(f) {
			log.add('KEYS: failed to remove key ' + name || key + ' = ' + f.errorMessage);
		}
	});
}

function __tv_bt_init() {
	//BlueTooth
	document.addEventListener(
		'bluetooth_event_received',
		function(param) {
			// {String} param.eventType - bluetooth event type ("bt_gap_find_devices_result" / "bt_service_status_changed")
			// {Object} param.btGapFindDevicesResult - event data for the event type "bt_gap_find_devices_result"
			//      {
			//          {String} scanState - scan state ("found_devices" : devices are found / "done" : scanning is done with no device found)
			//          {Array} list - device list
			//                  {String} list[].name - device name
			//                  {Number} list[].class - device class
			//                  {String} list[].address - BD (Bluetooth Device) address
			//                  {Number} list[].rssi - RSSI value of device
			//      }
			// {Object} param.btServiceStatusChanged - event data for the event type "bt_service_status_changed"
			//      {
			//          {String} listType - list type ("discovered"/"bonded"/"none")
			//          {String} state - device connection state ("connected"/"disconnected"/"connecting"/"disconnecting"/"none")
			//          {String} address - BD (Bluetooth Device) address
			//          {String} service - service profile ("hid" : HID profile / "audio" : audio src(A2DP) profile / "opc" : OPC profile / "audio_sink" : audio sink(A2DP) profile)
			//          {String} name - device name
			//      }
			console.log('Event \'bluetooth_event_received\' is received.');
			if(param.eventType === 'bt_gap_find_devices_result') {
				console.log('BT: scan state = ' + param.btGapFindDevicesResult.scanState);
				for(var i = 0; i < param.btGapFindDevicesResult.list.length; i++) {
					console.log('BT: found device[' + i + '] name = ' + param.btGapFindDevicesResult.list[i].name + ', class = ' + param.btGapFindDevicesResult.list[i].class + ', BD address = ' + param.btGapFindDevicesResult.list[i].address + ', rssi = ' + param.btGapFindDevicesResult.list[i].rssi);
				}
			} else if(param.eventType === 'bt_service_status_changed') {
				console.log('BT: listType = ' + param.btServiceStatusChanged.listType + ', state = ' + param.btServiceStatusChanged.state + ', BD address = ' + param.btServiceStatusChanged.address + ', service profile = ' + param.btServiceStatusChanged.service + ', name = ' + param.btServiceStatusChanged.name);

				if($id('source_bt_devices')) {

					if(param.btServiceStatusChanged.state == 'connected') {
						$('#source_bt_devices').append('<div id="device_' + param.btServiceStatusChanged.address + '">' + param.btServiceStatusChanged.name + '</div>');
					} else if(param.btServiceStatusChanged.state == 'disconnected') {
						$($id('device_' + param.btServiceStatusChanged.address)).remove();
					} else {

					}

				}

			}
		},
		false
	);
}


function _tv_bt_on() {
	hcap.bluetooth.setScanState({
		'visible': true,
		'connectable': true,
		'onSuccess': function() {
			console.log('onSuccess');
		},
		'onFailure': function(f) {
			console.log('onFailure : errorMessage = ' + f.errorMessage);
		}
	});
}
function _tv_bt_off() {
	hcap.bluetooth.disconnect({
		'service': 'audio_sink',
		'address': '00:11:22:33:44:55', //no matter
		'onSuccess': function() {
			console.log('onSuccess');
		},
		'onFailure': function(f) {
			console.log('onFailure : errorMessage = ' + f.errorMessage);
		}
	});

	hcap.bluetooth.setScanState({
		'visible': false,
		'connectable': false,
		'onSuccess': function() {
			console.log('onSuccess');
		},
		'onFailure': function(f) {
			console.log('onFailure : errorMessage = ' + f.errorMessage);
		}
	});
}

function _get_power_state() {
	var d = $.Deferred();

	hcap.power.getPowerMode({
		'onSuccess': function(s) {
			d.resolve(s.mode != hcap.power.PowerMode.WARM);
		},
		'onFailure': function(f) {
			d.reject(f.errorMessage);
		}
	});

	return d.promise();
}

function _tv_set_aspect_ratio(ratio) {
	hcap.property.setPictureProperty({
		'key': hcap.property.PicturePropertyKey.ASPECT_RATIO,
		'value': ratio,
		'onSuccess': function() {
			log.add('Aspect Ratio set to ' + ratio);
		},
		'onFailure': function(f) {
			log.add('Aspect Ratio (' + ratio + ') failed: ' + f.errorMessage);
		}
	});
}

function _tv_screensaver_control() {
	if(__hcap_compare('1.20') >= 0){
		__setProperty('screensaver_control', '1')
			.done(function() {
				log.add('ScreenSaver Control gained');
			})
			.fail(function(error) {
				log.add('ScreenSaver Control: errorMessage = ' + error);
			});
	}else{
		log.add('ScreenSaver not supported');
	}
}

function __tv_on_destroy_init() {
	document.addEventListener(
		'on_destroy',
		function() {
			console.log('Event \'on_destroy\' is received');
			hcap.system.beginDestroy({
				'onSuccess': function() {
					console.log('beginDestroy onSuccess');

					setTimeout(function() {
						hcap.system.endDestroy({
							'onSuccess': function() {
								console.log('endDestroy onSuccess');
							},
							'onFailure': function(e) {
								console.log('endDestroy onFailure : errorMessage = ' + e.errorMessage);
							}
						});
					}, 1000);
				},
				'onFailure': function(f) {
					console.log('beginDestroy onFailure : errorMessage = ' + f.errorMessage);
				}
			});
		},
		false
	);
}

function __tv_set_window_size() {
	var d = $.Deferred();
	__getProperty('display_resolution')
		.done(function(res) {
			if(res == '1920x1080') {
				d.resolve('hd720upscaled');
			} else {
				d.resolve('hd720');
			}
		});
	return d.promise();
}

function __hcap_compare(a, b){
	if(!b){
		b = _tv_get_info.hcap();
	}
	a = a.split('.')[1];
	b = b.split('.')[1];
	return (b-a).constrain(-1,1);
}

function _tv_checkout(){
	hcap.checkout.requestCheckout({
		'onSuccess' : function() {
			log.add('CHECKOUT: Success');
		}, 
		'onFailure' : function(f) {
			log.add('CHECKOUT: error = ' + f.errorMessage);
		}
	});
}
