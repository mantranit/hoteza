var RemoteControl = {
	deps: [
		'ServiceCodes',
		'Events'
	],
	init: function(){
		var that = this;

		Events.registerListener('rc', that.process_cmd);
	},

	touch_timer: 0,
	process_cmd: function(obj){
		CustomNotification.rcCheck(obj.cmd);

		switch(obj.cmd){
			case 'key':
				try{
					tv_keydown({keyCode:tv_keys[obj.data]});
				}catch(e){
					log.add('RC: error during press');
				}
				break;
			case 'connect':
				if(!$id('RemoteControl_icon')){
					$('#tv_fullscreen_overlay').append('<div class="ui-icon-remote remote-icon" id="RemoteControl_icon"></div>');
				}
				$('#RemoteControl_icon').animate({'top':'0px'});
				break;
			case 'disconnect':
				$('#RemoteControl_icon').animate({'top':'-100px'});
				break;
			case 'volup':
				_tv_volup();
				break;
			case 'voldown':
				_tv_voldown();
				break;
			case 'mute':
				_tv_mute();
				break;
			case 'channel':
				var timeout = 0;
				if(!fullscreen){
					if (tv_cur_block === 'tv_welcome') {
						tv_welcome_hide().done(tv_mode);
					}
					else {
						tv_mode();
					}
					timeout = 4000;
				}

				setTimeout(function () {
					var channel = getChannelIndex(obj.data.id),
						type = obj.data.type;
					if (typeof channel === 'undefined') {
						return false;
					}

					tv_channellist_show();
					tv_channel_show(channel);

					if (typeof channel === 'number') {
						if (tv_channellist_type  === 'mosaic') {
							tv_mosaic.channel(channel, type);
							return true;
						}

						tv_cur_pos = channel;
						tv_sel_cur();
					}
				}, timeout);
				break;
			case 'setvolume':
				tv_set_volume(parseInt(obj.data.value));
				break;
			case 'power':
				Events.send('power_switch');
				get_power_state().done(function (state) {
					if(state){
						_tv_poweroff();
					} else {
						_tv_poweron();
					}
				});
				break;
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
				log.add('RC: discovered');
				break;
			case 'touch':
				var coords = obj.data.split(':');
				if(!$id('tv_touch')){
					$(document.body).append('<div id="tv_touch" style="position:absolute;left:0px;top:0px;-webkit-transform: translateZ(0);z-index:9998;width:20px;height:20px;border-radius:20px;border:2px solid rgba(255,255,255,0.7);background:rgba(0,0,0,0.4);-webkit-transition:all 100ms linear;margin: -12px 0px 0px -12px;"></div>');
				}
				var x = ww*coords[0];
				var y = wh*coords[1];
				$id('tv_touch').style.left = x + 'px';
				$id('tv_touch').style.top = y + 'px';
				if(this.touch_timer){
					clearTimeout(this.touch_timer);
					this.touch_timer = 0;
				}
				this.touch_timer = setTimeout(function(){
					$('#tv_touch').hide(300, function(){$(this).remove();});
				}, 3000);

				//Element from list
				for(var i=0; i<tv_sel_list.length; i++){
					var tmp = $.data(tv_sel_list[i]);
					if((x > tmp.left && x < (tmp.left + tmp.width)) && (y > tmp.top && y < (tmp.top + tmp.height))){
						tv_cur_pos = i;
						tv_sel_cur();
					}
				}

				break;
			case 'remotedebug':
				weinre_debug();
				break;
			case 'get_sleep_timer':
				Events.send('sleep_timer_data', sleep_timer.get());
				break;
			case 'sleep_timer':
				if (obj.data) {
					custom_info(getlang('tv_switch_off_info', obj.data / 1000 / 60));
					setTimeout(custom_dialog_close, 10 * 1000);
				}

				sleep_timer.set(obj.data, true);

				if(!$id('RemoteControl_icon')){
					$('#tv_fullscreen_overlay').append('<div class="ui-icon-clock remote-icon" id="RemoteTimer_icon"></div>');
				}
				$('#RemoteTimer_icon').animate({'top':'0px'});

				setTimeout(function () {
					$('#RemoteTimer_icon').animate({'top':'-100px'});
				}, 2000);
				break;
			case 'get_channels':
				sendChannelsToMobile();
				break;
			default:
				log.add('RC: unknown cmd ' + obj.cmd);
				log.add('Data: ' + obj.data);
				break;
		}

		return true;
	}

};
