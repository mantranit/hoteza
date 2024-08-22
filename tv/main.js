log.add('APP: version ' + version.v + ' (' + version.date + ') build: ' + version.git);

var css_transform, css_transition;
var ww, wh, hh, pw;
var guide = {}; // Нельзя удалять до переделка Guide. построение точек по этому массиву

function tv_size_init(){
	ww = 1280;
	wh = 720;
	hh = 45;
	pw = 860; //TODO: сделать для классики, проверить для скандика

	if(isset('config.menu') == 'metro' || isset('config.menu') == 'scandic'){
		hh = 182;
	}else{
		hh = 154;
	}
	document.title = 'Hoteza ('+ww+'x'+wh+')' ;
}

var defaults = {};
defaults.accept_languages = Array('ru', 'en');
defaults.language = 'en';

window.onerror = js_error;
function js_error(e, url, line, column, error){
	var error_message = 'initial';
	if(typeof(e) === 'object'){
		error_message = e.message;
	}else{
		error_message = e;
	}

	log.add('Global error: ' + error_message + ', url: ' + url + ', line: ' + line);

	if(isset('config.error_reporting')){
		//Посылка ошибки на сервер
		log.post_error(error_message, url, line);
	}
}

event_link = 'vlink';
event_action_move = 'vmove';
event_animated_end = 'event_animated_end_';

function document_ready() {
	cursorAnimation();
	HotezaTV.metrics.modules = time.uptime();
	log.add('doc ready');

	//Проверка поддержки трансформаций (префиксы)
	if(typeof document.body.style.transform !== 'undefined'){
		//console.log('transform');
		css_transform = 'transform';
		css_transition = 'transition';
		css_transitionend = 'transitionend';
		css_animationend = 'animationend';
	}
	if(typeof document.body.style.webkitTransform !== 'undefined'){
		//console.log('webkitTransform');
		css_transform = '-webkit-transform';
		css_transition = '-webkit-transition';
		css_transitionend = 'webkitTransitionEnd';
		css_animationend = 'webkitAnimationEnd';
	}
	if(typeof document.body.style.OTransform !== 'undefined'){
		//console.log('operaTransform');
		css_transform = '-o-transform';
		css_transition = '-o-transition';
		css_transitionend = 'oTransitionEnd';
		css_animationend = 'oAnimationEnd';
	}

	//Применение языковых стилей
	$(document.head).find('#style_lang').remove();
	css_append('s/' + (get_language()) + '.css', 'style_lang');
	
	// скачиваем файл локализации для moment.js
	if (get_language() !== 'en') {
		var localeLangForMoment = get_language() === 'si' ?
			'sl' : get_language().toLowerCase();

		$(document.head).append(
			'<script type="text/javascript" src="j/libs/moment/locale/'+ localeLangForMoment +'.js"><\/script>'
		);
	}

	log.add('added styles');

	makeClickable();
	log.add('Event listeners added');

	//Форматирование цен магазина
	shop_init_prices();
	log.add('shop prices init');

	// Загрузка корзины
	// shop_load();
	// log.add('shop loaded');

	if(isset('config.tv.roomcontrol')){
		css_append('s/rcu.css');
		css_append('s/font/RCU/style.css');
		$.cachedScript('j/rcu.js?v=' + version.v)
		.done(function(){
			build_rcu();
		});
	}

	/*
	//Переход на последнюю страницу
	var tmp = HotezaTV.history.lastpage;
	if(tmp && $(tmp).length){
		navigate(tmp);
	}else{
		//по умолчанию
		navigate('#shop');
	}
	*/
	active_page = '';
	active_page_id = '';

	//preload images
	preload_start();

}
var preload_starttime = 0;

function preload_start() {
	preload_starttime = Date.now();
	if(isset('config.preload_images') == undefined) {
		config.preload_images = 1;
	}

	switch(isset('config.preload_images')) {
		case 1:
			log.add('Preload: type 1');

			new PreloadMedia('body')
				.progress(LPBar.preload_progress)
				.done(function(total){
					preload_end(total);
				});

			break;

		case 2:
			log.add('Preload: type 2');

			new PreloadMedia('body')
				.progress(LPBar.preload_progress)
				.done(function(total){
					preload_end(total);
				});

			break;

		case 3:
			log.add('Preload: type 3, runtime');

			new PreloadMedia('body')
				.progress(LPBar.preload_progress)
				.done(function(total){
					preload_end(total);
				});

			break;

		case 0:
		case false:
			log.add('Preload: off');

			$('[image_url]').each(function(){
				var src = $(this).attr('image_url');

				if (this.tagName.toLowerCase() === 'img') {
					$(this).attr('src', src);
				} else {
					this.style.cssText =
						this.style.cssText
							.replace(
								'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
								this.getAttribute('image_url')
							);
				}

				$(this).removeAttr('image_url');
			});

			preload_end(0);
			break;
		default:
			break;

	}
}

function preload_end(total) {
	log.add('Preloaded ' + total + ' pics in ' + (Date.now() - preload_starttime) +' ms');

	LPBar.hide();

	document.getElementById('container').style.visibility = 'visible';
	log.add('container show');

	//~ $(document.body).css({
		//~ 'background-image': 'url(tv/container_bg_splash.jpg)',
		//~ 'background-position': '50%'
	//~ });
	log.add('Splash show');
	$('#splashscreen').show();
	HotezaTV.metrics.splash = time.uptime();
	$(HotezaTV).trigger('splashshow');
}

function change_language(lang){
	storage.setItem('language', lang);
	setTimeout(function () {
		reload_app();
	}, 500);
}

//Icons V1 to V2
var iconsV2 = {
	about: 'info',
	service: 'appointment-reminders',
	food: 'bar',
	sport: 'dumbbell',
	guide: 'map-marker',
	image: 'picture',
	message: 'message',
	help: 'help',
	settings: 'settings',
	roomservice: 'restaurant',
	cart: 'shopping-cart-loaded',
	spa: 'bath',
	meeting: 'user-group-man-man',
	offers: 'euro-price-tag',
	shop: 'shopping-bag',
	loyalty: 'thumb-up',
	dir: 'open-folder',
	direction: 'signpost',
	questionnaire: 'survey',
	spa2: 'towel',
	home: 'home',
	concierge: 'service-bell',
	control: 'control-panel',
	social: 'chat',
	taxi: 'taxi',
	login: 'guest-male',
	tv: 'tv',
	wakeup: 'alarm-clock',
	bill: 'bill',
	music: 'music',
	wifi: 'wifi',
	youtube: 'youtube',
	radio: 'radio'
};
var guestData = {};

function filter_content_by_group(){
	var tmp_i = 0;
	var tmp_i2 = 0;
	var tmp_o = 0;
	var tmp_t = $('[groups]').length;
	var start = Date.now();
	$('[groups]').each(function(){
		var tmp = this.getAttribute('groups');
		if(tmp == '' || tmp == '[]' || tmp == '[""]' ){
			this.removeAttribute('groups');
			tmp_o++;
			//console.log('empty');
		}else{
			try{
				tmp = JSON.parse(tmp);
			}catch(e){
				tmp = false;
			}

			if(
				tmp &&
				guestData &&
				guestData.groups &&
				tmp.filter(function(n){return (guestData.groups.indexOf(n.toString()) != -1);}).length
			){
				this.classList.remove('forbidden_by_group');
				tmp_i++;
			}else{
				this.classList.add('forbidden_by_group');
				tmp_i2++;
				//$(this).remove();
				//console.log('hide');
			}
			//tmp = 'group_'+tmp+.join(' group_');
			//$(this).attr('groups', tmp).removeAttr('groups');
			//$(this).addClass(tmp);
			//console.log('not empty');
		}
	});

	log.add('FILTER: Filtered items by group: +' + tmp_i + '|-' + tmp_i2 + '|' + tmp_t + ' in ' + (Date.now() - start) + 'ms');
	if(tmp_o > 0){
		log.add('FILTER: Empty groups in item: ' + tmp_o);
	}

	//TODO: если текущая страница forbidden то переход
}

function filter_content_by_device(obj, device) {
	//Фильтр контента по девайсу
	//TODO: VOD тоже
	var tmp_i = 0;
	var tmp_i2 = 0;
	var tmp_o = 0;
	var objs = obj.find('[devices]');
	var tmp_t = objs.length;
	var start = Date.now();
	objs.each(function(){
		var tmp = this.getAttribute('devices');
		if(tmp == '' || tmp == '[]' || tmp == '[""]' ){
			this.removeAttribute('devices');
			tmp_o++;
		}else{
			try{
				tmp = JSON.parse(tmp);
			}catch(e){
				tmp = false;
			}
			if(tmp && (tmp.indexOf(device) == -1)){
				tmp_i++;
				$(this).remove();
			}else{
				tmp_i2++;
			}

		}
	});

	log.add('FILTER: Filtered items by device "' + device + '": +' + tmp_i2 + '/ -' + tmp_i + '/' + tmp_t);
	if(tmp_o > 0){
		log.add('FILTER: Empty devices in item: ' + tmp_o);
	}
	log.add('FILTER: In ' + (Date.now() - start) + 'ms');

	return obj;
}

//TODO: сделать нормальную фильтрацию любого контента (переделать filter_content_by_device_for_struct)
function filter_content_by_device_for_struct(obj, device) {
	var tmp_i = 0;
	var tmp_i2 = 0;
	var start = Date.now();

	_filter(obj.menu, device);
	_filter(obj.pages, device);

	for (var index in obj.pages) {
		if (obj.pages[index].type === 'list') {
			_filter(obj.pages[index].listItems, device);
		}
	}

	log.add('FILTER: Filtered items by device "' + device + '": +' + tmp_i2 + '|-' + tmp_i + ' in ' + (Date.now() - start) + 'ms');
	function _filter(o, _device) {
		for (var key in o) {
			if (
				(
					o[key].devices &&
					!o[key].devices.length
				) ||
				!o[key].devices ||
				o[key].devices.indexOf('') !== -1
			) {
				tmp_i2++;
				continue;
			}

			if (o[key].devices.indexOf(_device) === -1) {
				tmp_i++;
				delete o[key];
			}
		}
	}
}

/**
 * @param {string} id - id создаваемой страницы
 * @param {object} data_obj - объект с данными
 * @param {string} tplType - имя шаблона
 * @param {string} [klass] - класс страницы (добавляется)
 * @param {string} [toAdd] - куда добапвляем страницу
 * @param {object} [func] - словарь ф-ий использующихся в шаблоне
 * */
function renderPageOnTheStructv2(id, data_obj, tplType, klass, toAdd, func, virtual_render) {

	if (!hh) {
		hh = $('.page .header').outerHeight(true);
	}
	var ph = wh - hh - (isset('config.menu') ? 86 : 126); //TODO: поправить цифры для скандика, похоже используется только в галерее

	var data = $.extend({},data_obj);

	// не рендерим страницы, если нет в конфиге
	if (
		(tplType === 'viewbill' && !isset('structv2.config.viewbill')) ||
		(tplType === 'cart' && !isset('structv2.config.cart')) ||
		(tplType === 'shop_order' && !isset('structv2.config.cart'))
	) {
		return false;
	}

	if (id && id.indexOf('id') !== -1 && id !== 'guide') {
		id = id.split('_')[1];
	}

	// удаляем страницу и рендерим с нуля.
	// когда уйдем от struct.txt этот блок можно будет удалить
	var page = document.getElementById(id);
	if (page) {
		$(page).remove();
		log.add('Page removed id: ' + id);
	}

	if (config.menu !== '') {
		data.metro_menu = true;

		if (config.menu === 'scandic') {
			data.scandic_menu = true;
		}
	}

	// конвертация массива imageList в массив объектов
	// и вычисление общее ширины
	// так как шаблонизатор не показывает индексы
	// и не умеет умножать
	if (tplType === 'gallery') {
		data.imageListArrayObject = arrayToObject(data.imageList);
		data.galleryContainerWidth = pw * data.imageListArrayObject.length;

		// если включен этот флаг
		// при входе в галерею сразу открывается
		// полноэкранный просмотр фото
		if (data.fullScreen) {
			data.onopen = 'tv_ok();';
		}
	}

	// превращаем объект объектов в массив объектов
	if (tplType === 'guide') {
		data.categoriesArr = objectToArrayList(data.categories);
		data.markersArr = objectToArrayList(data.markers);
		var key;
		for (key in data.categories) {
			guide[data.categories[key].id] = [];
		}

		for (key in data.markers) {
			var arr = [];

			arr.push(data.markers[key].title);
			arr.push(data.markers[key].lat);
			arr.push(data.markers[key].lng);
			arr.push(data.markers[key].content);

			guide[data.markers[key].categoryId].push(arr);
		}
	}

	if (
		tplType === 'menu_classic' ||
		tplType === 'menu_scandic'
	) {
		data.menuArr = objectToArrayList(data);

		for (var j = 0; j < data.menuArr.length; j++) {
			var menu_item = data.menuArr[j];

			if(isset('config.tv.hacks.do_not_use_svg')){
					// преобразовываем иконки
					if (iconsV2[menu_item.icon]){
						menu_item.icon = 'icons8-' + iconsV2[menu_item.icon].toLowerCase();
					}else if(menu_item.icon === ''){
						// eslint-disable-next-line dot-notation
						menu_item.icon = menu_item['class'].toLowerCase();
					}
					menu_item.svg_icon = false;
			}else{
				if(isset('structv2.config.icon_library')){
					menu_item.iconVal = SVG.iconsValue[menu_item.icon];
				}else{
					// преобразовываем иконки
					if (iconsV2[menu_item.icon]){
						menu_item.icon = 'icons8-' + iconsV2[menu_item.icon].toLowerCase();
					}else if(menu_item.icon === ''){
						// eslint-disable-next-line dot-notation
						menu_item.icon = menu_item['class'].toLowerCase();
					}
					menu_item.iconVal = SVG.iconsValue[menu_item.icon];
				}
				menu_item.svg_icon = true;
			}

			if (menu_item.type === 'widget') {
				widgetObserver.add(menu_item.id, menu_item);
			}
		}

	}

	if (tplType === 'cart' || tplType === 'shopCategory') {
		data.symbol = isset('structv2.config.currency.symbol');
	}

	if (tplType === 'language') {
		//data.language = storage.language ? storage.language : isset('structv2.config.defaults.language');
		data.language = get_language();
	}

	// перевод TODO: проверить новое построение
	data.lang = getObjectLang();

	data.width = pw;
	data.height = ph;
	data.hh = hh;

	data.new_preload = (isset('config.preload_images') == 3);

	var tmpl = templates_cache[tplType];
	var html = tmpl.render(data, Object.assign({
		formatMoney: function (cost) {
			return accounting.formatMoney(cost, currency_format);
		},
		getlang: getlang,
		isset: isset,
		getPageFromStruct: getPageFromStruct
	}, func ? func : {}));

	return UI.build_page({
		id: id,
		content: html,
		tpl: true,
		tplType: tplType,
		'class': klass,
		width: pw,
		height: ph,
		to: toAdd,
		onopen: data.onopen ? data.onopen : null,
		onclose: data.onclose ? data.onclose : null,
		devices: data.devices && data.devices.length ? data.devices.toString() : null,
		groups: data.groups && data.groups.length ? data.groups.toString() : null,
		virtual_render: virtual_render
	});

}

var lang = {};
lang.empty = true;
function getObjectLang() {
	if (lang.empty) {
		lang.selectTime = getlang('mobileAppContent-contentPage-input-hotelServiceRequest-selectTime');
		lang.kontinue = getlang('mobileAppContent-welcomePage-button-continue');
		lang.now = getlang('mobileAppContent-contentPage-button-hotelServiceRequest-now');
		lang.back = getlang('mobileAppContent-default-label-back');
		lang.guide = getlang('mobileAppContent-mainMenuPage-label-guide');
		lang.cart = getlang('mobileAppContent-mainMenuPage-label-cart');
		lang.cartIsEmpty = getlang('mobileAppContent-mainContent-label-cartIsEmpty');
		lang.checkOut = getlang('mobileAppContent-mainContent-button-checkout');
		lang.total = getlang('mobileAppContent-mainContent-label-total');
		lang.settings = getlang('settings');
		lang.fsupdate = getlang('mobileAppContent-mainContent-settings-fsupdate');
		lang.chooselang = getlang('mobileAppContent-mainContent-settings-chooselang');
		lang.language = getlang('mobileAppContent-mainContent-label-language');
		lang.billLoginreq = getlang('bill_loginreq');
		lang.billPage = getlang('bill_page');
		lang.feedback = getlang('mobileAppContent-mainMenuPage-label-feedback');
		lang.send = getlang('mobileAppContent-default-buttons-send');
		lang.selectrecipient = getlang('mobileAppContent-mainContent-messages-selectrecipient');
		lang.messages = getlang('messages');
		lang.addPcsToCart = getlang('mobileAppContent-mainContent-label-addPcsToCart');
		lang.addToCart = getlang('mobileAppContent-mainContent-label-addToCart');
		lang.continueshopping = getlang('mobileAppContent-mainContent-button-continueshopping');
		lang.gotocart = getlang('mobileAppContent-mainContent-button-gotocart');
		lang.shopordertext = getlang('mobileAppContent-mainContent-label-shopordertext');
		lang.order = getlang('mobileAppContent-mainContent-header-order');

		lang.controlserviceinfo = getlang('mobileAppContent-mainMenuPage-label-controlservicesinfo');
		lang.controlservicesDND = getlang('mobileAppContent-mainMenuPage-label-controlservicesDND');
		lang.controlservicescleanroom = getlang('mobileAppContent-mainMenuPage-label-controlservicescleanroom');
		lang.temperaturecontrol = getlang('mobileAppContent-mainMenuPage-label-temperaturecontrol');
		lang.curtainscontrol = getlang('mobileAppContent-mainMenuPage-label-curtainscontrol');
		lang.curtainsopen = getlang('mobileAppContent-mainMenuPage-label-curtainsopen');
		lang.lightcontrol = getlang('mobileAppContent-mainMenuPage-label-lightcontrol');
		lang.mainlight = getlang('mobileAppContent-mainMenuPage-label-mainlight');
		lang.halllight = getlang('mobileAppContent-mainMenuPage-label-halllight');
		lang.bedlight = getlang('mobileAppContent-mainMenuPage-label-bedlight');
		lang.roomcontrol = getlang('mobileAppContent-mainMenuPage-label-roomcontrol');
		lang.tvon = getlang('mobileAppContent-mainMenuPage-label-tvcontrol-tvon');
		lang.mute = getlang('mobileAppContent-mainMenuPage-label-tvcontrol-mute');
		lang.channel = getlang('mobileAppContent-mainMenuPage-label-tvcontrol-channel');
		lang.tvcontrol = getlang('mobileAppContent-mainMenuPage-label-tvcontrol');
		lang.translated = getlang('mobileAppContent-mainContent-label-translatedMessage');

		lang.service_order = getlang('service_order');
		lang.confirm = getlang('confirm');
		lang.select_time_date = getlang('select_time_date');

		lang.parental_lock = getlang('parental_lock');
		lang.parental_lock_description = getlang('parental_lock_description');
		lang.parental_lock_enabled = getlang('parental_lock_enabled');

		lang.sleep_timer = getlang('sleep_timer');
		lang.change_quantity = getlang('change_quantity');

		lang.empty = false;
	}

	return lang;
}
