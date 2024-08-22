var Menu = {
	deps: ['SVG'],
	opened: false,
	init: function() {
		var d = $.Deferred();

		var menuType = isset('config.menu', 'classic').toLowerCase();
		if(menuType === 'metro') {
			$(HotezaTV).on('auth', function() {
				QR.get(structv2.menu, 'menu');
			});
		} else if(menuType === 'scandic') {
		} else {
			menuType = 'classic';
		}

		new LoadTemplates(['modules/Menu/menu_'+ menuType + '.html'])
		.done(function(){
			window['build_' + menuType + '_menu']();
			// инициализируем виджеты
			widgetObserver.init();
			d.resolve();
		});

		return d.promise();
	},
	open: function() {

	}
};


var metro_menu = false,
	scandic_menu = false,
	classic_menu = false;
function build_metro_menu() {
	var start = Date.now();
	config.menu = 'metro';

	// css_append('s/layout_metro.css');
	$(document.body).addClass('metro_menu');

	//формирование массива
	var items = [];
	var layout = isset('structv2.config.metro_layout_tv');
	for(var index in layout) {
		if(typeof (layout[index]) == 'object') {
			var item = structv2.menu['id_' + index];
			if(item) {
				item.layout = layout[index];
				item.svg_icon = true;
				if(isset('structv2.config.icon_library')) {
					item.iconVal = SVG.iconsValue[item.icon];
				} else {
					// преобразовываем иконки
					if(iconsV2[item.icon]) {
						item.icon = 'icons8-' + iconsV2[item.icon].toLowerCase();
					} else if(item.icon === '') {
						// eslint-disable-next-line dot-notation
						item.icon = item['class'].toLowerCase();
					}
					item.iconVal = SVG.iconsValue[item.icon];
				}
				items.push(item);

				//TODO: перенос в меню
				if(item.type === 'widget') {
					widgetObserver.add(item.id, item);
				}
			} else {
				log.add('MENU: ERROR! item `' + index + '` not found in struct!');
			}
		}
	}

	renderPageOnTheStructv2('menu_wrapper', {data: items}, 'menu_metro');

	hide_menu = metro_hide_menu;
	show_menu = metro_show_menu;
	metro_menu = true;
	Menu.opened = true;

	log.add('MENU: METRO built in ' + (Date.now() - start) + 'ms');
}

function metro_show_menu() {
	if(isset('config.tv.hacks.fix_menu_icons_flicker')) {
		$('#menu_wrapper')
			.css('visibility', 'hidden')
			.show(function() {
				$('#menu_wrapper').css('visibility', '');
			});
	} else {
		$('#menu_wrapper').show();
	}
	$('#tv_fullscreen_btns').hide();

	Menu.opened = true;
}

function metro_hide_menu() {
	$('#menu_wrapper').hide();
	$('#tv_fullscreen_btns').show();

	Menu.opened = false;
}

function scandic_show_menu() {
	toggleMenuOpenClass(true);
	$('#menu_wrapper').show();
	$('#tv_fullscreen_btns').show();

	Menu.opened = true;
}

function scandic_hide_menu() {
	toggleMenuOpenClass(false);
	$('#menu_wrapper').hide();

	Menu.opened = false;
}

function initScandicMenu() {
	if(!scandic_menu) {
		return false;
	}

	$('#tv_cur').hide();

	var btns = $('#menu_wrapper .btn-arrow'),
		menu = $('#menu'),
		legends = $('#tv_fullscreen_btns'),
		welcome = $('#tv_fullscreen_welcome_big');

	btns.css('bottom', '-229px');
	menu.css('bottom', '-229px');
	legends.addClass('transition-all-3');

	setTimeout(function() {
		btns.addClass('transition-all-3');
		menu.addClass('transition-all-3');
		welcome.addClass('transition-all-3');

		btns.css('bottom', '');
		menu.css('bottom', '');
		welcome.css('bottom', '');

		menu.one('transitionend webkitTransitionEnd ', function(){
			btns.removeClass('transition-all-3');
			menu.removeClass('transition-all-3');

			welcome.removeClass('transition-all-3');
			legends.removeClass('transition-all-3');

			welcome.css('display', '');

			tv_sel_cur();
		});
	}, 20);
}
function setWelcomeVsMenu() {
	var fullscreenWelcome = document.getElementById('tv_fullscreen_welcome_big'),
		greetingWelcome = document.querySelector('#tv_welcome h1'),
		coords = greetingWelcome.getBoundingClientRect(),
		targetPosition = 720 - coords.bottom;

	fullscreenWelcome.style.display = 'block';
	fullscreenWelcome.style.bottom = targetPosition + 'px';

	greetingWelcome.style.display = 'none';
}

function toggleMenuOpenClass(open) {
	if(!scandic_menu) {
		return false;
	}

	var body = document.body;
	if(open) {
		body.classList.add('menu_open');
	}
	else {
		body.classList.remove('menu_open');
	}
}
var serveArrowMenuOpacity = (function() {
	var leftOpacity,
		rightOpacity,
		nextLeftOpacity,
		nextRightOpacity,

		leftArrow,
		rightArrow;

	return function() {
		init();

		// если список меню меньше 5 прерываем выполнение ф-ии
		if(leftOpacity === 0) {
			return true;
		}

		if(tv_cur_pos === 0) {
			nextLeftOpacity = 0.2;
		}
		else if(tv_cur_pos > 4) {
			nextLeftOpacity = 1;
		}

		if(tv_cur_pos === tv_sel_list.length - 1) {
			nextRightOpacity = 0.2;
		}
		else if(tv_cur_pos < tv_sel_list.length - 5) {
			nextRightOpacity = 1;
		}

		setOpacity();
	};

	function init() {
		if(typeof leftOpacity !== 'undefined') {
			return true;
		}

		leftArrow = document.querySelector('.btn-arrow.left');
		rightArrow = document.querySelector('.btn-arrow.right');

		leftOpacity = 0.2;

		if(tv_sel_list.length > 5) {
			rightOpacity = 1;
		}
		else {
			leftOpacity = 0;
			rightOpacity = 0;
		}

		setOpacity();
	}
	function setOpacity() {
		if(leftOpacity !== nextLeftOpacity) {
			leftOpacity = nextLeftOpacity;
			leftArrow.style.opacity = leftOpacity;
		}

		if(rightOpacity !== nextRightOpacity) {
			rightOpacity = nextRightOpacity;
			rightArrow.style.opacity = rightOpacity;
		}
	}
})();

//TODO: в обеих ф-циях сделать sel_block при уже имеющемся cur_block
//TODO: добавить fit_text с каким-то условием
function build_classic_menu() {
	// css_append('s/layout_classic.css');

	//Построение структуры
	$(document.body).removeClass('metro_menu');
	$(document.body).addClass('classic_menu');

	renderPageOnTheStructv2('menu_wrapper', structv2.menu, 'menu_classic');

	classic_menu = true;
}

function show_menu() {
	return false;
}

function hide_menu() {
	return false;
}

function toggle_menu() {
	if(Menu.opened){
		hide_menu();
	}else{
		show_menu();
	}
	return true;
}

function build_scandic_menu() {
	// css_append('s/layout_metro.css');
	css_append('s/scandic-menu.css');

	// класс metro_menu добавляется для верстки страниц
	$(document.body).addClass('scandic_menu metro_menu');

	renderPageOnTheStructv2('menu_wrapper', structv2.menu, 'menu_scandic');

	setMenuWidth();
	setVideoInMenu();

	scandic_menu = true;

	hide_menu = scandic_hide_menu;
	show_menu = scandic_show_menu;
	Menu.opened = true;

	function setMenuWidth() {
		var ITEM_MARGIN_RIGHT = 25,
			ITEM_WIDTH = 210;

		var count = 0;
		for(var key in structv2.menu) {
			if(structv2.menu[key].type === 'delimiter') {
				continue;
			}

			count++;
		}

		var menu = document.querySelector('#menu ul');
		menu.style.width = (ITEM_MARGIN_RIGHT + ITEM_WIDTH) * count + 'px';
		menu.style.left = '0px';
	}
	function setVideoInMenu() {
		var container = document.getElementById('menu_wrapper').querySelector('[data-video-src]');

		if(!container) {
			return false;
		}

		var video = container.getAttribute('data-video-src');
		container.removeAttribute('data-video-src');

		document.getElementById('menu_wrapper').setAttribute('data-video-src', video);
	}
}
