var ServiceCodes = {
	deps: [],
	init: function(){
	},

	listeners: {},
	registerListener: function(code, func){
		//bulk registration, object
		if(typeof(code) === 'object'){
			for(var i in code){
				this.registerListener(i, code[i]);
			}
			return true;
		}
		//---

		//check exists
		if(code in this.listeners){
			log.add('ServiceCodes: error code exists ' + code);
			return false;
		}
		//---

		if(code != (code|0)){
			log.add('ServiceCodes: error non numeric code ' + code);
			return false;
		}
		if(code.length !== 4){
			log.add('ServiceCodes: error length of code ' + code);
			return false;
		}
		if(typeof(func) === 'function'){
			this.listeners[code] = func;
			return true;
		}
		return false;
	},
	evaluate: function(code){
		if(isset('config.tv.service_codes_lock')){
			log.add('ServiceCodes: can\'t execute, LOCKED');
			return false;
		}

		if(code in this.listeners){
			try{
				this.listeners[code]();
			}catch(e){
				log.add('ServiceCodes: error executing callback code ' + code);
				log.add(e);
				l(e);
			}
			return true;
		}

		//Old mechanism
		if(code === '1105'){
			tv_configure();
		}
		else if(code === '1106'){
			storage.removeItem('token');
			tv_log('Guest token cleared');
		}else if(code === '1120'){
			$('#tv_fullscreen_weather').html('???');
			tv_weather();
		}else if(code === '1130'){
			try{
				Apps.miracast();
			}catch(e){
				log.add('Miracast/WiDi failed');
			}
		}else if(code === '1133'){
			try{
				_tv_sources();
			}catch(e){
				log.add('Sources List failed');
			}
		}else if(code === '1134'){
			try{
				_tv_sources(true);
			}catch(e){
				log.add('Sources List failed');
			}
		}else if(code === '1135'){
			tv_welcome();
		}else if(code === '1136'){
			tv_welcome_hide();
		}else if(code === '1137'){
			try{
				navigate('#sources_page');
			}catch(e){
				log.add('Sources Page List failed');
			}
		}else if(code === '1138'){
			try{
				//TODO: not inplemented yet
				navigate('#sources_page_all');
			}catch(e){
				log.add('Sources Page List failed');
			}
		}else if(code === '1150'){
			//Classic menu
		}else if(code === '1151'){
			//Metro menu
			build_metro_menu();
		}else if(code === '1165'){
			CONFIG.test();
		}else if(code === '1171'){
			weinre_debug_on();
		}else if(code === '1172'){
			weinre_debug_off();
		}else if(code === '1175'){
			if (storage.getItem('hhurl')) {
				document.location = storage.getItem('hhurl') + '#del';
			}else{
				custom_alert('HOTEZA HUB: not on hub');
				log.add('HOTEZA HUB: not on hub');
			}
		}else if(code === '1191'){
			window._log_show = true;
			tv_log('+');
		}else if(code === '1199'){
			window._log_show = false;
			tv_log('-');
		}else if(code === '1666'){
			fire_alarm();
		}else if(code === '1777'){
			tv_log(perfs());
		}else if(code === '1800'){
			//Загрузка модуля Тестов
			if(typeof(Tests) == 'undefined'){
				Loader.start();
				Modules.load('Tests')
				.done(function(){
					Loader.stop();
				});
			}else{
				Tests.open();
			}
		}else if(code === '1801'){
			UI.build_page({
				id: 'pincode',
				title: ' ',
				content: '<div style="font-size:72px;line-height:initial;text-align:center;margin-top:100px;">PINCODE<br/>' + pincode() + '</div>'
			});
			navigate('#pincode');
		}else if(code === '100'){
			_tv_bg_restore();

			reload_app();

		}else if(code === '101'){
			//CSS reload
			$(document.head)
			.find('link')
			.each(function(){
				$(this).attr(
					'href',
					$(this).attr('href').replace(/\?.+$/, '') + '?_='+Math.random()
				);
			});

		}else if(code === '102'){
			tv_reboot();
		}else if(code === '103'){
			tv_poweroff();
		}else if(code === '110'){
			if($id('customization_css')){
				//Customization remove
				$('#customization_css').remove();
				$('#customization_css_old').remove();
			}else{
				css_append('custom/config.css?_='+Math.random(), 'customization_css');
			}
		}
	}
};
