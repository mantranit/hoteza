var RE = /^matrix\(([0-9]+)[^0-9]*([0-9]+)[^0-9]*([0-9]+)[^0-9]*([0-9]+)[^0-9]*([0-9]+).*\)$/;

var global_event_listener;
function makeClickable() {
	if (global_event_listener){
		return true;
	}

	$(document.body).on(event_link, '[href]', function(e){
		navigate(this.getAttribute('href'),this.getAttribute('href_type'));
		return false;
	});

	$(document.body).on(event_link, '[onvclick]', function(e){
		runAction.call(this, 'onvclick');
		return false;
	});

	$(document.body).on(event_action_move, '[onvmove]', function(e){
		runAction.call(this, 'onvmove');
		return false;
	});

	global_event_listener = true;

	var runAction = (function () {
		if (tv_desktop_mark) {
			return function (type) {
				// eslint-disable-next-line no-eval
				eval(this.getAttribute(type));
			};
		}
		else {
			return function (type) {
				try {
					// eslint-disable-next-line no-eval
					eval(this.getAttribute(type));
				} catch(e) {
					log.add(e.message);
				}
			};
		}
	})();
}

var navigating = false;
var active_page, active_page_id;
var pref_time = Date.now();
function pref_log(text){
	var now = Date.now();
	//TODO: if debug
	//console.log(text + ': ' + (now - pref_time));
	pref_time = now;
}
var nav_starttime;
function navigate(to, type, dontsave, not_fit_text) {
	var d = $.Deferred();

	//блокировка навигации menu->menu
	if(to == '#menu' && tv_cur_block == 'menu'){
		console.log('Menu2menu blocked');
		d.reject('menu2menu');
		return d.promise();
	}

	if (navigating) {
		d.reject('nav in progress');
		return d.promise();
	}

	nav_starttime = Date.now();
	pref_log('start');
	
	//TODO: выход из текущего модуля
	if(fullscreen){
		tv_mode();
	}

	hideInputBlocks();

	var id = to.replace(/^#/,'');

	if (!$id(id) && !UI.has_page(id)) {
		console.log('Page ' + id + ' do not exist');
		d.reject('not exist');
		return d.promise();
	}

	//Перехват новой навигации
	if(UI.has_page(id)){
		navigating = true;
		UI.navigate(id)
		.done(function(){
			pref_log('nav');
			//TODO: сделать возможность делать nav после onopen (или вместо)
			if($id(id)){
				nav();
			}else{
				console.log('Navigating without page');
			}
		})
		.fail(function(error){
			console.log('New navigation failed: ' + error);
			d.reject('new nav fail');
		})
		.always(function(){
			navigating = false;
		});
		return d.promise();;
	}

	if (
		type !== 'notification' &&
		type !== 'popup' &&
		Media.type !== null
	) {
		Media.stop({ directType: null }).done(nav);
	} else {
		nav();
	}

	return d.promise();
	function nav() {
		var from_page;
		var to_page = $(to);

		if(id == 'menu' || tv_cur_block == 'menu'){
			menuVisibilityControl(id);
		}

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
			pref_log('navigation');

			if (!not_fit_text) {
				fit_text(to_page.find('.header h1'), 20, true);
				fit_text(to_page.find('.pagelist li>span'));
			}
			pref_log('fittext');

			navigating = false;

			//перемотка контента на начало
			if(from_page){
				if(!from_page[0].getAttribute('keep_position') && from_page.find('.content')[0]){
					var tmp = from_page.find('.content')[0].style;
					tmp[css_transition] = css_transform + ' 0s';
					tmp[css_transform] = 'translate3d(0,0,0)';
				}
			}
			pref_log('keep pos');

			// Ведение статистики
			if (typeof Analytics !== 'undefined') {
				Analytics.hitsPages(id);
			}
			pref_log('analytics');

			// используется id вместо active_page_id
			// так как active_page_id не может быть равен menu
			tv_sel_block(id);
			pref_log('sel_block took');

			// Построение прокрутки страниц
			make_scroll(to_page);
			pref_log('scroll');

			// Изменение высоты контента под размер окна
			if(to_page[0].getAttribute('scroll_to_bottom')){
				scroll_to_bottom(to_page);
			}
			pref_log('to bottom');

		}else{
			to_page[0].style.display = 'block';
			to_page.addClass('active_page');
			tv_sel_block(active_page_id);
			pref_log('current nav');
		}

		// Сохранение последней страницы
		if (
			!dontsave &&
			!parseInt(to_page.attr('data-dont-save'))
		) {
			HotezaTV.history.lastpage = to;
		}

		// Выполнение действий по закрытии страницы
		execAction(from_page, 'close');
		// Выполнение действий по открытии страницы
		execAction(to_page, 'open');
		pref_log('exec');

		console.log('Total:' + (Date.now() - nav_starttime));
		d.resolve();
	}
	//TODO: отвратительные костыли. убрать когда разделятся меню и велком
	function menuVisibilityControl(_id) {
		if (
			// если dialog вызывался в меню,
			// например отсутствие каналов
			// меню скрывалось
			_id !== 'dialog' &&
			_id !== 'notification_container' &&
			(
				metro_menu ||
				scandic_menu
			)
		) {
			if (_id === 'menu') {
				show_menu();
			}
			else {
				hide_menu();
			}
		}
	}
	function hideInputBlocks() {
		if (document.activeElement) {
			var tmp = document.activeElement.tagName;
			if (tmp === 'INPUT' || tmp === 'TEXTAREA') {
				tmp.blur();
			}
		}
		else {
			if ($('INPUT:focus, TEXTAREA:focus').length) {
				$('*:focus').blur();
			}
		}
	}
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
}

function make_scroll(to) {
	if (!to.length || !to) {
		return false;
	}

	var c, ch, visibleSpace;
	c = to.find('.content');

	// фикс высоты страницы welcome
	if (
		to[0].id === 'time_picker' ||
		to[0].id === 'welcome'
	) {
		return false;
	}
	else if (to.find('.content_wrapper').length) {
		visibleSpace = to.find('.content_wrapper');
		ch = visibleSpace.height();
	}

	var scroll = getScroll(to);
	if (c.outerHeight() > ch) {

		if (!scroll.length) {
			to.append(
				'<div id="' + to[0].id + '_scroll" class="page_scroll">' +
					'<div id="' + to[0].id + '_scroll_inner" class="page_scroll_inner"></div>' +
				'</div>'
			);

			scroll = getScroll(to);
			scroll.css({
				top: parseInt(
					visibleSpace.css('top')
				),
				// right: 175,
				height: ch
			});
			$id(to[0].id + '_scroll_inner').container_height = ch;

			// добавление теней на текст
			// manageShadowOnPage({to: to})

		}

		resize_scroll(to);
	}
	else if (scroll) {
		scroll.remove();
	}

	function getScroll(_to) {
		return $('#'+ _to[0].id + '_scroll');
	}
}

function resize_scroll(to) {
	if (!to || !to.length) {
		return false;
	}

	var c, ch, c_h;
	c = to.find('.content');

	// || to.find('.gallery_container').length удалён хак для галереи, она давно исправлена
	//фикс высоты страницы welcome
	if (to[0].id === 'welcome') {
		return;
	}

	var scroll_inner = $id(to[0].id + '_scroll_inner');
	// если на странице нет скролла
	if (!scroll_inner) {
		return;
	}

	c_h = c.outerHeight();
	ch = scroll_inner.container_height;

	var tmp = ((ch*ch/c_h)|0);
	if(ch/c_h < 1){
		scroll_inner.style.height = tmp + 'px' ;
	}

	scroll_inner.coef = ch/c_h;
	scroll_inner.max = ch - tmp;

}

function scroll_to_top(page){
	if(!page){
		page = $(active_page);
	}

	if(page[0] && page.find('.content')[0]){
		//TODO: реализовать нормально условие
		if(page[0].getAttribute('scroll_to_bottom')){
			page.find('.content')[0].style.top = '0px';
		}else{
			page.find('.content')[0].style.top = '0px';
		}
	}

	move_scroll(0);
}

function scroll_to_bottom(page) {
	if(!page){
		page = $(active_page);
	}

	if(page[0]){
		var scroll_hidden = false;
		if(page.css('display') === 'none'){
			page.css('visibility','hidden').show();
			scroll_hidden = true;
		}

		//TODO: support multiple scrollables
		var content_wrapper = page.find('.content_wrapper'),
			content = content_wrapper.find('.content');

		if(content[0]){
			if(page[0].getAttribute('scroll_to_bottom')){
				content[0].style.top = (content_wrapper.height() - content.height()) + 'px';
			}else{
				content[0].style.top = Math.min(0, (content_wrapper.height() - content.height())) + 'px';
			}
			scrollInnerToBottom(page);
		}

		if(scroll_hidden){
			page.hide().css('visibility','');
		}
	}
}

function scrollInnerToBottom(page) {
	var scrollInner = page.find('.page_scroll_inner')[0];

	if (scrollInner) {
		//scrollInner.style[css_transform] = 'translate3D(0,'+scrollInner.max+'px,0)';
		scrollInner.style.top = scrollInner.max + 'px';
	}
}
