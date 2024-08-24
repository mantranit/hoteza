/* exported PLAYER_INIT, is_saving_storage_process, tv_channels_sorted_lang, tv_channels_category_list, res_url, T_SEC, T_MIN, T_HOUR, T_DAY, Vendor */
var HotezaTV = {
	history: {
		lastpage: ''
	},
	metrics: {
		system: false,
		modules: false,
		splash: false,
		final: false,
		was_standby: false
	},
	reg: 'initial',
	auth: 'initial'
};

var appUseZoom = false;
var fullscreen;
var tv_cur_block;
var tv_cur_pos;
var tv_sel_list = $([]);
var tv_cur_elem;
var tv_max_pos = 0;
var tv_room = 0;
var tv_keys = {};
var tv_keys_reverse = {};
var tv_last_key;
// Используется в tv_lg.js для предотвращения tv+_channel_stop ????
var PLAYER_INIT = false;
var is_saving_storage_process = false;

var clip;
var gallery;
var tv_keydown_override;
var tv_channels_sorted_lang;
var tv_channels_category_list;
var _tv_channels; // отфильтрованные по группам каналы

var weather_updater;
var res_url = 'res_url_not_set';
var api_url = 'api_url_not_set';

var tv_ip = 'unknown';
var tv_mac = 'unknown';
var tv_sign = 'unknown';
var tv_api_url = 'tv_api_url_not_set';
var tv_daemon_url = '';

var guestData = {};

//Временные константы для таймаутов
var T_SEC = 1000, T_MIN = 60 * T_SEC, T_HOUR = 60 * T_MIN, T_DAY = 24 * T_HOUR;

//Глобальное снижение качество эффектов jquery
$.fx.interval = 50;

// Глобальная установка таймаута 10 сек
initAjaxSetup();

var templatesUrl = [
		'templates/welcome.html',
		'templates/welcome_screen.html',
		'templates/default.html',
		'templates/gallery.html',
//        'templates/page.html',
		// 'templates/wakeupcall.html',
		'templates/guide.html',
		// 'templates/cart.html',
		'templates/settings.html',
		'templates/parental_lock.html',
		'templates/viewbill.html',
		'templates/rcu.html',
		'templates/language.html',
		'templates/feedback.html',
//        'templates/shop_category.html',
//        'templates/shop_products.html',
		'templates/shopitem.html',
		// 'templates/shop_order.html',
		'templates/sample_page.html',
		'templates/tv_control_demo.html',
		'templates/room_control_demo.html',
		'templates/service_page_for_data.html',
		'templates/sources_page.html',
		'templates/sources_page_old.html',

		'templates/tv_channel_container.html',
		'templates/tv_channel_list.html',
		'templates/tv_channel_preview.html',
		'templates/tv_channel_choosing_list.html',
		'templates/tv_channel_information.html',
		'templates/tv_channel_list_refresh.html',
		'templates/tv_channel_list_language.html',
		'templates/tv_channel_epg.html',

		'templates/mosaic.html',
		'templates/tv_station_list.html',
		'templates/tv_station_list_refresh.html',
		'templates/radio_preview.html',
		'templates/tv_station_choosing_list.html',
		'templates/radio_action.html',

		'templates/weather_forecast.html',
		'templates/menu_weather_s2x2.html',
		'templates/menu_weather_s2x1.html',
		'templates/menu_weather_s1x1.html',
		'templates/menu_weather_scandic.html',
		'templates/menu_weather_classic.html',
		'templates/weather_select_location.html',

		'templates/mod_playlist.html',
		'templates/mod_audio_list.html',
		'templates/mod_playlist_container.html',
		'templates/mod_category.html',
		'templates/mod_preview.html',

		'templates/movie_page.html',
		'templates/popup_list.html',

		'templates/time_picker.html',
		'templates/information.html',
		'templates/list_items/list_items.html',
		'templates/list_items_toppings.html',
		'templates/features_services_wakeup.html',
		'templates/features_services_wakeup_legend.html',
		'templates/features_substrate.html',
		'templates/wakeup_new.html',
		'templates/fullscreen_video.html',
		'templates/table/table.html',

		'templates/features_legend.html',
		'templates/inner_menu_item.html',
		'templates/fullscreen_overlay.html',

		'templates/auth-qr.html',
//		'templates/yandex_station.html'
	],
	templates = {},
	templates_cache = {},

	componentsUrl = [
		'templates/components/header.html'
	];

var tv_channels_languages_def = [
	{'m0': {'transcription': 'Crnogorski','image': 'i/flags/Montenegro.png'}},
	{'sl': {'transcription': 'Slovenski','image': 'i/flags/Slovenia.png'}}, // ISO 639-1
	{'si': {'transcription': 'Slovenski','image': 'i/flags/Slovenia.png'}}, // CMS
	{'sk': {'transcription': 'Slovenský','image': 'i/flags/Slovakia.png'}},
	{'sr': {'transcription': 'Српски','image': 'i/flags/Serbia.png'}},
	{'hr': {'transcription': 'Hrvatski','image': 'i/flags/Croatia.png'}},
	{'en': {'transcription': 'English','image': 'i/flags/United-Kingdom.png'}},
	{'ru': {'transcription': 'Русский','image': 'i/flags/Russia.png'}},
	{'zh': {'transcription': '汉语','image': 'i/flags/China.png'}},
	{'zh-TW' : {'transcription': '繁體', 'image': 'i/flags/_China-traditional.png'}},
	{'ar': {'transcription': 'العربية','image': 'i/flags/_Arabic.png'}},
	{'de': {'transcription': 'Deutsch','image': 'i/flags/Germany.png'}},
	{'es': {'transcription': 'Español','image': 'i/flags/Spain.png'}},
	{'fr': {'transcription': 'Français','image': 'i/flags/France.png'}},
	{'tr': {'transcription': 'Türkçe','image': 'i/flags/Turkey.png'}},
	{'it': {'transcription': 'Italiano','image': 'i/flags/Italy.png'}},
	{'pt': {'transcription': 'Português','image': 'i/flags/Portugal.png'}},
	{'ja': {'transcription': '日本の','image': 'i/flags/Japan.png'}},
	{'nl': {'transcription': 'Nederlands','image': 'i/flags/Netherlands.png'}},
	{'fa': {'transcription': 'فارسی','image': 'i/flags/_Arabic.png'}},
	{'ko': {'transcription': '한국의','image': 'i/flags/South-Korea.png'}},
	{'da': {'transcription': 'Dansk','image': 'i/flags/Denmark.png'}},
	{'th': {'transcription': 'Thailand','image': 'i/flags/Thailand.png'}},
	{'uk': {'transcription': 'Українська','image': 'i/flags/Ukraine.png'}},
	{'tg': {'transcription': 'Тоҷикӣ','image': 'i/flags/Tajikistan.png'}},
	{'ro': {'transcription': 'Moldovenească','image': 'i/flags/Moldova.png'}},
	{'hy': {'transcription': 'Հայերեն','image': 'i/flags/Armenia.png'}},
	{'uz': {'transcription': 'Оʻzbek','image': 'i/flags/Uzbekistan.png'}},
	{'ky': {'transcription': 'Кыргы́з','image': 'i/flags/Kyrgyzstan.png'}},
	{'kk': {'transcription': 'Қазақша','image': 'i/flags/Kazakhstan.png'}},
	{'az': {'transcription': 'Azərbaycan','image': 'i/flags/Azerbaijan.png'}},
	{'id': {'transcription': 'Indonesia','image': 'i/flags/Indonesia.png'}},
	{'vi': {'transcription': 'Tiếng Việt','image': 'i/flags/Vietnam.png'}},
	{'hu': {'transcription': 'Magyar','image': 'i/flags/Hungary.png'}},
	{'el': {'transcription': 'Ελληνικά','image': 'i/flags/Greece.png'}},
];
$(HotezaTV).one('splashshow', function(){
	var code;
	//TODO: изменить вид, поменять в использовании (VOD, mosaic)
	var tmp = isset('config.tv.channels_languages_override');
	if(tmp && tmp.length){
		for(var i=0; i<tmp.length; i++){
			code = Object.keys(tmp[i]);
			//Удаление существующего (переделать на обновление?)
			for(var index in tv_channels_languages_def){
				if(tv_channels_languages_def[index][code]){
					tv_channels_languages_def.splice(index, 1);
				}
			}
			//Добавление
			tv_channels_languages_def.push(tmp[i]);
		}
	}

	// Кастомный порядок языков из конфига
	var tmp_conf = isset('config.tv.channels_languages_order', ['locale']);
	if(tmp_conf && tmp_conf.length){
		var out = [];
		for(var i2=0; i2<tmp_conf.length; i2++){
			if(tmp_conf[i2] == 'locale'){
				tmp_conf[i2] = get_language();
			}
			for(var o=(tv_channels_languages_def.length-1); o>=0; o--){
				code = Object.keys(tv_channels_languages_def[o])[0];
				if(code == tmp_conf[i2]){
					out.push(tv_channels_languages_def.splice(o,1)[0]);
				}
			}
		}
		out = out.concat(tv_channels_languages_def);
		tv_channels_languages_def = out;
		log.add('CHANNELS: languages list reordered: ' + isset('config.tv.channels_languages_order', ['locale']).join(',') + ',...');
	}else{
		log.add('CHANNELS: default languages list');
	}
});

css_append('templates/table/table.css');

var videoCollection = new VideoCollection();

var tv_open_app = {
	opened: false,
	open: function(must) {

		if (
			typeof must === 'undefined' &&
			tv_open_app.opened
		) {
			return;
		}

		//TODO: удалить после реализации выхода из любого места приложения
		//при старте системы равен true, после нажатия любой кнопки - false
		if(system_idle){
		}else{
			reload_app();
			return false;
		}


		tv_open_app.opened = true;

		if (
			isset('config.tv.welcome_screen.enabled') &&
			(
				isset('config.tv.welcome_screen.always')  ||
				(
					!isset('config.tv.welcome_screen.always') &&
					!load_data().welcome_screen_shown
				)
			)
		) {
			tv_welcome();
		}
		else {
			setTimeout(function(){
				delete_splash().done(function () {
					navigate('#menu');

					//TODO: удалить после норамльной реализации меню-велком
					if(classic_menu){
						$('#tv_fullscreen_btns').show();
					}

					if (metro_menu) {
						set_first_active_cursor_in_menu();
					}
					else if (!scandic_menu) {
						if (isset('config.tv.welcome_screen.enabled')) {
							$(first_page_in_classic_menu.get_page()).trigger(event_link);
							tv_sel_block('menu');
						}
						else {
							navigate('#welcome', 'now');
							tv_sel_block('menu');
						}
					}
				});
			}, 3000);
		}
	}
};

var tv_content_url = 'c/';
var structv2;

function fs_read(){
	structv2 = null;
	$('#tv_cur').hide();
	var splash = new Image();
	splash.onload = function(i){

		var loadTemplatesInstance;
		if(isset('config.production')){
			loadTemplatesInstance = new LoadPackedTemplates();
		}else{
			loadTemplatesInstance = new LoadTemplates();
		}

		$.when(loadTemplatesInstance, loadComponents())
		.done(function() {

			var tmp = get_language();

			$.getJSON(tv_content_url + 'struct/struct_' + tmp + '.json?_r=' + Math.random())
			.done(function (data) {

				extendStruct(data, tmp)
				.done(function (data_inner) {
					structv2 = data_inner;
					// изменяем ссылку с #cart на #orders,
					// делаем так, чтобы сохранить обратную совместимость
					structv2.menu = changeCartItemLink(structv2.menu);

					log.add('Loaded JSON struct');

					fs_read_end();
				});

			})
			.fail(function () {
				log.add('ERROR: JSON struct failed: ' + tmp);
				if(storage.getItem('language')){
					storage.removeItem('language');
					// Failsafe load of default struct
					var defaultLanguage = (isset('config.defaults.language') || 'en');

					$.getJSON(tv_content_url + 'struct/struct_' + defaultLanguage + '.json?_r=' + Math.random())
					.done(function (data) {

						extendStruct(data, defaultLanguage)
						.done(function (data_inner) {
							structv2 = data_inner;
							// изменяем ссылку с #cart на #orders,
							// делаем так, чтобы сохранить обратную совместимость
							structv2.menu = changeCartItemLink(structv2.menu);

							log.add('Loaded DEFAULT JSON struct');

							fs_read_end();
						});

					})
					.fail(function(){
						tv_log('No content to display [' + defaultLanguage + ']');
					});
				}
			});

		});
	};
	splash.onerror = function(){
		log.post_log('ERROR: hotel ' + get_hotelId() + ' room ' + (isset('storage')?storage.getItem('room'):'empty') + ': Global error: CONTAINER ERROR /url: undefined /line: 0 /col: 0');
	};
	splash.src = 'tv/container_bg_splash.jpg';
}

function fs_read_end(){
	log.add('got struct');

	// построение страниц по struct
	$.getJSON(tv_content_url + 'lang.json')
	.done(function(data){
		var i;
		var timestart = Date.now();
		lang_append(data);
		log.add('LANG: loaded language strings (' + Object.keys(lang_strings) + ') in ' + (Date.now() - timestart) + 'ms');

		if(isset('config.lang_override')){
			lang_append(isset('config.lang_override'));
			log.add('LANG: strings overriden');
		}

		filter_content_by_device_for_struct(structv2, 'tv');

		var start = Date.now();

		UI.buffer_start();

		// Вставка placeholder для именного приветствия гостя
		structv2.welcome.title = setGuestNameIntoText(structv2.welcome.title, '<span class="tv_welcome_greeting_placeholder"></span>');
		structv2.welcome.content = setGuestNameIntoText(structv2.welcome.content, '<span class="tv_welcome_greeting_placeholder"></span>');
		// рендер welcome'a
		renderPageOnTheStructv2('welcome', structv2.welcome, 'welcome');

		//TODO: перенести в модули
		// если получаем массив, значит поле пустое
		// в противном случае здесь будет объект
		if(!$.isArray(structv2.yandex_station)){
			YandexStation.init();
		}

		// путеводитель
		renderPageOnTheStructv2('guide', Object.assign({
			title: getlang('mobileAppContent-mainMenuPage-label-guide'),
			backBtn: 0
		},
			structv2.guide
		), 'guide');

		// корзина
		// renderPageOnTheStructv2('cart', structv2.cart, 'cart');
		// renderPageOnTheStructv2('shop_order', {}, 'shop_order', 'white');

		// настройки
		renderPageOnTheStructv2(
			'settings',
			{
				'title': getlang('settings'),
				'parental_lock': isset('config.tv.parental_lock'),
				'sleep_timer': isset('config.tv.sleep_timer.enabled'),
				'backBtn': 0
			},
			'settings'
		);

		// счет строится в viewbill

		// языки
		var tmp_conf = isset('config.tv.settings_languages_order');
		if(tmp_conf && tmp_conf.length){
			var out = [];
			for(i=0; i<tmp_conf.length; i++){
				for(var o=(structv2.language.length-1); o>=0; o--){
					if(structv2.language[o].code == tmp_conf[i]){
						out.push(structv2.language.splice(o,1)[0]);
						console.log('Language moved ' + tmp_conf[i]);
					}
				}
			}
			out = out.concat(structv2.language);
			structv2.language = out;
			log.add('Language list reordered');
		}
		renderPageOnTheStructv2('language_select', {
			languageArr: structv2.language,
			title: getlang('mobileAppContent-mainContent-settings-chooselang'),
			backBtn: 1,
			parentId: 'settings'
		}, 'language');

		// обратная связь
		renderPageOnTheStructv2(
			'feedback',
			Object.assign({
				title: getlang('mobileAppContent-mainMenuPage-label-feedback'),
				stars: [1,2,3,4,5],
				backBtn: 0
			},
				structv2.feedback
			),
			'feedback',
			'new'
		);

		// генерация shopitem
		renderPageOnTheStructv2('shopitem', {
			backBtn: 1,
			onvclick: 'shop_back(this);',
			lock_ordering: isset('config.shop.lock_ordering')
		}, 'shopitem');

		// генерация sample_page для логов
		renderPageOnTheStructv2('sample_page', { title: 'Лог' }, 'sample_page', 'white');

		renderPageOnTheStructv2('service_page', { title: 'Service' }, 'service_page_for_data');
		$('#service_resolution').html(ww+'x'+wh);

		if (structv2.config.demo) {
			renderPageOnTheStructv2('room_control', {
				title: getlang('mobileAppContent-mainMenuPage-label-roomcontrol'),
				backBtn: 0
			}, 'room_control_demo');
			renderPageOnTheStructv2('tv_control', {
				title: getlang('mobileAppContent-mainMenuPage-label-tvcontrol'),
				backBtn: 0
			}, 'tv_control_demo');
		}

		for(i in structv2.pages) {
			var page = structv2.pages[i];

			if (page.type === 'authQR') {
				renderPageOnTheStructv2(
					i,
					Object.assign(
						{},
						page,
						// eslint-disable-next-line quotes
						{ onopen: "QR.get('"+ page.id +"', 'page')" }
					),
					'auth-qr',
					'white'
				);
			}

			if (page.type === 'video') {
				renderPageOnTheStructv2(
					i,
					Object.assign(
						page,
						{
							onopen: 'fullscreenVideoPage.open();',
							onclose: 'fullscreenVideoPage.close();'
						}
					),
					'fullscreen_video',
					'fullscreen_video'
				);
			}

			if (page.type === 'gallery') {
				renderPageOnTheStructv2(i, page, 'gallery', 'gallery_page');
			}

		}

		UI.buffer_stop();

		// Пререндер шрифтов, чтобы не прыгал текст и не слетал курсор
		//TODO: ??? preload default font with empty span
		//TODO: ??? preload bold
		//TODO: ??? preload RCU and other modules fonts
		if(isset('config.tv.hacks.preload_fonts')){
			var fonts = isset('config.tv.hacks.preload_fonts');
			if(typeof(fonts) == 'string'){
				fonts = [fonts];
			}
			if(typeof(fonts) == 'object'){
				for(i in fonts){
					fonts[i] = '<span style="font-family: ' + fonts[i] + ';"></span>';
				}
				$(document.body).append('<div style="opacity:0;position: absolute;top: 0px;">' + fonts.join('') + '</div>');
			}else{
				log.add('UI: preload_fonts incorrect');
			}
		}else{
		}

		log.add('Rendered struct in ' + (Date.now() - start) + 'ms');

		HotezaTV.metrics.system = time.uptime();

		LPBar.show();
		Modules.load_all()
		.then(document_ready);

	})
	.fail(function(){
		log.add('LANG: failed to load language strings');
	});

}

$(HotezaTV).on('splashshow', function(){
	var channellist_path = tv_content_url + 'channellist.json';
	if(tv_desktop_mark && isset('config.desktop.channellist')){
		channellist_path = isset('config.desktop.channellist');
	}

	$.get(
		channellist_path + '?_='+Math.random(),
		function(data){
			if(typeof(data.length) === 'undefined'){
				if(data[get_language()] && data[get_language()].length){
					data = data[get_language()];
				}else{
					data = data[defaults.language];
				}
			}
			tv_channels = data;
			log.add('CHANNELS: channels loaded = ' + tv_channels.length);

			//TODO: add screen caption
			//TODO: check current state WORKS?
			get_power_state()
			.done(function(state){
				if(state == true){
					tv_virtual_standby_state = false;
					console.log('TV is ON');
					hash.set('standby', null);
					tv_ready();
				}else{
					tv_virtual_standby_state = true;
					console.log('TV is STANDBY');
					hash.set('standby');
					log.add('TV: TV in Standby Mode!!!');
				}
			})
			.fail(function(error){
				console.log('TV in UNKNOWN STATE');
				tv_virtual_standby_state = false;
				hash.set('standby', null);
				tv_ready();
			});

			_tv_channels = tv_mosaic.filter_channels_by_groups();

			// Построение списка каналов
			tv_channellist_build();

			//сброс таймера проверки загрузки системы (из старта)
			clearTimeout(system_start_timer);

			//Установка таймера перезагрузки системы (в standby)
			setTimeout(
				function(){
					if(tv_virtual_standby_state == true){
						if(isset('config.tv.reboot_in_standby')){
							console.log('Hoteza reboot due to long STANDBY');
							tv_reboot();
						}else{
							console.log('Hoteza restart due to long STANDBY');
							reload_app();
						}
					}else{
						//Turned on
						log.add('TV: ON for a long time (6 hours)');
					}
				},
				6 * T_HOUR
			);

			//Установка таймера выключения системы (если никто не трогал)
			setTimeout(
				function(){
					if(system_idle == true){
						console.log('Hoteza turn off due to no touch');
						tv_poweroff();
					}else{
						//TODO: turn off after confirmation
						//was touched
						log.add('TV: ON for a long time (12 hours) but touched');
					}
				},
				12 * T_HOUR
			);
		},
		'json'
	).fail(function(error){
		tv_log('Channellist error');
	});

});

$(HotezaTV).one('fs_ready', function(){
	//HotezaHub
	var tmp = hash.get('hhurl');
	if(tmp){
		storage.setItem('hhurl', tmp);
		hash.set('hhurl', null);
	}else{
		//TODO: убрано до момента решения удаления урла при перезагрузке страницы
		//storage.removeItem('hhurl');
	}

	hash.set('room', storage.getItem('room'));

	//Подключение weinre
	weinre_debug_check();

	setTimeout(fs_read, 50);
});

//Определение телевизора
var ua = navigator.userAgent.toLowerCase();

//TODO: del 
var tv_amino_mark = 0,
	tv_lg_mark = 0,
	tv_samsung_mark = 0,
	tv_samsung_tizen_mark = 0,
	tv_tizen_mark = 0,
	tv_philips_old_mark = 0,
	tv_philips_mark = 0,
	tv_mag_mark = 0,
	tv_tvip_mark = 0,
	tv_sony_mark = 0,
	tv_vestel_mark = 0,
	tv_desktop_mark = 0;
var tv_manufacturer = '';
// tvip "mozilla/5.0 (qtembedded; u; linux; c) applewebkit/533.3 (khtml, like gecko) mag200 stbapp ver: 3 rev: 656 mobile safari/533.3"
// mag  "mozilla/5.0 (qtembedded; u; linux; c) applewebkit/533.3 (khtml, like gecko) mag200 stbapp ver: 4 rev: 2721 mobile safari/533.3"
var Vendor = {
	_probes:{
		'amino': ['amino'],
		'lg': ['lge', 'netcast', 'lg browser'],
		'tizen_tep': ['tizen 6.5'],
		'tizen': ['tizen'],
		'samsung': ['smarthub', 'smart-tv', 'maple'],
		'philips_old': ['opera', 'presto', 'hbbtv'],
		'philips': ['philipstv', 'japit', 'wixp'],
		'tvip': ['tvip', 'mag200 stbapp ver: 3'],
		'mag': ['mag200', 'stbapp ver: 4'],
		'sony': ['bravia', 'sonycebrowser'],
		'vestel': ['vestel', 'smarttva']
	},
	_getVendorMark: function(userAgent, probes) {
		var count = 0;
		for (var key in probes) {
			if (userAgent.match(probes[key])) {
				count++;
			}
		}
		return count;
	},
	get: function(){
		var highest = 0, out = 'desktop';
		for(var i in this._probes){
			var tmp = this._getVendorMark(ua, this._probes[i]);
			if(highest < tmp){
				highest =  tmp;
				out = i;
			}
		}
		return out;
	},
	load: function(vendor){
		var d = $.Deferred();
		if(!vendor){
			vendor = this.get();
		}
		log.add('DEVICE: Vendor loading ' + vendor);
		$.cachedScript('tv/vendors/' + vendor + '/tv_' + vendor + '.js?v=' + version.v)
		.done(function(){

			$('#vendor_css').remove();

			if(typeof(_tv_vendor_init) == 'function'){
				_tv_vendor_init()
				.done(function(){
					log.add('DEVICE: Vendor init success');
					tv_manufacturer = vendor;

					//TODO: del
					//COMPATIBILITY
					// eslint-disable-next-line no-eval
					eval('tv_' + vendor + '_mark = 3'); //jshint ignore: line

					if(vendor == 'tvip'){
						tv_mag_mark = 2;
					}
					if(vendor == 'tizen'){
						tv_samsung_mark = 2;
						tv_samsung_tizen_mark = 3;
						tv_manufacturer = 'samsung';
					}
					if(vendor == 'tizen_tep'){
						tv_samsung_mark = 2;
						tv_samsung_tizen_mark = 3;
						tv_manufacturer = 'samsung';
					}
					//-------------
					d.resolve();
				})
				.fail(function(f){
					log.add('DEVICE: Vendor init ERROR!!! ' + f);
					tv_log(f);
					d.reject('INIT failed');
				});
			}else{
				log.add('DEVICE: Vendor NO INIT !!!');
				d.reject('NO INIT');
			}
		}).fail(function(e){console.log(e);
			var err = vendor + ' load error';
			tv_log(err);
			log.add(err);
			d.reject(err);
		});
		return d.promise();
	}
};

$(HotezaTV).one('final', function(){
	log.init();
	tv_final();
});

/*
$(HotezaTV).one('final', function(){
	var tmp = storage.getItem('room');
	if(tmp.length == 3){
		storage.setItem('room', '0'+tmp);
		$.get('https://api.hoteza.com/jsonapi/marriottchange-'+tmp)
		.always(function(){
			document.location.reload();
		});
	}
});
*/

function tv_load_nav(){
	$.cachedScript('tv/nav_tv.js?v=' + version.v)
	.done(function(){
		$(HotezaTV).trigger('fs_ready');
	});
}

function tv_ready(){
	$(HotezaTV).trigger('tv_ready');

	$(document.body).append($(templates_cache.fullscreen_overlay.render({}, { getlang: getlang })));

	tv_set_start_volume();

	time.sync();

	if(isset('config.weather.enabled')){
		tv_weather();
		weather_updater = setInterval(tv_weather, 30*T_MIN);
	}
	parental_lock_fill();

	tv_set_room();

	var tv_reg;
	if(isset('config.tv.hacks.tv_registration_v2')){
		tv_reg = tv_register_v2();
	}
	else{
		tv_reg = tv_register();
	}
	tv_reg
	.done(function(){
		log.add('TV: registered');
		HotezaTV.reg = 'OK';
		filter_content_by_group();
		tv_auth();
	})
	.fail(function(err){
		log.add('TV: ERROR - ' + err);
		HotezaTV.reg = err;
		guestData_clear();
		filter_content_by_group();
	});

	//Обработка галерей ПЕРЕДЕЛАТЬ!
	$('.gallery_container IMG').on(event_link, function(){
		gallery = new Gallery(this.closest('.gallery_container'));
		gallery.show(this);
	});

	//Перенести в Analytics или удалить
	//~ try {
		//~ if(typeof(Object.keys) === "function"){
			//~ log.add('Nav stat length: ' + Object.keys(JSON.parse(storage.getItem('nav_stat'))).length);
		//~ }
	//~ }
	//~ catch (e) {
		//~ log.add('NAVSTAT: ' + e.name + ': ' + e.message);
	//~ }

	clip = clipper();

	setTimeout(tv_open_app.open, 2000);

}

function tv_final(){
	_setHandlerKeydown();

	//TODO: move earlier
	if(isset('config.tv.volume_control') == 'hoteza'){
		if(isset('_add_volume_control')){
			_add_volume_control();
			_tv_get_volume()
			.done(function(data){
				Volume.set(data, true);
			})
			.fail(function(){
				log.add('Volume: failed to get');
			});
		}else{
			log.add('Volume: hoteza volume control unsupported');
		}
	}else{
		if(isset('_remove_volume_control')){
			_remove_volume_control();
		}
	}

	//Формирование обратного списка кнопок, для быстрого поиска
	for(var key in tv_keys){
		tv_keys_reverse[tv_keys[key]] = key;
	}

	$('#tv_fullscreen_overlay').css('visibility', '');

	// setTimeout(function(){
	// 	alert = custom_alert;
	// }, 1000);

	system_started = true;
}
function set_first_active_cursor_in_menu() {
	if (!metro_menu) {return;}

	var id = isset('structv2.config.metro_layout_tv.cursor');
	if (!id) {return;}

	var cursor = $('#menu li[data-id="'+ id +'"]');
	if (!cursor.is(':visible') || tv_cur_elem.data('id') == id) {return;}

	tv_sel_list.filter(function(i, elem) {
		if ($(elem).data('id') == id) {tv_cur_pos = i;}
	});

	tv_sel_cur();
}

var time = {
  timer: null,
  secs: null,
  date: new Date(),
  dof: 0,
  tz: 0,
  uptime: function (human_readable) {
    var out = Date.now() - log.zero;
    if (human_readable == true) {
      out = toHHMMSS(out / 1000);
    }
    return out;
  },
  now: function (utc) {
    var out = Date.now() + this.dof;
    if (!utc) {
      out += this.tz;
    }
    return out;
  },
  sync: function () {
    $.get(
      "http://103.153.72.195:8080/api/v1/datetime?tz=" +
        isset("config.timezone"),
      function (response) {
        time.dof = (response.time | 0) * 1000 - Date.now();
        time.tz = (response.offset | 0) * 1000;

        log.add(
          "TIME: synced, offset = " +
            toHHMMSS(time.dof / 1000) +
            " / " +
            time.dof +
            ", timezone: " +
            response.tz
        );
        log.add("TIME: date " + time.date);

        if (typeof _tv_time_set == "function") {
          try {
            _tv_time_set();
            log.add("TIME: clock set");
          } catch (e) {
            log.add("TIME: error setting TV clock");
          }
        }

        time.set();
      },
      "json"
    ).fail(function (err) {
      log.add("TIME: sync error: " + err.status + "|" + err.statusText);
    });
  },
  set: function () {
    if (isset("config.tv.time_status_exist")) {
      $("#tv_fullscreen_time").show();
    }

    if (time.timer) {
      clearTimeout(time.timer);
    }

    if (time.secs > 0) {
      var time_passed = (time.now() - time.date.getTime()) / 1000;
      if (Math.abs(time_passed - time.secs) > 60) {
        log.add(
          "TIME: passed " +
            toHHMMSS(time_passed) +
            ", expect " +
            toHHMMSS(time.secs) +
            ", resyncing"
        );
        time.secs = null;
        time.sync();
        return false;
      }
    }

    time.date = new Date(time.now());

    tv_set_date(time.date);

    $("#tv_fullscreen_time_hours").html(time.date.getUTCHours());
    $("#tv_fullscreen_time_minutes").html(lz(time.date.getUTCMinutes()));

    if (tv_channellist_type === "mosaic" && isset("config.tv.mosaic_clock")) {
      $("#tv_fullscreen_mosaic_time").html(
        '<span class="ui-icon-clock"></span>' +
          time.date.getUTCHours() +
          '<span class="blink">:</span>' +
          lz(time.date.getUTCMinutes())
      );
    }

    var tmp = 60 - new Date(time.now()).getSeconds();
    time.timer = setTimeout(time.set, tmp * 1000);

    time.secs = tmp;
  },
};
function tv_set_date(date) {
  if (!date || !("getUTCDate" in date)) {
    return false;
  }
  var container = $("#tv_fullscreen_date");
  if (isset("config.tv.date_status_exist")) {
    container.show();
  } else {
    container.hide();
    return false;
  }

  container.html(
    date.getUTCDate() +
      " " +
      getlang(MONTHOFYEAR[date.getUTCMonth()] + "_short") +
      " " +
      date.getUTCFullYear()
  );
}

function tv_set_room() {
  if (tv_room) {
    $("#tv_fullscreen_roomnumber").html(" " + tv_room);
    $("#tv_fullscreen_room").show();
  }
}

function tv_set_guest(tmp, repeat) {
  tmp = tmp ? tmp : isset("config.tv.welcome_format");

  /*Обратная совместимость config*/
  tmp = backward_compatibility_welcome_format(tmp);
  /*-------*/

  if (tmp) {
    $("#tv_fullscreen_welcome").html(tmp.format(get_welcome_guest_data()));
    $("#tv_fullscreen_welcome").show();

    if (scandic_menu && !repeat) {
      // перенос строки приветствия для scandic_menu
      tmp = addCarry(tmp);
      $("#tv_fullscreen_welcome_big").html(
        tmp.format(get_welcome_guest_data())
      );
    }
  } else {
    log.add("Error: No format for welcome message");
  }

  if (!checkWelcomeWidth()) {
    setTimeout(function () {
      tv_set_guest(
        isset("config.tv.welcome_format").replace("{w}, ", ""),
        true
      );
    }, 100);
  }

  function addCarry(string) {
    var queries = ["{w} ", "{w}, "];

    for (var i = 0; i < queries.length; i++) {
      var query = queries[i];
      if (string.indexOf(query) !== -1) {
        return string.replace(query, "<span>" + query + "</span>");
      }
    }

    return string;
  }
}
function tv_get_guest_name() {
  var guestName = "";

  if (check_auth()) {
    var tmp =
      isset("config.tv.greeting_format") || isset("config.tv.welcome_format");

    /*Обратная совместимость config*/
    tmp = backward_compatibility_welcome_format(tmp).replace(/{w}, |{w}*$/, "");
    /*-------*/

    guestName = tmp.format(get_welcome_guest_data()).trim();
  }

  return guestName.length > 1 && guestName !== "null" ? guestName : "";
}
function tv_set_welcome_guest_greeting(text) {
  var guestName = tv_get_guest_name();
  return setGuestNameIntoText(text, guestName);
}
function tv_set_welcome_guest_greeting_v2() {
  var guestName = tv_get_guest_name();
  $(".tv_welcome_greeting_placeholder").html(addCarry(guestName));

  function addCarry(name) {
    if (typeof ScandicWelcome !== "undefined" && isset("config.menu") !== "") {
      return "<br />" + name;
    }

    return name;
  }
}
function get_welcome_guest_data() {
  return {
    welcome: getlang("tv_welcome").replace(/[，, ]*$/, ""),
    w: getlang("tv_welcome").replace(/[，, ]*$/, ""),
    title: Guest.guestTitle || "",
    t: Guest.guestTitle || "",
    firstname: Guest.guestName || "",
    f: Guest.guestName || "",
    lastname: Guest.guestSurname || "",
    l: Guest.guestSurname || "",
  };
}
function backward_compatibility_welcome_format(welcome_format) {
  if (
    window.tv_hide_guestname ||
    window.tv_show_guesttitle ||
    window.tv_show_guestfirstname
  ) {
    welcome_format = "{w}, ";
    if (!isset("tv_hide_guestname")) {
      if (isset("tv_show_guesttitle")) {
        welcome_format += "{t} ";
      }
      if (isset("tv_show_guestfirstname")) {
        welcome_format += "{f} ";
      }
      welcome_format += "{l}";
    } else {
      welcome_format = "{w}";
    }
    log.add("Backward compatibility: Welcome format: " + welcome_format);
  }

  return welcome_format;
}
function checkWelcomeWidth() {
  var welcome = document.getElementById("tv_fullscreen_welcome"),
    info = document.getElementById("tv_fullscreen_info"),
    logo =
      metro_menu || scandic_menu
        ? document.getElementById("tv_fullscreen_logo")
        : document.getElementById("menu_wrapper");

  if (!welcome) {
    return false;
  }

  var welcomeMargin = parseInt(getComputedStyle(welcome).marginRight),
    containerWidth = metro_menu
      ? 1280 - logo.clientWidth - 29 - 29
      : 1280 - logo.clientWidth - 36 - 29;

  return (
    containerWidth - info.clientWidth - welcomeMargin > welcome.clientWidth
  );
}

function tv_set_guest_deprecated() {
  //DEPRECATED! NOT USED
  if (!("tv_hide_guestname" in window && tv_hide_guestname == true)) {
    var tmp = "";
    if ("tv_show_guesttitle" in window && tv_show_guesttitle == true) {
      if (typeof Guest.guestTitle != "undefined") {
        tmp += Guest.guestTitle + " ";
      } else {
        log.add("TV: GUEST TITLE EMPTY!");
      }
    }
    if ("tv_show_guestfirstname" in window && tv_show_guestfirstname == true) {
      if (typeof Guest.guestName != "undefined") {
        tmp += Guest.guestName + " ";
      } else {
        log.add("TV: GUEST NAME EMPTY!");
      }
    }
    tmp += Guest.guestSurname;
    $("#tv_fullscreen_guestname").html(tmp);
    $("#tv_fullscreen_welcome").show();
    fit_text($("#tv_fullscreen_welcome"), 14, true);
  } else {
    $("#tv_fullscreen_welcome")
      .html(getlang("tv_welcome").replace(/[, ]*$/, ""))
      .show();
  }
}

var weather;
function tv_weather() {
  var data = {
    hotelId: get_hotelId(),
  };
  $.post(
    "http://103.153.72.195:8080/api/v1/weather",
    data,
    function (response) {
      switch (response.result) {
        case 0:
          weather = response;
          if (weather.timestamp | 0) {
            var tmp = time.now(true) - weather.timestamp * 1000;
            if (tmp > 3 * T_HOUR) {
              //TODO: weather hide
              log.add("WEATHER: outdated: " + toHHMMSS(tmp / 1000));
              log.post_log(
                "WEATHER: ERROR: hotel " +
                  get_hotelId() +
                  ": weather outdated: " +
                  toHHMMSS(tmp / 1000)
              );
            } else {
              tv_set_weather();
              log.add("WEATHER: OK");
            }
          }
          break;
        case 1:
          log.add("WEATHER: Invalid hotel");
          clearInterval(weather_updater);
          break;
        case 2:
          log.add("WEATHER: not activated");
          clearInterval(weather_updater);
          break;
        default:
          log.add("WEATHER: response unknown");
          clearInterval(weather_updater);
          break;
      }
    },
    "json"
  ).fail(function (err) {
    log.add("WEATHER: error " + err.status + "|" + err.statusText);
  });
}
function tv_set_weather(get) {
  var tmp_temp, tmp_icon;
  if (weather) {
    if (weather.tempC && weather.tempC > 0) {
      if (isset("config.weather.plus")) {
        tmp_temp = "+" + weather.tempC;
      } else {
        tmp_temp = weather.tempC;
      }
    } else {
      tmp_temp = weather.tempC;
    }
    if (isset("config.weather.icon")) {
      tmp_icon =
        '<span class="weather-icon-' +
        weather.weatherIconTxt.split(" ").join("-") +
        '"></span>';
    } else {
      tmp_icon = "";
    }

    if (get) {
      return {
        icon: tmp_icon,
        temp: tmp_temp + "&deg;C",
        desc: getlang("icon-" + weather.weatherIconTxt.split(" ").join("-")),
      };
    } else {
      $("#tv_fullscreen_weather")
        .html(tmp_icon + tmp_temp + "&deg;C")
        .show();
    }
  } else if (get) {
    return {};
  }
}

var tv_channel_number = "";
var tv_channel_number_entered;

function tv_channel_number_press(num) {
  if (fullscreen) {
    var channels = getChannels();

    if (tv_channel_number.length < 4) {
      tv_channel_number += "" + num;
    }
    if (!$("#tv_channel_number").length) {
      $(document.body).append($('<div id="tv_channel_number"></div>'));
    }
    $("#tv_channel_number").html(tv_channel_number + "-");
    if (tv_channel_number_entered) {
      clearTimeout(tv_channel_number_entered);
    }
    tv_channel_number_entered = setTimeout(function () {
      tv_channel_number = tv_channel_number | 0;
      if (channels[tv_channel_number - 1]) {
        $("#tv_channel_number").html(tv_channel_number);

        if (tv_channellist_type === "vertical_new") {
          VerticalChannel.chooseChannel(tv_channel_number - 1);
        } else {
          tv_channel_show(tv_channel_number - 1);
        }
        tv_channellist_show();
        tv_channellist_fade();
      } else {
        $("#tv_channel_number").html(
          '<span style="color:Red;">' + tv_channel_number + "</span>"
        );
      }

      tv_channel_number = "";
      setTimeout(function () {
        $("#tv_channel_number").remove();
      }, 3000);
    }, 1000);
  } else {
    tv_channel_number += "" + num;
    if (tv_channel_number_entered) {
      clearTimeout(tv_channel_number_entered);
    }
    tv_channel_number_entered = setTimeout(function () {
      ServiceCodes.evaluate(tv_channel_number);
      tv_channel_number = "";
    }, 1000);
    if (tv_channel_number.length === 4) {
      ServiceCodes.evaluate(tv_channel_number);
      tv_channel_number = "";
    }
  }
}

function _tv_keydown_external(e) {
  if (!e) {
    e = event;
  }
  var code = e.keyCode ? e.keyCode : e.which;
  switch (code) {
    case tv_keys.INPUT:
    case tv_keys.EXIT:
    case tv_keys.BACK:
    case tv_keys.MENU:
      _tv_source(["TV", 0]);
      break;
    default:
      break;
  }
}
//индикатор загрузки системы, до true - загрузка в процессе, выставляется в tv_final
var system_started = false;
//индикатор, что кто-то трогал систему, используется в tv_open_app.open
var system_idle = true;
function tv_keydown(event, isNotOverride) {
  system_idle = false;

  var code = getKeyCode(event);

  //Object.keys(tv_keys)[Object.values(tv_keys).indexOf(code)]
  tv_last_key = code;

  //Механизм перехвата нажатия кнопок сторонними модулями
  if (
    tv_cur_block !== "dialog" &&
    typeof tv_keydown_override === "function" &&
    !isNotOverride &&
    //костыльная отмена оверрайда кнопок громкости (если перехватываются)
    [tv_keys.VOL_UP, tv_keys.VOL_DOWN, tv_keys.MUTE].indexOf(code) == -1
  ) {
    try {
      tv_keydown_override(event);
    } catch (e) {
      log.add("Error executing override function (" + e + ")");
      log.post_error("Error executing override function (" + e + ")");
    }
    return false;
  }

  if (!tv_cur_block) {
    navigate("#menu");
    if ([tv_keys.RED, tv_keys.BLUE, tv_keys.EXIT].indexOf(code) === -1) {
      return true;
    }
  }

  if (
    tv_cur_elem &&
    tv_cur_elem.length &&
    tv_cur_elem.get(0).hasAttribute("ontvkey")
  ) {
    var key = tv_keys_reverse[code];

    var tv_cur_trigger_elem = $();
    if (tv_cur_elem.get(0).hasAttribute("on_" + key)) {
      tv_cur_trigger_elem = tv_cur_elem;
    } else if (tv_cur_elem.find("[on_" + key + "]").length) {
      tv_cur_trigger_elem = tv_cur_elem.find("[on_" + key + "]");
    }
    tv_cur_trigger_elem.trigger(event_link);
  }

  switch (code) {
    case 0:
      break;
    case tv_keys.NUM_0:
      tv_channel_number_press(0);
      break;
    case tv_keys.NUM_1:
      tv_channel_number_press(1);
      break;
    case tv_keys.NUM_2:
      tv_channel_number_press(2);
      break;
    case tv_keys.NUM_3:
      tv_channel_number_press(3);
      break;
    case tv_keys.NUM_4:
      tv_channel_number_press(4);
      break;
    case tv_keys.NUM_5:
      tv_channel_number_press(5);
      break;
    case tv_keys.NUM_6:
      tv_channel_number_press(6);
      break;
    case tv_keys.NUM_7:
      tv_channel_number_press(7);
      break;
    case tv_keys.NUM_8:
      tv_channel_number_press(8);
      break;
    case tv_keys.NUM_9:
      tv_channel_number_press(9);
      break;

    case tv_keys.INPUT:
      navigate("#sources_page");
      break;

    case tv_keys.UP:
      tv_up();
      break;
    case tv_keys.DOWN:
      tv_down();
      break;
    case tv_keys.LEFT:
      tv_left();
      break;
    case tv_keys.RIGHT:
      tv_right();
      break;
    case tv_keys.ENTER:
      tv_ok();
      if (event.stopPropagation) {
        event.stopPropagation();
      }
      break;
    case tv_keys.EXIT:
    case tv_keys.BACK:
      tv_back();
      break;
    case tv_keys.CH_UP:
      tv_chup();
      break;
    case tv_keys.CH_DOWN:
      tv_chdown();
      break;

    case tv_keys.RED:
      if (tv_cur_block === "popup") {
        tv_back();
      }

      tv_mode();
      break;
    case tv_keys.GREEN:
      if (fullscreen && tv_channellist_type === "vertical_new") {
        VerticalChannel.toggleBlock("category");
      } else if (fullscreen && !tv_channellist_hidden) {
        tv_channel_category_build();
      }

      if (
        tv_cur_block === "VODplayer" &&
        isset("config.tv.sleep_timer.enabled")
      ) {
        sleep_timer.open(undefined, "closeSleepTimerForVOD();");
      }

      // открываем popup фильтров магазина
      if (tv_cur_block === "pagelist") {
        Services.openChooseFilters();
      }

      //TODO: заменить костыль на управление кнопками
      if (active_page == "#sanatorium_schedule") {
        Sanatorium.select_guest_popup();
      }

      break;
    case tv_keys.YELLOW:
      if (tv_cur_block === "cart") {
        shop_item_delete();
      }

      if (tv_cur_block === "VODplayer") {
        VOD.show_menu("subtitles");
      }
      break;
    case tv_keys.BLUE:
      if (fullscreen) {
        tv_change_audio();
      } else {
        if (tv_cur_block === "VODplayer") {
          VOD.show_menu("languages");
        } else {
          navigate("#language_select");
        }
      }
      //tv_sel_block(active_page_id);
      break;

    case tv_keys.PORTAL:
    case tv_keys.GUIDE:
    case tv_keys.Q_MENU:
    case tv_keys.MENU:
    case tv_keys.HOME:
      if (fullscreen) {
        tv_mode();
      } else {
        navigate("#menu");
      }
      break;

    //только на Филипсах xx14
    case tv_keys.YOUTUBE:
      Apps.open("youtube");
      break;
    case tv_keys.NETFLIX:
      Apps.open("netflix");
      break;
    case tv_keys.CAST:
      _tv_miracast();
      break;

    case 69:
    case 412:
      if (tv_cur_block === "VODplayer") {
        VOD.rwd(20);
      }
      break;

    case 70:
    case 413:
      if (tv_cur_block === "VODplayer") {
        tv_back(); //VOD.stop();
      }
      break;

    case 72:
    case 417:
      if (tv_cur_block === "VODplayer") {
        VOD.ffw(20);
      }
      break;

    case 74:
    case 19:
      if (tv_cur_block === "VODplayer") {
        VOD.pause();
      }
      break;

    case 71:
    case 415:
      if (tv_cur_block === "VODplayer") {
        VOD.play();
      }
      break;

    case tv_keys.DOOREYE:
      if (typeof DoorEye != "undefined") {
        DoorEye.ask();
      } else {
        log.add("DoorEye: module not loaded!");
      }
      break;

    case tv_keys.VOL_UP:
      //TODO: max volume from config
      if (typeof _tv_set_volume == "function") {
        _tv_get_volume()
          .done(function (data) {
            var tmp = Math.min(99, data + 1);
            _tv_set_volume(tmp);
            //TODO: должно быть через event handler
            Volume.set(tmp);
          })
          .fail(function (f) {
            log.add("VOLUME: failed to get");
          });
      } else {
        log.add("VOLUME: not implemented");
      }
      break;

    case tv_keys.VOL_DOWN:
      if (typeof _tv_set_volume == "function") {
        _tv_get_volume()
          .done(function (data) {
            var tmp = Math.max(0, data - 1);
            _tv_set_volume(tmp);
            //TODO: должно быть через event handler
            Volume.set(tmp);
          })
          .fail(function (f) {
            log.add("VOLUME: failed to get");
          });
      } else {
        log.add("VOLUME: not implemented");
      }
      break;

    case tv_keys.MUTE:
      tv_mute()
        .done(function (data) {
          if (data) {
            Volume.set(-1);
          } else {
            _tv_get_volume().done(function (volume) {
              Volume.set(volume);
            });
          }
        })
        .fail(function () {
          console.log("VOLUME: mute failed");
        });
      break;

    case tv_keys.NUMBERS:
      Keypad.toggle();
      break;

    default:
      //tv_log('code ' + code);
      break;
  }
}

function tv_up() {
  var tmp = $(active_page).find(".content"),
    tmp_parent = tmp.parent(),
    shift;

  if (tv_cur_block === "menu") {
    if (metro_menu) {
      metro_menu_move("up");
      return true;
    }

    if (tv_cur_pos > 0) {
      tv_cur_pos--;
    } else {
      tv_cur_pos = 0;
    }
  } else if (tv_cur_block === "service_page") {
    tmp = $(active_page).find(".content");
    tmp_parent = tmp.parent();

    if ($(active_page).attr("scroll_to_bottom")) {
      shift = Math.max(
        tmp_parent.height() - tmp.outerHeight(),
        Math.min(tmp.position().top + 50, 0)
      );
      tmp[0].style.top = shift + "px";
    } else {
      shift = Math.min(
        0,
        Math.max(
          tmp.position().top + 50,
          tmp_parent.height() - tmp.outerHeight()
        )
      );
      tmp[0].style.top = shift + "px";
    }

    if (
      tv_sel_list[tv_cur_pos - 1] &&
      $(tv_sel_list[tv_cur_pos - 1]).hasClass("button")
    ) {
      tv_cur_pos--;
      tv_sel_cur("up");
    }

    move_scroll(shift);
    return true;
  } else if (tv_cur_block === "show_gallery") {
    return true;
  } else if (
    tv_cur_block === "shopitem" ||
    ((tv_cur_block === "order_details" || tv_cur_block === "orders") &&
      tv_sel_list.length === 1)
  ) {
    tmp = $(active_page).find(".content");
    tmp_parent = tmp.parent();

    if ($(active_page).attr("scroll_to_bottom")) {
      shift = Math.max(
        tmp_parent.height() - tmp.outerHeight(),
        Math.min(tmp.position().top + 50, 0)
      );
      tmp[0].style.top = shift + "px";
    } else {
      shift = Math.min(
        0,
        Math.max(
          tmp.position().top + 50,
          tmp_parent.height() - tmp.outerHeight()
        )
      );
      tmp[0].style.top = shift + "px";
    }

    move_scroll(shift);

    if (tv_cur_pos > 0) {
      tv_cur_pos--;
    } else {
      tv_cur_pos = 0;
    }
  } else if (
    tv_cur_block === "settings" ||
    tv_cur_block === "weather_select_location" ||
    tv_cur_block === "mod_playlist" ||
    tv_cur_block === "popup" ||
    tv_cur_block === "toppings" ||
    tv_cur_block === "language" ||
    tv_cur_block === "category" ||
    tv_cur_block === "cart" ||
    ((tv_cur_block === "order_details" || tv_cur_block === "orders") &&
      tv_sel_list.length > 1)
  ) {
    if (tv_cur_pos > 0) {
      tv_cur_pos--;
    } else {
      tv_cur_pos = 0;
    }
  } else if (tv_cur_block === "dialog") {
    metro_menu_move("up");
    return true;
  } else if (tv_cur_block === "pagelist" || tv_cur_block === "VODcategory") {
    metro_menu_move("up");

    if (tv_cur_block === "VODcategory") {
      VirtualScroll.set(tv_cur_block, tv_cur_block);
    }
    return true;
  } else if (tv_cur_block === "feedback") {
    if (
      tv_cur_elem.parent().hasClass("stars") ||
      tv_cur_elem.parent().hasClass("emoticons")
    ) {
      tmp = tv_cur_elem.index();
      if (tv_cur_pos - (tmp + 1) > 0) {
        if (
          $(tv_sel_list[tv_cur_pos - (tmp + 1)])
            .parent()
            .hasClass("stars")
        ) {
          tv_cur_pos -= 5;
        } else {
          tv_cur_pos = tv_cur_pos - (tmp + 1);
        }
      }
    } else {
      if (tv_cur_pos > 0) {
        if (
          $(tv_sel_list[tv_cur_pos - 1])
            .parent()
            .hasClass("stars")
        ) {
          tv_cur_pos -= 5;
        } else {
          tv_cur_pos--;
        }
      } else {
        tv_cur_pos = 0;
      }
    }
  } else if (tv_cur_block === "tv_channellist") {
    if (tv_channellist_type === "vertical_new") {
      VerticalChannel.showEpg();
    }

    tv_left();
    return true;
  } else if (tv_cur_block === "VODplayer") {
    if (!VOD.playerVisible) {
      VOD.show();
    }
  } else if (tv_cur_block !== "tv_welcome") {
    // DEFAULT
    tmp = $(active_page).find(".content");
    tmp_parent = tmp.parent();

    if ($(active_page).attr("scroll_to_bottom")) {
      shift = Math.max(
        tmp_parent.height() - tmp.outerHeight(),
        Math.min(tmp.position().top + 50, 0)
      );
      tmp[0].style.top = shift + "px";
    } else {
      shift = Math.min(
        0,
        Math.max(
          tmp.position().top + 50,
          tmp_parent.height() - tmp.outerHeight()
        )
      );
      tmp[0].style.top = shift + "px";
    }

    move_scroll(shift);
  }

  change_sel_list("up");
  tv_sel_cur();
}

function tv_down() {
  var tmp, tmp_parent, shift;

  if (!tv_cur_block) {
    navigate("#menu");
  } else {
    if (tv_cur_block === "menu") {
      if (metro_menu) {
        metro_menu_move("down");
        return true;
      }

      if (scandic_menu) {
        return false;
      }

      if (tv_cur_pos < tv_max_pos - 1) {
        tv_cur_pos++;
      } else {
        tv_cur_pos = tv_max_pos - 1;
      }
    } else if (tv_cur_block === "service_page") {
      tmp = $(active_page).find(".content");
      tmp_parent = tmp.parent();

      if ($(active_page).attr("scroll_to_bottom")) {
        shift = Math.max(
          tmp.position().top - 50,
          tmp_parent.height() - tmp.outerHeight()
        );
        tmp[0].style.top = shift + "px";
      } else {
        shift = Math.min(
          0,
          Math.max(
            tmp.position().top - 50,
            tmp_parent.height() - tmp.outerHeight()
          )
        );
        tmp[0].style.top = shift + "px";
      }

      move_scroll(shift);

      if (tv_cur_elem.hasClass("button") && tv_sel_list[tv_cur_pos + 1]) {
        tv_cur_pos++;
        tv_sel_cur("down");
      }

      return true;
    } else if (tv_cur_block === "show_gallery") {
      return true;
    } else if (
      tv_cur_block === "shopitem" ||
      ((tv_cur_block === "order_details" || tv_cur_block === "orders") &&
        tv_sel_list.length === 1)
    ) {
      tmp = $(active_page).find(".content");
      tmp_parent = tmp.parent();

      if ($(active_page).attr("scroll_to_bottom")) {
        shift = Math.max(
          tmp.position().top - 50,
          tmp_parent.height() - tmp.outerHeight()
        );
      } else {
        shift = Math.min(
          0,
          Math.max(
            tmp.position().top - 50,
            tmp_parent.height() - tmp.outerHeight()
          )
        );
      }

      tmp[0].style.top = shift + "px";
      move_scroll(shift);

      if (tv_cur_pos < tv_max_pos - 1) {
        tv_cur_pos++;
      }
    } else if (tv_cur_block === "dialog") {
      metro_menu_move("down");
      return true;
    } else if (tv_cur_block === "pagelist" || tv_cur_block === "VODcategory") {
      metro_menu_move("down");

      if (tv_cur_block === "VODcategory") {
        VirtualScroll.set(tv_cur_block, tv_cur_block);
      }
      return true;
    } else if (tv_cur_block === "feedback") {
      if (
        tv_cur_elem.parent().hasClass("stars") ||
        tv_cur_elem.parent().hasClass("emoticons")
      ) {
        tmp = tv_cur_elem.index();
        if (tv_cur_pos + (5 - tmp) < tv_max_pos) {
          if (
            $(tv_sel_list[tv_cur_pos + (5 - tmp)])
              .parent()
              .hasClass("stars")
          ) {
            tv_cur_pos += 5;
          } else {
            tv_cur_pos = tv_cur_pos + (5 - tmp);
          }
        }
      } else {
        if (tv_cur_pos < tv_max_pos - 1) {
          tv_cur_pos++;
        } else {
          tv_cur_pos = tv_max_pos - 1;
        }
      }
    } else if (tv_cur_block === "tv_channellist") {
      if (tv_channellist_type === "vertical_new") {
        VerticalChannel.showEpg();
      }

      tv_right();
      return true;
    } else if (tv_cur_block === "VODplayer") {
      if (!VOD.playerVisible) {
        VOD.show();
      }
    } else if (
      tv_cur_block === "settings" ||
      tv_cur_block === "weather_select_location" ||
      tv_cur_block === "mod_playlist" ||
      tv_cur_block === "popup" ||
      tv_cur_block === "toppings" ||
      tv_cur_block === "language" ||
      tv_cur_block === "category" ||
      tv_cur_block === "cart" ||
      ((tv_cur_block === "order_details" || tv_cur_block === "orders") &&
        tv_sel_list.length > 1)
    ) {
      if (tv_cur_pos < tv_max_pos - 1) {
        tv_cur_pos++;
      }
    } else if (tv_cur_block !== "tv_welcome") {
      tmp = $(active_page).find(".content");
      tmp_parent = tmp.parent();

      if ($(active_page).attr("scroll_to_bottom")) {
        shift = Math.max(
          tmp.position().top - 50,
          tmp_parent.height() - tmp.outerHeight()
        );
        tmp[0].style.top = shift + "px";
      } else {
        shift = Math.min(
          0,
          Math.max(
            tmp.position().top - 50,
            tmp_parent.height() - tmp.outerHeight()
          )
        );
        tmp[0].style.top = shift + "px";
      }

      move_scroll(shift);
    }
  }

  change_sel_list("down");
  tv_sel_cur();
}

function move_scroll(shift, target) {
  var scroll;

  if (!target) {
    scroll = document.getElementById(active_page_id + "_scroll_inner");
  } else {
    scroll = document.getElementById(target + "_scroll_inner");
  }

  if (scroll && tv_cur_block !== "menu") {
    var val;

    if (
      (tv_cur_block === "pagelist" ||
        tv_cur_block === "cart" ||
        tv_cur_block === "language" ||
        tv_cur_block === "category") &&
      tv_cur_pos + 1 === tv_sel_list.length
    ) {
      val = scroll.max;
    } else {
      val = Math.min(scroll.max, Math.max(0, -shift * scroll.coef)) | 0;
    }

    //scroll.style[css_transform] = 'translate3D(0,'+val+'px,0)';
    scroll.style.top = val + "px";

    // добавление теней к тексту
    // manageShadowOnPage({
    //     shift: shift,
    //     scroll: scroll,
    //     value: val
    // });
  }
}

function tv_left() {
  if (tv_cur_block === "menu") {
    if (metro_menu) {
      metro_menu_move("left");
      return true;
    }
    if (scandic_menu) {
      var isPermitted = cursorMovingPermitted.get({
        key: "scandic_menu",
        direct: "left",
      });

      if (!isPermitted) {
        return false;
      }

      if (tv_cur_pos > 0) {
        previousPosition.set(tv_cur_pos);
        tv_cur_pos--;
        tv_sel_cur();
      }

      return true;
    }
  } else if (tv_cur_block === "pagelist" || tv_cur_block === "VODcategory") {
    if (metro_menu_move("left") === false && classic_menu) {
      navigate("#menu");
    }

    if (tv_cur_block === "VODcategory") {
      VirtualScroll.set(tv_cur_block, tv_cur_block);
    }
    return true;
  } else if (tv_cur_block === "cart") {
    if (tv_cur_elem.hasClass("shop_plusminus")) {
      shop_minus_persons();
    } else if (classic_menu) {
      navigate("#menu");
    }
  } else if (tv_cur_block === "gallery") {
    if (tv_cur_pos > 0) {
      tv_cur_pos--;
      var tmp = $(active_page).find(".gallery_indicator");
      tmp.find("DIV.current").removeClass("current");
      $(tmp.find("DIV")[tv_cur_pos]).addClass("current");
      $(active_page).find(".gallery_container")[0].style[css_transform] =
        "translate3d(" + -pw * tv_cur_pos + "px,0,0)";
    } else {
      if (classic_menu) {
        navigate("#menu");
      }
    }
  } else if (tv_cur_block === "guide") {
    if (tv_cur_pos > 0) {
      tv_cur_pos--;
    } else {
      if (classic_menu) {
        navigate("#menu");
      }
    }
  } else if (tv_cur_block === "tv_channellist") {
    if (tv_channellist_hidden) {
      tv_channellist_show(true);
    }
    if (tv_cur_pos > 0) {
      tv_cur_pos--;
    } else {
      if (tv_channellist_type === "vertical_new") {
        tv_cur_pos = tv_max_pos - 1;
      } else {
        return true;
      }
      //tv_cur_pos = tv_max_pos - 1;
    }
    tv_channellist_fade(true);
  } else if (tv_cur_block === "service_page") {
    if (classic_menu) {
      navigate("#menu");
    }

    return true;
  } else if (tv_cur_block === "settings") {
    //actually DEAFULT
    if (
      tv_sel_list[tv_cur_pos - 1] &&
      ($(tv_sel_list[tv_cur_pos - 1]).hasClass("timepicker") ||
        $(tv_sel_list[tv_cur_pos - 1]).hasClass("button"))
    ) {
      tv_cur_pos--;
    } else {
      if (tv_cur_elem.hasClass("button")) {
        return tv_back();
      }

      if (classic_menu) {
        if (Wakeupcall.opened) {
          return Wakeupcall.close("choose_wakeup");
        }

        navigate("#menu");
      }
    }
  } else if (tv_cur_block === "shopitem") {
    if (tv_cur_elem.hasClass("shop_plusminus")) {
      shop_minus();
    } else {
      if (classic_menu) {
        navigate("#menu");
      }
    }
  } else if (tv_cur_block === "toppings") {
    if (tv_cur_elem.hasClass("shop_plusminus")) {
      shop_minus("#" + tv_cur_elem.attr("id"));
    } else if (tv_cur_elem.hasClass("shop_radio")) {
      shop_change_radio("#" + tv_cur_elem.attr("id"));
    }
  } else if (tv_cur_block === "feedback") {
    if (
      tv_cur_elem.parent().hasClass("stars") ||
      tv_cur_elem.parent().hasClass("emoticons")
    ) {
      if (tv_cur_elem.index() > 0) {
        tv_cur_pos--;
      } else {
        if (classic_menu) {
          navigate("#menu");
        }
      }
    } else {
      if (classic_menu) {
        navigate("#menu");
      }
    }
  } else if (tv_cur_block === "tv_welcome") {
    if (tv_cur_elem.hasClass("btn_lng")) {
      if (tv_cur_pos > 0) {
        tv_cur_pos--;
      } else {
        return true;
      }
    }
  } else if (tv_cur_block === "dialog" || tv_cur_block === "popup") {
    metro_menu_move("left");
    return true;
  } else if (tv_cur_block === "VODplayer") {
    if (VOD.playerVisible) {
      if (tv_cur_pos > 0) {
        tv_cur_pos--;
      }
      VOD.hideReset();
    } else {
      VOD.show();
    }
  } else if (
    tv_cur_block === "mod_playlist" ||
    tv_cur_block === "time_picker"
  ) {
    if (tv_cur_pos > 0) {
      tv_cur_pos--;
    }
  } else {
    //TODO: move to module override
    if (tv_cur_block == "scroll" && !classic_menu) {
      scroll_to_top();
    }
    if (classic_menu) {
      navigate("#menu");
    }
  }
  tv_sel_cur();
}

function tv_right() {
  if (tv_cur_block === "menu") {
    if (metro_menu) {
      metro_menu_move("right");
      return true;
    }
    if (scandic_menu) {
      var isPermitted = cursorMovingPermitted.get({
        key: "scandic_menu",
        direct: "right",
      });

      if (!isPermitted) {
        return false;
      }

      if (tv_cur_pos < tv_max_pos - 1) {
        previousPosition.set(tv_cur_pos);
        tv_cur_pos++;
        tv_sel_cur();
      }

      return true;
    }

    var widgetList = widgetObserver.get_list("id");
    if (widgetList && widgetList.indexOf(active_page_id) !== -1) {
      widgetObserver.open(active_page_id);
      return;
    }

    //TODO: странная механика (сделано только для будильника в классике)
    var activeItem = document.querySelector("#menu .active");
    if (activeItem && activeItem.hasAttribute("onvclick")) {
      return $(activeItem).trigger(event_link);
    }

    tv_sel_block(active_page_id);
    return true;
  } else if (tv_cur_block === "pagelist" || tv_cur_block === "VODcategory") {
    metro_menu_move("right");

    if (tv_cur_block === "VODcategory") {
      VirtualScroll.set(tv_cur_block, tv_cur_block);
    }
    return true;
  } else if (tv_cur_block === "cart") {
    if (tv_cur_elem.hasClass("shop_plusminus")) {
      shop_plus_persons();
    }
  } else if (tv_cur_block === "gallery") {
    if (tv_cur_pos < tv_max_pos - 1) {
      tv_cur_pos++;
      var tmp = $(active_page).find(".gallery_indicator");
      tmp.find("DIV.current").removeClass("current");
      $(tmp.find("DIV")[tv_cur_pos]).addClass("current");
      $(active_page).find(".gallery_container")[0].style[css_transform] =
        "translate3d(" + -pw * tv_cur_pos + "px,0,0)";
    }
  } else if (tv_cur_block === "guide") {
    if (tv_cur_pos < tv_max_pos - 1) {
      tv_cur_pos++;
    }
  } else if (tv_cur_block === "tv_channellist") {
    if (tv_channellist_hidden) {
      tv_channellist_show(true);
    }
    if (tv_cur_pos < tv_max_pos - 1) {
      tv_cur_pos++;
    } else {
      if (tv_channellist_type === "vertical_new") {
        tv_cur_pos = 0;
      } else {
        return true;
      }

      //tv_cur_pos = 0;
    }
    tv_channellist_fade(true);
  } else if (tv_cur_block === "shopitem") {
    if (tv_cur_elem.hasClass("shop_plusminus")) {
      shop_plus();
    }
  } else if (tv_cur_block === "toppings") {
    if (tv_cur_elem.hasClass("shop_plusminus")) {
      shop_plus("#" + tv_cur_elem.attr("id"));
    } else if (tv_cur_elem.hasClass("shop_radio")) {
      shop_change_radio("#" + tv_cur_elem.attr("id"));
    }
  } else if (tv_cur_block === "feedback") {
    if (
      tv_cur_elem.parent().hasClass("stars") ||
      tv_cur_elem.parent().hasClass("emoticons")
    ) {
      if (tv_cur_elem.index() < 4) {
        tv_cur_pos++;
      }
    }
  } else if (tv_cur_block === "tv_welcome") {
    if (tv_cur_elem.hasClass("btn_lng")) {
      if (tv_cur_pos < tv_max_pos - 1) {
        tv_cur_pos++;
      } else {
        return true;
      }
    }
  } else if (tv_cur_block === "dialog" || tv_cur_block === "popup") {
    metro_menu_move("right");
    return true;
  } else if (tv_cur_block === "VODplayer") {
    //VOD.ffw(10);
    if (VOD.playerVisible) {
      if (tv_cur_pos < tv_max_pos - 1) {
        tv_cur_pos++;
      }
      VOD.hideReset();
    } else {
      VOD.show();
    }
  } else if (tv_cur_block === "service_page") {
    return true;
  } else if (tv_cur_block === "settings") {
    //actually DEAFULT
    if (
      (tv_cur_elem.hasClass("button") || tv_cur_elem.hasClass("timepicker")) &&
      tv_sel_list[tv_cur_pos + 1]
    ) {
      tv_cur_pos++;
    }
  } else if (
    tv_cur_block === "mod_playlist" ||
    tv_cur_block === "time_picker"
  ) {
    if (tv_sel_list[tv_cur_pos + 1]) {
      tv_cur_pos++;
    }
  } else {
    //TODO: move to module override
    if (tv_cur_block == "scroll" && !classic_menu) {
      scroll_to_bottom();
    }
  }
  tv_sel_cur();
}

function tv_sel_cur(btn_move) {
  if (isAnimating) {
    $("#tv_cur").hide();
    return $(window).one("finish_animate", tv_sel_cur);
  }

  if (!tv_max_pos) {
    $("#tv_cur").hide();
    return false;
  }

  tv_cur_elem = tv_sel_list.eq(tv_cur_pos);

  var tv_cur_offset,
    tv_cur_offset_target = $(),
    tv_cur_height = tv_cur_elem.outerHeight(true),
    tv_offset_threshold = 50,
    tv_cur_offset_target_top,
    tv_max_offset,
    container,
    shift;

  if (tv_cur_block === "menu") {
    if (!config.menu || config.menu === "classic") {
      tv_cur_offset_target = $("#menu");
    } else if (config.menu === "scandic") {
      tv_cur_offset_target = $("#menu ul");
    } else {
      //TODO: UL in #menu
      tv_cur_offset_target = $("#menu_wrapper");
    }
    tv_max_offset = wh;
  } else if (
    tv_cur_block === "tv_radiolist" ||
    tv_cur_block === "tv_channellist" ||
    tv_cur_block === "tv_programmes_list" ||
    tv_cur_block === "choosing_list" ||
    tv_cur_block === "language" ||
    tv_cur_block === "category" ||
    tv_cur_block === "genre"
  ) {
    tv_cur_offset_target = $("#" + tv_cur_block).find(".content");

    if (
      tv_channellist_type === "mosaic" ||
      tv_cur_block === "tv_radiolist" ||
      tv_cur_block === "tv_programmes_list" ||
      tv_cur_block === "genre"
    ) {
      tv_max_offset = $("#" + tv_cur_block)
        .find(".content_wrapper")
        .height();
      tv_offset_threshold =
        tv_cur_block === "language" ||
        tv_cur_block === "category" ||
        tv_cur_block === "genre"
          ? 20
          : 0;
    } else {
      tv_max_offset = 0;
      tv_offset_threshold = 1000;
    }
  } else if (tv_cur_block === "VODplayer") {
    if (tv_cur_elem.hasClass("btn_player_lng")) {
      tv_max_offset = 0;
      tv_offset_threshold = 1000;
      tv_cur_offset_target = $("#playerListMenu");
    } else {
      tv_cur_offset_target = $(document.body);
    }
  } else if (tv_cur_block === "VODcategory") {
    tv_offset_threshold = 74;
    tv_cur_offset_target = $(active_page).find(".content");
    tv_max_offset = $(active_page).find(".content_wrapper").height();
  } else if (tv_cur_block === "channel") {
    if (tv_cur_elem.hasClass("btn_player_lng")) {
      tv_max_offset = 0;
      tv_offset_threshold = 1000;
      tv_cur_offset_target = $("#switch_language");
    } else {
      tv_cur_offset_target = $(document.body);
    }
  } else if (tv_cur_block === "tv_welcome") {
    tv_cur_offset_target = $("#tv_welcome .container, #tv_welcome .content");
  } else if (tv_cur_block === "weather_select_location") {
    container = $("#" + tv_cur_block);

    tv_cur_offset_target = container.find(".content");
    tv_max_offset = container.find(".content_wrapper").height();
    tv_offset_threshold = 20;
  } else if (tv_cur_block === "popup") {
    container = $(active_page);

    tv_cur_offset_target = container.find(".content");
    tv_max_offset = container.find(".content_wrapper").height();
    tv_offset_threshold = 20;
  } else if (tv_cur_block === "mod_playlist") {
    container = $("#" + MOD.current_playlist_id);

    tv_cur_offset_target = container.find(".content");
    tv_max_offset = container.find(".content_wrapper").height();
    tv_offset_threshold = 20;
  } else if (tv_cur_block === "dialog") {
    tv_cur_offset_target = $("#custom_dialog_content");
    tv_max_offset = wh;
  } else if (tv_cur_block == "keypad") {
    tv_cur_offset_target = $("#custom_dialog_content");
    tv_max_offset = wh;
  } else {
    tv_cur_offset_target = $(active_page).find(".content");
    tv_max_offset = $(active_page).find(".content_wrapper").height();
  }

  tv_cur_offset =
    tv_cur_elem.get(0).getBoundingClientRect().top -
    tv_cur_offset_target.get(0).getBoundingClientRect().top;

  if (tv_cur_block === "VODplayer" || tv_cur_block === "channel") {
    if (tv_cur_elem.hasClass("btn_player_lng")) {
      tv_cur_offset_target[0].style.left =
        "-" + (Math.round(tv_cur_elem.position().left) + "px");
    } else {
      tv_sel_list.removeClass("tv_cur");
      tv_cur_elem.addClass("tv_cur");
    }
  } else if (
    tv_cur_block === "tv_radiolist" ||
    tv_cur_block === "tv_channellist" ||
    tv_cur_block === "tv_programmes_list" ||
    tv_cur_block === "language" ||
    tv_cur_block === "category" ||
    tv_cur_block === "genre"
  ) {
    if (tv_cur_block === "tv_radiolist" || tv_cur_block === "genre") {
      if (
        (tv_cur_pos === 0 && tv_cur_block === "genre") ||
        (tv_cur_block === "tv_radiolist" &&
          (tv_cur_pos === 0 ||
            tv_cur_pos === 1 ||
            tv_cur_pos === 2 ||
            tv_cur_pos === 3))
      ) {
        tv_cur_offset_target[0].style.top = 0;
        move_scroll(0, tv_cur_block);
      } else {
        tv_cur_offset_target_top = tv_cur_offset_target.position().top;

        if (
          tv_cur_offset + tv_cur_height - 2 + tv_offset_threshold >
          tv_max_offset - tv_cur_offset_target_top
        ) {
          shift = Math.min(
            0,
            Math.max(
              tv_max_offset - tv_cur_offset_target.outerHeight(true),
              tv_max_offset -
                (tv_cur_offset + tv_cur_height) -
                tv_offset_threshold
            )
          );

          if (tv_cur_block === "genre") {
            tv_cur_offset_target[0].style.top = shift + "px";
          } else {
            tv_cur_offset_target[0].style.top =
              -(tv_cur_offset - tv_max_offset + tv_cur_height) + "px";
          }

          move_scroll(shift, tv_cur_block);
        } else if (
          tv_cur_offset <
          tv_offset_threshold - tv_cur_offset_target_top
        ) {
          shift = Math.min(0, -tv_cur_offset + tv_offset_threshold);

          if (tv_cur_block === "genre") {
            tv_cur_offset_target[0].style.top = shift + "px";
          } else {
            tv_cur_offset_target[0].style.top =
              tv_cur_offset_target_top + tv_cur_height + "px";
          }

          move_scroll(shift, tv_cur_block);
        }
      }
    } else if (
      typeof tv_channellist_type !== "undefined" &&
      (tv_channellist_type === "vertical" ||
        tv_channellist_type === "vertical_new")
    ) {
      tv_offset_threshold = 10;
      tv_max_offset = $("#tv_channellist_cont").height();
      if (
        tv_cur_offset + tv_cur_height + tv_offset_threshold >
        tv_max_offset - tv_cur_offset_target.position().top
      ) {
        tv_cur_offset_target[0].style.top =
          Math.min(
            0,
            Math.max(
              tv_max_offset - tv_cur_offset_target.outerHeight(true),
              tv_max_offset -
                (tv_cur_elem.position().top + tv_cur_height) -
                tv_offset_threshold
            )
          ) + "px";
      } else if (
        tv_cur_offset <
        tv_offset_threshold - tv_cur_offset_target.position().top
      ) {
        tv_cur_offset_target[0].style.top =
          Math.min(0, -tv_cur_elem.position().top + tv_offset_threshold) + "px";
      }
      var percent = Math.abs(
        tv_cur_offset_target.position().top /
          (tv_max_offset - tv_cur_offset_target.outerHeight(true))
      );

      var scroll = document.getElementById("scroll_scroll");
      if (scroll) {
        scroll.style.top =
          Math.round(
            percent *
              ($("#scroll_inner").height() - $("#scroll_scroll").height())
          ) + "px";
      }
    } else if (
      typeof tv_channellist_type !== "undefined" &&
      tv_channellist_type !== "mosaic"
    ) {
      tv_cur_offset_target[0].style.left =
        Math.round(
          ($("#tv_channellist_cont").width() - tv_cur_elem.width()) / 2 -
            tv_cur_elem.position().left
        ) + "px";
    } else if (
      typeof tv_channellist_type !== "undefined" &&
      tv_channellist_type === "mosaic"
    ) {
      if (
        (tv_cur_block === "tv_programmes_list" && isEpgFirstLine()) ||
        (tv_cur_pos === 0 &&
          (tv_cur_block === "language" || tv_cur_block === "category"))
      ) {
        tv_cur_offset_target[0].style.top = 0;
        move_scroll(0, tv_cur_block);
      } else {
        tv_cur_offset_target_top = tv_cur_offset_target.position().top;

        tv_cur_offset = appUseZoom ? Math.ceil(tv_cur_offset) : tv_cur_offset;
        tv_cur_offset_target_top = appUseZoom
          ? Math.ceil(tv_cur_offset_target_top)
          : tv_cur_offset_target_top;

        if (
          tv_cur_offset + tv_cur_height - 2 + tv_offset_threshold >
          tv_max_offset - tv_cur_offset_target_top
        ) {
          shift = Math.min(
            0,
            Math.max(
              tv_max_offset - tv_cur_offset_target.outerHeight(true),
              tv_max_offset -
                (tv_cur_offset + tv_cur_height) -
                tv_offset_threshold
            )
          );

          if (tv_cur_block === "language" || tv_cur_block === "category") {
            tv_cur_offset_target[0].style.top = shift + "px";
          } else {
            tv_cur_offset_target[0].style.top =
              -(tv_cur_offset - tv_max_offset + tv_cur_height) + "px";
          }

          move_scroll(shift, tv_cur_block);
        } else if (
          tv_cur_offset <
          tv_offset_threshold - tv_cur_offset_target_top
        ) {
          shift = Math.min(0, -tv_cur_offset + tv_offset_threshold);

          if (tv_cur_block === "language" || tv_cur_block === "category") {
            tv_cur_offset_target[0].style.top = shift + "px";
          } else {
            tv_cur_offset_target[0].style.top =
              tv_cur_offset_target_top + tv_cur_height + "px";
          }

          move_scroll(shift, tv_cur_block);
        }
      }
    }
  } else if (tv_cur_block === "weather_select_location") {
    if (tv_cur_pos === 0) {
      tv_cur_offset_target[0].style.top = 0;
      move_scroll(0, "substrate");
    } else {
      tv_cur_offset_target_top = tv_cur_offset_target.position().top;

      if (
        tv_cur_offset + tv_cur_height + tv_offset_threshold >
        tv_max_offset - tv_cur_offset_target_top
      ) {
        shift = Math.min(
          0,
          Math.max(
            tv_max_offset - tv_cur_offset_target.outerHeight(true),
            tv_max_offset -
              (tv_cur_offset + tv_cur_height) -
              tv_offset_threshold
          )
        );

        tv_cur_offset_target[0].style.top =
          -(tv_cur_offset - tv_max_offset + tv_cur_height) + "px";
        move_scroll(shift, "substrate");
      } else if (
        tv_cur_offset <
        tv_offset_threshold - tv_cur_offset_target_top
      ) {
        shift = Math.min(0, -tv_cur_offset + tv_offset_threshold);
        tv_cur_offset_target[0].style.top =
          tv_cur_offset_target_top + tv_cur_height + "px";
        move_scroll(shift, "substrate");
      }
    }
  } else if (tv_cur_block === "tv_welcome") {
    tv_sel_list.removeClass("tv_cur");
    tv_cur_elem.addClass("tv_cur");
  } else if (tv_cur_block === "menu" && scandic_menu) {
    if (tv_cur_pos === previousPosition.get()) {
      return false;
    }

    var tvCurPositionX = isset("config.tv.hacks.tv_cursor_no_transform")
        ? parseInt(tv_cur.style.left)
        : parseInt(matrixToArray($(tv_cur).css("transform"))[4]),
      ITEM_MARGIN_RIGHT = 25,
      ITEM_WIDTH = 210,
      VISIBLE_ITEMS = 5,
      positionLeft,
      positionPrev;

    if (tv_cur_pos === 0) {
      positionLeft = 0 + "px";
    } else if (
      tvCurPositionX > 1000 &&
      tv_cur_pos - previousPosition.get() > 0
    ) {
      positionLeft =
        -((tv_cur_pos + 1 - VISIBLE_ITEMS) * (ITEM_WIDTH + ITEM_MARGIN_RIGHT)) +
        "px";
    } else if (
      tvCurPositionX < 100 &&
      tv_cur_pos - previousPosition.get() < 0
    ) {
      positionLeft = -(tv_cur_pos * (ITEM_WIDTH + ITEM_MARGIN_RIGHT)) + "px";
    }

    positionPrev = tv_cur_offset_target[0].style.left;

    if (typeof positionLeft === "undefined") {
      positionLeft = positionPrev;
    }

    cursorMovingPermitted.set({
      key: "scandic_menu",
      direct: tv_cur_pos > previousPosition.get() ? "right" : "left",
      animation: positionPrev !== positionLeft,
      time: 200,
    });

    // управление opacity стрелок
    serveArrowMenuOpacity();

    if (
      // если перемещаем меню, не перемещаем tv_cur
      positionPrev !== positionLeft &&
      // когда возвращаемся со страницы в меню
      // tv_cur скрыт
      // это вызывает сдвиг меню влево
      tvCurPositionX !== 0
    ) {
      tv_cur_offset_target[0].style.left = positionLeft;

      return false;
    }
  } else if (!btn_move) {
    if (tv_cur_block === "cart" || tv_cur_block === "feedback") {
      if (tv_cur_pos === 0) {
        shift = 0;
        tv_cur_offset_target[0].style.top = 0;

        move_scroll(shift);
      } else {
        tv_cur_offset_target_top = tv_cur_offset_target.position().top;
        if (
          tv_cur_offset + tv_cur_height + tv_offset_threshold >
          tv_max_offset - tv_cur_offset_target_top
        ) {
          shift = Math.min(
            0,
            Math.max(
              tv_max_offset - tv_cur_offset_target.outerHeight(true),
              tv_max_offset -
                (tv_cur_offset + tv_cur_height) -
                tv_offset_threshold
            )
          );

          if (!tv_cur_offset_target.find(".gallery_container").length) {
            tv_cur_offset_target[0].style.top = shift + "px";
          }

          move_scroll(shift);
        } else if (
          tv_cur_offset <
          tv_offset_threshold - tv_cur_offset_target_top
        ) {
          shift = Math.min(0, -tv_cur_offset + tv_offset_threshold);
          tv_cur_offset_target[0].style.top = shift + "px";

          move_scroll(shift);
        }
      }
    } else if (
      tv_cur_block === "toppings" ||
      ((tv_cur_block === "order_details" || tv_cur_block === "orders") &&
        tv_sel_list.length > 1) ||
      (!tv_cur_elem.hasClass("button") &&
        !tv_cur_elem.hasClass("shop_plusminus"))
    ) {
      if (tv_cur_pos === 0 && tv_cur_block !== "VODcategory") {
        shift = 0;
        tv_cur_offset_target[0].style.top = 0;

        move_scroll(shift);
      } else {
        tv_cur_offset_target_top = tv_cur_offset_target.position().top;

        if (
          tv_cur_offset + tv_cur_height + tv_offset_threshold >=
          tv_max_offset - tv_cur_offset_target_top
        ) {
          shift = Math.min(
            0,
            Math.max(
              tv_max_offset - tv_cur_offset_target.outerHeight(true),
              tv_max_offset -
                (tv_cur_offset + tv_cur_height) -
                tv_offset_threshold
            )
          );

          if (!tv_cur_offset_target.find(".gallery_container").length) {
            tv_cur_offset_target[0].style.top = shift + "px";
          }

          move_scroll(shift);
        } else if (
          tv_cur_offset <
          tv_offset_threshold - tv_cur_offset_target_top
        ) {
          shift = Math.min(0, -tv_cur_offset + tv_offset_threshold);

          tv_cur_offset_target[0].style.top = shift + "px";

          move_scroll(shift);
        }
      }
    }
  }

  setPositionTvCur();
}
function setPositionTvCur() {
  $(".tv_cur").removeClass("tv_cur");
  tv_cur_elem.addClass("tv_cur");

  //Magic border offset 3
  var magic_border_width = 3,
    tmp = tv_cur_elem.get(0).getBoundingClientRect(),
    tmp_top = tmp.top,
    tmp_left = tmp.left,
    tmp_width = tmp.width,
    tmp_height = tmp.height;

  if (tmp_left <= 0) {
    tmp_left = 0;
    tmp_width -= magic_border_width;
  } else {
    tmp_left -= magic_border_width;
  }
  if (tmp_left + tmp_width > ww) {
    tmp_width -= magic_border_width;
  }

  if (tmp_top <= 0) {
    tmp_top = 0;
    tmp_height -= magic_border_width;
  } else {
    tmp_top -= magic_border_width;
  }

  if (tmp_top + tmp_height + magic_border_width >= wh) {
    tmp_height -= magic_border_width;
  }

  if (cursorIsNotVisible(tmp_top)) {
    return false;
  }

  var tv_cur_style = document.getElementById("tv_cur").style;
  tv_cur_style.width = tmp_width + "px";
  tv_cur_style.height = tmp_height + "px";

  if (typeof previousPosition.get("channel") !== "undefined") {
    return false;
  }

  if (isset("config.tv.hacks.tv_cursor_no_transform")) {
    tv_cur_style.left = tmp_left + "px";
    tv_cur_style.top = tmp_top + "px";
  } else {
    //tv_cur_style.webkitTransform = 'translate3D( ' + tmp_left+'px, '+ tmp_top + 'px,0)';
    tv_cur_style.webkitTransform =
      "translate( " + tmp_left + "px, " + tmp_top + "px)";
    tv_cur_style.transform =
      "translate( " + tmp_left + "px, " + tmp_top + "px)";
  }

  tv_cur_elem.trigger(event_action_move);

  tv_cur_style.display = tv_cur_elem.hasClass("not_tv_cur") ? "none" : "block";

  function cursorIsNotVisible(elemTop) {
    if (classic_menu && tv_cur_block === "menu") {
      return false;
    }

    var visibleArea;
    try {
      visibleArea = $id(active_page_id).querySelector(".content_wrapper");
    } catch (e) {
      return false;
    }

    if (!visibleArea) {
      return false;
    }

    var visibleAreaTop = visibleArea.getBoundingClientRect().top;
    return visibleAreaTop >= elemTop + 20;
  }
}

var previousBlock;
function tv_sel_block(id) {
  var tmp;
  id = getID(id);

  previousBlock = tv_cur_block;

  if (tv_sel_list.length) {
    tv_sel_list.removeClass("tv_sel");
  }

  if (tv_cur_elem && tv_cur_elem.length) {
    tv_cur_elem[0].classList.add("tv_sel");
  }

  // выбор языка в tv_mosaic при tv_cur_block == channel
  if (
    id === "channel" &&
    guestData.tv_channels_lang_stream &&
    guestData.tv_channels_lang_stream[tv_mosaic.current_channel] != null
  ) {
    tv_cur_pos = guestData.tv_channels_lang_stream[tv_mosaic.current_channel];
  } else {
    tv_cur_pos = 0;
  }

  $("#tv_cur").removeClass("square");
  if (id === "menu") {
    tv_cur_block = "menu";
    tv_sel_list = $("#menu")
      .find("[href]")
      .filter(function () {
        return $(this).is(":visible") && this.tagName.toLowerCase() !== "use";
      });
    metro_menu_calc();
    $("#tv_cur").addClass("square");
  } else if (id === "dialog") {
    tv_cur_block = "dialog";
    tv_sel_list = $("#custom_dialog")
      .find("[onvclick]")
      .filter(function () {
        return $(this).is(":visible");
      });
    metro_menu_calc();
  } else if (id === "show_gallery") {
    tv_cur_block = "show_gallery";
    tv_sel_list = $(".gallery_subContainer").find("[onvclick]");
    tv_cur_elem = tv_sel_list;
    $("#tv_cur").addClass("square");
    return true;
  } else if (id === "guide") {
    tv_cur_block = "guide";
    tv_sel_list = $("#" + id).find(".guide_icon");
  } else if (
    id === "settings" ||
    id === "service_page" ||
    id === "select_page" ||
    id === "language_select" ||
    id === "selectpage" ||
    id === "sources_list" ||
    id === "sample_page"
  ) {
    tv_cur_block = "settings";
    tv_sel_list = $("#" + id)
      .find(".content")
      .find('[href^="#"], [onvclick]')
      .filter(function () {
        return $(this).is(":visible");
      });
  } else if (id === "tv_channellist") {
    tv_cur_block = "tv_channellist";
    tv_sel_list = $("#tv_channellist")
      .find(".content")
      .find("li")
      .filter(function (index, item) {
        return tv_channellist_type === "not_vertical" ||
          tv_channellist_type === "vertical" ||
          tv_channellist_type === ""
          ? true
          : $(item).is(":visible");
      });
  } else if (id === "tv_programmes_list") {
    tv_cur_block = "tv_programmes_list";
    tv_sel_list = $("#tv_programmes_list").find(".programme");
  } else if (id === "language" || id === "category" || id === "genre") {
    tv_cur_block = id;
    tv_sel_list = $("#" + id)
      .find(".content")
      .find("li");
  } else if (id === "tv_radiolist") {
    tv_cur_block = "tv_radiolist";
    tv_sel_list = $("#tv_radiolist")
      .find(".content")
      .find("li")
      .filter(function (index, item) {
        return !$(item).hasClass("displaynone");
      });
  } else if (id === "channel") {
    tv_cur_block = "channel";
    tv_sel_list = $("#bottom_channel_information").find("[data-code]");
  } else if (id === "keypad") {
    tv_cur_block = "keypad";
    tv_sel_list = $("#hoteza_keypad TD");
    metro_menu_calc();
  } else if ($("#" + id).hasClass("service_page")) {
    tv_cur_block = "shopitem";
    tv_sel_list = $(active_page)
      .find(".shop_plusminus, DIV.button, #shopitemoptions .settings_button")
      .filter(function () {
        return $(this).is(":visible");
      });
  } else if (id === "shopitem" || id === "order_details" || id === "orders") {
    tv_cur_block = id;
    tv_sel_list = $(active_page)
      .find(".shop_plusminus, .button, #shopitemoptions .settings_button")
      .filter(function () {
        return $(this).is(":visible");
      });
  } else if (id === "cart") {
    tv_cur_block = "cart";
    tv_sel_list = $("#cart")
      .find("[onvclick], .shop_plusminus")
      .filter(function () {
        return $(this).is(":visible");
      });
  } else if (id === "feedback") {
    tv_cur_block = "feedback";
    tv_sel_list = $("#feedback")
      .find("[href], [onvclick]")
      .filter(function () {
        return $(this).is(":visible");
      });
  } else if (id === "tv_welcome") {
    //TODO: перенести в navigate
    active_page = "#tv_welcome";
    active_page_id = "tv_welcome";
    tv_cur_block = "tv_welcome";
    tv_sel_list = $("#tv_welcome").find(".button");
  } else if (id === "weather_select_location") {
    tv_cur_block = "weather_select_location";
    tv_sel_list = $("#weather_select_location").find("[onvclick]");
  } else if (id === "VODplayer") {
    tv_cur_block = "VODplayer";
    tv_sel_list = $("#playerPanel [onvclick]").filter(function () {
      return $(this).is(":visible");
    });
  } else if (id === "VODcategory") {
    tv_cur_block = "VODcategory";
    tv_sel_list = $("#" + id)
      .find(".pagelist")
      .find("[onvclick]")
      .filter(function () {
        return $(this).is(":visible");
      });
    metro_menu_calc();
  } else if (id === "time_picker") {
    tv_cur_block = "time_picker";
    tv_sel_list = $("#time_picker")
      .find("[onvclick], .time_picker_item, .button")
      .filter(function () {
        return $(this).is(":visible");
      });
    tv_keydown_override = time_picker.server_keydown;
  } else if ($id(id) && $id(id).classList.contains("list_items_toppings")) {
    tv_cur_block = "toppings";
    tv_sel_list = $(active_page)
      .find(".shop_plusminus, .shop_radio, .shop_select, .button")
      .filter(function () {
        return $(this).is(":visible");
      });
  } else if ($id(id) && $id(id).classList.contains("popup")) {
    tv_cur_block = "popup";
    tv_sel_list = $("#" + id)
      .find("[onvclick], .button")
      .filter(function () {
        return $(this).is(":visible");
      });
  } else if (
    id === "mod_playlist" ||
    ($id(id) && $id(id).classList.contains("mod_playlist"))
  ) {
    tv_cur_block = "mod_playlist";
    tv_sel_list =
      id === "mod_playlist"
        ? $(active_page).find("li")
        : $("#" + id).find("li");
  } else if ($id(id) && $id(id).classList.contains("fullscreen_video")) {
    tv_cur_block = "fullscreen_video";
    tv_sel_list = $([]);
  } else if ($("#" + id).find(".pagelist.shop").length) {
    tv_cur_block = "pagelist";
    tv_sel_list = $("#" + id)
      .find(".pagelist")
      .find("[onvclick]")
      .filter(function () {
        return $(this).is(":visible");
      });
    metro_menu_calc();
  } else if ($("#" + id).find(".rcu").length) {
    tv_cur_block = "pagelist";
    tv_sel_list = $("#" + id)
      .find(".rcu")
      .filter(function () {
        return $(this).is(":visible");
      });
    metro_menu_calc();
  } else if ($id(id) && (tmp = $id(id).querySelector(".pagelist"))) {
    tv_cur_block = "pagelist";
    tv_sel_list = $(tmp)
      .find("[href]")
      .filter(function () {
        return $(this).is(":visible");
      });
    metro_menu_calc();
    if (["sources_page"].indexOf(id) == -1) {
      $("#tv_cur").addClass("square");
    }
  } else if ($("#" + id).find(".gallery_container").length) {
    tv_cur_block = "gallery";
    tv_sel_list = $("#" + id).find("IMG");
    $("#tv_cur").hide();
    $("#tv_cur").addClass("square");
  } else if (id === "shop_order" || id === "movie_page" || id === "viewbill") {
    tv_cur_block = "service_page";
    tv_sel_list = $("#" + id)
      .find('[href^="#"], [onvclick], .timepicker')
      .filter(function () {
        return $(this).is(":visible");
      });
  } else if ($("#" + id).hasClass("weather")) {
    //Статичная страница
    tv_cur_block = "static";
    tv_sel_list = $([]);
  } else {
    tv_sel_list = $("#" + id)
      .find('[href^="#"], [onvclick], .timepicker, DIV.button')
      .filter(function () {
        return $(this).is(":visible");
      });
    if (tv_sel_list.length) {
      tv_cur_block = "settings";
    } else {
      tv_cur_block = "scroll";
      tv_sel_list = $([]);
    }
  }

  tv_cur_pos = getTvCurPos();

  tv_max_pos = tv_sel_list.length;
  tv_sel_cur();

  if ($("#" + id).find(".back").length) {
    $("#tv_fullscreen_btn_back").show();
  } else {
    $("#tv_fullscreen_btn_back").hide();
  }

  // обработка видео на страницах и меню
  videoControl();

  function getID(page_id) {
    if (page_id) {
      return page_id;
    }
    if (["VODplayer", "tv_radiolist", "genre"].indexOf(previousBlock) != -1) {
      return previousBlock;
    }
    if (fullscreen) {
      return tv_channellist_type === "mosaic" && tv_mosaic.current_block
        ? tv_mosaic.current_block
        : "tv_channellist";
    }

    if (Menu.opened) {
      return "menu";
    }

    return active_page_id;
  }
  function videoControl() {
    var pageWithVideo = isGetVideoPage();
    if (pageWithVideo) {
      var video = videoCollection.get();

      if (video && !video.paused && video.page === pageWithVideo) {
        return false;
      }

      if (video) {
        clip(null, video.page);
      }

      video = new Video(pageWithVideo);

      if (video.getVideo()) {
        videoCollection.add(pageWithVideo, video);
      }

      setTimeout(videoCollection.start, 100);
    }
  }
  function getTvCurPos() {
    if (tv_cur_block === "tv_programmes_list") {
      return Epg.getCurrentItemPosition();
    }

    if (tv_sel_list.filter(".tv_sel").length) {
      return tv_sel_list.index(tv_sel_list.filter(".tv_sel"));
    }

    return tv_cur_pos;
  }
}

function change_sel_list(direct) {
  switch (tv_cur_block) {
    case "tv_welcome":
      var welcome_block = $("#tv_welcome");

      switch (direct) {
        case "up":
          if (!tv_cur_elem.hasClass("btn_lng")) {
            break;
          }

          tv_sel_list.removeClass("tv_cur");
          tv_sel_block("tv_welcome");

          break;
        case "down":
          if (!tv_cur_elem.hasClass("button")) {
            break;
          }

          tv_sel_list = welcome_block.find(".btn_lng");

          if (!tv_sel_list.length) {
            tv_sel_block("tv_welcome");
            break;
          }

          tv_cur_elem = welcome_block.find(".current_language");
          tv_max_pos = tv_sel_list.length;
          tv_cur_pos = tv_cur_elem.index();

          break;
      }

      break;
  }
}

function tv_ok() {
  if (fullscreen) {
    if (tv_channellist_hidden) {
      tv_channellist_show(true);
      tv_sel_cur();
    } else {
      if (tv_cur_elem) {
        tv_cur_elem.trigger(event_link);
      }
    }
  } else {
    if (tv_sel_list.length && tv_cur_elem) {
      if (tv_cur_block === "VODplayer") {
        if (VOD.playerVisible) {
          tv_cur_elem.trigger(event_link);
        } else {
          VOD.show();
        }
      } else {
        tv_cur_elem.trigger(event_link);
      }
    }
  }
}

function tv_chup() {
  if (fullscreen) {
    tv_right();
    tv_ok();
  } else {
    if (tv_cur_block === "shopitem") {
      shop_plus();
    }
  }
}

function tv_chdown() {
  if (fullscreen) {
    tv_left();
    tv_ok();
  } else {
    if (tv_cur_block === "shopitem") {
      shop_minus();
    }
  }
}

function tv_menu(fromPage) {
  fromPage = fromPage && fromPage.length ? fromPage : null;
  if (fromPage && !classic_menu) {
    fromPage.hide();
    fromPage.removeClass("active_page away_page l r");
  }

  if (tv_cur_block === "dialog") {
    //Скрытие алерта
    custom_dialog_close();
  } else if (tv_cur_block === "VODplayer") {
    VOD.destroy();
    //TODO: вынести в override
    tv_menu();
  } else if ("VOD" in window && VOD.active && tv_cur_block === "menu") {
    VOD.close();
  }
}

function tv_back() {
  if (!fullscreen) {
    if (tv_cur_block === "dialog") {
      //Скрытие алерта
      custom_dialog_close();
    } else if (tv_cur_block === "VODplayer") {
      if (VOD.playerVisible) {
        if (VOD.playerDOM.paused) {
          clearTimeout(VOD.hideTimer);
          VOD.destroy();
          return;
        }

        VOD.hide();
      } else {
        VOD.destroy();

        // для HG32EE590
        _tv_bg_restore();
      }
    } else if ("VOD" in window && VOD.active && tv_cur_block === "menu") {
      VOD.close();
    } else if (tv_cur_block === "tv_welcome") {
      tv_welcome_hide();
    } else if (tv_cur_block !== "menu") {
      // manageShadowOnPage({ id: 'shopitem', remove: true });

      var tmp = $(active_page).find(".back[href_type=back]");
      if (tmp.length) {
        tmp.trigger(event_link);
      } else {
        navigate("#menu");
      }
    }
  } else {
    if (tv_channellist_type === "vertical_new") {
      VerticalChannel.back();
    } else {
      if (!tv_channellist_hidden) {
        tv_channellist_hide(true);
      } else {
        tv_mode();
      }
    }
  }
}

function tv_mode() {
  if (!tv_channels.length || (_tv_channels && !_tv_channels.length)) {
    custom_dialog(
      "alert",
      getlang("tv_nottelevision"),
      getlang("not_available_channels")
    );
    return false;
  }

  //TODO: сделать нормально
  if (tv_cur_block === "tv_welcome") {
    return false;
  }

  if (!fullscreen) {
    Media.stop({ directType: "ip" }).done(toChannel);
  } else {
    if (tv_channellist_type === "mosaic") {
      tv_mosaic.close();
    }

    tv_channellist_fade(true);

    tv_channellist_hide();
    $("#tv_fullscreen_overlay").removeClass("fullscreen").show();

    fullscreen = false;

    $("#tv_fullscreen_btn_tvmode").html(getlang("tv_television"));
    $("#tv_fullscreen_btn_tvcategories").hide();

    try {
      _tv_bg_restore();
    } catch (e) {}

    $("#container").show();
    // $(active_page).show();
    if (classic_menu) {
      tv_sel_block(active_page_id);
    }
    navigate("#menu");

    $("#tv_cur").css("visibility", "visible");
  }

  function toChannel() {
    clip(null);

    if (tv_cur_block === "dialog") {
      //Скрытие алерта
      custom_dialog_close();
    }

    $("#container").hide();

    $("#tv_fullscreen_overlay").addClass("fullscreen");

    try {
      _tv_bg_prepare();
    } catch (e) {
      tv_log("bg prepare error");
    }

    //		if($('#tv_channellist UL').hasClass('tv_channel_category')){
    //			l(1);
    //		}

    tv_sel_block("tv_channellist");

    // передаем управление в tv_mosaic
    if (tv_channellist_type === "mosaic") {
      //Хак для скандик меню, не убиралось приветствие гостя при переходе на каналы из главного меню (нужно только для моазйки?)
      if (scandic_menu) {
        hide_menu();
      }
      //----

      tv_mosaic.open();
      fullscreen = true;
      return true;
    }

    if (tv_channellist_type === "vertical_new") {
      VerticalChannel.open("channel");
      fullscreen = true;
      return true;
    }

    setTimeout(tv_channellist_show, 0);

    $("#tv_fullscreen_btn_tvmode").html(getlang("tv_nottelevision"));
    if (tv_channel_categories.length > 0) {
      $("#tv_fullscreen_btn_tvcategories").show();
    }

    $("#tv_cur").css("visibility", "hidden");

    if (typeof tv_cur_channel === "undefined") {
      tv_cur_pos = 0;
      tv_cur_channel = 0;
      tv_sel_cur();
    }

    setTimeout(function () {
      tv_channel_show(tv_cur_channel);
      fullscreen = true;
    }, 0);

    if (tv_mag_mark) {
      _player_resize();
    }
  }
}
function tv_welcome_getData() {
  var welcome = isset("structv2.welcome"),
    type =
      isset("structv2.welcome.mediaType") ||
      isset("config.tv.welcome_screen.mediaType") ||
      "channel",
    data;

  switch (isset("structv2.welcome.mediaType")) {
    case "channel":
    case "udp":
    case "image":
    case "video":
      data = isset("structv2.welcome.data");
      break;
    default:
      data = isset("config.tv.welcome_screen")[type];
      break;
  }

  return welcome
    ? {
        type: type,
        data: data,
        image: welcome.image,
        title: welcome.title,
        content: welcome.content,
        language: welcome.language,
        lang: {
          kontinue: getlang("mobileAppContent-welcomePage-button-continue"),
        },
      }
    : {};
}

function tv_welcome() {
  log.add("TV welcome show");

  welcome_prepare();

  // Передаем управление в ScandicWelcome
  if (typeof ScandicWelcome !== "undefined" && isset("config.menu") !== "") {
    return ScandicWelcome.open();
  }

  structv2.welcome.language = get_language_select_welcome();
  structv2.welcome.lang = {
    kontinue: getlang("mobileAppContent-welcomePage-button-continue"),
  };
  $(document.body).append(
    templates_cache.welcome_screen.render(tv_welcome_getData())
  );

  tv_set_welcome_guest_greeting_v2();
  $(HotezaTV).on("auth", function () {
    tv_set_welcome_guest_greeting_v2();
  });

  if (!tv_desktop_mark) {
    document.body.style.backgroundColor = "transparent";
  }

  $("#tv_fullscreen_btns").hide();

  videoCollection.destroy().done(function () {
    _player_shutdown().done(function () {
      //Убрано условине по типу. логика в getChannelForWelcome
      var tune = getChannelForWelcome();
      if (tune) {
        try {
          _tv_bg_prepare();
        } catch (e) {
          tv_log("bg prepare error");
        }
        _tv_channel_show(tune);
        setVideoSize();
      }

      tv_keydown_override = server_keydown;

      var tmp_vol = isset("config.tv.welcome_screen.volume") || 0;
      tv_set_volume(tmp_vol);

      if ($id("splashscreen")) {
        setTimeout(function () {
          delete_splash();
          tv_sel_block("tv_welcome");
        }, 2000);
      } else {
        tv_sel_block("tv_welcome");
      }
    });
  });

  function get_language_select_welcome() {
    var languages = isset("structv2.language");
    if (!languages || languages.length < 2) {
      return null;
    }
    if (!isset("config.tv.welcome_select_language")) {
      return null;
    }

    var resultArr = [],
      current_language = get_language();

    for (var i = 0; i < languages.length; i++) {
      var language = Object.assign({}, languages[i]);

      language.title = language.title.replace(/\(.+\)/g, "").replace(/\s$/, "");
      language.current = language.code == current_language ? true : false;

      resultArr.push(language);
    }

    return resultArr;
  }
  function welcome_prepare() {
    if (tv_cur_block === "dialog") {
      //Скрытие алерта
      custom_dialog_close();
    }

    $("#container").hide();
    //$('#tv_fullscreen_overlay').css('visibility', '');
    //$('#tv_fullscreen_overlay').hide();
  }
  function server_keydown(e) {
    if (!e) {
      e = event;
    }
    var code = e.keyCode ? e.keyCode : e.which;

    //Обработка shift для MAG
    if (e.shiftKey) {
      code = "S" + code;
    }

    switch (code) {
      case tv_keys.UP:
        tv_up();
        break;
      case tv_keys.DOWN:
        tv_down();
        break;
      case tv_keys.LEFT:
        tv_left();
        break;
      case tv_keys.RIGHT:
        tv_right();
        break;
      case tv_keys.ENTER:
        tv_ok();
        if (e.stopPropagation) {
          e.stopPropagation();
        }
        break;
      case tv_keys.EXIT:
      case tv_keys.BACK:
      case tv_keys.PORTAL:
      case tv_keys.GUIDE:
      case tv_keys.Q_MENU:
      case tv_keys.MENU:
      case tv_keys.HOME:
        tv_welcome_hide();
        break;

      default:
        break;
    }
  }
}
function getChannelForWelcome() {
  var tmp_channels;
  if (isset("config.tv.welcome_screen.useGroupsInWelcome")) {
    tmp_channels = _tv_channels;
  } else {
    tmp_channels = tv_channels;
  }
  var channel;

  switch (isset("structv2.welcome.mediaType")) {
    case "channel":
      channel = tmp_channels[isset("structv2.welcome.data") || 0];
      break;
    case "udp":
      channel = tv_channel_to_old_format({
        type: "udp",
        data: isset("structv2.welcome.data"),
      });
      break;
    case "image":
    case "video":
      break;
    default:
      if (
        !isset("config.tv.welcome_screen.mediaType") ||
        isset("config.tv.welcome_screen.mediaType") == "channel"
      ) {
        channel = tmp_channels[isset("config.tv.welcome_screen.channel") || 0];
      } else if (isset("config.tv.welcome_screen.mediaType") == "udp") {
        channel = tv_channel_to_old_format({
          type: "udp",
          data: isset("config.tv.welcome_screen.udp"),
        });
      }
      break;
  }
  return channel;
}

function tv_welcome_resize() {
  $("#tv_welcome .container").css(
    "top",
    (wh - $("#tv_welcome .container").outerHeight()) / 2 + "px"
  );
  tv_sel_cur();
}

function tv_welcome_hide() {
  var d = $.Deferred();
  //Выставление флага просмотра приветствия гостя (Welcome)
  var data = load_data();
  data.welcome_screen_shown = true;
  save_data(data);

  if (typeof ScandicWelcome !== "undefined") {
    return ScandicWelcome.close().done(function () {
      goToApp();
      d.resolve();
    });
  } else {
    var type = tv_welcome_getData().type;
    if (type == "channel" || type == "udp") {
      _tv_channel_stop();
      goToApp();
      d.resolve();
    } else {
      videoCollection.destroy().done(function () {
        _player_shutdown().done(function () {
          clip(null);
          goToApp();
          d.resolve();
        });
      });
    }
  }

  function goToApp() {
    $("#tv_fullscreen_overlay").show();
    $("#tv_fullscreen_btns").show();
    $("#container").show();

    $("#tv_welcome").remove();

    //TODO: навигация на инструкцию по пульту?
    // tv_sel_block('menu');

    _tv_bg_restore();

    fullscreen = false;

    tv_cur_channel = 0;

    tv_keydown_override = null;

    //TODO: пперенести в модуль
    initScandicMenu();

    // Возможно можно проще, по идее при классик меню там уже всё подготовлено
    if (classic_menu) {
      navigate("#menu");
      $(first_page_in_classic_menu.get_page()).trigger(event_link);
      tv_sel_block("menu");
    } else {
      navigate("#menu");
      set_first_active_cursor_in_menu();
    }
  }

  return d.promise();
}

//Преобразование в старый формат
function tv_channel_to_old_format(obj) {
  var out;
  switch (obj.type) {
    case "udp":
      out = {
        type: "ip",
        broadcastType: "UDP",
        protocol: obj.data.split(":")[0],
        port: obj.data.split(":")[1] | 0 || "1234",
      };
      break;
    default:
      break;
  }
  return out;
}

function tv_channellist_build() {
  var channels = getChannels();
  var tmp, filtersNames, num, filtered, action;
  if (typeof channels === "undefined") {
    return false;
  }

  if (
    tv_manufacturer == "mag" &&
    typeof tv_channellist_type !== "undefined" &&
    tv_channellist_type === "mosaic" &&
    !isset("config.tv.hacks.MAG")
  ) {
    tv_channellist_type = "";
  }

  if (tv_channellist_type === "vertical_new") {
    VerticalChannel.init(true);
  } else if (tv_channellist_type === "vertical") {
    var h, w;
    if (!$("#tv_channellist").length) {
      $(document.body).append(
        "" +
          '<div id="tv_channellist" style="display:none;" class="vertical">' +
          '<div id="tv_channel_filter"><span>&nbsp;</span></div>' +
          '<div id="tv_channellist_cont">' +
          '<div class="content">' +
          "<ul></ul>" +
          "</div>" +
          '<div id="scroll_outer">' +
          '<div class="scroll_up"></div>' +
          '<div class="scroll_down"></div>' +
          '<div id="scroll_inner">' +
          '<div id="scroll_scroll"></div>' +
          "</div>" +
          "</div>" +
          "</div>" +
          '<div id="tv_header"></div>' +
          "</div>"
      );

      //CSS OVERRIDE
      h = wh - 300;
      w = 400;
      $("#tv_channellist").css("bottom", 150 + "px");
      $("#tv_channellist_cont").height(h).width(w);
    }

    $("#tv_channellist UL").removeClass("tv_channel_category").empty();

    tmp = "";
    filtersNames = channelCategories.getNamesFiltersList();
    if (filtersNames.length) {
      $("#tv_channel_filter")
        .html(
          "<span>" +
            getlang("tv_category") +
            ": " +
            $.each(filtersNames, function (item) {
              return item;
            }) +
            "</span>"
        )
        .show();
    } else {
      $("#tv_channel_filter").hide();
    }

    for (num in channels) {
      // проверка tv_rights
      if (!filterRightsContent(channels[num], "video")) {
        if (typeof tv_cur_channel === "undefined") {
          tv_cur_channel = num;
        }

        filtered = true;
        channelCategories(channels[num], tv_channel_categories);

        if (
          filtersNames.length &&
          filtersNames.indexOf(channels[num].category) === -1
        ) {
          filtered = false;
        }
        if (
          typeof tv_channel_filter.language !== "undefined" &&
          tv_channel_filter.language !== channels[num].lang
        ) {
          filtered = false;
        }

        // проверка nopost
        action = handlerNopost(channels, num, "tv_channel_show(" + num + ");");
        if (filtered === true) {
          tmp +=
            "" +
            '<li data-num="' +
            num +
            '" onvclick="' +
            action +
            '">' +
            '<div class="tv_channel_logo" style="background:url(' +
            channels[num].image +
            ') 50% no-repeat;"></div>' +
            '<div class="prognum">' +
            ((num | 0) + 1) +
            "</div>" +
            channels[num].name +
            "</li>";
        }
      }
    }
    $("#tv_channellist_cont UL").append(tmp);

    //Высота контента
    var max_height = $("#tv_channellist_cont").height(),
      target_height =
        $("#tv_channellist LI").length *
          $("#tv_channellist LI").outerHeight(true) +
        20;
    $("#tv_channellist").find(".content")[0].style.height =
      (target_height < max_height ? max_height : target_height) + "px";

    if (max_height >= $("#tv_channellist_cont .content").height()) {
      $("#tv_channellist_cont UL").css("margin-right", "");
      $("#scroll_outer").hide();
    } else {
      $("#tv_channellist_cont UL").css("margin-right", "32px");
      $("#scroll_outer").height(h - 40);
      $("#scroll_outer").show();
    }

    if (fullscreen && !tv_channellist_hidden) {
      tv_sel_block("tv_channellist");
    }

    sendChannelsToMobile();
  } else if (tv_channellist_type === "mosaic") {
    if (typeof tv_mosaic === "undefined") {
      return;
    }

    tv_channel_filter.category = [];
    tv_channel_filter.language = [];

    // создаем список категорий и добавляем количество каналов
    tv_channels_category_list = tv_mosaic.category_list();

    // сортируем список языков и добавляем количество каналов
    tv_channels_sorted_lang = tv_mosaic.sort_languages();

    tv_mosaic.filter_channels();

    tv_mosaic.build_container();

    if (channels.length) {
      tv_mosaic.build_channel_list();
      tv_mosaic.build_channel_list(true);

      tv_mosaic.build_preview(channels[0].name);
      tv_mosaic.build_choosing_list("language");
      tv_mosaic.build_choosing_list("category");
    }

    var tmp_preload = new PreloadMedia("#tv_channellist");
  } else {
    if (!document.getElementById("tv_channellist")) {
      $(document.body).append(
        '<div id="tv_channellist" class="horizontal" style="display:none;"><div id="tv_channel_filter"><span></span></div><div class="tv_channel_left"></div><div id="tv_channellist_cont"><div class="content"><ul></ul></div></div><div class="tv_channel_right"></div></div><div id="tv_header"></div>'
      );
    }

    tmp = document.querySelector("#tv_channellist_cont UL");

    if (tmp) {
      tmp.classList.remove("tv_channel_category");
    }

    tmp = document.getElementById("tv_channel_filter");
    filtersNames = channelCategories.getNamesFiltersList();
    if (filtersNames.length) {
      tmp.innerHTML =
        "<span>" +
        getlang("tv_category") +
        ": " +
        $.each(filtersNames, function (item) {
          return item;
        }) +
        "</span>";
      tmp.style.display = "block";
    } else {
      tmp.style.display = "none";
    }

    tmp = "";

    for (num in channels) {
      // проверка tv_rights
      if (!filterRightsContent(channels[num], "video")) {
        if (typeof tv_cur_channel === "undefined") {
          tv_cur_channel = num | 0;
        }

        filtered = true;
        channelCategories(channels[num], tv_channel_categories);

        if (
          filtersNames.length &&
          filtersNames.indexOf(channels[num].category) === -1
        ) {
          filtered = false;
        }
        if (
          typeof tv_channel_filter.language !== "undefined" &&
          tv_channel_filter.language !== channels[num].lang
        ) {
          filtered = false;
        }

        // проверка nopost
        action = handlerNopost(channels, num, "tv_channel_show(" + num + ");");
        if (filtered === true) {
          tmp +=
            "" +
            '<li data-num="' +
            num +
            '" onvclick="' +
            action +
            '">' +
            '<div class="tv_channel_name">' +
            channels[num].name +
            "</div>" +
            "<div " +
            'class="tv_channel_logo" ' +
            'style="background:url(' +
            channels[num].image +
            ') 50% no-repeat;"' +
            "></div>" +
            "</li>";
        }
      }
    }
    document.getElementById("tv_channellist_cont").innerHTML =
      '<div class="content"><ul>' + tmp + "</ul></div>";

    //Смещение
    tmp = $("#tv_channellist").find("LI").outerWidth(true);

    document.querySelector("#tv_channellist .content").style.width =
      channels.length * tmp + "px";

    if (fullscreen && !tv_channellist_hidden) {
      tv_sel_block("tv_channellist");
    }

    sendChannelsToMobile();
  }
}

function tv_channel_category_build() {
  var categories = channelCategories.getNamesFiltersList(true);

  if (categories.length === 0) {
    return false;
  }

  $("#tv_channel_filter").hide();
  $("#tv_channellist UL").empty();

  var tmp =
    '<li data-num="null" onvclick="tv_channel_filter.category = [];tv_channellist_build();"><span>' +
    getlang("tv_allchannels") +
    "</span></li>";
  for (var num in categories) {
    var hasFilter = channelCategories.hasFilter(num);
    tmp +=
      "" +
      "<li " +
      'data-num="' +
      num +
      '" ' +
      'onvclick="' +
      (hasFilter
        ? "channelCategories.removeFilter(" + num + ")"
        : "channelCategories.addFilter(" + num + ")") +
      ';tv_channellist_build();"' +
      (hasFilter ? ' class="tv_sel selected"' : "") +
      ">" +
      "<span>" +
      categories[num] +
      "</span>" +
      "</li>";
  }

  $("#tv_channellist UL").addClass("tv_channel_category").append(tmp);

  tv_sel_block("tv_channellist");
  tv_channellist_fade(true);
}

function tv_channellist_show(full) {
  if (full && tv_channellist_type !== "vertical_new") {
    document.getElementById("tv_fullscreen_overlay").style.display = "block";
    //document.getElementById('tv_fullscreen_overlay').style.visibility = 'visible';
  }

  if (tv_channellist_type === "mosaic") {
    return tv_mosaic.server_channel_information.toggle();
  }

  document.getElementById("tv_channellist").style.display = "block";

  if (tv_sel_list.length === 0) {
    tv_sel_block("tv_channellist");
  }

  if (
    typeof tv_cur_channel !== "undefined" &&
    tv_channellist_type !== "vertical_new"
  ) {
    var tmp = $("#tv_channellist_cont [data-num]").filter(function () {
      return $(this).data("num") == tv_cur_channel;
    });

    if (tmp.length) {
      tv_cur_pos = tmp.index();
    }
    tv_sel_cur();
  }
  tv_channellist_hidden = false;
  tv_channellist_fade(true);
}

function tv_channellist_hide(full) {
  if (full) {
    document.getElementById("tv_fullscreen_overlay").style.display = "none";
    //		document.getElementById('tv_fullscreen_overlay').style.visibility = 'hidden';
  }

  $("#tv_channellist").hide();
  tv_channellist_hidden = true;

  if (tv_channellist_type === "vertical_new") {
    $("#tv_cur").hide();
  }
}

var tv_channellist_hidden = false;
var tv_fade_timer;
function tv_channellist_fade(reset) {
  if (typeof fullscreen === "undefined") {
    return false;
  }

  if (tv_fade_timer) {
    clearTimeout(tv_fade_timer);
    $("#tv_channellist").stop().animate({ opacity: 1 }, 100);
  }
  if (!reset) {
    tv_fade_timer = setTimeout(function () {
      $("#tv_channellist").animate({ opacity: 0 }, 500, function () {
        tv_channellist_hidden = true;
        this.style.display = "none";
      });
      //			document.getElementById('tv_fullscreen_overlay').style.visibility = 'hidden';
      document.getElementById("tv_fullscreen_overlay").style.display = "none";

      if (tv_channellist_type === "vertical_new") {
        $("#tv_cur").hide();
      }
    }, 5000);
  }
}

var tv_channels = [];
var tv_channel_categories = [];
var tv_channel_filter = {};

var tv_cur_channel;
var tv_prev_cur_channel;
var tv_cur_channel_audio;

function tv_channel_show(tune, coords) {
  var channel,
    id,
    channels = getChannels();

  if (typeof tune === "object") {
    channel = tune;
    id = -1;
  } else {
    id = tune | 0;
    channel = channels[id];
  }

  if (channel) {
    sendChannelId(channel.id);
  }

  if (fullscreen && (!channel || tv_cur_channel === id) && id !== -1) {
    tv_channellist_hide(true);
    return false;
  }

  tv_cur_channel_audio = null;
  tv_cur_channel = id;

  _tv_channel_show(channel, coords);

  tv_channellist_fade();
}

function tv_log(msg) {
  if (isset("config.tv.suppress_log")) {
    log.add("TV LOG: " + msg);
  } else {
    if (!document.getElementById("tv_log")) {
      $(document.body).append('<div id="tv_log"></div>');
    }
    var tmp = "log_" + Math.random();
    $('<div id="' + tmp + '">' + msg + "</div>")
      .appendTo(document.getElementById("tv_log"))
      .delay(10000)
      .fadeOut(0, function () {
        $(this).remove();
      });
  }
}

function tv_register() {
  var d = $.Deferred();
  //TODO: check with device tv_mac
  //get MAC
  $.post(
    tv_daemon_url + "getmymac",
    function (data) {
      tv_ip = data.ip;
      tv_mac = data.mac;
      tv_sign = data.sign;

      if (!tv_mac || !tv_sign || !tv_room) {
        //МАК и ключ не получен или не установлен номер комнаты
        d.reject("nomac or noroom");
      } else {
        log.add("TV: DAEMON: IP = " + tv_ip + " / MAC = " + tv_mac);

        data = {
          hotelId: get_hotelId(),
          roomNumber: tv_room,
          ip: tv_ip,
          mac: tv_mac,
          manufacturer: tv_manufacturer,
          model: tv_get_info().model,
          firmware: tv_get_info().firmware,
          sign: tv_sign,
        };

        if (typeof Events !== "undefined" && Events.TVID()) {
          data.tvIndex = Events.TVID();
        }

        $.post(
          "http://103.153.72.195:8080/api/v1/tvconnect/registration",
          data,
          function (r) {
            if (typeof r == "object") {
              switch (r.result) {
                case 0:
                  if (r.data.groups) {
                    guestData.groups = r.data.groups;
                  }
                  d.resolve();
                  break;
                case 1:
                  d.reject("invalid sign");
                  break;
                case 2:
                  d.reject("invalid hotelid");
                  break;
                case 3:
                  d.reject("MAC " + tv_mac + " belongs to another room");
                  break;
                case 4:
                  d.reject("cannot overwrite MAC in this room");
                  break;
                case 5:
                  d.reject("Cannot create token");
                  break;
                case 6:
                  d.reject("Room Number incorrect");
                  break;
                case 9:
                  d.reject("Unknown error");
                  break;
                default:
                  d.reject("Unknown answer - " + r.result);
                  break;
              }
            } else {
              d.reject("no result");
            }
          },
          "json"
        ).fail(function (err, error, errorThrown) {
          d.reject("fail " + err.status + "|" + err.statusText);
        });
      }
    },
    "json"
  ).fail(function () {
    d.reject("Daemon connect failed - " + tv_daemon_url);
  });
  return d.promise();
}

function tv_register_v2() {
  var d = $.Deferred();
  log.add("TV: registration V2");

  if (!tv_mac || !tv_room) {
    //МАК не получен или не установлен номер комнаты
    d.reject("nomac or noroom");
  } else {
    log.add("TV: IP = " + tv_ip + " / MAC = " + tv_mac);

    data = {
      v: "2",
      hotelId: get_hotelId(),
      roomNumber: tv_room,
      ip: tv_ip,
      mac: tv_mac,
      manufacturer: tv_manufacturer,
      model: tv_get_info().model,
      firmware: tv_get_info().firmware,
    };

    if (typeof Events !== "undefined" && Events.TVID()) {
      data.tvIndex = Events.TVID();
    }

    $.post(
      "http://103.153.72.195:8080/api/v1/tvconnect/registration",
      data,
      function (r) {
        if (typeof r == "object") {
          switch (r.result) {
            case 0:
              tv_sign = r.sign;
              if (r.data.groups) {
                guestData.groups = r.data.groups;
              }
              d.resolve();
              break;
            case 1:
              d.reject("invalid sign");
              break;
            case 2:
              d.reject("invalid hotelid");
              break;
            case 3:
              d.reject("MAC " + tv_mac + " belongs to another room");
              break;
            case 4:
              d.reject("cannot overwrite MAC in this room");
              break;
            case 5:
              d.reject("Cannot create token");
              break;
            case 6:
              d.reject("Room Number incorrect");
              break;
            case 9:
              d.reject("Unknown error");
              break;
            default:
              d.reject("Unknown answer - " + r.result);
              break;
          }
        } else {
          d.reject("no result");
        }
      },
      "json"
    ).fail(function (err, error, errorThrown) {
      d.reject("failed - " + err.status + "|" + err.statusText);
    });
  }

  return d.promise();
}

//TODO: определить место списка остальных гостей
var GuestList = null;
//TODO: контроллировать изменение прав
//TODO: хранить все параметры в объекте. (группы, права, фамилия)
var Guest = {
  _token: false,
  surname: "",
  guestName: "",
  guestTitle: "",
  rightsContent: {},
  set_guest: function (r) {
    if (typeof r.token === "string") {
      if (storage.getItem("token") !== r.token) {
        //First time got this token
        log.add("TV: new guest");

        var tmp = $(structv2.language)
            .map(function () {
              return this.code;
            })
            .toArray(),
          curLang = get_language();

        if (r.lang && r.lang !== curLang) {
          if (tmp.indexOf(r.lang) !== -1) {
            return change_language(r.lang);
          } else if (curLang !== isset("config.defaults.language")) {
            log.add("TV: guest language " + r.lang + " not supported");
            return change_language(isset("config.defaults.language"));
          }
        }
      }

      if (storage.getItem("guestData_token") !== r.token) {
        //Очистка, не совпадающий гость
        guestData_clear();

        storage.setItem("guestData_token", r.token);
      }

      if (typeof _tv_checkin == "function") {
        setTimeout(function () {
          _tv_checkin();
        }, 2000);
      }

      Guest.guestSurname = r.guestName || "";
      Guest.guestName = r.guestFirstName || "";
      Guest.guestTitle = r.guestTitle || "";
      Guest.rightsContent = r.rights || {};

      /**
       * video
       *   0    без ограничений
       *   1    Без платных услуг
       *   2    Без ХХХ услуг
       *   3    Все отключено
       * nopost
       *   0    с платным контентом
       *   1    без платного контента
       */
      guestData.groups = r.groups;

      if (typeof tv_auth_function === "function") {
        try {
          tv_auth_function();
        } catch (e) {
          log.add("TV: override failed");
          tv_set_guest();
        }
      } else {
        tv_set_guest();
      }
      log.add("TV: got token - " + r.token);

      //Обработчик кастомных полей PMS
      if (typeof tv_pms_function === "function") {
        try {
          tv_pms_function(r.additional);
        } catch (e) {
          log.add("TV: Error: PMS custom field function failed");
        }
      }

      // фильтруем каналы по группам
      _tv_channels = tv_mosaic.filter_channels_by_groups();

      //Перестроение списка каналов и VOD с учётом доступных групп
      tv_channellist_build(true);
      wakeup_status(true);
      filter_content_by_group();
      // tv_sel_block();

      //TODO: контроллировать изменение прав
      if (Guest.token != r.token) {
        Guest.token = r.token;
        tv_open_app.open(true);
      } else {
        console.log("reauth");
      }

      //Получение команд от сервера
      tv_get_server_commands();
      manageFeedbackSending();

      // по логике описанной Антоном, в Events приходит сообшение о том,
      // что что-то произошло с тем или иным сервисом,
      // после event'a мы должны сходить на сервер и узнать что же именно произошло
      Events.registerListener("feedback", manageFeedbackSending);

      if (r.guestList && r.guestList.length) {
        GuestList = r.guestList;
      } else {
        GuestList = null;
      }
    } else {
      log.add("TV: token error");
      //То да не то
    }
  },
};
Object.defineProperty(Guest, "token", {
  get: function () {
    return Guest._token;
  },
  set: function (newval) {
    if (newval == false || newval == null || typeof newval == "undefined") {
      storage.removeItem("token");
      console.log("token reset");
    } else {
      storage.setItem("token", newval);
      console.log("token set");
    }

    Guest._token = newval;
    $(HotezaTV).trigger("auth");
  },
});

function get_media_subtitles(subtitles) {
  var d = $.Deferred();

  if (typeof subtitles === "undefined" || !Object.keys(subtitles).length) {
    return d.resolve(null);
  }

  d.resolve(subtitles);

  return d.promise();
}

function tv_auth() {
  if (!tv_mac || !tv_sign) {
    //МАК и ключ не получен
    log.add("TV: nomac, nosign");
    return false;
  } else {
    var data = {
      hotelId: get_hotelId(),
      mac: tv_mac,
      manufacturer: tv_manufacturer,
      sign: tv_sign,
    };

    $.post(
      "http://103.153.72.195:8080/api/v1/tvconnect/token",
      data,
      function (r) {
        $("#tv_fullscreen_welcome").hide();
        switch (r.result) {
          case 0:
            Guest.set_guest(r);
            HotezaTV.auth = "OK";
            break;
          case 1:
            HotezaTV.auth = "invalid sign";
            break;
          case 2:
            HotezaTV.auth = "invalid hotelId";
            break;
          case 3:
            HotezaTV.auth = "MAC not registered";
            break;
          case 4:
            guestData_clear();
            HotezaTV.auth = "OK";
            break;
          case 5:
            HotezaTV.auth = "Ой ваще всё плоха";
            break;
          case 9:
            HotezaTV.auth = "unknown error (9)";
            break;
          default:
            HotezaTV.auth = "unknown answer (" + r.result + ")";
            break;
        }
        log.add("TV: " + HotezaTV.auth);
      },
      "json"
    ).fail(function (err) {
      guestData.groups = [];
      filter_content_by_group();
      HotezaTV.auth = "error " + err.status + "|" + err.statusText;
      log.add("TV: " + HotezaTV.auth);
    });
  }
}

function check_auth() {
  var token = Guest.token;
  if (token) {
    return token;
  } else {
    return false;
  }
}

function require_auth() {
  var token = check_auth();
  if (token) {
    return token;
  } else {
    //Добавить сообщение
    return false;
  }
}

function tv_set_guest_language(guest_language) {
  if (storage.getItem("language") === guest_language) {
    return;
  }
  if (storage.getItem("data") && JSON.parse(storage.getItem("data")).language) {
    return;
  }

  for (var i = 0; i < structv2.language.length; i++) {
    var language = structv2.language[i];

    if (language.code.indexOf(guest_language) !== -1) {
      change_language(guest_language);
      break;
    }
  }
}

/**
 * Функция циклического переключения звуковой дорожки (только в classic channels)
 */
function tv_change_audio() {
  if (typeof _tv_change_audio == "function") {
    return _tv_change_audio();
  } else {
    log.add("APP: _tv_change_audio not implemented yet");
    console.log("APP: _tv_change_audio not implemented yet");
    return $.Deferred().reject("APP: _tv_change_audio not implemented yet");
  }
}

function tv_cur_audio_display(audio) {
  //{int index, array list} {0, ['ru','en']}
  //	audio['list'][audio['index']] = audio['list'][audio['index']].toUpperCase();
  //	tv_log(audio['list'].join(' '));
  if (!$("#tv_channel_number").length) {
    $(document.body).append($('<div id="tv_channel_number"></div>'));
  }
  $("#tv_channel_number").html(audio.list[audio.index].toUpperCase());

  setTimeout(function () {
    $("#tv_channel_number").remove();
  }, 5000);
}

function tv_get_server_commands() {
  var data = {
    token: Guest.token,
    cmd: "alarm",
    tvIndex: Events.TVID(),
  };

  $.post("http://103.153.72.195:8080/api/v1/getTask", data, function (r) {
    switch (r.result) {
      case 0:
        if (r.payload.length === 0) {
          log.add("TV: cmd: no commands");
        }

        for (var i in r.payload) {
          var cmd = r.payload[i];
          switch (cmd.cmd) {
            case "alarm":
              //Фильтрация будильника по зонам
              if (cmd.data[3] && cmd.data[3] != Events.TVID()) {
                log.add("WAKEUP: got wakeup for another TVID");
                return false;
              }

              wakeup_status(false);

              var alarm_dif = Math.round(time.now(true) / 1000) - cmd.data[1];
              if (alarm_dif < 10 * 60) {
                switch (cmd.data[2]) {
                  case "tv_channel":
                    if (system_started) {
                      setTimeout(tv_wakeup, 1000);
                    } else {
                      $(HotezaTV).one("final", function () {
                        setTimeout(tv_wakeup, 1000);
                      });
                    }
                    break;
                  default:
                    log.add("WAKEUP: unknown type " + cmd.data[2]);
                    break;
                }
              } else {
                log.add("WAKEUP: overdue " + toHHMMSS(alarm_dif));
              }
              break;

            case "welcome":
              // Вся логика перенесена в tv_open_app.open()
              break;

            default:
              log.add('TV: cmd: not yet implemented "' + cmd[0] + '"');
              break;
          }
        }
        break;

      default:
        log.add("TV: cmd: Error or Unknown answer - " + r.result);
        break;
    }
  }).fail(function (xhr, error) {
    log.add("TV: cmd: error");
  });
}

function tv_wakeup() {
	if (tv_cur_block === 'tv_welcome') {tv_welcome_hide();}

	if ('Wakeupcall' in window) {
		// Добавлена задержка, так как на EC690
		// видео на будильнике не запускалось
		return setTimeout(Wakeupcall.open.bind(null,'wakeup'), 1000);
	}

	if (!fullscreen) {
		tv_mode();
	}

	tv_wakeup_volume(isset('config.tv.wakeup.start_volume')|0);

	$(document).one('keydown', function(){
		tv_wakeup_volume_cancel();
		custom_dialog_close();
		tv_task_answer({answer: 'tvwolok'});
		tv_mode();
	});

	setTimeout(function() {

		var cur_channel = isset('config.tv.wakeup.channel');
		_tv_channel_show(cur_channel);
		tv_cur_channel = cur_channel;

		custom_dialog('alert', getlang('wakeup_title'), getlang('wakeup_message'));
		custom_dialog_resize(400);
		tv_sel_cur();

		$('#tv_cur').css('visibility','visible');
	}, 3000);

	tv_task_answer({answer: 'tvwolon'});

}

var tv_wakeup_cnt;
function tv_wakeup_volume(i) {
	tv_set_volume(i);
	if(i < isset('config.tv.wakeup.end_volume')|0){
		tv_wakeup_cnt = setTimeout(function (){
			tv_wakeup_volume(i+1);
		}, 3*1000);
	}else{
		tv_wakeup_volume_cancel();
	}
}

function tv_wakeup_volume_cancel() {
	clearTimeout(tv_wakeup_cnt);
}

function tv_task_answer(data) {
	data.token = storage.getItem('token');
	$.post(
		api_url+'taskAnswer',
		data,
		function(r){
			switch(r.result){
			}
		}
	);
}

function fire_alarm() {
	_tv_set_volume(30);
	$(document.body).html('<div style="width:100%;height:100%;background:url(i/fire.gif) center no-repeat;"></div><audio src="tv/sound/fire.mp3" autoplay loop></audio>');
	document.removeEventListener('keydown',tv_keydown,false);
}

var tv_virtual_standby_state = 'unknown';
function tv_virtual_standby_off() {
	if(tv_virtual_standby_state == false){
		hash.set('standby');
		tv_virtual_standby_state = true; //смысл в этом небольшой - прилага идёт на перезагрузку, но пусть будет
		reload_app();
	}else{
		log.add('Virtual Standby: already OFF');
	}
}

function tv_virtual_standby_on() {
	if(tv_virtual_standby_state == true){
		log.add('Virtual Standby: TV turned ON (' + time.uptime(true) + ')');
		HotezaTV.metrics.was_standby = time.uptime();
		log.zero = Date.now();
		hash.set('standby', null);
		tv_virtual_standby_state = false;
		tv_ready();
	}else{
		log.add('Virtual Standby: already ON');
	}
}

function metro_menu_calc(objs, flag) {
	if (typeof(objs) === 'undefined') {
		objs = tv_sel_list;
	}

	var obj = objs.get(0);
	if (
		!flag &&
		objs.length > 0 &&
		$.data(obj, 'top') == obj.getBoundingClientRect().top
	) {
		return true;
	}

	objs.each(function(){
		$.data(this, this.getBoundingClientRect());
	});
}

function metro_menu_move(dir) {
	var index = tv_get_nearest_element(tv_sel_list, $.data(tv_cur_elem.get(0)), dir);

	if (index === false){
		return false;
	}

	previousPosition.set(tv_cur_pos);

	tv_cur_pos = index;
	tv_sel_cur();

	metro_menu_calc();

	return index;
}

//NOT USED!
/*
function tv_get_elements_in_coords(elements, coords){ //{x1: 0, x2: 0, y1: 0, y2:0}

	var out = elements.filter(function(){
		//console.log($(this).offset().left);
		return ($(this).offset().left >= coords.x1 && $(this).offset().top >= coords.y1 && $(this).offset().left <= coords.x2 && $(this).offset().top <= coords.y2);
	});
	var array = [];
	out.each(function(){
		array.push({x: $(this).offset().left, y:$(this).offset().top, id: $(this).index()});
	});

	return array;
}
*/

function tv_get_elements_in_direction(elements, coords, dir){
	var array = [], c;
	elements.each(function(index){
		var data = $.data(this);
		switch(dir){
			case 'right':
				if (data.left < coords.x) {return true;}
				c = {
					x: data.left,
					y: data.top + data.height/2
				};
				break;
			case 'left':
				if (data.left + data.width > coords.x) {return true;}
				c = {
					x: data.left + data.width,
					y: data.top + data.height/2
				};
				break;
			case 'up':
				if (data.top + data.height > coords.y) {return true;}
				c = {
					x: data.left + data.width/2,
					y: data.top + data.height
				};
				break;
			case 'down':
				if (data.top < coords.y) {return true;}
				c = {
					x: data.left + data.width/2,
					y: data.top
				};
				break;
			default:
				console.log('Unknown direction');
				break;
		}

		array.push({
			id: index,
			l: Math.sqrt(Math.pow((c.x - coords.x),2) + Math.pow((c.y - coords.y),2))
		});
	});

	return array;
}

function tv_get_nearest_element(elements, element, dir){
	var x, y;
	switch(dir) {
		case 'right':
			x = element.left + element.width;
			y = element.top + element.height/2;
		break;
		case 'left':
			x = element.left;
			y = element.top + element.height/2;
		break;
		case 'up':
			x = element.left + element.width/2;
			y = element.top;
		break;
		case 'down':
			x = element.left + element.width/2;
			y = element.top + element.height;
		break;
		default:
		break;
	}

	var array = tv_get_elements_in_direction(elements, {
		x: x,
		y: y
	}, dir);

	if (array.length === 0) {
		return false;
	}

	// Sort
	var index = tv_cur_pos,
		val = 0;

	var tmp_i = array.length;
	for (var i = 0; i < tmp_i; i++) {
		var tmp = array[i];
		if (i === 0) {
			index = tmp.id;
			val = tmp.l;
		}
		else{
			if(tmp.l < val){
				index = tmp.id;
				val = tmp.l;
			}
		}
	}

	return index;
}

function list_diff(a, b){
	var results = [];

	for (var i = 0; i < a.length; i++) {
		if (b.indexOf(a[i]) === -1) {
			results.push(a[i]);
		}
	}
	return results;
}

function tv_sources_page(show_all){
	//deleted
	console.log('tv sources old call');
	return false;
}

var Sources = {
	_sources: {
		input_list: {icon: 'sources-icon-settings_input_hdmi', open: function(){_tv_sources();}}, //param: [input, input] 
		input: {icon: 'sources-icon-settings_input_hdmi', open: function(param){
			if(!param){
				log.add('SOURCES: empty input');
				return false;
			}
			var tmp = param.match(/hdmi(\d)/i);
			if(tmp){
				//TODO: заменить на tv_source после переделки вендорных на промисы
				_tv_source(['HDMI', tmp[1]-1]);
				return true;
			}else{
				log.add('SOURCES: cannot parse input');
				return false;
			}
		}}, //param: input
		miracast: {icon: 'sources-icon-androidwindows', open: function(){Apps.miracast();}},
		hotezastream_appletv: {icon: 'sources-icon-airplay', open: function(){AirStream.start();}},
		hotezastream_chromecast: {icon: 'sources-icon-cast', open: function(){AirStream.start(true);}},
		usb: {icon: 'sources-icon-usb', open: function(){_tv_usb();}},
		bluetooth: {icon: 'sources-icon-settings_bluetooth', open: function(){tv_bt.open();}}
	},
	init: function(){
		if(isset('structv2.config.sources')){
			UI.register_page({id: 'sources_page', action: {func: Sources.open, param: false}});
			//UI.register_page({id: 'sources_page_all', action: {func: Sources.open, param: true}});
		}else{
			UI.register_page({id: 'sources_page', action: {func: Sources.open_old, param: false}});
		}
	},
	open: function(show_all){
		if(fullscreen === true){
			tv_mode();
		}
		if(tv_cur_block === 'tv_welcome'){
			tv_welcome_hide();
		}

		var tmp;
		if(show_all){
			tmp = [];
			var keys = Object.keys(Sources._sources);
			for(var k=0; k<keys.length; k++){
				tmp.push({
					type: keys[k],
					title: keys[k],
					description: keys[k]
				});
			}
		}else{
			tmp = isset('structv2.config.sources');
		}
		var items = [];
		for(var i in tmp){
			if(Object.keys(Sources._sources).indexOf(tmp[i].type) == -1){
				log.add('SOURCES: unknown source in struct: ' + tmp[i].type);
				continue;
			}
			//Исключения при построении на STB
			if(tv_manufacturer == 'mag' || tv_manufacturer == 'tvip'){
				//TODO: supported sources from vendor (get_supported_sources)
				if(['input_list','input','miracast','usb','bluetooth'].indexOf(tmp[i].type) != -1){
					log.add('SOURCES: source ' + tmp[i].type + ' unavailable on STB');
					continue;
				}
			}
			Object.assign(tmp[i], Sources._sources[tmp[i].type]);
			tmp[i].id = 'sources_' + tmp[i].type;
			items.push(tmp[i]);
		}
	
		if(!$id('sources_page')){
			var sources_page_object = {
				'title': getlang('tv_sources_page'),
				'items': items
			};
			if(HotezaTV.history.lastpage == '#menu' || HotezaTV.history.lastpage == '#sources_page'){
				sources_page_object.backBtn = 0;
				sources_page_object.parentId = '';
			}else{
				sources_page_object.backBtn = 1;
				sources_page_object.parentId = active_page_id;
			}
			renderPageOnTheStructv2('sources_page', sources_page_object, 'sources_page');
			navigate('#sources_page');
		}
	},
	open_old: function(show_all){
		if(fullscreen === true){
			tv_mode();
		}
		if(tv_cur_block === 'tv_welcome'){
			tv_welcome_hide();
		}

		var tmp = [];
		//построение. один раз. кнопка "назад" зависит от страницы с которой вызывается функция первый раз
		if(!$id('sources_page')){
	
			var sources = {
				'SOURCES': {'id': 1, 'title': getlang('tv_sources'), 'icon': 'sources-icon-settings_input_hdmi', 'onvclick': '_tv_sources(' + show_all + ');'},
				'HDMI': {'id': 2, 'title': 'HDMI', 'icon': 'sources-icon-settings_input_hdmi', 'onvclick': '_tv_sources(' + show_all + ');'},
				'MIRACAST': {'id': 3, 'title': getlang('screen_sharing'), 'icon': 'sources-icon-androidwindows', 'onvclick': 'Apps.miracast();'},
				'APPLETV': {'id': 4, 'title': 'Apple TV', 'icon': 'sources-icon-airplay', 'onvclick': '_tv_source([\'HDMI\', 0])'},
				'CHROMECAST': {'id': 5, 'title': 'ChromeCast', 'icon': 'sources-icon-cast', 'onvclick': '_tv_source([\'HDMI\', 1])'},
				'AIRSTREAM': {'id': 6, 'title': 'Apple TV', 'icon': 'sources-icon-airplay', 'onvclick': 'AirStream.start()'},
				'CHROMESTREAM': {'id': 7, 'title': 'ChromeCast', 'icon': 'sources-icon-cast', 'onvclick': 'AirStream.start(true)'},
				'USB': {'id': 8, 'title': 'USB', 'icon': 'sources-icon-usb', 'onvclick': '_tv_usb();'},
				'BLUETOOTH': {'id': 9, 'title': 'Bluetooth', 'icon': 'sources-icon-settings_bluetooth', 'onvclick': 'tv_bt.open()'},
			};
	
			if(show_all){
				tmp = Object.keys(sources);
			}else{
				tmp = isset('config.tv.external_devices')||['SOURCES', 'MIRACAST', 'USB'];
			}
	
			var items = [];
			for(var i in tmp){
				//Исключения при построении на STB
				if(tv_manufacturer == 'mag' || tv_manufacturer == 'tvip'){
					if(['SOURCES','HDMI','MIRACAST','USB','BLUETOOTH'].indexOf(tmp[i]) != -1){
						continue;
					}
				}
				items.push(sources[tmp[i]]);
			}
	
			var sources_page_object = {
				'title': getlang('tv_sources_page'),
				'items': items
			};
			if(tv_cur_block == 'menu'){
				sources_page_object.backBtn = 0;
				sources_page_object.parentId = '';
			}else{
				sources_page_object.backBtn = 1;
				sources_page_object.parentId = active_page_id;
			}
			renderPageOnTheStructv2('sources_page', sources_page_object, 'sources_page_old');
			navigate('#sources_page');
		}
	},
	open_source: function(type, param){
		if(Sources._sources[type]){
			try{
				Sources._sources[type].open(param);
			}catch(e){
				log.add('SOURCES: open failed, exception: ' + e);
				console.log(e);
			}
		}else{
			log.add('SOURCES: open failed, unknown source type "' + type + '"');
		}
	}
};
$(HotezaTV).on('splashshow', Sources.init);

function tv_source(params){
	if(typeof(_tv_source) == 'function'){
		if(!_tv_source(params)){
			custom_alert('Source not connected');
			return false;
		}else{
			return true;
		}
	}else{
		console.log('SOURCE CHANGE NOT SUPPORTED');
		return false;
	}
}

function wakeup_status(visible, when, orderId) {
	var container = document.getElementById('tv_fullscreen_alarm');

	if (typeof when !== 'undefined') {
		wakeup_status.set(when, orderId);
	}

	when = wakeup_status.get('time');

	if (!isset('config.tv.wakeup_status_exist')) {
		return false;
	}

	var isValidWakeup = wakeup_status.isValidWakeup();
	if (visible && isValidWakeup) {
		if (!when) {
			return false;
		}

		container.querySelector('#wakeup_time').innerHTML = when;
		container.style.display = 'block';
	}
	else {
		container.style.display = 'none';
		wakeup_status.set('');
	}
}
wakeup_status.get = function (type, isFullTime) {
	var data = load_data(),
		result = getData(data, type);

	if (!result) {
		return null;
	}

	if (
		(result && type === 'orderId') ||
		(isFullTime && type === 'time')
	) {
		return result;
	}

	return getTime(result);

	function getTime(date) {
		return date.split(' ')[1].substring(0, 5);
	}
	function getData(_data, _type) {
		if (
			typeof _data.wakeup === 'undefined' ||
			typeof _data.wakeup[_type] === 'undefined'
		) {
			return null;
		}

		return _data.wakeup[_type];
	}
};
wakeup_status.set = function (t, orderId) {
	var data = load_data();

	data.wakeup = {
		time: t,
		orderId: orderId
	};

	save_data(data);
};
wakeup_status.isValidWakeup = function () {
	var date = wakeup_status.get('time',true);
	if (!date) {
		return true;
	}

	var wakeupMoment = moment(date.replace(' ', 'T')),
		nowMoment = time_picker.get_moment_with_current_time(Date.now());

	return parseInt(wakeupMoment.format('X')) > parseInt(nowMoment.format('X'));
};

var UI = {
	buffering: false,
	buffer: '',
	buffer_start: function(){
		this.buffering = true;
	},
	buffer_stop: function(){
		$('#container').append(this.buffer);
		this.buffer = '';
		this.buffering = false;
	},
	_pages: {},
	has_page: function(page){
		if(Object.keys(this._pages).indexOf(page) !== -1){
			return true;
		}else{
			return false;
		}
	},
	//TODO: register_block: name, sel_list, keydown (keys) (metro_move)
	//TODO: dynamic page? with parameters
	/**
	 * @param {object} params
	 * @param {string} params.id
	 * @param {(function|{func: function, param: any})?} params.action
	 * @param {string[]?} params.images
	 * @returns boolean
	 */
	register_page: function(params){
		if(this.has_page(params.id)){
			log.add('UI: can`t register existing page');
			return false;
		}else{
			this._pages[params.id] = {};
			if(params.action){
				if(typeof(params.action) == 'function'){
					this._pages[params.id].action = {func: params.action};
				}else if(typeof(params.action) == 'object' && params.action.func && typeof(params.action.param) != 'undefined'){
					this._pages[params.id].action = params.action;
				}else{
					//ERROR
				}
			}
			if(params.images && (isset('config.preload_images') == 3)){
				this._pages[params.id].images = params.images;
			}
			return true;
		}
	},
	navigate: function(page){
		var that = this;
		var d = $.Deferred();
		if(that.has_page(page)){
			if(isset('config.virtual_render') && !$id(page)){
				$('#container').append(that._pages[page].content);
			}
			if(that._pages[page].images && that._pages[page].images.length){
				Loader.start();
			}
			new _PreloadMedia(that._pages[page].images||[])
			.done(function(){
				if(that._pages[page].images && that._pages[page].images.length){
					Loader.stop();
				}
				pref_log('preload');
				//TODO: переделать замену как-то нормально
				for(var image in that._pages[page].images){
					//TODO: заменяется только первый элемент в выборке? а если одну картинку используют дважды???
					var node = $('[new_image_url="' + that._pages[page].images[image] + '"]')[0];
					if(node){
						if(node.nodeName.toLowerCase() == 'img'){
							node.src = that._pages[page].images[image];
						}else{
							//особенно вот это переделать
							node.style.cssText =
							node.style.cssText
							.replace(
								'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
								that._pages[page].images[image]
							);
						}
						node.removeAttribute('new_image_url');
						console.log(that._pages[page].images[image]);
					}else{
						console.log('No preload image replace!');
					}
				}
				delete that._pages[page].images;
				pref_log('replace');

				if(that._pages[page].action && that._pages[page].action.func){
					//TODO: try? func?
					var param = typeof(that._pages[page].action.param) != 'undefined' ? that._pages[page].action.param : page;
					that._pages[page].action.func(param);
				}
				d.resolve(that._pages[page].nonav);
			});
		}else{
			console.log('UI: can`t navigate to #' + page);
			d.reject('cant do');
		}
		return d.promise();
	},
	nav: function(to, type, dontsave, not_fit_text){
		var id = to.replace(/^#/,'');

		//TODO: временно
		to = '#' + to;
		var to_page = $(to);
		var from_page;

		if(active_page !== to){

			navigating = true;

			//выделение в меню
			setActiveMenuItem();

			if(active_page && $(active_page).length){
				from_page = $(active_page);
				from_page[0].style[css_transition] = '';
			}

			if (to === '#menu') {
				tv_menu(from_page);
			}
			else {
				if(from_page){
					if (!to_page.hasClass('popup')) {
						from_page.hide();
						from_page.removeClass('active_page away_page l r');
					}
				}

				to_page.addClass('active_page').show();
				active_page = to;
				active_page_id = id;
			}

			if (!not_fit_text) {
				fit_text(to_page.find('.header h1'), 20, true);
				fit_text(to_page.find('.pagelist li>span'));
			}

			navigating = false;

			//перемотка контента на начало
			if(from_page){
				if(!from_page[0].getAttribute('keep_position') && from_page.find('.content')[0]){
					var tmp = from_page.find('.content')[0].style;
					tmp[css_transition] = css_transform + ' 0s';
					tmp[css_transform] = 'translate3d(0,0,0)';
				}
			}

			// Ведение статистики
			if (typeof Analytics !== 'undefined') {
				Analytics.hitsPages(id);
			}

			// используется id вместо active_page_id
			// так как active_page_id не может быть равен menu
			this.sel_block(id);

			// Построение прокрутки страниц
			make_scroll(to_page);

			// Изменение высоты контента под размер окна
			if(to_page[0].getAttribute('scroll_to_bottom')){
				scroll_to_bottom(to_page);
			}

		}
		else{
			to_page[0].style.display = 'block';
			to_page.addClass('active_page');
			this.sel_block(active_page_id);
		}

		// Сохранение последней страницы
		if (
			!dontsave &&
			!parseInt(to_page.attr('data-dont-save'))
		) {
			HotezaTV.history.lastpage = to;
		}

		//TODO: должно быть пусто!!!
		// Выполнение действий по закрытии страницы
		execAction(from_page, 'close');
		// Выполнение действий по открытии страницы
		execAction(to_page, 'open');

		function setActiveMenuItem() {
			var tre = $('#menu [href="'+ to +'"]')[0];
	
			if(tre){
				if(!tre.classList.contains('active')){
					var tmp_o = document.getElementById('menu').querySelectorAll('.active');
					for(var i = 0, tmp_l = tmp_o.length; i<tmp_l;i++){
						tmp_o[i].classList.remove('active');
					}
					tre.classList.add('active');
				}
			}
		}
	},
	sel_block: function(id){
		id = getID(id);

		previousBlock = tv_cur_block;
	
		if (tv_sel_list.length) {
			tv_sel_list.removeClass('tv_sel');
		}
	
		if (tv_cur_elem && tv_cur_elem.length) {
			tv_cur_elem[0].classList.add('tv_sel');
		}
	
		// выбор языка в tv_mosaic при tv_cur_block == channel
		if (
			id === 'channel' &&
			guestData.tv_channels_lang_stream &&
			guestData.tv_channels_lang_stream[tv_mosaic.current_channel] != null
		) {
			tv_cur_pos = guestData.tv_channels_lang_stream[tv_mosaic.current_channel];
		}
		else {
			tv_cur_pos = 0;
		}
	
		$('#tv_cur').removeClass('square');
		if (id === 'menu') {
			tv_cur_block = 'menu';
			tv_sel_list = $('#menu').find('[href]').filter(function() {
				return $(this).is(':visible') && this.tagName.toLowerCase() !== 'use';
			});
			metro_menu_calc();
			$('#tv_cur').addClass('square');
		}
		else if (id === 'dialog') {
			tv_cur_block = 'dialog';
			tv_sel_list = $('#custom_dialog').find('[onvclick]').filter(function() { return $(this).is(':visible'); });
			metro_menu_calc();
		}
		else if (id === 'show_gallery') {
			tv_cur_block = 'show_gallery';
			tv_sel_list = $('.gallery_subContainer').find('[onvclick]');
			tv_cur_elem = tv_sel_list;
			$('#tv_cur').addClass('square');
			return true;
		}
		else if (id === 'guide') {
			tv_cur_block = 'guide';
			tv_sel_list = $('#'+id).find('.guide_icon');
		}
		else if (
			id === 'settings' ||
			id === 'service_page' ||
			id === 'select_page' ||
			id === 'language_select' ||
			id === 'selectpage' ||
			id === 'sources_list' ||
			id === 'sample_page'
		) {
			tv_cur_block = 'settings';
			tv_sel_list = $('#'+id).find('.content').find('[href^="#"], [onvclick]').filter(function() { return $(this).is(':visible'); });
		}
		else if (id === 'tv_channellist') {
			tv_cur_block = 'tv_channellist';
			tv_sel_list = $('#tv_channellist').find('.content').find('li').filter(function(index, item) {
				return (
					tv_channellist_type === 'not_vertical' ||
					tv_channellist_type === 'vertical' ||
					tv_channellist_type === ''
				) ? true : $(item).is(':visible');
			});
		}
		else if (id === 'tv_programmes_list') {
			tv_cur_block = 'tv_programmes_list';
			tv_sel_list = $('#tv_programmes_list').find('.programme');
		}
		else if (id === 'language' || id === 'category' || id === 'genre') {
			tv_cur_block = id;
			tv_sel_list = $('#' + id).find('.content').find('li');
		}
		else if (id === 'tv_radiolist') {
			tv_cur_block = 'tv_radiolist';
			tv_sel_list = $('#tv_radiolist').find('.content').find('li').filter(function(index, item) {
				return !$(item).hasClass('displaynone');
			});
		}
		else if (id === 'channel') {
			tv_cur_block = 'channel';
			tv_sel_list = $('#bottom_channel_information').find('[data-code]');
		}
		else if ($('#'+id).hasClass('service_page')) {
			tv_cur_block = 'shopitem';
			tv_sel_list = $(active_page)
				.find('.shop_plusminus, DIV.button, #shopitemoptions .settings_button')
				.filter(function() { return $(this).is(':visible'); });
		}
		else if (
			id === 'shopitem' ||
			id === 'order_details' ||
			id === 'orders'
		) {
	
			tv_cur_block = id;
			tv_sel_list = $(active_page)
				.find('.shop_plusminus, .button, #shopitemoptions .settings_button')
				.filter(function() { return $(this).is(':visible'); });
		}
		else if (id === 'cart') {
			tv_cur_block = 'cart';
			tv_sel_list = $('#cart').find('[onvclick], .shop_plusminus').filter(function() { return $(this).is(':visible'); });
		}
		else if (id === 'feedback') {
			tv_cur_block = 'feedback';
			tv_sel_list = $('#feedback').find('[href], [onvclick]').filter(function() { return $(this).is(':visible'); });
		}
		else if (id === 'tv_welcome') {
			//TODO: перенести в navigate
			active_page = '#tv_welcome';
			active_page_id = 'tv_welcome';
			tv_cur_block = 'tv_welcome';
			tv_sel_list = $('#tv_welcome').find('.button');
		}
		else if (id === 'weather_select_location') {
			tv_cur_block = 'weather_select_location';
			tv_sel_list = $('#weather_select_location').find('[onvclick]');
		}
		else if (id === 'VODplayer') {
			tv_cur_block = 'VODplayer';
			tv_sel_list = $('#playerPanel [onvclick]').filter(function() { return $(this).is(':visible'); });
		}
		else if (id === 'VODcategory') {
			tv_cur_block = 'VODcategory';
			tv_sel_list = $('#'+id).find('.pagelist').find('[onvclick]').filter(function() { return $(this).is(':visible'); });
			metro_menu_calc();
		}
		else if (id === 'time_picker') {
			tv_cur_block = 'time_picker';
			tv_sel_list = $('#time_picker').find('[onvclick], .time_picker_item, .button').filter(function() {
				return $(this).is(':visible');
			});
		}
		else if ($id(id) && $id(id).classList.contains('list_items_toppings')) {
			tv_cur_block = 'toppings';
			tv_sel_list = $(active_page)
				.find('.shop_plusminus, .shop_radio, .shop_select, .button')
				.filter(function() { return $(this).is(':visible'); });
		}
		else if ($id(id) && $id(id).classList.contains('popup')) {
			tv_cur_block = 'popup';
			tv_sel_list = $('#' + id).find('[onvclick], .button').filter(function() { return $(this).is(':visible'); });
		}
		else if (
			id === 'mod_playlist' ||
			(
				$id(id) && $id(id).classList.contains('mod_playlist')
			)
		) {
			tv_cur_block = 'mod_playlist';
			tv_sel_list = id === 'mod_playlist' ? $(active_page).find('li') : $('#'+id).find('li');
		}
		else if ($id(id) && $id(id).classList.contains('fullscreen_video')) {
			tv_cur_block = 'fullscreen_video';
			tv_sel_list = $([]);
		}
		else if ($('#'+id).find('.pagelist.shop').length) {
			tv_cur_block = 'pagelist';
			tv_sel_list = $('#'+id).find('.pagelist').find('[onvclick]').filter(function() { return $(this).is(':visible'); });
			metro_menu_calc();
		}
		else if ($('#'+id).find('.rcu').length) {
			tv_cur_block = 'pagelist';
			tv_sel_list = $('#'+id).find('.rcu').filter(function() { return $(this).is(':visible'); });
			metro_menu_calc();
		}
		else if ($id(id) && (tmp = $id(id).querySelector('.pagelist'))) {
			tv_cur_block = 'pagelist';
			tv_sel_list = $(tmp).find('[href]').filter(function() { return $(this).is(':visible'); });
			metro_menu_calc();
			if(['sources_page'].indexOf(id) == -1){
				$('#tv_cur').addClass('square');
			}
		}
		else if ($('#'+id).find('.gallery_container').length) {
			tv_cur_block = 'gallery';
			tv_sel_list = $('#'+id).find('IMG');
			$('#tv_cur').hide();
			$('#tv_cur').addClass('square');
		}
		else if (
			id === 'shop_order' ||
			id === 'movie_page' ||
			id === 'viewbill'
		) {
			tv_cur_block = 'service_page';
			tv_sel_list = $('#'+id).find('[href^="#"], [onvclick], .timepicker').filter(function() { return $(this).is(':visible'); });
		}
		else {
			tv_sel_list = $('#'+id).find('[href^="#"], [onvclick], .timepicker, DIV.button').filter(function() { return $(this).is(':visible'); });
			if (tv_sel_list.length){
				tv_cur_block = 'settings';
			}else{
				tv_cur_block = 'scroll';
				tv_sel_list = $([]);
			}
		}

		tv_cur_pos = getTvCurPos();
	
		tv_max_pos = tv_sel_list.length;
		tv_sel_cur();
	
		if($('#'+id).find('.back').length){
			$('#tv_fullscreen_btn_back').show();
		}else{
			$('#tv_fullscreen_btn_back').hide();
		}
	
		// обработка видео на страницах и меню
		videoControl();
	
		function getID(page_id) {
			//TODO: понять и удалить
			if (page_id) {
				return page_id;
			}
			if (['VODplayer','tv_radiolist','genre'].indexOf(previousBlock) != -1) {
				return previousBlock;
			}
			if (fullscreen) {
				return tv_channellist_type === 'mosaic' && tv_mosaic.current_block ?
					tv_mosaic.current_block : 'tv_channellist';
			}

			if (Menu.opened) {
				return 'menu';
			}

			return active_page_id;

		}
		function videoControl() {
			var pageWithVideo = isGetVideoPage();
			if (pageWithVideo) {
				var video = videoCollection.get();
	
				if (
					video &&
					!video.paused &&
					video.page === pageWithVideo
				) {
					return false;
				}
	
				if (video) {
					clip(null, video.page);
				}
	
				video = new Video(pageWithVideo);
	
				if (video.getVideo()) {
					videoCollection.add(pageWithVideo, video);
				}
	
				setTimeout(videoCollection.start, 100);
			}
		}

		function getTvCurPos() {
			if (tv_cur_block === 'tv_programmes_list') {
				return Epg.getCurrentItemPosition();
			}
	
			if(tv_sel_list.filter('.tv_sel').length){
				return tv_sel_list.index(tv_sel_list.filter('.tv_sel'));
			}
	
			return tv_cur_pos;
		}
	},
	build_page: function (obj){
		//id
		//title
		//content
		//back - href/onvclick - page id to go back

		// UI.build_page вызван с шаблоном
		if (obj.tpl) {
			var wrap = document.getElementById(obj.id);

			if (wrap) {
				wrap.innerHTML = obj.content;

				if (obj.class != undefined) {wrap.className = 'page ' + obj.class;}
			}
			else {

				var html;
				// если страницы нет, создаем ее по дефолтному шаблону
				var data = {};
				data.content = obj.content;
				data.id = obj.id;
				data.devices = obj.devices;
				data.groups = obj.groups;
				data.tplType = obj.tplType;
				data.onopen = obj.onopen;
				data.onclose = obj.onclose;
				data.wh = wh;

				if (obj.class != undefined) {data.klass = obj.class;}

				// построение виджета в меню
				if (obj.class == 'widget_menu') {
					html = data.content;
				}
				else { // дефолтное построение
					html = templates_cache.default(data);
				}


				if (obj.to) {
					$(obj.to).append(html);
				}
				else {
					if(this.buffering == true){
						this.buffer += html;
					}
					else {
						if(obj.virtual_render && isset('config.virtual_render')){
							return html;
						}else{
							$('#container').append(html);
						}
					}

				}

			}

			return;
		}

		if(typeof(obj) !== 'object'){
			obj = {};
		}

		var id = (obj.id?obj.id:(Math.random().toString(36).slice(2)));
		var tmp;
		if($('#'+id).length){
			//l('UI: page ' + id + ' already exists');
			tmp = $('#'+id);
		}else{
			tmp = $('#sample_page').clone().hide();
			tmp.attr('id', id);
			if (obj.className) {
				tmp.addClass(obj.className);
			}
			$('#container').append(tmp);
		}

		tmp.find('.header').html(
			(
				(obj.back && obj.back.href) ?
					'<div class="back" href="' + obj.back.href + '" onvclick="' + obj.back.onvclick + '" href_type="back"></div>' :
					'<div class="back" onvclick="navigate(\'#menu\')" href_type="back"></div>'
			) + '<h1>' + ((obj.title) ? (obj.title) : 'Default') + '</h1>'
		);
		tmp.find('.content').html(((obj.content) ? (obj.content) : ''));

		return id;
	},
	pay_page: function (obj){
		//type - type of pay (ex. vod)
		//amount - amount to pay
		//check - text to check
		//text - text to display
		//confirm_text - text to display in confirm window
		//data - payload (ex. video_id)

		//???? image

		//TODO: use lang

		var tmp = {'id': 'pay_page'};
		tmp.back = obj.back;
		tmp.title = 'Pay Page';

		//TODO: send request

		tmp.content = '<div>' + obj.text + '<p>POS: ' + obj.type + '</p><p>Amount to pay: <span class="price">' + accounting.formatMoney(obj.amount||0, currency_format) + '</span></p><div id="pay_button" class="button" onvclick="">Pay</div></div>';

		navigate('#' + this.build_page(tmp));

		$('#pay_button').on(event_link, function(){
			custom_input({
				text: obj.confirm_text||'',
				check: obj.check,
				onConfirm: function(){
					//TODO: make request
					var data = {
						type: obj.type,
						data: obj.data,
						token: storage.getItem('token')
					};
					$.post(config.admin_url + 'jsonapi/addPayContent', data)
					.done(function(response){
						//TODO: try
						//TODO: use lang
						switch(response.result){
							case 0:
								//TODO: try
								obj.onSuccess();
								break;
							default:
								custom_alert('Pay error: ' + response.result);
								break;
						}
					});
				}
			});
		});

	},
	popup_list_page: function (data, firstInit) {
		var tmpl = templates_cache[data.tplType];
		var html = tmpl.render(data);

		var to = $(data.to);
		if (to.length && firstInit) {
			to.remove();
			to = [];
		}

		if (to.length) {
			to.append(html);
		}
		else {$('#container').append(html);}
	},
	render: function(id, data_obj, tplType, klass, toAdd, func){
		if(isset('config.virtual_render')){
			//TODO: сомнительно, не работает на динамических страницах
			this._pages[data_obj.id].content = renderPageOnTheStructv2(id, data_obj, tplType, klass, toAdd, func, true);
		}else{
			renderPageOnTheStructv2(id, data_obj, tplType, klass, toAdd, func);
		}
	}
};

CONFIG.load();

function tv_get_state(){
	var tmp = {
		'version': version.v,
		'mac': tv_mac,
		'active_page_id': isset('active_page_id', 'none'),
		'tv_cur_block': isset('tv_cur_block', 'none'),
		'tv_manufacturer': isset('tv_manufacturer', 'none'),
		'language': get_language(),
		'ua': ua||'',
		'tv': tv_get_info()
	};

	if(tv_virtual_standby_state){
		tmp.status = 'standby';
	}

	if(tv_cur_elem){
		try{
			tmp.tv_cur_elem = {
				'id': tv_cur_elem.attr('id')||'',
				'href': tv_cur_elem.attr('href')||'',
				'onvclick': tv_cur_elem.attr('onvclick')||'',
				'textContent': (tv_cur_elem[0].textContent.trim())||''
			};
		}
		catch(e){
			tmp.tv_cur_elem = 'bad';
			log.add('ERROR: tv_cur_elem bad');
		}
	}else{
		tmp.tv_cur_elem = 'none';
	}

	if(tv_last_key){
		try {
			tmp.tv_last_key = tv_last_key + ' (' + (tv_keys_reverse[tv_last_key]||'_no_key_') + ')';
		}
		catch(e) {
			tmp.tv_last_key = 'bad';
			log.add('ERROR: tv_last_key bad');
		}
	}else{
		tmp.tv_last_key = 'none';
	}

	try {
		tmp.uptime = time.uptime(true);
	}
	catch (e) {
		tmp.uptime = 'bad';
		log.add('ERROR: uptime bad');
	}

	return tmp;
}

var sleep_timer = {
	power_off: false,
	time_for_sleep: null,
	timer: {
		timeout: null,
		interval: null
	},
	default_choices: [0, 30, 60, 90, 120, 150, 180],
	detach_keydown: null,
	/**
		* Открыть sleep_timer
		* @param {object} [to] - страница вида $(`#${id}`)
		* @param {string} [backAction] - дополнительные действия при закрытии страницы
		* */
	open: function (to, backAction) {
		this.render(to, backAction);

		if (tv_keydown_override) {
			this.detach_keydown = tv_keydown_override;
		}

		tv_keydown_override = this.tv_keydown;

		navigate('#sleep_timer', 'popup');
		this.set_current_time();
		this.power_off = false;
	},

	close: function () {
		tv_keydown_override = sleep_timer.detach_keydown;
		sleep_timer.detach_keydown = null;
		$('#sleep_timer').remove();
	},

	off: function (only_clear) {
		clearInterval(this.timer.timeout);
		clearInterval(this.timer.interval);

		this.time_for_sleep = null;

		if (only_clear) {return;}

		this.set_current_time();
		select_item();
		tv_back();

	},
	transform_choices: function(arr){
		for(var i in arr){
			if(typeof(arr[i]) == 'number'){
				if(arr[i] == 0){
					arr[i] = {
						//TODO: translation ('mins' too)
						item: 'Off',
						itemName: false,
						onvclick: 'sleep_timer.off()'
					};
				}else{
					arr[i] = {
						item: arr[i],
						itemName: true,
						onvclick: 'sleep_timer.set(' + (arr[i] * T_MIN) + ')'
					};
				}
			}
		}
		return arr;
	},
	render: function (to, backAction) {
		to = typeof to !== 'undefined' ? to : null;
		backAction = typeof backAction !== 'undefined' ?
			'sleep_timer.close();' + backAction :
			'sleep_timer.close();navigate(HotezaTV.history.lastpage)';

		var choices = [];

		if(isset('config.tv.sleep_timer.data')){
			choices = this.transform_choices(isset('config.tv.sleep_timer.data'));
		}else{
			choices = this.transform_choices(this.default_choices);
		}

		var data = {
			id: 'sleep_timer',
			data: choices,
			lang: {
				title: getlang('sleep_timer'),
				itemName: getlang('minutes_short')
			},
			backOnvclick: backAction,
			tpl: true,
			tplType: 'popup_list',
			klass: '',
			to: to
		};

		UI.popup_list_page(data);
	},
	get: function () {
		if (this.time_for_sleep === null) {return null;}

		return Math.floor((this.time_for_sleep/1000)/60);
	},
	set: function (millisec, withoutShowed) {
		this.off(true);
		if (!millisec) {
			return true;
		}

		millisec = parseInt(millisec);
		this.timer.timeout = setTimeout(tv_poweroff, millisec);

		this.time_for_sleep = millisec;
		this.timer.interval = setInterval(sleep_timer._update.bind(this), 1000);

		if (withoutShowed) {
			return false;
		}

		this.set_current_time();
		select_item();
		tv_back();
	},
	set_current_time: function () {
		var current_data = $('#sleep_timer').find('.current_data');
		if (this.get()) {
			current_data.html(': '+ getlang('in') +' '+ this.get() +' '+ getlang('minutes_short'));
		}
		else {
			current_data.html('');
		}

		tv_sel_cur();
	},
	_update: function () {
		this.time_for_sleep = this.time_for_sleep - 1000;

		this.attention();

		if (this.time_for_sleep <= 0 && !this.power_off) {
			this.off(true);
			this.set_current_time();

			tv_poweroff();
			this.power_off = true;
		}
	},

	tv_keydown: function (e) {
		var code = getKeyCode(e);

		switch (code) {
			case tv_keys.UP:
			case tv_keys.RIGHT:
			case tv_keys.DOWN:
			case tv_keys.LEFT:
			case tv_keys.ENTER:
				tv_keydown(e, true);
				break;
			case tv_keys.BACK:
				tv_back();
				break;
			default:
				tv_back();
				tv_keydown(e);
		}
	},

	/**
		* Ф-ия запускается за минуту до выключения ТВ
		* и предупреждает пользователя о скором выключении
		* */
	attention: function () {
		if (!this.time_for_sleep || this.time_for_sleep > 60 * 1000) {
			return false;
		}

		var customDialog = document.getElementById('custom_dialog');

		if (customDialog) {
			return updateTime(customDialog, this.time_for_sleep / 1000);
		}

		custom_confirm({
			title: getlang('sleep_timer'),
			text: getlang('sleep_timer_will_powered_of'),

			confirm: getlang('continue_watching_tv'),
			cancel: null,
			onConfirm: sleep_timer.off.bind(this, true)
		});

		function updateTime(dialog, _time) {
			var addedInfo = dialog.querySelector('#custom_dialog_added_info');

			if (addedInfo) {
				addedInfo.innerHTML = _time;
				return;
			}

			dialog.querySelector('.button_wrap').insertAdjacentHTML(
				'beforebegin',
				'<tr class="custom_dialog_added_info"><td id="custom_dialog_added_info">'+ _time +'</td></tr>'
			);

			custom_dialog_resize();
			tv_sel_cur();
		}
	}
};

function setVideoSize(coords){
	if(!coords || typeof(coords) !== 'object'){
		coords = {
			top: 0,
			left: 0,
			//TODO: изменить и проверить ww и wh
			width: 1280,
			height:720
		};
	}
	_setVideoSize(coords);
}

var tv_bt = {
	open: function(){
		var tmp_page = {
			id: 'tv_source_bt',
			title: 'Bluetooth',
			back: {
				href: '#sources_page',
				onvclick: ''
			},
			content: 'Now you can connect <div id="source_bt_devices"></div>'
		};

		if(!$id('tv_source_bt')){
			UI.build_page(tmp_page);
			$('#tv_source_bt').prepend('<span class="wrap_img" style="background-image:url(i/bluetooth.png)"></span>');
			$('#tv_source_bt').attr('onclose', 'tv_bt.close()');
		}

		navigate('#tv_source_bt');

		_tv_bt_on();
	},
	close: function (){
		_tv_bt_off();
	},
};
function wrap_function(func_name){
	var func = window[func_name];
	if(typeof(func) == 'function'){
		return func;
	}else{
		return function(){
			log.add('APP: ' + func_name + ' not implemented yet');
			console.log('APP: ' + func_name + ' not implemented yet');
		};
	}
}
//~ var tv_poweroff = wrap_function('_tv_poweroff');
//~ var tv_poweron = wrap_function('_tv_poweron');

function tv_poweroff(){
	if(typeof(_tv_poweroff) == 'function'){
		return _tv_poweroff();
	}else{
		log.add('APP: _tv_poweroff not implemented yet');
		console.log('APP: _tv_poweroff not implemented yet');
		return $.Deferred().reject('APP: _tv_poweroff not implemented yet');
	}
}
function tv_poweron(){
	if(typeof(_tv_poweron) == 'function'){
		return _tv_poweron();
	}else{
		log.add('APP: _tv_poweron not implemented yet');
		console.log('APP: _tv_poweron not implemented yet');
		return $.Deferred().reject('APP: _tv_poweron not implemented yet');
	}
}

function tv_power(state){
	if(typeof(state) == 'undefined'){
		return _get_power_state();
	}else if(state === true || state === 'on'){
		return tv_poweron();
	}else if(state === false || state === 'off'){
		return tv_poweroff();
	}else{
		log.add('POWER: unknown state ' + state);
		return $.Deferred().reject('POWER: unknown state ' + state);
	}
}

function tv_reboot(){
	if(typeof(_tv_reboot) == 'function'){
		_tv_reboot();
	}else{
		log.add('APP: tv_reboot not implemented yet');
		console.log('APP: tv_reboot not implemented yet');
	}
}

function tv_set_volume(value){
	//TODO: возможно надо устанавливать не в 100
	//TODO: возможно надо разделить как-то (смешанная инсталляция)
	if (isset('config.tv.hacks.volume_control_disable')) {
		value = 100;
	}
	//TODO: реализация в процентах (приставки и Philips)
	if(typeof(_tv_set_volume) == 'function'){
		_tv_set_volume(value);
	}else{
		log.add('APP: _tv_set_volume not implemented yet');
		console.log('APP: _tv_set_volume not implemented yet');
		return false;
	}
}
function tv_mute(value){
	var d = $.Deferred();
	if(typeof(_tv_mute) == 'function' && typeof(_tv_get_mute) == 'function'){
		_tv_get_mute()
		.done(function(state){
			if(state != value){
				var tmp = _tv_mute();
				if(tmp && (typeof(tmp.done) === 'function')){
					tmp.done(function(){
						d.resolve(!state);
					})
					.fail(function(){
						d.reject('failed to mute/unmute');
					});
				}else{
					//sync
					d.resolve(!state);
				}
			}else{
				//already set
				d.resolve(state);
			}
		})
		.fail(function(){
			d.reject('failed to get mute state');
		});
	}else{
		log.add('APP: tv_mute not implemented yet');
		console.log('APP: tv_mute not implemented yet');
		d.reject('not implemented');
	}
	return d.promise();
}

function showLegend(duration) {
	$('#tv_fullscreen_overlay').stop().animate({ 'opacity': 1 }, typeof duration !== 'undefined' ? duration : 0);
}
function hideLegend(duration) {
	$('#tv_fullscreen_overlay').stop().animate({ 'opacity': 0 }, typeof duration !== 'undefined' ? duration : 0);
}

var fullscreenVideoPage = {
	timer: null,
	open: function () {
		//не скрываем легенду в классическом меню
		if(!classic_menu){
			document.addEventListener('keydown', fullscreenVideoPage.listener);
			fullscreenVideoPage.hideLegend();
		}
	},
	close: function () {
		//не скрываем легенду в классическом меню
		if(!classic_menu){
			clearTimeout(fullscreenVideoPage.timer);
			document.removeEventListener('keydown', fullscreenVideoPage.listener);
			showLegend();
		}
	},
	hideLegend: function () {
		clearTimeout(fullscreenVideoPage.timer);
		fullscreenVideoPage.timer = setTimeout(function () {
			if (tv_cur_block !== 'fullscreen_video') {
				return false;
			}

			hideLegend(500);
		}, 5000);
	},
	listener: function () {
		showLegend(500);
		fullscreenVideoPage.hideLegend();
	}
};
function get_power_state() {
	if(typeof(_get_power_state) == 'function'){
		return _get_power_state();
	}else{
		return $.Deferred().reject('not implemented!!!');
	}
}

function tv_configure(){
	if(active_page == '#tv_welcome'){
		tv_welcome_hide();
		setTimeout(_tv_configure_show, 1000);
	}else{
		_tv_configure_show();
	}
	function _tv_configure_show(){
		if(isset('config.tv.allow_register_by_pin')){
			custom_input({
				title: 'Configuration',
				text: 'Enter room number',
				onConfirm: function(s){
					custom_input({
						title: 'PIN CODE',
						text: 'Enter confirmation PIN',
						onConfirm: function(p){
							Loader.start();
							var data = {
								hotelId: get_hotelId(),
								roomNumber: s,
								ip: tv_ip,
								mac: tv_mac,
								manufacturer: tv_manufacturer,
								pin: p
							};
							$.post(tv_api_url + 'registration_pin', data)
							.done(function(response){
								Loader.stop();
								if(response && response.result){
									switch (response.result){
										case 0:
											storage.setItem('room', s, true);
											reload_app();
											break;
										case 1:
											custom_dialog('alert', 'Error', 'RoomNumber: incorrect PIN', 'tv_configure();');
											break;
										default:
											custom_dialog('alert', 'Error', 'RoomNumber: unexpected result ' + response.result, 'tv_configure();');
											break;
									}
								}
							})
							.fail(function(err){
								Loader.stop();
								custom_dialog('alert', 'Error', 'RoomNumber: request failed', 'tv_configure();');
							});
						}
					});
				}
			});
		}else{
			custom_input({
				title: 'Configuration',
				text: 'Enter room number',
				onConfirm: function(s){
					if(s){
						storage.setItem('room', s, true);
						reload_app();
					}
				}
			});
		}
	}
}

function tv_get_info(){
	var out = {
		model: 'Unknown',
		firmware: 'Unknown'
	};
	if(_tv_get_info && _tv_get_info.firmware && _tv_get_info.model){
		out = {
			model: _tv_get_info.model(),
			firmware: _tv_get_info.firmware(),
			serial_number: (_tv_get_info.serial_number) ? _tv_get_info.serial_number() : 'N/A'
		};

		if(_tv_get_info.extra){
			var tmp = _tv_get_info.extra();
			for(var i in tmp){
				out[i] = tmp[i];
			}
		}
	}
	return out;
}

var LPBar = {
	show: function(){
		$(document.body).append('<div id="lp_container"><div id="lp_bar"><div id="lp_bar_inner"></div></div></div>');
		$('#lp_container').css({
			top: wh/2 + 30 + 'px'
		});
		$('#lp_bar_inner').css({
			width: '0px'
		});
	},
	hide: function(){
		$('#lp_container').remove();
	},
	start_progress: function(percent) {
		$id('lp_bar').style.width = (100 * percent) + '%';
	},
	start_end: function(){
		$id('lp_bar').style.width = '100%';
	},
	preload_progress: function(currentLoaded, total) {
		$id('lp_bar_inner').style.width = (100 * currentLoaded / total) + '%';
	},
	preload_end: function(){
		$id('lp_bar_inner').style.width = '100%';
	}
};

function tv_get_network_info(){
	var d = $.Deferred();
	if(_tv_get_network_info){
		_tv_get_network_info()
		.done(function(obj){
			//TODO: check returned values
			d.resolve(obj);
		})
		.fail(function(e){
			d.resolve({
				ip: 'fail',
				mac: 'fail'
			});
		});
	}else{
		d.resolve({
			ip: 'not implemented',
			mac: 'not implemented'
		});
	}
	return d.promise();
}

//Hoteza Volume Control
var Volume = {
	_hide_timer: null,
	_value: 10,
	init: function(){
		$(document.body).append('<div id="volume_control"><div id="volume_control_line"><div id="volume_control_elapsed"></div><div id="volume_control_bullet"></div></div><div id="volume_control_value">VAL</div><div id="volume_control_icon"></div></div>');
		this._max = $('#volume_control_line').height(); 
	},
	show: function(){
		if(!$id('volume_control')){
			this.init();
		}
		$('#volume_control').stop().fadeIn(100);
		this.reset_timer();
	},
	hide: function(){
		this.clear_timer();
		$('#volume_control').fadeOut(100);
	},
	reset_timer: function(){
		this.clear_timer();
		this._hide_timer = setTimeout(function(){Volume.hide();}, 3000);
	},
	clear_timer: function(){
		if(this._hide_timer){
			clearTimeout(this._hide_timer);
			this._hide_timer = null;
		}
	},
	set: function(value, background){
		this._value = parseInt(value).constrain(-1,99);
		this.set_positions();
		if(!background){
			this.show();
		}
	},
	set_positions: function(){
		if(!$id('volume_control')){
			this.init();
		}

		if(this._value == -1){
			$('#volume_control').addClass('muted');
		}else{
			$('#volume_control_value').html(this._value);
			$('#volume_control').removeClass('muted');
			var tmp = this._value / this._max;
			//easeout
			tmp = 1 - Math.pow(1 - tmp, 3);

			$('#volume_control_bullet').css('bottom', parseInt(tmp * 95) + '%');
			$('#volume_control_elapsed').css('height', parseInt(tmp * 95) + 2 + '%');
		}

	}
};
var Keypad = {
	init: function(){
		$(document.body).append('<div id="hoteza_keypad"><table>' +
			'<tr>' +
			'<td onvclick="custom_input_key(1)">1</td>' +
			'<td onvclick="custom_input_key(2)">2</td>' +
			'<td onvclick="custom_input_key(3)">3</td>' +
			'</tr><tr>' +
			'<td onvclick="custom_input_key(4)">4</td>' +
			'<td onvclick="custom_input_key(5)">5</td>' +
			'<td onvclick="custom_input_key(6)">6</td>' +
			'</tr><tr>' +
			'<td onvclick="custom_input_key(7)">7</td>' +
			'<td onvclick="custom_input_key(8)">8</td>' +
			'<td onvclick="custom_input_key(9)">9</td>' +
			'</tr><tr>' +
			'<td onvclick="custom_input_key(-1)"><svg viewBox="0 -1 28 16"><use xlink:href="#icon-backspace"></use></svg></td>' +
			'<td onvclick="custom_input_key(0)">0</td>' +
			'<td onvclick="Keypad.hide()">OK</td>' +
			'</tr>' +
		'</table></div>');
	},
	_tv_keydown: function(e){
		var code = e.keyCode;
		switch(code){
			case tv_keys.LEFT:
				metro_menu_move('left');
				break;
			case tv_keys.RIGHT:
				metro_menu_move('right');
				break;
			case tv_keys.UP:
				metro_menu_move('up');
				break;
			case tv_keys.DOWN:
				metro_menu_move('down');
				break;
			case tv_keys.ENTER:
				tv_cur_elem.trigger(event_link);
				break;
			case tv_keys.BACK:
			case tv_keys.EXIT:
			case tv_keys.NUMBERS:
					Keypad.hide();
				break;

			default:
				break;
		}
	},
	_shown: false,
	show: function(){
		if(tv_cur_block != 'dialog'){
			return false;
		}

		if(!$id('hoteza_keypad')){
			this.init();
		}
		$('#hoteza_keypad').stop().fadeIn(100);

		tv_sel_block('keypad');

		if(tv_keydown_override){
			console.log('ACHTUNG!');
		}
		tv_keydown_override = this._tv_keydown;
		this._shown = true;
	},
	hide: function(){
		$('#hoteza_keypad').stop().fadeOut(100, function(){$(this).remove();});
		tv_sel_block('dialog');

		tv_keydown_override = null;
		this._shown = false;
	},
	toggle: function(){
		if(this._shown){
			this.hide();
		}else{
			this.show();
		}
	}
};