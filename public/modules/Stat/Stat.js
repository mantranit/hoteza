var Stat = {
	deps: [],
	_channels_periods: {
		collector: 5*T_SEC,
		saver: 5*T_MIN,
		reporter: 1*T_HOUR
	}, 
	url: isset('config.stat_url'),
	init: function(){
		var that = this;
		$(HotezaTV).one('final', function(){
			//TODO: check values
			var tmp = HotezaTV.metrics;
			if(tmp.system && tmp.modules && tmp.splash && tmp.final){
				if(!tmp.was_standby){
					Stat._load_time = tmp.final/1000;
					tmp.final -= tmp.splash;
				}else{
					Stat._load_time = (tmp.final + tmp.splash)/1000;
					tmp.final = tmp.final;
				}
				tmp.splash -= tmp.modules;
				tmp.modules -= tmp.system;
			}else{
				log.add('Stat: no accurate load metrics');
				Stat._load_time = time.uptime()/1000;
			}
			setTimeout(function(){
				var start = Date.now();
				that.report_load()
				.done(function(){
					log.add('STAT: load post success in ' + (Date.now()-start) + 'ms');
				})
				.fail(function(err){
					log.add('STAT: load post failed: ' + err);
				});
			}, 10*T_SEC);

			var stat;
			try{
				stat = storage.getItem('stat_channels')||'{}';
				stat = JSON.parse(stat);
			}catch(e){
				stat = {};
			}
			Stat._channels = stat;

			setInterval(function(){Stat.stats_collector();}, Stat._channels_periods.collector);
			setInterval(function(){Stat.stats_saver();}, Stat._channels_periods.saver);
			setInterval(function(){Stat.stats_reporter();}, Stat._channels_periods.reporter);

			setTimeout(function(){Stat.stats_reporter();}, 5*T_MIN);
		});
	},
	_load_time: false,
	report_load: function(){
		var that = this;
		var d = $.Deferred();
		if(Stat._load_time){
			$.post(
        //TODO: переместить общие данные в отдельное место
        "https://18eb-58-187-184-107.ngrok-free.app/api/v1/load",
        {
          region: get_hotelRegion(),
          hotelId: get_hotelId(),
          room: storage.getItem("room"),
          manufacturer: tv_manufacturer,
          model: _tv_get_info.model(),
          data: Stat._load_time,
          fulldata: isset("HotezaTV.metrics"),
        }
      )
        .done(function (data) {
          var error;
          if (data.error) {
            d.reject(data.error);
          } else {
            d.resolve(data);
          }
        })
        .fail(function (err) {
          d.reject("Server error");
        });
		}else{
			d.reject('No time');
		}
		return d.promise();
	},
	report_channels: function(){
		var metrics = Object.keys(isset('Stat._channels', {})).length;
		if(metrics){
			var url = "https://18eb-58-187-184-107.ngrok-free.app/api/v1/channels";
			$.post(
				url,
				{
					region: get_hotelRegion(),
					hotelId: get_hotelId(),
					room: tv_room,
					data: Stat._channels
				}
			)
			.done(function(data){
				switch(data.result){
					case 0:
						log.add('Stat: reported channels, ' + metrics + ' metrics');
						Stat._channels = {};
						Stat.stats_saver();
						break;
					default: 
						log.add('Stat: error reporting channels "' + data.error + '" ' + metrics + ' metrics');
						break;
				}
			})
			.fail(function(err){
				log.add('Stat: failed to report channels (' + err.status + '|' + err.statusText + ') ' + metrics + ' metrics');
			});
		}else{
			// log.add('Stat: no channels to report');
		}
	},
	stats_collector: function(){
		if(tv_cur_block !== 'tv_channellist' && tv_cur_block !== 'channel'){
			return false;
		}
		var date_now = new Date(time.now(true));
		var date = new Date(date_now.getUTCFullYear(), date_now.getUTCMonth(), date_now.getUTCDate(), date_now.getUTCHours()).getTime()/1000;

		var channel_id = getChannels()[tv_cur_channel].id;
		if(!this._channels[date]){
			this._channels[date] = {};
		}
		if(!this._channels[date][channel_id]){
			this._channels[date][channel_id] = 0;
		}
		//TODO: actual elapsed time
		this._channels[date][channel_id] += this._channels_periods.collector/T_SEC|0;
	},
	stats_saver: function(){
		//TODO: check data size
		storage.setItem('stat_channels', JSON.stringify(Stat._channels));
	},
	stats_reporter: function(){
		this.report_channels();
	},
	_channels: {}
};
