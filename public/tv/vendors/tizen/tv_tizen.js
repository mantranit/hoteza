// $(document.head).append("<script type='text/javascript' src='$B2BAPIS/b2bapis/b2bavplay.js'></script>");
// $(document.head).append("<script type='text/javascript' src='$B2BAPIS/b2bapis/b2bapis.js'></script>");
// $(document.head).append("<script type='text/javascript' src='$WEBAPIS/webapis/webapis.js'></script>");
var DICTIONARY_LANG = {'abk': 'ab','aar': 'aa','afr': 'af','aka': 'ak','alb': 'sq','amh': 'am','ara': 'ar','arg': 'an','arm': 'hy','asm': 'as','ava': 'av','ave': 'ae','aym': 'ay','aze': 'az','bam': 'bm','bak': 'ba','baq': 'eu','bel': 'be','ben': 'bn','bih': 'bh','bis': 'bi','bos': 'bs','bre': 'br','bul': 'bg','bur': 'my','cat': 'ca','cha': 'ch','che': 'ce','nya': 'ny','chi': 'zh','chv': 'cv','cor': 'kw','cos': 'co','cre': 'cr','hrv': 'hr','cze': 'cs','dan': 'da','div': 'dv','dut': 'nl','dzo': 'dz','eng': 'en','epo': 'eo','est': 'et','ewe': 'ee','fao': 'fo','fij': 'fj','fin': 'fi','fre': 'fr','ful': 'ff','glg': 'gl','geo': 'ka','ger': 'de','gre': 'el','grn': 'gn','guj': 'gu','hat': 'ht','hau': 'ha','heb': 'he','her': 'hz','hin': 'hi','hmo': 'ho','hun': 'hu','ina': 'ia','ind': 'id','ile': 'ie','gle': 'ga','ibo': 'ig','ipk': 'ik','ido': 'io','ice': 'is','ita': 'it','iku': 'iu','jpn': 'ja','jav': 'jv','kal': 'kl','kan': 'kn','kau': 'kr','kas': 'ks','kaz': 'kk','khm': 'km','kik': 'ki','kin': 'rw','kir': 'ky','kom': 'kv','kon': 'kg','kor': 'ko','kur': 'ku','kua': 'kj','lat': 'la','ltz': 'lb','lug': 'lg','lim': 'li','lin': 'ln','lao': 'lo','lit': 'lt','lub': 'lu','lav': 'lv','glv': 'gv','mac': 'mk','mlg': 'mg','may': 'ms','mal': 'ml','mlt': 'mt','mao': 'mi','mar': 'mr','mah': 'mh','mon': 'mn','nau': 'na','nav': 'nv','nde': 'nd','nep': 'ne','ndo': 'ng','nob': 'nb','nno': 'nn','nor': 'no','iii': 'ii','nbl': 'nr','oci': 'oc','oji': 'oj','chu': 'cu','orm': 'om','ori': 'or','oss': 'os','pan': 'pa','pli': 'pi','per': 'fa','pol': 'pl','pus': 'ps','por': 'pt','que': 'qu','roh': 'rm','run': 'rn','rum': 'ro','rus': 'ru','san': 'sa','srd': 'sc','snd': 'sd','sme': 'se','smo': 'sm','sag': 'sg','srp': 'sr','gla': 'gd','sna': 'sn','sin': 'si','slo': 'sk','slv': 'sl','som': 'so','sot': 'st','spa': 'es','sun': 'su','swa': 'sw','ssw': 'ss','swe': 'sv','tam': 'ta','tel': 'te','tgk': 'tg','tha': 'th','tir': 'ti','tib': 'bo','tuk': 'tk','tgl': 'tl','tsn': 'tn','ton': 'to','tur': 'tr','tso': 'ts','tat': 'tt','twi': 'tw','tah': 'ty','uig': 'ug','ukr': 'uk','urd': 'ur','uzb': 'uz','ven': 've','vie': 'vi','vol': 'vo','wln': 'wa','wel': 'cy','wol': 'wo','fry': 'fy','xho': 'xh','yid': 'yi','yor': 'yo','zha': 'za','zul': 'zu'};

var storage = {},
	tv_keys,
	emptyEventListener = {
		onbufferingstart: function () {},
		onbufferingprogress: function (percent) {},
		onbufferingcomplete: function () {},
		oncurrentplaytime: function (currentTime) {},
		onevent: function (eventType, eventData) {},
		onstreamcompleted: function () {},
		onerror: function (eventType) {},
		onsubtitlechange: function (duration, text, data3, data4) {},
		ondrmevent: function (drmEvent, drmData) {}
	};

function _tv_vendor_init(){
	var d = $.Deferred();
	_tv_init_storage()
	.done(function () {
		//Поддержка Virtual Standby
		__tv_virtual_standby_init();

		__registerKeys();

		d.resolve();
	})
	.fail(function(){
		d.reject('storage error');
	});

	$(HotezaTV).one('splashshow', function(){
		tv_keys = {
			EXIT: 10182,
			DOWN: 40,
			UP: 38,
			LEFT: 37,
			RIGHT: 39,
			ENTER: 13,
			MENU: 10133,
			HOME: 10071,
			BACK: 10009,
			RED: 403,
			GREEN: 404,
			YELLOW: 405,
			BLUE: 406,
			CH_UP: 427,
			CH_DOWN: 428,
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
			INPUT: 10072,
			STOP: 413,
			PLAY: 415,
			PAUSE: 19,
			FAST_FORWARD: 417,
			REWIND: 412,
			VOL_UP: 447,
			VOL_DOWN: 448,
			MuTE: 449
		};
	});
	$(HotezaTV).one('splashshow', __initInstalledApps);

	//SDAP send fix
	if(isset('config.tv.hacks.tizen_add_slash')){
		var tmp = b2bapis.b2bcontrol.getURLLauncherAddress();
		if(tmp[tmp.length - 1] != '/'){
			b2bapis.b2bcontrol.setURLLauncherAddress(
				tmp + '/',
				function(){
					log.add('TV: Tizen URL fixed');
				},
				function(){
					log.add('ERROR: Tizen URL fix FAILED');
				}
			);
		}
	}

	//Auto FW uprade
	if(isset('config.tv.hacks.fw_samsung_upgrade')){
		$(HotezaTV).one('final', function(){
			setTimeout(function(){
				_tv_firmware_uprade()
				.done(function(data){
					log.add('FW Uprade: ' + data);
				})
				.fail(function(err) {
					log.add('FW upgrade: Error: ' + err);
				});
			}, 5*T_MIN);
		});
	}

	return d.promise();
}

var save_storage_timer = null;
function save_storage(removeThrottling){
	clearInterval(save_storage_timer);
	is_saving_storage_process = true;
	save_storage_timer = setTimeout(function () {
		fileSystem.write('storage', JSON.stringify(storage));
	}, removeThrottling ? 0 : 100);
}

var fileSystem = {
	initDocuments: function () {
		var d = $.Deferred();
		if (typeof fileSystem.documents !== 'undefined') {return;}

		tizen.filesystem.resolve('documents',
			function (directory) {
				fileSystem.documents = directory;
				d.resolve();
			},
			function (err) {
				console.log(err);
				log.add(err);
				d.reject();
			}, 'rw');
		
		return d.promise();
	},
	read: function (file) {
		var d = $.Deferred();

		if (typeof fileSystem[file] !== 'undefined') {
			fileSystem[file].readAsText(function (data) {
				d.resolve(data);
			}, null, 'UTF-8');
		}
		else {
			tizen.filesystem.resolve('documents/' + file + '.txt', readFileSuccess, readFileError, 'rw');
		}

		return d.promise();

		function readFileSuccess(data) {
			fileSystem[file] = data;
			fileSystem[file].readAsText(function (_data) {
				d.resolve(_data);
			}, null, 'UTF-8');
		}
		function readFileError(err) {
			if (err.name === 'NotFoundError') {
				fileSystem[file] = fileSystem.documents.createFile(file + '.txt');
				d.resolve(false);
			}
			else {
				console.log(err);
				log.add(err);
				d.reject(err);
			}
		}
	},
	write: function (file, data) {
		var d = $.Deferred();

		fileSystem[file].openStream('w', openSuccess, openError, 'UTF-8');

		return d.promise();

		function openSuccess(fs) {
			fs.write(data);
			fs.close();

			is_saving_storage_process = false;
			d.resolve();
		}
		function openError(err) {
			is_saving_storage_process = false;
			console.log(err);
			log.add(err);
			d.reject(err);
		}
	},
	timer: null,
	delete: function (file) {
		var d = $.Deferred();

		delete fileSystem[file];
		fileSystem.documents.deleteFile(
			'documents/' + file + '.txt',
			d.resolve,
			d.resolve
		);

		return d.promise();
	},
	read_image: function(url){
		var d = $.Deferred();
		tizen.filesystem.resolve(url, function(file) {
			file.openStream(
				'r',
				function(fs) {
					d.resolve('data:image;base64, ' + fs.readBase64(file.fileSize));
					fs.close();
				}, function(e) {
					console.log('Error ' + e.message);
					d.reject('Read');
				}, 'UTF-8'
			);
		}, function(e){
			console.log(e);
			d.reject('Resolve');
		}, 'r');
		return d.promise();
	}
};

function _tv_init_storage() {
	var d = $.Deferred();

	fileSystem.initDocuments()
	.done(function(){
		var storage_text;
		fileSystem.read('storage').done(function (res) {
			if (res) {
				log.add('FS: DATA read success');
				storage_text = res;
			}
			else {
				storage_text = '{}';
			}
	
			try {
				storage = JSON.parse(''+storage_text)||{};
			}
			catch(e){
				storage = {};
				tv_log('Storage parse error');
			}
	
			storage.setItem = function(item, val, removeThrottling){
				storage[item] = val;
				save_storage(removeThrottling);
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
	
			d.resolve();
		});
	})
	.fail(function(){
		log.add('FS: initDocuments failed');
		d.reject('initDocuments failed');
	});

	return d.promise();
}
function _tv_samsung_new(){
	return true;
}

function _setHandlerKeydown() {
	document.removeEventListener('keydown', tv_keydown,false);
	document.addEventListener('keydown', tv_keydown,false);
}

function __registerKeys() {
	__unregisterKeys();

	var blacklistKeys = ['VolumeMute', 'VolumeUp', 'VolumeDown', 'Menu'];//Volume and Menu controlled separately
	var supportedKeys = tizen.tvinputdevice.getSupportedKeys();
	for (var i = 0; i < supportedKeys.length; i++) {
		if (blacklistKeys.indexOf(supportedKeys[i].name) == -1){
			tizen.tvinputdevice.registerKey(supportedKeys[i].name);
		}
	}

	var specialKeys = [];
	var blacklistSpecialKeys = ['Power', 'More', 'Color']; //More(123), Color: for AU800
	var supportedSpecialKeys = webapis.appcommon.getSpecialSupportedKeys();
	for (var o = 0; o < supportedSpecialKeys.length; o++) {
		if (blacklistSpecialKeys.indexOf(supportedSpecialKeys[o].name) == -1){
			specialKeys.push(supportedSpecialKeys[o].name);
		}
	}
	webapis.appcommon.registerKey(specialKeys);
}
function __unregisterKeys() {
	var deletedKeys = [];
	var supportedSpecialKeys = webapis.appcommon.getSpecialSupportedKeys();
	for (var o = 0; o < supportedSpecialKeys.length; o++) {
		deletedKeys.push(supportedSpecialKeys[o].name);
	}
	webapis.appcommon.unregisterKey(deletedKeys);
}

function _add_key_menu(){
	tizen.tvinputdevice.registerKey('Menu');
}
function _remove_key_menu(){
	tizen.tvinputdevice.unregisterKey('Menu');
}
function _add_volume_control(){
	tizen.tvinputdevice.registerKey('VolumeUp');
	tizen.tvinputdevice.registerKey('VolumeDown');
	tizen.tvinputdevice.registerKey('VolumeMute');
}
function _remove_volume_control(){
	tizen.tvinputdevice.unregisterKey('VolumeUp');
	tizen.tvinputdevice.unregisterKey('VolumeDown');
	tizen.tvinputdevice.unregisterKey('VolumeMute');
}

var Samsung_sources = {
	'TV': {
		0: {
			number: 1,
			type: 'TV'
		}
	},
	'HDMI': {
		0: {
			number: 1,
			type: 'HDMI'
		},
		1: {
			number: 2,
			type: 'HDMI'
		},
		2: {
			number: 3,
			type: 'HDMI'
		},
		3: {
			number: 4,
			type: 'HDMI'
		}
	},
	'AV': {
		0: {
			number: 1,
			type: 'AV'
		}
	}
};
function _tv_sources(show_all){

	if(fullscreen === true){
		tv_mode();
	}

	var tmp_arr;
	if(show_all){
		tmp_arr = ['USB', ['HDMI', 0], ['HDMI', 1], ['HDMI', 2], 'AV'];
		// 'RGB', 'SCART', 'SVIDEO', 'TV', 'VGA', 'Ext' not implemented
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
		}
		else {
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
var Samsung_external_source = false;
function _tv_source(param){
	$(window).trigger('analytics', {
		type: 'hitPage',
		target: param[0]
	});

	// setVideoSize();

	document.body.style.backgroundColor = 'transparent';

	var tmp = Samsung_sources[param[0]][param[1]];
	if(tmp === 0 && Samsung_external_source === false){
		log.add('SOURCES: ' + tmp + ' is already active');
		return false;
	}

	_tv_channel_stop();
	videoCollection.destroy().done(_tv_set_source.bind(null, tmp));
	return true;
}
function _tv_get_connected_source(type) {
	var d = $.Deferred();

	tizen.systeminfo.getPropertyValue(type, successCB, errorCB);

	return d.promise();

	function successCB(videoSource) {
		d.resolve(videoSource.connected);
	}
	function errorCB(e) {
		log.add(
			'getPropertyValue('+ type +') is failed. Error name = '+ e.name + ', Error message = ' + e.message
		);
		d.resolve([]);
	}
}
function _tv_set_source(settableSource) {

	_tv_get_connected_source('VIDEOSOURCE').done(function (sources) {
		if (!sources.length) {return errorSetSource();}

		var hasConnectedSource = false;
		for (var i = 0; i < sources.length; i++) {
			var source = sources[i];

			if (
				source.type === settableSource.type &&
				source.number === settableSource.number
			) {
				hasConnectedSource = true;
				settableSource = source;
			}
		}

		if (!hasConnectedSource) {return errorSetSource();}

		tizen.tvwindow.setSource(settableSource, successSetSource, errorSetSource);
	});

	function successSetSource() {
		if (settableSource.type === 'TV') {
			tv_keydown_override = null;

			$('#container,#tv_cur,#tv_fullscreen_overlay').fadeIn(1000);

			Samsung_external_source = false;

			$('#tv_source_' + settableSource.type + '_' + (settableSource.number - 1)).css('opacity', '');
			log.add('Source ' + settableSource.type + ':' + (settableSource.number - 1) + 'changed');
			tv_sel_block();
		}
		else {
			tv_keydown_override = _tv_keydown_external;

			$('#container,#tv_cur,#tv_fullscreen_overlay').fadeOut(1000);

			Samsung_external_source = true;

			$('#tv_source_' + settableSource.type + '_' + (settableSource.number - 1)).css('opacity', '');
			log.add('Source ' + settableSource.type + ':' + (settableSource.number - 1) + ' changed');
		}

		setVideoSize();

	}
	function errorSetSource() {
		$('#tv_source_' + settableSource.type + '_' + (settableSource.number - 1)).css('opacity', 0.4);
		log.add('Source ' + settableSource.type + ':' + (settableSource.number - 1) + ' inactive');
	}
}

function _tv_usb(){
	$(window).trigger('analytics', {
		type: 'hitPage',
		target: 'usb'
	});

	tizen.filesystem.listStorages(function(storages) {
		var _storage;
		for(var i in storages){
			if(storages[i].type == 'EXTERNAL'){
				_storage = storages[i];
				break;
			}
		}
		if(_storage){
			if(_storage.state == 'MOUNTED'){
				tizen.filesystem.resolve(
					_storage.label,
					function(dir) {
						Loader.start();
						setTimeout(Loader.stop, 2000);
						_launch_usb_app(dir.fullPath);
					}, function(e) {
						console.log('Error ' + e.message);
					}, 'r'
				);
			}else{
				custom_alert('USB drive error');
			}
		}else{
			custom_alert('USB is not connected');
		}
	});

	function _launch_usb_app(path){

		var appControl = new tizen.ApplicationControl(
			'http://tizen.org/appcontrol/operation/view',
			null,
			null,
			null,
			[
				new tizen.ApplicationControlData('launch_type', ['mycontents']),
				new tizen.ApplicationControlData('device_path', [path]),
				new tizen.ApplicationControlData('device_name', ['USB']),
				new tizen.ApplicationControlData('device_type', ['USB'])
			]
		);

		var appControlReplyCallback = {
			onsuccess: function(data) {
				console.log('inside success');
			},
			onfailure: function() {
				log.add('ERROR: USB launch application control failed');
			}
		};

		var launching_app = 'com.samsung.tv.mycontents';

		if(tv_get_info().model.indexOf('EF') != -1){ //Для EF запускается другое приложение USB
			launching_app = 'org.volt.mycontents';
		}

		tizen.application.launchAppControl(
			appControl,
			launching_app,
			function () {
				//console.log("[] success !!");
			},
			function (e) {
				log.add('Launch App Control. Error: ' + e.message);
			},
			appControlReplyCallback
		);
	}

}

function _tv_miracast() {
	//_tv_preloaded_app('org.tizen.ScreenMirroringLFD-app-tv'); //Старая схема запуска (не работает на AU800)
	var launching_app = 'mobile_screenmirroring_1';

	if(tv_get_info().model.indexOf('U800') != -1 || tv_get_info().model.indexOf('Q60') != -1){ //Для AU800 запускается другое приложение Screen Mirroring (Smart View)
		launching_app = 'smartphone_screenmirroring_1';
	}

	var appControl = new tizen.ApplicationControl(
		'http://tizen.org/appcontrol/operation/view',
		null,
		null,
		null,
		[new tizen.ApplicationControlData('deeplink',[launching_app])]
	);

	var appControlReplyCallback = {
		onsuccess: function(data) {
			console.log('inside success');
		},
		onfailure: function() {
			custom_alert('Screen Sharing failed');
			log.add('Screen Sharing: The launch application control failed');
		}
	};

	tizen.application.launchAppControl(
		appControl,
		'org.tizen.connection-guide-app',
		function () {
			console.log('[] success !!');
		},
		function (e) {
			log.add('Launch App Control. Error: ' + e.message);
		},
		appControlReplyCallback
	);
}

function _tv_bt_on(){
	_tv_preloaded_app('org.tizen.ep-hotel-btplayer');
}
function _tv_bt_off(){
}

function _tv_preloaded_app(id) {
	var appControl = new tizen.ApplicationControl('http://tizen.org/appcontrol/operation/view');

	var appControlReplyCallback = {
		onsuccess: function(data) {
			// console.log("inside success");
		},
		onfailure: function() {
			tv_log('Application with id - '+ id +' is not available');
			log.add('The launch application control failed');
		}
	};

	tizen.application.launchAppControl(
		appControl,
		id,
		function () {
			// console.log("[] success !!");
		},
		function (e) {
			log.add('Launch App Control. Error: ' + e.message);
		},
		appControlReplyCallback
	);
}

var __def_tizen_icon = 'tv/vendors/tizen_tep/icon.png';

var installedApps = [],
	allowedInstalledApps = [];
function __initInstalledApps() {
	tizen.application.getAppsInfo(onListInstalledApps);
	function onListInstalledApps(applications) {
		installedApps = [];
		allowedInstalledApps = [];
		for (var i = 0; i < applications.length; i++) {
			var application = applications[i];

			installedApps.push(application);

			var allowedApps = isset('config.tv.allowed_apps');
			if (!allowedApps) {
				continue;
			}

			//TODO: убрать когда переделаем на построение по конфигу
			if (allowedApps.indexOf(application.name) !== -1) {
				allowedInstalledApps.push(application);

				if(application.iconPath){
					_read_app_image(i);
				}else{
					installedApps[i].data = __def_tizen_icon;
				}
			}
		}
	}

	function _read_app_image(index){
		fileSystem.read_image(installedApps[index].iconPath)
		.done(function(result){
			installedApps[index].data = result;
		});
	}
}
function _tv_get_preloaded_app_list(raw) {
	var d = $.Deferred();

	var out = [];

	for(var index in installedApps){
		var app = installedApps[index];
		out.push({
			id: app.id,
			name: app.name,
			icon: app.data
		});
	}

	if(raw){
		d.resolve(installedApps);
	}else{
		d.resolve(out);
	}

	return d.promise();
}

function _tv_channel_show (tune){
	var channels = getChannels();
	var channel, id;

	if (typeof tune === 'object'){
		channel = tune;
		id = 0;
	}
	else {
		id = tune|0;
		channel = channels[id];
	}

	_tv_channel_stop();

	_channel_show();

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

		if (channel['type'] === 'rf') {
			var ChannelInfo = {};
			var freq = channel['protocol'].toString().split('#');

			if(freq[0] < 1000){
				freq[0] *= 1000000;
			}

			freq[0] = freq[0] / 1000; // tizen использует килогерцы

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

					ChannelInfo = {
						broadcastStandard: 'DVB',
						channelType: 'ATV',
						frequency: freq[0],
						modulationType: 'PAL',
						soundSystem: 'AUTO',
						colorsSystem: 'AUTO'
					};

					break;

				case 'CABLE':

					ChannelInfo = {
						broadcastStandard: 'DVB',
						channelType: 'CDTV',
						frequency: freq[0],
						modulationType: 'QAM256',
						bandwidth: '8Mhz',
						symbolRate: freq[2]||6875,
						programNumber: freq[1]|0 //service ID
					};

					break;

				case 'CABLE_HRC':

					// работает с преднастроенными каналами
					// SID должны быть уникальными
					if (isset('config.tv.hacks.tizen_another_tune_channel')) {
						return tizen.tvwindow.show(
							_anotherTuneDirect,
							null,
							['0px', '0px', '1920px', '1080px'],
							'MAIN',
							'BEHIND'
						);
					}

					ChannelInfo = {
						broadcastStandard: 'DVB',
						channelType: 'CDTV',
						frequency: freq[0],
						modulationType: 'QAM64',
						bandwidth: '8Mhz',
						symbolRate: freq[2]||6875,
						programNumber: freq[1]|0 //service ID
					};

					break;

				case 'SATELLITE':
				case 'SATELLITE_2':

				if(freq[0]<30){
					freq[0] *= 1000;
				}

				if(freq[0]<30000){ // Mhz for SAT
						freq[0] *= 1000;
					}

					if(freq[0]>30000000){ // kHz for SAT
						freq[0] /= 1000;
					}

					ChannelInfo = {
						broadcastStandard: 'DVB',
						channelType: 'SDTV',
						frequency: freq[0]|0, // kHz
//						modulationType: "8PSK", //QPSK не важно было
						bandwidth: '8Mhz', // не важно было
						programNumber: freq[1]|0, //service ID
						satelliteId : freq[2]||'' //? ASTRA_19_2E, EUTELSAT_36E
//						polarization: "POL_HL" // POL_VL, UNKNOWN не важно было
					};

					log.add('Tuning to SAT. Freq: ' + freq[0] + ' kHz, SID: ' + freq[1] + ' on sat ' + freq[2]);
					break;

				case 'TERRESTRIAL':
					ChannelInfo = {
						broadcastStandard: 'DVB',
						channelType: 'DTV',
						frequency: freq[0],
						modulationType: 'OFDM',
						programNumber: freq[1]|0 //service ID
					};

					var BW = 8;
					if(freq[2]){
						BW = freq[2]|0;
						if(BW >= 5 && BW <= 8){
							//All OK
						}else{
							BW = 8; //Default
							log.add('TV: Incorrect Bandwidth on channel ' + channel + ' (' + freq[2] + ')');
						}
					}else{
						//Auto SR 7-8
						if((freq[0]|0) >= 474000){
							BW = 8;
						}else{
							BW = 7;
						}
					}
					ChannelInfo.bandwidth = BW + 'Mhz';

					log.add('Tuning to DVB-T. Freq: ' + freq[0] + ' kHz, SID: ' + freq[1] + ' BW: ' + ChannelInfo.bandwidth);
					break;

				case 'TERRESTRIAL2':

					ChannelInfo = {
						broadcastStandard: 'DVB',
						channelType: 'DTV',
						frequency: freq[0],
						modulationType: 'OFDM_T2',
						programNumber: freq[1]|0 //service ID
					};

					var BW2 = 8;
					if(freq[2]){
						BW2 = freq[2]|0;
						if(BW2 >= 5 && BW2 <= 8){
							//All OK
						}else{
							BW2 = 8; //Default
							log.add('TV: Incorrect Bandwidth on channel ' + channel + ' (' + freq[2] + ')');
						}
					}else{
						//Auto SR 7-8
						if((freq[0]|0) >= 474000){
							BW2 = 8;
						}else{
							BW2 = 7;
						}
					}
					ChannelInfo.bandwidth = BW2 + 'Mhz';

					log.add('Tuning to DVB-T2. Freq: ' + freq[0] + ' kHz, SID: ' + freq[1] + ' BW: ' + ChannelInfo.bandwidth);
					break;

				default:
					log.add('TV: unsupported Channel type: ' + channel['broadcastType']);
					break;
			}

			tizen.tvwindow.show(_tuneDirect, null, ['0px', '0px', '1920px', '1080px'], 'MAIN', 'BEHIND');

		} else {
			var url;
			if(channel['broadcastType'] == 'RTP') {
				url = 'rtp://';
			}else{
				url = 'udp://';
			}
			url = url + channel['protocol'].trim() + ':' + (channel['port']||1234);

			webapis.avplay.open(url);

			webapis.avplay.setListener(emptyEventListener);

			try{
				webapis.avplay.prepare();
				webapis.avplay.play();
			} catch(e) {
				webapis.avplay.close();
			}

			if (tv_channellist_type !== 'mosaic') {
				_setVideoSize({
					top: 0,
					left: 0,
					width: 1280,
					height: 720
				});
			}
		}

		function _tuneDirect() {
			b2bapis.b2bbroadcast.tuneDirect(ChannelInfo, function() {
					console.log('SUCCESS TuneDirect');
				},
				function(f) {
					console.log('ERROR TuneDirect');
					console.log(f.message);
					log.add('ERROR TuneDirect');
				});
		}
		function _anotherTuneDirect() {
			var tuneCB = {
				onsuccess: function() {
					 console.log('Tune() is successfully done. And there is a signal.');
				},
				onnosignal: function() {
					 console.log('Tune() is successfully done. But there is no signal.');
				}
			};

			tizen.tvchannel.tune({ programNumber: freq[1]|0 }, tuneCB);
		}


	}
}
function _tv_channel_stop() {
	if (webapis.avplay.getState() === 'PLAYING') {
		webapis.avplay.stop();
		webapis.avplay.close();
	}
	else {
		tizen.tvwindow.hide(function (windowRect, type) {
		}, function () {
		}, 'MAIN');
	}
}

function _tv_set_volume(value){
	tv_mute(false);
	tizen.tvaudiocontrol.setVolume(value);
}
function _tv_get_volume(){
	var d = $.Deferred();
	d.resolve(tizen.tvaudiocontrol.getVolume());
	return d.promise();
}

function _tv_mute() {
	_tv_change_mute( (!tizen.tvaudiocontrol.isMute()) );
}
function _tv_get_mute(){
	var d = $.Deferred();
	d.resolve(tizen.tvaudiocontrol.isMute());
	return d.promise();
}
function _tv_change_mute(mute) {
	tizen.tvaudiocontrol.setMute(mute);
}

function _tv_volup(){
	tizen.tvaudiocontrol.setVolumeUp();
}

function _tv_voldown(){
	tizen.tvaudiocontrol.setVolumeDown();
}

function _tv_get_audio() {
	var total_track = webapis.avplay.getTotalTrackInfo(),
		languages_list = [];

	if (
		total_track.length === 1 ||
		total_track.length === 2
	) {return null;}

	for (var i = 0; i < total_track.length; i++) {
		var track = total_track[i],
			language,
			code;

		if (track.type !== 'AUDIO') {continue;}

		language = JSON.parse(track.extra_info);
		code = language.language.length === 3 ?
			DICTIONARY_LANG[language.language] : language.language;

		languages_list.push(code);
	}

	return languages_list;
}
function _tv_get_sync_audio() {
	var d = $.Deferred();

	_get_media_audio().done(d.resolve);

	return d.promise();
}
function _tv_get_sync_cur_audio() {
	var d = $.Deferred();
	var streamInfo = webapis.avplay.getCurrentStreamInfo();

	for (var i = 0; i < streamInfo.length; i++) {
		var info = streamInfo[i];
		if (info.type === 'AUDIO') {d.resolve(parseInt(info.index));}
	}

	return d.promise();
}
function _tv_get_cur_audio(){
	var streamInfo = webapis.avplay.getCurrentStreamInfo();

	for (var i = 0; i < streamInfo.length; i++) {
		var info = streamInfo[i];
		if (info.type === 'AUDIO') {return parseInt(info.index);}
	}
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
	_set_media_audio(null, index);
	return true;
}

function _player_start() {
	PLAYER_INIT = true;
}
function _player_play(ctx) {
	ctx.url = encodeString(ctx.url);
	ctx.url = setLocationURL(ctx.url);

	ctx.started = true;
	ctx.media = true;

	webapis.avplay.open(ctx.url);

	webapis.avplay.setListener(ctx.eventListener ? ctx.eventListener : emptyEventListener);

	webapis.avplay.prepareAsync(function () {
		webapis.avplay.play();
		webapis.avplay.setLooping(ctx.loop);
	});
}
function _player_pause(ctx) {
	webapis.avplay.pause();
	ctx.paused = true;
}
function _player_resume(ctx) {
	webapis.avplay.play();
	ctx.paused = false;
}
function _player_resize(ctx) {
	webapis.avplay.setDisplayRect(
		Math.floor(1.5*ctx.coords.left),
		Math.floor(1.5*ctx.coords.top),
		Math.floor(1.5*ctx.coords.width),
		Math.floor(1.5*ctx.coords.height)
	);
}
function _player_destroy() {
	var d = $.Deferred();

	if (webapis.avplay.getState() !== 'NONE') {
		webapis.avplay.stop();
		webapis.avplay.close();
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

function _get_media_audio (player) {
	var d = $.Deferred(),
		total_track = webapis.avplay.getTotalTrackInfo(),
		languages_list = [];

	if (
		total_track.length === 1 ||
		total_track.length === 2
	) {d.resolve(null);}

	for (var i = 0; i < total_track.length; i++) {
		var track = total_track[i],
			language,
			code;

		if (track.type !== 'AUDIO') {continue;}

		language = JSON.parse(track.extra_info);
		code = language.language.length === 3 ?
			DICTIONARY_LANG[language.language] : language.language;

		languages_list.push(code);
	}

	d.resolve(languages_list);

	return d.promise();
}
function _set_media_audio(player, index) {
	webapis.avplay.setSelectTrack('AUDIO', index + 1);
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
function _set_media_subtitle(player, url) {

	_deleteTmpFiles().done(function () {
		var download = new tizen.DownloadRequest(url, 'wgt-private-tmp');

		tizen.download.start(download, {
			oncompleted: function(downloadId, fullPath){
				tizen.filesystem.resolve('wgt-private-tmp',
					function(e){
						$('#playerSubtitles').html('');
						webapis.avplay.setExternalSubtitlePath(fullPath);
					},
					function(e){
						console.log(e);
						log.add(e);
					}, 'r');
			}
		});
	});

	function _deleteTmpFiles() {
		var d = $.Deferred();

		tizen.filesystem.resolve('wgt-private-tmp',
			function(directory){
				directory.listFiles(function (files) {
					for (var i = 0; i < files.length; i++) {
						var file = files[i];
						if (file.isFile) {directory.deleteFile(file.fullPath);}
					}

					d.resolve();
				});
			},
			d.resolve, 'rw');

		return d.promise();
	}
}
function _switch_subtitle(player, flag) {
	var subtitles = $('#playerSubtitles');

	if (flag) {
		webapis.avplay.setSilentSubtitle(false);
		subtitles.show();
	}
	else {
		webapis.avplay.setSilentSubtitle(true);
		subtitles.hide();
		subtitles.html('');
	}
}

function _get_duration_video(player) {
	var d = $.Deferred();

	if (webapis.avplay.getState() !== 'PLAYING') {
		setTimeout(function () {
			d.resolve(webapis.avplay.getDuration());
		}, 500);
	}
	else {
		d.resolve(webapis.avplay.getDuration());
	}

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
		webapis.avplay.jumpForward(player.time);
	}
	else if (player.direct === 'backward') {
		webapis.avplay.jumpBackward(player.time);
	}

	d.resolve();

	return d.promise();
}

function _setVideoSize(coords) {
	if (webapis.avplay.getState() === 'PLAYING') {
		webapis.avplay.setDisplayRect(
			coords.left * 1.5,
			coords.top * 1.5,
			coords.width * 1.5,
			coords.height * 1.5
		);
	}
	else {
		tizen.tvwindow.show(
			function(){},
			null,
			[
				Math.floor(coords.left * 1.5) + 'px',
				Math.floor(coords.top * 1.5) + 'px',
				Math.floor(coords.width * 1.5) + 'px',
				Math.floor(coords.height * 1.5) + 'px'
			],
			'MAIN',
			'BEHIND'
		);
	}
}
function _add_listener_TV(plugin) {
	// plugin.detach_listener = pluginIPTV.OnEvent ? pluginIPTV.OnEvent : null;
	// pluginIPTV.OnEvent = plugin.event_listener;
}
function _remove_listener_TV(plugin) {
	// pluginIPTV.OnEvent = plugin.detach_listener ? plugin.detach_listener : null;
	// plugin.detach_listener = null;
}

function _tv_get_network_info() {
	var d = $.Deferred();
	var out = {
		ip: b2bapis.b2bcontrol.getIPAddress(),
		mac: b2bapis.b2bcontrol.getMACAddress(),
		type: 'UNKNOWN'
	};

	try{
		var type = webapis.network.getActiveConnectionType();
		switch (type) {
			case webapis.network.NetworkActiveConnectionType.ETHERNET:
				out.type = 'ETH';
				break;
			case webapis.network.NetworkActiveConnectionType.WIFI:
				out.type = 'WIFI';
				break;
			default:
				break;
		}
	}catch(e){
		console.log(e.message);
	}

	d.resolve(out);

	return d.promise();
}

var _tv_get_info = {
	_model: null,
	_firmware: null,
	_serial_number: null,
	model: function () {
		this._model = this._model ? this._model : webapis.productinfo.getRealModel();
		return this._model;
	},
	firmware: function () {
		this._firmware = this._firmware ? this._firmware : b2bapis.b2bcontrol.getFirmwareVersion(); //(webapis.productinfo.getFirmware();)
		return this._firmware;
	},
	serial_number: function(){
		this._serial_number = this._serial_number ? this._serial_number : b2bapis.b2bcontrol.getSerialNumber();
		return this._serial_number;
	},

	extra: function(){
		return {
			app_version: tizen.application.getCurrentApplication().appInfo.version
		};
	}
};

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
	// $(document.body).get(0).style['background'] = '';
}
function _tv_reboot() {
	_tv_bg_restore();

	b2bapis.b2bcontrol.rebootDevice(
		function(){
			log.add('REBOOT SUCCESS ????');
		},
		function(e){
			log.add('REBOOT Failed ' + JSON.stringify(e));
		}
	);
}
function _tv_poweroff() {
	var onSuccess = function(val) {
		console.log('[setPowerOff] success : ' + val);
	};
	var onError = function(error) {
		console.log('[setPowerOff] code :' + error.code + ' error name: ' + error.name + ' message ' + error.message);
	};
	console.log('[setPowerOff] ');
	b2bapis.b2bcontrol.setPowerOff(onSuccess, onError);
}
function _tv_poweron() {
	var onSuccess = function(val) {
		console.log('[setPowerOn] success : ' + val);
	};
	var onError = function(error) {
		console.log('[setPowerOn] code :' + error.code + ' error name: ' + error.name + ' message ' + error.message);
	};
	console.log('[setPowerOn] ');
	b2bapis.b2bpower.setPowerOn(onSuccess, onError);
}

function _get_power_state() {
	var d = $.Deferred();
	var state = b2bapis.b2bpower.getPowerState();
	d.resolve(state != 'Standby');
	return d.promise();
}

function __tv_virtual_standby_init(){

	//Unset needed
	try {
		b2bapis.b2bpower.unsetPowerStateChangeListener();
	} catch (e) {
		if(e.code == 11){
			log.add('Virtual Standby: Listener was not set! First load or system failure???');
		}else{
			log.add('Virtual Standby: Error unsetting Power State Listener. ' + e.code + ' ' + e.name);
		}
	}

	b2bapis.b2bpower.setPowerStateChangeListener(power_listener);

	log.add('Virtual Standby: Power State Listener set');

	function power_listener(msg){
		if(msg.data == 'Standby'){
			tv_virtual_standby_off();
		}else{
			tv_virtual_standby_on();
		}
	}
}

function _tv_firmware_uprade(){
	var d = $.Deferred();
	
	var SoftwareID = '0';
	var SWUFileName = '';
	var SWVersion = '';
	var SWURL = ''; 
	var SWTotalBytes = 0;

	$.get('fw/samsung/upgrade.json')
	.done(function(data){
		var models = Object.keys(data);
		if(data && models && models.length){
			if(models.indexOf(tv_get_info().model) != -1){
				var url = data[tv_get_info().model];
				if(url.match(/^https?:\/\/.+\/image\/\w+\.bem$/)){
					SWURL = url;
					var url_split = url.split('/');
					SWUFileName = url_split[url_split.length-1];

					$.get(url_split.slice(0,-2).join('/') + '/info.txt')
					.done(function(data){
						SWVersion = data;
						var SWVersion_split = data.split(' ');
						if(SWVersion && SWVersion_split.length == 2){
							var fw_split = tv_get_info().firmware.split('-');
							if(fw_split.slice(0,2).join('-') == SWVersion_split[0]){
								switch(__fw_compare(fw_split[2], SWVersion_split[1])){
									case 1:

										$.ajax({
											type: 'HEAD',
											url: SWURL,
										})
										.done(function(data, status, xhr) {
											SWTotalBytes = parseInt(xhr.getResponseHeader('Content-Length'));
											if(SWTotalBytes){
												console.log('FW upgrade: filename: ' + SWUFileName + ', filesize: ' + SWTotalBytes +', version: ' + SWVersion);

												try {
													//TODO: перенос прослушки прогресса в общий поток (условие?)
													b2bapis.b2bcontrol.setUpdateFirmwareProgressChangeListener(function(data){
														console.log('FW upgrade: progress ' + data);
													});
													//----
													b2bapis.b2bcontrol.updateFirmware(
														SoftwareID,
														SWUFileName,
														SWVersion,
														SWURL,
														SWTotalBytes,
														function(state){
															d.resolve('Power off TV and wait for at least 10 minutes to download and install new firmware.');
														},
														function(e){
															d.reject('TV error ' + e);
														}
													);
												} catch (error) {
													d.resolve('Duplicate command (probably)');
												}

											}else{
												d.reject('Cannot get FW size');
											}
										})
										.fail(function(err){
											if(err.status == 200){
												d.reject('Incorrect FW file');
											}else if(err.status == 404){
												d.reject('No FW file');
											}else if(err.statusText == 'timeout'){
												d.reject('FW file timeout');
											}else{
												d.reject('File error: ' + err.status + '|' + err.statusText);
											}
										});
										break;
									case -1:
										d.reject('Version is lower');
										break;
									case 0:
										d.reject('Version is the same');
										break;
									default:
										d.reject('unknown error in version');
										break;
								}
							}else{
								d.reject('Incorrect FW for model');
							}
						}else{
							d.reject('Incorrect version info');
						}
					})
					.fail(function(err){
						if(err.status == 200){
							d.reject('Incorrect info');
						}else if(err.status == 404){
							d.reject('No version info');
						}else if(err.statusText == 'timeout'){
							d.reject('Version timeout');
						}else{
							d.reject(err.status + '|' + err.statusText);
						}
					});

				}else{
					d.reject('Incorrect URL');
				}
			}else{
				d.resolve('No FW for this model');
			}
		}else{
			d.reject('Empty manifest');
		}
	})
	.fail(function(err){
		if(err.status == 200){
			d.reject('Incorrect manifest');
		}else if(err.status == 404){
			d.reject('No upgrade manifest');
		}else if(err.statusText == 'timeout'){
			d.reject('Manifest timeout');
		}else{
			d.reject(err.status + '|' + err.statusText);
		}
	});
	return d.promise();

	function __fw_compare(a, b){
		a = a.split('.').slice(0,2).join('.')*10;
		b = b.split('.').slice(0,2).join('.')*10;
		return (b-a).constrain(-1,1);
	}
}