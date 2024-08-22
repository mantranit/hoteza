var ScandicWelcome = {
	deps: [],
	init: function() {
		var d = $.Deferred();

		css_append('modules/ScandicWelcome/style.css');

		loadTemplate('modules/ScandicWelcome/scandicWelcome.html')
			.done(function() {
				d.resolve();
			});

		$(HotezaTV).on('auth', function(){
			tv_set_welcome_guest_greeting_v2();
		});
		return d.promise();
	},
	open: function () {
		ScandicWelcome.render().done(function () {
			tv_keydown_override = ScandicWelcome.server_keydown;

			//Убрано условине по типу. логика в getChannelForWelcome
			var tune = getChannelForWelcome();
			if (tune) {
				channelShow();
			}

			var tmp_vol = (isset('config.tv.welcome_screen.volume')||0);
			tv_set_volume(tmp_vol);

			if (scandic_menu) {
				setWelcomeVsMenu();
			}

			$('#tv_fullscreen_btns').show();

			if($id('splashscreen')){
				setTimeout(function(){
					delete_splash();
					tv_sel_block('tv_welcome');
				}, 2000);
			}else{
				tv_sel_block('tv_welcome');
			}
		});

		function channelShow() {
			var tune = getChannelForWelcome();

			_tv_bg_prepare();
			_tv_channel_show(tune);
			setVideoSize();

		}
	},
	close: function () {
		var d = $.Deferred();

		var type = tv_welcome_getData().type;
		if ( type == 'channel' || type == 'udp') {
			_tv_channel_stop();
			d.resolve();
		}
		else {
			videoCollection.destroy().done(function () {
				_player_shutdown().done(function () {
					clip(null);
					d.resolve();
				});
			});
		}

		//document.getElementById('tv_fullscreen_overlay').style.zIndex = '';

		return d.promise();
	},
	render: function () {
		var d = $.Deferred();
		var fullscreenOverlay = $('#tv_fullscreen_overlay');

		// когда не входили в Хотезу
		// система все время была на Welcome
		if (document.getElementById('tv_welcome')) {
			return d.resolve();
		}

		fullscreenOverlay.before(templates_cache['scandicWelcome'].render(tv_welcome_getData()));

		tv_set_welcome_guest_greeting_v2();

		d.resolve();
		return d.promise();
	},
	server_keydown: function (e) {
		if (!e) {e = event;}
		var code = (e.keyCode ? e.keyCode : e.which);

		//Обработка shift для MAG
		if(e.shiftKey){
			code = 'S'+code;
		}

		switch(code){
			case tv_keys.RED:
				tv_welcome_hide().done(function () {
					tv_mode();
				});
				break;
			case tv_keys.BLUE:

				tv_welcome_hide().done(function () {
					if (scandic_menu) {
						document.getElementById('tv_fullscreen_welcome_big').style.display = '';
					}
					navigate('#language_select');
				});

				break;

			case tv_keys.ENTER:
				tv_ok();
				if(e.stopPropagation){
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

			case tv_keys.INPUT:
				tv_welcome_hide();
				navigate('#sources_page');
				break;

			default:
				break;

		}
	}
};
