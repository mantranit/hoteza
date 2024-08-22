var VOD = {
	inited:  false,
	reIniting: false,
	deps: ['ServiceCodes'],
	duration: 0,
	dictionary: {},
	player: $(),
	movie_page: null,
	playerDOM: {
		paused: false
	},
	status: 'initial',
	playerVisible: false,
	playerPanel: $(),
	playerStatus: $(),
	playerTime: $(),
	playerTimeline: $(),
	playerBullet: $(),
	playerElapsed: $(),
	playerPlay: $(),
	playerPause: $(),
	id: null,
	cur_time: -1,
	progressTimer: null,
	playTimer: null,
	hideTimer: null,
	structure: [],
	structureAssoc: {},
	detachedMenu: $(),
	active: false,
	init: function() {
		var d = $.Deferred();

		VOD.loadStructure()
		.done(function(){
			$(HotezaTV).on('auth', function(){
				VOD.renderCategories();
			});
			d.resolve();
		})
		.fail(function(){
			d.reject();
		});

		__setCSS();

		for (var i = 0; i < tv_channels_languages_def.length; i++) {
			var language = tv_channels_languages_def[i];
			var language_code = Object.keys(language)[0];

			VOD.dictionary[language_code] = language[language_code];
		}

		function __setCSS() {
			css_append('tv/vod.css', 'cssVOD');
			css_append('s/font/player/style.css', 'cssVODcontrols');
		}

		ServiceCodes.registerListener('1140', function(){
			VOD.open();
		});
		ServiceCodes.registerListener('1141', function(){
			VOD.close();
		});

		return d.promise();
	},
	open: function(parentId){
		if (typeof parentId !== 'undefined') {
			var back = document.querySelector('#VODcategories .header .back');
			back.setAttribute('onvclick', 'navigate(\''+ parentId +'\');');
		}
		this.showCategories();
	},
	close: function(){
		this.hideCategories();
	},
	loadStructure: function(){
		var d = $.Deferred();
		
		var that = this;
		$.getJSON(tv_content_url + 'vod.json?_=' + Math.random(),
			function(data){
				var tmp_arr = data[get_language()];
				var i;

				if (typeof tmp_arr === 'undefined') {
					log.add('VOD: structure not added');
					d.reject();
					return false;
				}

				if(typeof(tmp_arr.categories) == 'undefined'){
					log.add('VOD: no categories in structure');
					d.reject();
					return false;
				}

				//TODO: validation
				that.structure = tmp_arr;

				var category;
				that.structureAssoc['categories'] = {};
				for(i in tmp_arr['categories']){
					category = tmp_arr['categories'][i];
					that.structureAssoc['categories'][category['id']] = category;
				}

				// создаем массив дочерних категорий
				for(i in tmp_arr['categories']) {
					category = tmp_arr['categories'][i];
					parentId = category['parentId'];
					if (parentId) {
						if (typeof that.structureAssoc['categories'][parentId].children === 'undefined') {
							that.structureAssoc['categories'][parentId].children = [];
						}
						that.structureAssoc['categories'][parentId].children.push(category.id);
					}
				}

				that.structureAssoc['films'] = {};
				for(i in tmp_arr['films']){
					that.structureAssoc['films'][tmp_arr['films'][i]['id']] = tmp_arr['films'][i];
				}

				log.add('VOD: structure loaded. ' + (isset('VOD.structure.films.length') || '0 (!)') + ' videos in ' + (isset('VOD.structure.categories.length') || '0 (!)') + ' categories');

				d.resolve();
			},
			'json')
			.fail(function(){
				log.add('VOD: structure not found');
				d.reject();
			});

		return d.promise();
	},
	showCategories: function(){
		//TODO: отображение кнопки выхода
		if(isset('config.tv.vod.categories_in_menu') && classic_menu){
			if(this.active === false){
				this.detachedMenu = $('#menu>UL').detach();
				var tmp = $('<UL>');
				for(var i=0; i<this.structure['categories'].length; i++){
					if (filterRightsContent(this.structure['categories'][i], 'video')) continue;

					tmp.append('<li href="" onvclick="VOD.showCategory(\''+this.structure['categories'][i]['id']+'\')">'+this.structure['categories'][i]['title']+'</li>');
				}
				$('#menu').append(tmp);
				navigate('#menu');
				this.active = true;
			}
		} else {
			navigate('#VODcategories');
		}
	},
	renderCategories: function(ctx) {
		// Антоха шлет re_auth 2 раза
		// и почти одновременно
		if (VOD.reIniting) return;
		__removePreviousStructure();

		if(!(isset('config.tv.vod.categories_in_menu') && classic_menu)) {
			var content = typeof ctx !== 'undefined' ? ctx.content : this.structure['categories'];
			var tmp = '<ul class="pagelist">';

			for(var i = 0; i < content.length; i++){
				var tmp_cat = content[i];
				tmp_cat = typeof tmp_cat !== 'object' ?
					this.structureAssoc.categories[tmp_cat] :
					tmp_cat;

				// проверка tv_rights
				if (filterRightsContent(tmp_cat, 'video')) continue;
				if (typeof tmp_cat.children !== 'undefined') {
					VOD.renderCategories({
						id: tmp_cat.id,
						title: tmp_cat.title,
						content: tmp_cat.children
					});
				}
				if (typeof ctx === 'undefined' && tmp_cat.parentId) continue;

				// проверка nopost
				// var action = handlerNopost(
				// 	content,
				// 	i,
				// 	typeof tmp_cat.children === 'undefined' ?
				// 		'VOD.showCategory(\'' + tmp_cat.id + '\');' :
				// 		'navigate(\'#'+ tmp_cat.id +'\')'
				// );

				//Удалена проверка nopost для категорий
				var action = (typeof tmp_cat.children === 'undefined') ? 'VOD.showCategory(\'' + tmp_cat.id + '\');' : 'navigate(\'#'+ tmp_cat.id +'\')';

				if(tmp_cat.imageUrl){
					tmp += '<li href="" onvclick="' + action + '" class="withimg"><img image_url="' + tmp_cat.imageUrl + '" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" /><span>' + tmp_cat.title + '</span></li>';
				}
				else{
					tmp += '<li href="" onvclick="' + action + '"><span>' + tmp_cat.title + '</span></li>';
				}
			}

			if(isset('config.tv.vod.use_purchases') && typeof ctx !== 'undefined'){
				tmp += '<li href="" onvclick="VOD.showPurchases()"><span>' + getlang('vod_purchases') + '</span></li>';
			}

			tmp += '</ul>';

			if (typeof ctx === 'undefined') {
				//TODO: переделать нормально построение
				UI.build_page({
					id: 'VODcategories',
					title: getlang('vod_title'),
					className: 'VODcategories',
					//tpl: 'information_list',
					content: tmp
				});
				//костылёк
				$('#VODcategories').removeClass('white');
			} else {
				//TODO: переделать нормально построение
				UI.build_page({
					id: ctx.id,
					title: ctx.title,
					content: tmp,
					className: 'VODcategories',
					//tpl: 'information_list',
					back: {
						href: '#VODcategories'
					}
				});
				//костылёк
				$('#' + ctx.id).removeClass('white');
				return true;
			}

			var categories = document.querySelectorAll('.VODcategories');
			if (categories) {
				for (i = 0; i < categories.length; i++) {
					new PreloadMedia('#' + categories[i].getAttribute('id'));
				}
			}

			log.add('VOD: render categories.');

			VOD.reIniting = false;

		}

		function __removePreviousStructure() {
			var categories = $('.VODcategories');
			if (!categories.length) return false;

			VOD.reIniting = true;

			// если последней была страница VOD'a
			// едет верстка
			if (
				active_page === '#VODcategories' ||
				active_page === '#VODcategory' ||
				active_page === '#movie_page'
			) {
				active_page = '';
				active_page_id = '';
			}

			categories.remove();
			$('#movie_page').remove();
			$('#VODcategory').remove();
		}
	},
	hideCategories: function(){
		if(this.active === true){
			$('#menu>UL').remove();
			$('#menu').append(this.detachedMenu);
			this.active = false;
			navigate('#menu');
		}
	},
	showCategory: function(id, confirms){
		var category = this.structureAssoc;
		if (check_age(category, confirms)) {
			return false;
		}


		var tmp = '<ul class="pagelist">';
		for (var i=0; i<this.structure.films.length; i++) {
			var movie = this.structure.films[i];

			movie.categories = movie.categories ? movie.categories : [];

			if (
				movie.categories.indexOf(id) === -1 ||
				filterRightsContent(movie, 'video')
			) {
				movie.state = 'hide';
				continue;
			}

			movie.state = 'show';

			movie.price = parseFloat(movie.price) ? movie.price : null;
			// проверка nopost
			if(movie.price){
				movie.action = handlerNopost(
					this.structure['films'], i, 'VOD.showMovie(\''+movie['id']+'\', \''+id+'\');'
				);
			}else{
				movie.action = 'VOD.showMovie(\''+movie['id']+'\', \''+id+'\');';
			}
			movie.imageUrl = movie.imageUrl;

			tmp +=
				'<li ' +
					'onvclick="'+ movie.action +'" ' +
					'class="not_tv_cur"' +
					'data-id="'+ movie.id +'"' +
				'>' +
					'<div class="substrate"></div>' +
					'<div class="shop_image transition_all" style="background-image: url('+ movie.imageUrl +')"></div>' +
					'<span class="shopitemname transition_all">' +
						'<i class="align">'+ movie.title +'</i>' +
					'</span>' +
				'</li>';
		}
		tmp += '</ul>';

		var back = {};
		if(!(isset('config.tv.vod.categories_in_menu') && classic_menu)){
			back = {
				href: '#VODcategories'
			};
		}

		UI.build_page({
			id: 'VODcategory',
			back: back,
			title: this.structureAssoc['categories'][id]['title'],
			content: tmp
		});
		//костылёк
		$('#VODcategory').removeClass('white');

		Analytics.hitsPages(id);

		navigate('#VODcategory', undefined, undefined, true);
		VirtualScroll.set('VODcategory', 'VODcategory', true);

		function check_age(category, confirms) {

			category.contentTypes = category.contentTypes?category.contentTypes:[];

			if (category.contentTypes.indexOf('xxx') !== -1 && !confirms) {
				var data = {
					title: getlang('admission_to_adult'),
					text: getlang('confirm_your_age'),
					confirm: getlang('im_an_adult'),
					cancel: getlang('im_a_child'),
					onConfirm: VOD.showCategory.bind(VOD, category.id, true)
				};

				custom_confirm(data);

				return true;
			}
			else {
				return false;
			}
		}
	},
	showPurchases: function(){
		var data = {
			type: 'vod',
			data: Object.keys(VOD.structureAssoc.films),
			token: storage.getItem('token')
		};
		$.post(config['admin_url'] + 'jsonapi/checkPayContentStatus', data)
		.done(function(data){
			switch(data.result){
				case 0:
					//TODO: if no purchases?
					if(data.data){

						var tmp = '<ul class="pagelist">';
						var i;
						for(i in data.data){
							if(data.data[i] == 1){
								var movie = VOD.structureAssoc.films[i];
								// проверка tv_rights
								if (filterRightsContent(movie, 'video')) continue;

								tmp +=
									'<li onvclick="VOD.showMovie(\''+i+'\')">' +
										'<div class="shop_image">' +
											'<div>' +
												'<img src="'+movie['imageUrl']+'">' +
											'</div>' +
										'</div>' +
										'<span class="shopitemname">'+movie['title']+'<br />' +
										'<i class="movie_year">'+ movie['year'] +'</i>' +
										'</span>' +
										'<span class="movie_genre">'+ movie['genre'] +'</span>'+
									'</li>';
							}
						}
						tmp += '</ul>';

						var back;
						if(isset('config.tv.vod.categories_in_menu') && classic_menu){
							back = {};
						}else{
							back = {
								href: '#VODcategories'
							};
						}

						UI.build_page({
							id: 'VODcategory',
							back: back,
							title: getlang('vod_purchases'),
							content: tmp
						});
						//костылёк
						$('#VODcategory').removeClass('white');

						navigate('#VODcategory');

					}
					else{
						log.add('VOD: Check pay status wrong answer: ' + JSON.stringify(data));
					}
					break;
				case 1:
					log.add('VOD: не верный формат входных данныхб стоит свериться с документацией');
					break;
				case 2:
					custom_alert(getlang('not_registered'));
					log.add('VOD: не верный формат токена, или токен не найден');
					break;
				case 3:
					log.add('VOD: данный токен присвоен клиенту, который выписался');
					break;
				case 4:
					log.add('VOD: данный токен присвоен клиенту, регистрацию которого отменили');
					break;
				case 5:
					log.add('VOD: не известный тип платного контента или не верный формат данных');
					break;
				default:
					log.add('VOD: Check pay status FAILED: ' + data.result);
					break;
			}
		});
	},
	parental_lock: function(contentTypes){
		contentTypes = contentTypes?contentTypes:[];
		//Check PIN every time watching XXX content
		//TODO: 5 min timeout
		var d = $.Deferred();
		if(
			isset('config.tv.parental_lock') &&
			parental_lock_status() &&
			contentTypes.indexOf('xxx') !== -1
		){
			custom_input({
				title: getlang('parental_lock'),
				text: getlang('parental_lock_confirm'),
				check: pincode(),
				onConfirm: function(){d.resolve();},
				onCancel: function(){d.reject();}
			});
		}else{
			d.resolve();
		}
		return d.promise();
	},
	showMovie: function(id, cat_id){
		var that = this;
		if (!VOD.movie_page) {
			renderPageOnTheStructv2('movie_page', {}, 'movie_page');
			VOD.movie_page = $('#movie_page');
		}

		var movie = this.structureAssoc['films'][id];
		movie.price = (parseFloat(movie.price)) ? movie.price : null;
		movie.contentTypes = movie.contentTypes ? movie.contentTypes : [];

		VOD.movie_page.find('.header').html(
			'<div class="back" onvclick="navigate(\'#VODcategory\', undefined, undefined, true);" href_type="back"></div>' +
			'<h1>'+movie['title']+'</h1>'
		);
		var imageUrl = movie['imageUrl'];

		var tmp =
			'<div class="wrap_img" style="background-image:url('+imageUrl+');"></div>' +
			'<div class="content_wrapper">' +
				'<div class="content">' +
					'<div style="width:100%;float:left;box-sizing:border-box;padding:0;">' +
						_getMovieInfo(movie) +
						_getGenres(movie) +
						'<p>'+ (movie['description']||'') +'</p>'+
					'</div>' +
				'</div>' +
			'</div>' +
			(
				(isset('config.tv.vod.use_pay') && movie.price) ?
					'<span class="price">'+
						accounting.formatMoney(movie.price||0, currency_format) +
					'</span>' : ''
			) +
			'<div id="vod_video_watch" class="button" style="display:inline-block;" onvclick="">' +
				getlang('vod_watch') +
			'</div>';

		VOD.movie_page.find('.content_wrapper').prev().remove();
		VOD.movie_page.find('.content_wrapper').remove();
		VOD.movie_page.find('.price').remove();
		VOD.movie_page.find('#vod_video_watch').remove();
		VOD.movie_page.find('#movie_page_scroll').remove();
		VOD.movie_page.find('.header').before(tmp);

		if (isset('config.tv.vod.use_pay')) {
			var check, confirm_text;

			// в макете с ценой высота контента меньше
			VOD.movie_page.addClass('additional_info');

			if(isset('config.tv.vod.confirm_by')){
				check = config.tv.vod.confirm_by;
			}
			else{
				check = 'room';
			}

			switch(check){

				//TODO: check decimal???
				case 'sum':
					check = movie.price;
					confirm_text = getlang('confirm_sum');
					break;

				case 'pin':
					check = pincode();
					confirm_text = getlang('confirm_pin');
					break;

				case 'room':
				default:
					check = storage.getItem('room');
					confirm_text = getlang('confirm_room');
					break;
			}

			//Parental Lock override
			if(isset('config.tv.parental_lock') && parental_lock_status()){
				check = pincode();
				confirm_text = getlang('parental_lock_confirm');
			}

			$('#vod_video_watch').on(event_link, function(){
				var data = {
					type: 'vod',
					data: [id],
					token: storage.getItem('token')
				};
				$.post(config['admin_url'] + 'jsonapi/checkPayContentStatus', data)
				.done(function(data){
					switch(data.result){
						case 0:
							if(data.data && typeof(data.data[id]) !== 'undefined'){
								if(data.data[id] == 1){
									that.parental_lock(that.structureAssoc.films[id].contentTypes).done(function(){that.preinit(id);});
								}else{
									if(movie.price){
										var movie_text =
											'<span class="movie_title">' +
												movie.title +
											'</span>' +
											'<br/>' +
											'<span class="movie_price">'+
												accounting.formatMoney(movie.price||0, currency_format) +
											'</span>' +
											'<br>' +
											confirm_text;

										var obj = {
											title: getlang('buying_movie'),
											text: movie_text,
											check: check,
											btn_confirm: "hidden",
											onConfirm: function() {
												var postData = {
													type: 'vod',
													data: [id],
													token: storage.getItem('token')
												};

												$.post(config['admin_url'] + 'jsonapi/addPayContent', postData)
													.done(function(data){
														//TODO: try
														//TODO: use lang
														switch(data.result){
															case 0:
																//TODO: try
																that.parental_lock(that.structureAssoc.films[id].contentTypes).done(function(){that.preinit(id);});
																break;
															default:
																custom_alert('Pay error: ' + data.result);
																break;
														}
													});
											}
										};

										//TODO: переделать на промисы
										custom_input(obj);
										// UI.pay_page({
										// 	type: 'vod',
										// 	amount: movie.price,
										// 	text: '24 hrs access: ' + movie['title'],
										// 	check: check,
										// 	confirm_text: confirm_text,
										// 	back: {
										// 		href: '#vod_movie',
										// 		onvclick: 'VOD.showMovie(\'' + id + '\',\'' + cat_id + '\')'
										// 	},
										// 	data: [id],
										// 	onSuccess: function(){
										// 		VOD.showMovie(id,cat_id);
										// 	}
										// });
									}else{
										var postData = {
											type: 'vod',
											data: [id],
											token: storage.getItem('token')
										};

										$.post(config['admin_url'] + 'jsonapi/addPayContent', postData)
										.done(function(data){
											switch(data.result){
												case 0:
													that.parental_lock(that.structureAssoc.films[id].contentTypes).done(function(){that.preinit(id);});
													break;
												default:
													custom_alert('Pay error: ' + data.result);
													break;
											}
										});
									}
								}
							}
							else{
								log.add('VOD: Check pay status wrong answer: ' + JSON.stringify(data));
							}
							break;
						case 1:
							log.add('VOD: не верный формат входных данныхб стоит свериться с документацией');
							break;
						case 2:
							custom_alert(getlang('not_registered'));
							log.add('VOD: не верный формат токена, или токен не найден');
							break;
						case 3:
							log.add('VOD: данный токен присвоен клиенту, который выписался');
							break;
						case 4:
							log.add('VOD: данный токен присвоен клиенту, регистрацию которого отменили');
							break;
						case 5:
							log.add('VOD: не известный тип платного контента или не верный формат данных');
							break;
						default:
							log.add('VOD: Check pay status FAILED: ' + data.result);
							break;
					}
				});
			});
		}
		else {
			VOD.movie_page.removeClass('additional_info');

			$('#vod_video_watch').on(event_link, function(){
				//TODO: use lang
				//TODO: config preinit
				that.parental_lock(that.structureAssoc.films[id].contentTypes).done(function(){that.preinit(id);});
			});
		}

		Analytics.hitsPages(id);

		navigate('#movie_page');

		function _getMovieInfo(movie) {
			var fields = ['year', 'xxx', 'runtime', 'rating'],
				added = false,
				items = '<ul class="movie_info">';

			for (var i = 0; i < fields.length; i++) {
				var field = fields[i];

				switch (field) {
					case 'xxx':
						if (movie.contentTypes.indexOf('xxx') !== -1) {
							items += '<li>18+</li>';
							added = true;
						}
						break;

					case 'rating':
						if (
							movie.rating &&
							movie.rating.imdb
						) {
							items += '<li>IMDb: '+ movie.rating.imdb +'</li>';
							added = true;
						}
						break;

					default:
						if (movie[field]) {
							items += '<li>'+ movie[field] +'</li>';
							added = true;
						}
				}
			}

			items = added ? items + '</ul>' : '';
			return items;
		}
		function _getGenres(movie) {
			if (!movie.genre) return '';

			var genres = movie.genre.split(','),
				items = '<ul class="movie_genres">';

			for (var i = 0; i < genres.length; i++) {
				var genre = genres[i];
				items += '<li>'+ genre +'</li>';
			}

			items += '</ul>';
			return items;
		}
	},
	detachedContent: $(),
	preinit: function(id){
		//Просмотр с месте, гда остановились
		var data = load_data();
		if(data['VODdata'] && data['VODdata'][id] && data['VODdata'][id]['time']){
			custom_confirm({
				title: getlang('vod_title'),
				text: getlang('vod_watch_question'),
				confirm: getlang('vod_watch_continue'),
				cancel: getlang('vod_watch_start'),
				onConfirm: function(){
					VOD.openPlayer(id);
				},
				onCancel: function(){
					var data = load_data();
					data['VODdata'][id]['time'] = 0;
					save_data(data);
					VOD.openPlayer(id);
				}
			});
		}else{
			VOD.openPlayer(id);
		}
	},
	openPlayer: function(id){
		Media.stop({ directType: 'VOD' }).done(function() {
			_toVOD.call(VOD);
		});

		function _toVOD() {
			if(this.inited === false){
				var container = $('#container');
				this.detachedContent = container.contents().detach();

				_tv_bg_prepare();

				// без этого плэйер панель не показываться после первого скрытия
				if (tv_mag_mark) {
					document.getElementById('container').style.webkitBackfaceVisibility = 'visible';
				}

				container.addClass('nobg');

				container.html('' +
					'<div id="playerPanel">' +
						'<div id="playerNavigation">' +
							'<div class="nav">' +
								'<span class="tv_icon_back">' +
									'<svg class="svg_button" viewBox="0 0 24 19">' +
										'<use xlink:href="#btn_back"></use>' +
									'</svg>'+
									getlang('back') +
								'</span>' +
							'</div>' +
							'<div class="nav">' +
								'<span class="tv_icon_volume">' +
									'<svg class="svg_button" viewBox="0 0 53 24">' +
										'<use xlink:href="#btn_volume"></use>' +
									'</svg>'+
									getlang('volume') +
								'</span>' +
							'</div>' +
							'<div class="nav">' +
								'<span class="tv_icon_yellow">'+ getlang('subtitles') +'</span>' +
							'</div>' +
							'<div class="nav">' +
								'<span class="tv_icon_blue">'+ getlang('language') +'</span>' +
							'</div>' + 
							(isset('config.tv.sleep_timer.enabled')?'<div class="nav"><span class="tv_icon_green">'+ getlang('sleep_timer') +'</span></div>':'') +
						'</div>' +
						'<div id="playerControls">' +
							'<div id="playerRwd" class="player-icon-rewind not_tv_cur" onvclick="VOD.rwd(20);"></div>' +
							'<div id="playerPause" class="player-icon-pause not_tv_cur" onvclick="VOD.pause();"></div>' +
							'<div id="playerPlay" class="player-icon-play not_tv_cur" onvclick="VOD.play();"></div>' +
							'<!--<div id="playerStop" class="player-icon-stop" onvclick=""></div>-->' +
							'<div id="playerFfw" class="player-icon-fast-forward not_tv_cur" onvclick="VOD.ffw(20);"></div>' +
						'</div>' +
						'<div id="playerStatus">Default Status</div>' +
						'<div class="playerListWrap">' +
							'<ul id="playerListMenu"></ul>' +
						'</div>' +
						'<div id="playerTime" style="display:none;">00:00:00 / 00:00:00</div>' +
						'<div id="playerTimeline">' +
							'<div id="playerElapsed"></div>' +
							'<div id="playerBullet"></div>' +
						'</div>' +
						'<div id="playerTitle"></div>' +
					'</div>' +
					'<div id="playerSubtitles"></div>'
				);

				// this.player = $('#test_video');
				// this.playerDOM = $('#test_video')[0];
				this.player = new Video();

				this.playerPanel = $('#playerPanel');
				this.playerStatus = $('#playerStatus');
				this.playerListMenu = $('#playerListMenu');
				this.playerTime = $('#playerTime');
				this.playerTimeline = $('#playerTimeline');
				this.playerElapsed = $('#playerElapsed');
				this.playerBullet = $('#playerBullet');
				this.playerTitle = $('#playerTitle');
				this.playerSubtitles = $('#playerSubtitles');

				this.playerPlay = $('#playerPlay');
				this.playerPause = $('#playerPause');

				$('#tv_fullscreen_overlay').hide();
				tv_sel_block('VODplayer');

				this.show();
				this.inited = true;
			}

			if(this.structureAssoc.films[id]['fileUrl']){
				this.playerTitle.html(this.structureAssoc.films[id]['title']);

				//hack $('<div></div>').html(tmp).text()
				this.load(this.structureAssoc.films[id]['fileUrl'].replace(/&amp;/g,'&'), VOD.structureAssoc.films[id]['drm']);
				this.id = id;
			}
		}
	},
	load: function(url, drm){
		this.inited = true;
		this.player.url = url;
		if(drm){
			this.player.drm = drm;
		}
		this.player.play(
			tv_samsung_tizen_mark ? VOD.eventsTizen : VOD.events
		);
	},
	play: function(){
		if (VOD.inited) {
			VOD.player.resume();
			VOD.playerDOM.paused = false;

			VOD.setStatus('Playing');
			VOD.show();
		}
		else {
			if (tv_samsung_mark || tv_mag_mark) {
				VOD.player.start(
					tv_samsung_tizen_mark ? VOD.eventsTizen : VOD.events
				);
			}
			else {
				VOD.player.play();
			}

			VOD.playerDOM.paused = false;
			VOD.show();
		}
	},
	pause: function(){
		VOD.player.pause();
		VOD.playerDOM.paused = true;

		VOD.setStatus('Paused');
		this.show();
	},
	ffw: function(time){

		VOD.hideReset();

		time = time ?
			time < 1000 ?
				time * 1000 :
				time :
			60000;

		this.setTime(time, 'forward');
	},
	rwd: function(time){

		VOD.hideReset();

		time = time ?
			time < 1000 ?
				time * 1000 :
				time :
			60000;

		this.setTime(time, 'backward');
	},
	setTime: function(time, direct){
		var ctx = Object.assign(VOD.player, {
			time: time,
			direct: direct
		});
		_set_play_position_video(ctx);
	},
	saveDataTime: function(time) {
		var data = load_data();

		if(!data['VODdata']){
			data['VODdata'] = {};
		}
		if(!data['VODdata'][VOD.id]){
			data['VODdata'][VOD.id] = {};
		}
		data['VODdata'][VOD.id]['time'] = time;

		save_data(data);
	},
	setStatus: function(status){
		//TODO: Status i18n
		this.playerStatus.html(status);
		this.status = status;
	},
	timeUpdate: function(){
		// если пользователь быстро щелкал play / pause,
		// а потом вышел из просмотра
		// таймер не сбрасывается
		if (!VOD.player.media) {
			return false;
		}

		_get_play_position_video(VOD.player)
			.then(
				function(response) {
					var tmp_time = response | 0;

					if (VOD.cur_time !== tmp_time) {
						VOD.cur_time = tmp_time;
						VOD.player.currentTime = tmp_time;

						VOD.playerTime.show();
						VOD.playerTime.html(toHHMMSS((tmp_time / 1000), true) + ' / ' + toHHMMSS((VOD.duration / 1000), true));

						var tmp = (VOD.playerTimeline.width() * (tmp_time / (VOD.duration | 0)) | 0) - (VOD.playerBullet.width() / 2);
						if (VOD.playBullet_offset !== tmp) {
							VOD.playBullet_offset = tmp;
							VOD.playerBullet[0].style['left'] = tmp + 'px';
							VOD.playerElapsed[0].style['width'] = tmp + (VOD.playerBullet.width() / 2) + 'px';
						}

						//Сохранение места, где смотрели после 5 минут
						if (tmp_time >= 300000 && (tmp_time%10 == 0)) {
							VOD.saveDataTime(tmp_time);
						}
					}
				},
				function(e) {
					tv_log("Error message: " + e.message);
					VOD.progressUpdateOff();
				});
	},
	getDuration: function() {
		var d = $.Deferred();

		_get_duration_video(VOD.player).done(function(response) {
			VOD.duration = response;
			d.resolve();
		});

		return d.promise();
	},
	get_languages: function () {
		var d = $.Deferred();

		_get_media_audio(VOD.player).done(function (languages) {
			d.resolve(languages);
		});

		return d.promise();
	},
	get_subtitles: function () {
		var d = $.Deferred();

		get_media_subtitles(VOD.structureAssoc.films[VOD.id].subtitles)
			.done(function (subtitles) {
				d.resolve(subtitles);
			});

		return d.promise();
	},
	set_language: function (index) {
		_set_media_audio(VOD.player, index);

		VOD.hide();
	},
	set_subtitle: function (url) {
		_set_media_subtitle(VOD.player, url);
		_switch_subtitle(VOD.player, true);

		VOD.hide();
	},
	off_subtitle: function () {
		_switch_subtitle(VOD.player, false);

		VOD.hide();
	},
	show_menu: function (type) {
		VOD.show();

		_get_list(type).done(function (list) {
			VOD.playerTime.hide();
			if (!list) list = '<li class="btn_player_lng">' + getlang('bill_error') + '</li>';

			VOD.playerListMenu.html(list);

			tv_sel_list = $('#playerListMenu [onvclick]');
			tv_cur_pos = 0;
			tv_max_pos = tv_sel_list.length;

			tv_sel_cur();
		});

		function _get_list(type) {
			var d = $.Deferred();

			var tmp = '';
			switch (type) {
				case 'languages':
					VOD.get_languages().done(function (languages) {
						if (!languages) return d.resolve(null);

						for (var i = 0; i < languages.length; i++) {
							var language = languages[i];
							tmp += '<li class="btn_player_lng" onvclick="VOD.set_language('+ i +')">' +
								getTranscription(language) +
							'</li>';
						}

						d.resolve(tmp);
					});
					break;
				case 'subtitles':
					VOD.get_subtitles().done(function (subtitles) {
						if (!subtitles) return d.resolve(null);

						tmp += '<li class="btn_player_lng" onvclick="VOD.off_subtitle()">'+ getlang("off") +'</li>';
						for (var key in subtitles) {
							tmp += '<li class="btn_player_lng" onvclick="VOD.set_subtitle(\''+ subtitles[key] +'\')">' +
								getTranscription(key) +
							'</li>';
						}

						d.resolve(tmp);
					});
					break;
			}

			return d.promise();
		}

		function getTranscription(code) {
			return typeof VOD.dictionary[code] !== 'undefined' ? VOD.dictionary[code].transcription : 'Undefined';
		}
	},
	show: function(){
		this.playerPanel.show();

		if(this.playerDOM.paused){
			this.playerPlay.show();
			this.playerPause.hide();
		}
		else {
			this.playerPlay.hide();
			this.playerPause.show();
		}

		tv_sel_list = $('#playerControls [onvclick]').filter(function() { return $(this).is(':visible'); });
		tv_cur_pos = 1;
		tv_max_pos = tv_sel_list.length;

		tv_sel_cur();

		this.hideReset();

		// if(this.playerVisible === false){
		// 	tv_sel_cur();
		// }
		this.playerVisible = true;
	},
	hide: function(){
		if(this.playerDOM.paused === false){
			clearTimeout(VOD.hideTimer);

			VOD.playerListMenu.html('');
			VOD.playerListMenu.css('left', '0px');
			VOD.playerTime.show();

			this.playerPanel.hide();
			this.playerVisible = false;

			// провеока делается на тот случай, когда панель скрывается
			// а фокус находится на sleepTimer'e || dialog
			if (tv_cur_block === 'VODplayer') {
				$('#tv_cur').hide();
			}
		}
	},
	toggle: function(){
		if(this.playerVisible){
			this.hide();
		}else{
			this.show();
		}
	},
	hideReset: function(){
		clearTimeout(VOD.hideTimer);
		VOD.hideTimer = setTimeout(function(){
			VOD.hide();
		}, 5000);
	},
	events: function(e, data) {
		if (tv_lg_mark) {
			if (e.eventType === 'play_start' && !VOD.duration) {
				playStart();
			}
			else if (e.eventType === 'play_end') {
				playEnd();
			}
			else if (e.eventType === 'file_not_found') {
				playError();
			}
		}
		else if (tv_samsung_mark) {
			if (e === 7 && !VOD.duration) {
				VOD.player.currentTime = 0;
				playStart();
			}
			else if (e === 8) {
				playEnd();
			}
			else if (e === 1) {
				playError();
			}

			if (e === 14) {
				VOD.player.currentTime = data;
			}

			// субтитры
			if (e === 19 && data !== '') VOD.playerSubtitles.html(data);
		}
		else if (tv_mag_mark) {
			switch (e) {
				case '1': // Плеер достиг окончания медиа контента или зафиксировал длительный разрыв потока
					playEnd();
					break;
				case '4': // Начало отображаться видео и/или воспроизводиться звук
					if (!VOD.duration) {
						VOD.player.currentTime = 0;
						playStart();
					}
					break;
				case '5': // Ошибка открытия контента: нет такого контента на сервере или произошёл отказ при соединении с сервером
					playError();
					break;
			}
		}
		// Desktop
		else {
			switch (e.type){
				case 'canplay':
					playStart();
					break;

				case 'timeUpdate':
					VOD.player.currentTime = e.timeStamp;

					break;
			}
		}

		function playStart() {
			VOD.getDuration().done(function() {
				VOD.progressUpdateOn();
				VOD.player.resize();
				VOD.playerDOM.paused = false;

				VOD.setStatus('Playing');

				//Старт на месте, где остановились
				var data = load_data();
				if (data['VODdata'] && data['VODdata'][VOD.id] && data['VODdata'][VOD.id]['time']) {
					VOD.setTime(data['VODdata'][VOD.id]['time'], 'forward');
				}
				VOD.get_languages().done(function (languages) {
					if (!languages) return;

					var index = languages.indexOf(get_language());
					if (index !== -1) VOD.set_language(index);
				});
			});
		}
		function playEnd() {
			VOD.progressUpdateOff();

			VOD.setStatus('Stopped');
			VOD.inited = false;
			VOD.duration = 0;
			VOD.playerDOM.paused = true;
			VOD.show();

			//Стираем место, где остановились
			VOD.saveDataTime(0);
		}
		function playError() {
			VOD.setStatus('Error');
			log.add('Видео не доступно для проигрывания');
		}
	},
	eventsTizen: {
		onbufferingstart: function() {

		},
		onbufferingprogress: function(percent) {
			// console.log("Buffering progress data : " +   percent);
		},
		onbufferingcomplete: function() {
			if (VOD.duration) return;

			VOD.getDuration().done(function() {
				VOD.progressUpdateOn();
				VOD.player.resize();
				VOD.playerDOM.paused = false;

				VOD.setStatus('Playing');

				//Старт на месте, где остановились
				var data = load_data();
				if(data['VODdata'] && data['VODdata'][VOD.id] && data['VODdata'][VOD.id]['time']){
					VOD.setTime(data['VODdata'][VOD.id]['time'], 'forward');
				}

				VOD.get_languages().done(function (languages) {
					if (!languages) return;

					var index = languages.indexOf(get_language());
					if (index !== -1) VOD.set_language(index);
				});
			});
		},
		oncurrentplaytime: function(currentTime) {
			VOD.player.currentTime = currentTime;

			var different = VOD.duration - VOD.player.currentTime;
			if (different < 1000 && different !== 0) {
				_play_end();
			}

			function _play_end() {
				VOD.progressUpdateOff();

				VOD.setStatus('Stopped');
				VOD.inited = false;
				VOD.duration = 0;
				VOD.playerDOM.paused = true;
				VOD.show();

				//Стираем место, где остановились
				VOD.saveDataTime(0);
			}
		},
		onevent: function(eventType, eventData) {
			console.log("Event type error : " + eventType + ", eventData: " + eventData);
		},
		onerror: function(errorData) {
			console.log("Event type error : " + errorData);
			VOD.setStatus('Error');
			log.add('Видео не доступно для проигрывания');
		},
		onsubtitlechange: function(duration, text, data3, data4)   {
			VOD.playerSubtitles.html(text);
		},
		ondrmevent: function(drmEvent, drmData) {
			// console.log("DRM callback: " + drmEvent + ", data: " + drmData);
		}
	},
	destroy: function(){
		var d = $.Deferred();

		VOD.progressUpdateOff();
		VOD.player.destroy(VOD.events).done(function() {
			Media.set({ directType: null });

			var container = $('#container');

			$('#tv_fullscreen_overlay').show();

			VOD.playerDOM.paused = false;
			VOD.playerVisible = false;
			VOD.duration = 0;
			$('#poster-clone').remove();

			container.removeClass('nobg');
			container.removeClass('video');

			container.html(VOD.detachedContent);

			tv_sel_block();

			// костыль для MAG исправляющий растянутый бэкграунд
			if (tv_mag_mark) {
				container[0].style.backgroundImage = 'none';
				setTimeout(function() {
					container[0].style.backgroundImage = '';
				}, 100);
			}
			VOD.inited = false;

			d.resolve();
		});

		return d.promise();
	},
	progressUpdateOn: function(){
		VOD.progressUpdateOff();
		VOD.progressTimer = setInterval(VOD.timeUpdate, 1000);
	},
	progressUpdateOff: function(){
		if(VOD.progressTimer){
			clearInterval(VOD.progressTimer);
			VOD.progressTimer = null;
		}
	}
};

function closeSleepTimerForVOD() {

	tv_cur_block = 'VODplayer';
	active_page = '#movie_page';
	active_page_id = 'movie_page';

	$('#tv_cur').hide();

}
