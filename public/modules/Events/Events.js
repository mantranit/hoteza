var Events = {
	deps: [
		'ServiceCodes'
	],
	init: function(){
		var d = $.Deferred();
		var that = this;

		that.secret = isset('config.secret')||'hoteza';

		ServiceCodes.registerListener({
			'2109': function(){
				var tvids = isset('config.tv.tvids');
				var tvid = Events.TVID();
				if(tvids && tvids[tvid]){
					tvid = tvids[tvid] + ' (' + tvid + ')';
				}else{
					tvid = tvid;
				}
				custom_dialog('info', 'Events', 'Channel: ' + that.channel + '<br>Listening: ' + that.listening + '<br>TVID: ' + tvid);
			},
			'2100': function(){
				Events.TVID(0);
			},
			'2101': function(){
				Events.TVID(1);
			},
			'2102': function(){
				Events.TVID(2);
			},
			'2103': function(){
				Events.TVID(3);
			},
			'2104': function(){
				Events.TVID(4);
			},
			'2105': function(){
				Events.TVID(5);
			},
			'2106': function(){
				var tmp = '';
				var tvids = isset('config.tv.tvids').slice(0);
				var cur_tvid = Events.TVID()||0;

				tmp += '<div id="custom_dialog_buttons_wrapper">';
				for(var key in tvids){
					if(key == cur_tvid){
						tvids[key] = '&rarr; ' + tvids[key] + ' &larr;';
					}
					tmp += '<div class="button" style="padding-left:10px;padding-right:10px;box-sizing: border-box;" onvclick="Events.TVID(' + key + ')">' + tvids[key] + '</div>';
				}
				tmp += '</div><br>';
				custom_dialog('info', 'TVID Setup', tmp, '');
				//$('#custom_dialog_ok').remove();

			}
		});

		that.registerListener('sys', that.process_cmd);

		if(storage.getItem('room')){
			this.channel = 'hotel' + get_hotelId() + 'room' + storage.getItem('room');
			this.listen();
			d.resolve();
		}else{
			log.add('Events: init without room#');
			d.reject();
		}

		return d.promise();
	},

	listeners: {
		'rc': function(obj){
			Events.rc_sys_listener(obj);
		}
	},
	registerListener: function(cat, func){
		//check exists
		if(!cat){
			log.add('Events: category cannot be empty');
			return false;
		}
		if((cat in this.listeners) && cat != 'rc'){
			//TODO: добавление в список?
			log.add('Events: event already watched ' + cat);
			return false;
		}
		//---

		if(typeof(func) === 'function'){
			this.listeners[cat] = func;
			return true;
		}
		return false;
	},
	evaluate: function(cmd){
		if (cmd.ch !== '' && cmd.ch != this.TVID()) {
			// not for me
			return false;
		}

		if(cmd.cat in this.listeners){
			try{
				this.listeners[cmd.cat](cmd);
			}catch(e){
				log.add('Events: error executing callback event ' + cmd.cat);
			}
			return true;
		}else{
			log.add('Events: received unregistered event [' + cmd.cat + ']');
		}

	},
	fallbacks: [],
	fallback_timer: null,
	registerFallback: function(func, time){
		if(!time){
			time = 30;
		}
		if(typeof(func) === 'function'){
			this.fallbacks.push({func: func, time: time});
			return true;
		}else{
			log.add('Events: Bad fallback registration');
			console.log();
			return false;
		}
	},
	_runFallbacks: function(){
		var time = (Date.now()/1000)|0;
		for(var i in this.fallbacks){
			var mod = (this.fallbacks[i].time|0)||30;
			if(time%mod == 0){
				var func = this.fallbacks[i].func;
				if(typeof(func) == 'function'){
					func();
				}
			}
		}
		return true;
	},
	startFallbacks: function(){
		if(this.fallback_timer){
			log.add('Events: cannot start fallbacks');
			return false;
		}else{
			this.fallback_timer = setInterval(function(){
				Events._runFallbacks();
			}, 1000);
			return true;
		}
	},
	stopFallbacks: function(){
		if(this.fallback_timer){
			clearInterval(this.fallback_timer);
			this.fallback_timer = null;
			return true;
		}else{
			log.add('Events: cannot stop fallbacks');
			return false;
		}
	},
	channel: 'undef',
	secret: 'hoteza',
	TVID: function(id){
		if(typeof(id) === 'undefined'){
			return storage.getItem('TVID')||'0';
		}

		id = id|0;
		if(id){
			var tvids = isset('config.tv.tvids');
			if(tvids && tvids[id]){
				custom_dialog('info','TVID Setup', 'TVID set to ' + tvids[id] + ' (' + id + ')');
			}else{
				custom_dialog('info','TVID Setup', 'TVID set to ' + id + ' (unknown)');
			}
		}else{
			custom_dialog('info','TVID Setup', 'TVID unset');
		}
		this._TVID(id);
	},
	_TVID: function(id){
		id = id|0;
		if(id){
			storage.setItem('TVID',id);
		}else{
			storage.removeItem('TVID');
		}
	},

	listening: false,
	listener: null,
	last_msg: {'tag':0, 'time':0},
	listen: function (reinit){
		var that = this;
		if(that.listening){
			if(reinit){
				that.listener.abort();
				that.listener = null;
			}else{
				log.add('Events: already listening');
				return false;
			}
		}
		that.listening = true;
		var queue_tag_time = '?tag=' + this.last_msg.tag + '&time=' + this.last_msg.time;
		that.listener = $.ajax({
			url: isset('config.queue_url') + 'subv2/' + that.channel + 'T' + queue_tag_time,
			async: true,
			timeout: 60000,
			success: function(data){
				that.listening = false;
				var msg;
				for(var key in data){
					msg = data[key].text;
					if(msg){
						try{
							msg = GibberishAES.dec(msg.c, that.secret);
							var obj = JSON.parse(msg);
							//TODO: разбор по подпискам cat
							if(obj && obj.cat){
								that.debug('recv cmd: ' + obj.cmd + ' for ' + obj.cat);
								that.evaluate(obj);
							}else{
								//log.add('RC: not for me');
							}
						}catch(e){
							log.add('Events: msg bad key');
						}
						that.last_msg = {
							'tag': data[key].tag,
							'time': data[key].time
						};
					}
				}
				that.listen();
			},
			dataType: 'json'
		}).fail(function(err, msg1, msg2){
			that.listening = false;
			if(msg1 == 'timeout'){
				//TODO: Progressive time
				log.add('Events: timeout');
				that.listen();
			}else{
				setTimeout(function(){
					that.listen();
				}, 60000);
				log.add('Events: No connection: ' + err.status + '|' + err.statusText + ' ' + msg1);
			}
		});
	},
	ws: null,
	listen_ws: function (reinit){
		var that = this;
		if(that.listening){
			if(reinit){
				that.ws.close();
			}else{
				log.add('EVWS: already listening');
				return false;
			}
		}
		var queue_tag_time = '?tag=' + this.last_msg.tag + '&time=' + this.last_msg.time;
		that.ws = new WebSocket('wss://' + (isset('config.queue_url').replace(/^https?:\/\//, '')) + 'subws/' + that.channel + 'T' + queue_tag_time);
		that.ws.onopen = function(evt) {
			that.listening = true;
			log.add('EVWS: Connected');
			console.log(evt);
		};
		that.ws.onclose = function(evt) {
			that.listening = false;
			log.add('EVWS: CLOSE ' + evt.reason);
			console.log(evt);
		};
		that.ws.onmessage = function(evt) {
			try{
				data = JSON.parse(evt.data);
			}catch(e){
				log.add('WS: JSON parsing gone wrong: ' + data);
				return false;
			}

			var msg = data.text;
			if(msg){
				try{
					msg = GibberishAES.dec(msg.c, that.secret);
					var obj = JSON.parse(msg);
					//TODO: разбор по подпискам cat
					if(obj && obj.cat){
						that.evaluate(obj);
					}else{
						//log.add('RC: not for me');
					}
				}catch(e){
					log.add('Events: msg bad key');
				}
				that.last_msg = {
					'tag': data[key].tag,
					'time': data[key].time
				};
			}

		};
		that.ws.onerror = function(evt) {
			that.listening = false;
			log.add('EVWS: ERROR');
			console.log(evt);
		};

	},
	//TODO: category ???
	send: function(cmd, data){ //cmd, data - string
		var that = this;
		if(typeof(data) == 'undefined'){
			data = '';
		}
		var tmp = GibberishAES.enc(
			JSON.stringify ({
				'cat': 'rc',
				'room': storage.getItem('room'),
				'ch': that.TVID()||'',
				'cmd': cmd,
				'data': data||''
			}), that.secret
		);
		//TODO: local queue url?
		$.post(
			isset('config.queue_url') + 'pub/?id=' + that.channel + 'R',
			JSON.stringify ({'c': tmp})
		);
		//Дублирование комманд на широковещательный канал отеля
		$.post(
			isset('config.queue_url') + 'pub/?id=hotel'+get_hotelId(),
			JSON.stringify ({'c': tmp})
		);
		this.debug('sent cmd: ' + cmd + (data?(' ' + JSON.stringify(data)):''));
	},
	process_cmd: function(obj){
		//TODO: вынести проверку TVID
		if(!obj.ch || (obj.ch && obj.ch == Events.TVID())){
			switch(obj.cmd){
				case 'checkin':
				case 'reauth':
					log.add('Events: checkin');
					switch(isset('config.tv.checkin_action')){
						case 'ignore':
							log.add('Events: ignore checkin (wait for reboot)');
							break;
						default:
							tv_auth();
							break;
					}
					break;
				case 'checkout':
					log.add('Events: checkout');
					switch(isset('config.tv.checkout_action')){
						case 'reload':
							reload_app();
							break;
						case 'restart':
							tv_reboot();
							break;
						case 'poweroff':
							tv_poweroff();
							break;
						default:
							tv_auth();
							break;
					}
					break;
				case 'content_update':
					log.add('Events: content_update');
					reload_app();
					break;
				case 'restart':
					log.add('Events: restart');
					reload_app();
					break;
				case 'getstate':
					Events.send('state', JSON.stringify(tv_get_state()));
					break;
				case 'parental_lock_disable':
				case 'pin_reset':
					parental_lock_disable(true);
					break;
				case 'wol':
					tv_power()
					.done(function(power_status){
						if(power_status){
							//Получение команд от сервера (может там будильник)
							tv_get_server_commands();
						}else{
							tv_poweron();
						}
					})
					.fail(function(){
						tv_poweron();
					});
					break;
				case 'poweroff':
					tv_poweroff();
					break;
				default:
					log.add('Events: unknown sys event ' + obj.cmd);
					break;
			}
		}
	},
	debugging: false,
	debug_on: function(){
		this.debugging = true;
	},
	debug_off: function(){
		this.debugging = false;
	},
	debug: function(data){
		if(this.debugging){
			console.log('Events: ' + data);
		}
	},

	//Хак для использования встроенных функций без модуля RemoteControl
	rc_sys_listener: function(obj){
		switch(obj.cmd){
			case 'reload':
				_tv_bg_restore();
				reload_app();
				break;
			case 'ping':
				Events.send('pong');
				break;
			case 'discover':
				var tmp = {'ip': tv_ip, 'mac': tv_mac, 'manufacturer': tv_manufacturer, 'TVID':(Events.TVID()|0)};
				if(tv_virtual_standby_state){
					tmp.status = 'standby';
				}
				Events.send('discovered' , JSON.stringify(tmp));
				log.add('Events: discovered');
				break;
			case 'remotedebug':
				weinre_debug();
				break;
			default:
				console.log('Events: unknown [' + obj.cat + ':' + obj.cmd + ']');
				break;
		}
		return true;
	}

};
