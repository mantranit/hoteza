function _tv_show_preloaded_apps(show_all){
	return Apps.show(show_all);
}
var Apps = {
	deps: ['ServiceCodes'],
	init: function(){
		var d = $.Deferred();
		ServiceCodes.registerListener('1131', function(){Apps.show();});
		ServiceCodes.registerListener('1132', function(){Apps.show(true);});
		d.resolve();
		return d.promise();
	},
	get: function(raw){
		if (typeof _tv_get_preloaded_app_list === 'function') {
			//TODO: check response array
			return _tv_get_preloaded_app_list(raw);
		}else{
			log.add('Apps: ERROR: _tv_get_preloaded_app_list NOT IMPLEMENTED');
			return $.Deferred().reject('not implemented');
		}
	},
	show: function(show_all){
		this.get()
		.done(function(apps_list){
			var tmp = '';
			if(!apps_list || apps_list.length == 0){
				tmp = 'Apps not found';
			}else{
				for (var i = 0; i < apps_list.length; i++) {
					var app = apps_list[i];
					//TODO: переделать на построение по конфигу
					//TODO: запуск по id?
					var allowed_apps = isset('config.tv.allowed_apps');
					if((allowed_apps && allowed_apps.indexOf(app.name) != -1) || show_all){
						//TODO: проверять наличие иконки, выводить свою при отсутствии
						tmp += 
							'<div onvclick="Apps.launch({id: \'' + app.id + '\', name: \''+ app.name +'\'});" style="margin:0;padding:10px">' +
								'<img ' + (app.icon ? ('src="' + app.icon + '" style="') : 'style="width:50px;') + 'height:50px;margin-right:20px;vertical-align: middle;">' +
								(show_all ? (app.name + ' (' + app.id + ')') : app.name) +
							'</div>';
					}
				}
			}

			$('#sample_page .header').html('<h1>' + getlang('tv_smartapps') + '</h1>');
			$('#sample_page .content').html('<div style="margin:0px 20px;">' + tmp + '</div>');
			navigate('#sample_page');
		})
		.fail(function(f){
			console.log('Error getting APPS list', f);
		});
	},
	launch: function(payload) {
		$(window).trigger('analytics', {
			type: 'hitPage',
			target: payload.name
		});
		_tv_preloaded_app(payload.id);
	},
	check: function(appName) {
		var d = $.Deferred();
		//надо учитывать, что если попробовать заппустить приложение без "проверки", то список dict не обновится
		if(isset('config.tv.additional_apps') && Object.keys(config.tv.additional_apps).length){
			var tmp = Object.keys(config.tv.additional_apps);
			for(var i in tmp){
				if(!this.app_dict[tmp[i]]){
					this.app_dict[tmp[i]] = [];
				}
				this.app_dict[tmp[i]] = this.app_dict[tmp[i]].concat(config.tv.additional_apps[tmp[i]]);
			}
			delete config.tv.additional_apps;
		}

		var knownIds = this.app_dict[appName];

		//Удалённая реализация запуска internal приложений
		// if(knownI.id != 'internal'){
		// }else{
		// 	if(typeof(Apps[payload.name]) == 'function'){
		// 		Apps[payload.name]();
		// 	}else{
		// 		log.add('Apps: no internal handler for app ' + payload.name);
		// 	}
		// }

		Apps.get()
		.done(function (apps_list) {
			if (!knownIds || !knownIds.length) {
				d.reject('no such app in dict');
				return;
			}
	
			var apps_ids_list = apps_list.map(function(obj){return obj.id;});
	
			for(var o = 0; o < knownIds.length; o++){
				var app_index = apps_ids_list.indexOf(knownIds[o]);
				if (app_index !== -1) {
					d.resolve(apps_list[app_index]);
					return;
				}
			}
	
			d.reject('app not found');
		})
		.fail(function(f){
			d.reject(f);
		});
	
		return d.promise();
	},
	open: function(appName) {
		if(appName){
			//TODO: переделать на нормальный запуск приложений через internal
			appName = appName.toLowerCase();
			if(tv_lg_mark && appName == 'netflix'){
				Apps.netflix();
			}else{
				Apps.check(appName).done(function (payload) {
					Apps.launch(payload);
				}).fail(function (f) {
					log.add('Apps: open app failed: '+ appName +' doesn\'t exist (' + f + ')');
					tv_log('Opening App failed: '+ appName +' doesn\'t exist');
				});
			}
		}else{
			custom_alert('App ID not set');
		}
	},
	log: function(find){
		Apps.get()
		.done(function(apps_list){
			if(!apps_list || apps_list.length == 0){
				console.log('Apps not found');
				return false;
			}
			for(var index in apps_list){
				var app = apps_list[index];
				if(!find || (find && (app.name + app.id).toLowerCase().indexOf(find.toLowerCase()) != -1)){
					console.log(index +': ' + app.name + ' (' + app.id + ')');
				}
			}
		})
		.fail(function(f){
			console.log('Error getting APPS list', f);
		});
	},
	miracast: function(){
		if(typeof(_tv_miracast) != 'undefined'){
			$(window).trigger('analytics', {
				type: 'hitPage',
				target: 'miracast'
			});

			_tv_miracast();
		}else{
			log.add('MIRACAST/SCREEN SHARE: Not implemented');
		}
	},
	netflix: function(){
		var d = $.Deferred();
		if(typeof(_tv_netflix) != 'undefined'){
			$(window).trigger('analytics', {
				type: 'hitPage',
				target: 'netflix'
			});
			Loader.start();
			_tv_netflix()
			.done(function(){
				Loader.stop();
				d.resolve();
			})
			.fail(function(f){
				Loader.stop();
				custom_alert('Netflix error<br>Please try again later');
				log.add('Netflix error: ' + f);
				d.reject(f);
			});
		}else{
			custom_alert('Netflix not supported');
			d.reject('Netflix not supported');
		}
		return d.promise();
	},
	tests: function(){
		var tests_list = [
			{'name': 'Find YouTube', 'method': 'test_youtube'},
			{'name': 'Find Netflix', 'method': 'test_netflix'},
			{'name': 'Run Netflix', 'method': 'test_netflix_run'}
		];
		return tests_list;
	},
	test_youtube: function(){
		var find = 'yout';
		Apps.get()
		.done(function(apps_list){
			var out = [];
			for(var index in apps_list){
				var app = apps_list[index];
				if(!find || (find && (app.name + app.id).toLowerCase().indexOf(find.toLowerCase()) != -1)){
					out.push(index +': ' + app.name + ' (' + app.id + ')');
				}
			}
			if(out.length){
				custom_alert(out.join('<br>'));
			}else{
				custom_alert('App not found');
			}
		})
		.fail(function(f){
			console.log('Error getting APPS list', f);
		});
	},
	test_netflix: function(){
		var find = 'netf';
		Apps.get()
		.done(function(apps_list){
			var out = [];
			for(var index in apps_list){
				var app = apps_list[index];
				if(!find || (find && (app.name + app.id).toLowerCase().indexOf(find.toLowerCase()) != -1)){
					out.push(index +': ' + app.name + ' (' + app.id + ')');
				}
			}
			if(out.length){
				custom_alert(out.join('<br>'));
			}else{
				custom_alert('App not found');
			}
		})
		.fail(function(f){
			console.log('Error getting APPS list', f);
		});
	},
	test_netflix_run: function(){
		Apps.netflix();
	},
	app_dict: {
		youtube: [
			'9Ur5IzDKqV.TizenYouTube', // Tizen Installed
			'com.samsung.tv.cobalt-yt', // Tizen Embeded
			'144115188075859002', // LG
			'111299001912', // Samsung Orsay
			'com.google.android.youtube.tv', //Philips
			'youtube' //TVIP
		],
		browser: [
			'org.tizen.browser', // Tizen Embeded
			'org.tizen.chromium-efl.ubrowser', // Tizen. 'Chromium-efl ubrowser'
//			'org.tizen.chromium-efl.mini_browser', // Tizen. 'Chromium-efl MiniBrowser'
			'29_fullbrowser', // Samsung Orsay
			'144115188075855877', // LG 
		],
		netflix: [
			// Tizen Installed (not found)
			'org.tizen.netflix-app', // Tizen Embeded
//			'org.tizen.netflixlowmem', // Tizen Embeded
//			'244115188075859013', // LG US and later
//			'internal' //LG US and later
			'com.netflix.ninja', //Philips
		],
		airtime: [
			'201711221538035001', // LG webos (43UW761H-ZD)
			'34r7A9IqwB.airwave', //Tizen AirTime Installed
			'3201511006633', // Samsung Orsay
			'3201804016036', // Samsung Orsay 2
			'tv.airwave.androidtv', //Philips 6011
			'Airtime', //Philips 614
		],
		facebook: [
			'4ovn894vo9.Facebook' // Tizen Installed
		],
		usb: [
			'org.tizen.usb-launcher-tv', // Tizen Embeded
			'201604211753030001', // LG webos
			'144115188075855882' // LG SmartShare
		],
		bluetooth: [
			'244115188075859015', // LG webos
			'org.tizen.ep-hotel-btplayer' // Tizen Embeded
		]
	}
};