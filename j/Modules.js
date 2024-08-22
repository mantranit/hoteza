//TODO: add and render templates
var Modules = {
	modules_list: [],
	modules_loaded: [],
	modules_not_loaded: [],
	modules_inited: [],
	modules_deferred: [],
	modules_not_inited: [],
	deferred: null,
	start_time: null,
	modules_stats: {},
	load: function(name){
		var that = this,
			d = $.Deferred();

		if(that.modules_loaded.indexOf(name) !== -1){
			log.add('MODULES: duplicate load of module ' + name);
			d.resolve();
			return d.promise();
		}

		that.modules_stats[name] = {start: Date.now()};

		$.cachedScript('modules/' + name + '/' + name + '.js?v=' + version.v)
		.done(function(){
			that.modules_stats[name].load = (Date.now() - that.modules_stats[name].start);
			that.modules_loaded.push(name);
			log.add('MODULES: loaded ' + name);
			that.init(name)
			.done(function (async_status) {
				if(async_status){
					that.modules_stats[name].async = true;
				}
				that.modules_stats[name].init = (Date.now() - that.modules_stats[name].start - that.modules_stats[name].load);
				that.modules_inited.push(name);
				d.resolve();
			})
			.fail(function (err) {
				that.modules_stats[name].init = false;
				that.modules_not_inited.push(name);
				log.add('MODULES: ERROR init ' + name + ': ' + err);
				d.resolve('init err: ' + err);
			});
		})
		.fail(function(err, status, error){
			that.modules_stats[name].load = false;
			that.modules_not_loaded.push(name);
			log.add('MODULES: ERROR loading ' + name + ': ' + error);
			d.resolve('load err');
		});
		return d.promise();
	},
	load_all: function(){
		var that = this,
			d = $.Deferred();
		this.start_time = Date.now();

		//TODO: наполнение modules исходя из настроек? напр. rcu.enabled = true
		//TODO: разрешение конфликтов?

		//Core Modules
		this.modules_list = [
			'SVG',
			'Information',
			'Analytics',
			'Stat',
			'ServiceCodes',
			'Events',
			'Media',
			'VirtualScroll',
			'tv_mosaic',
			'Services',
			'Epg',
			'Loader',
			'CustomNotification',
			'Apps',
			'Menu',
			'Messages'
		];

		var modules_config = isset('config.modules');
		if (modules_config && modules_config.length) {
			this.modules_list = this.modules_list.concat(modules_config);
		}

		this.modules_list = deleteDisableModulesFromList(this.modules_list);

		log.add('MODULES: loading ' + this.modules_list.length + ' modules');

		var promises = [];
		$(this.modules_list).each(function(index, name){
			promises.push(function(){
				return Modules.load(name);
			});
		});

		chain_promises(promises)
		.progress(LPBar.start_progress)
		.done(function(r){
			log.add('MODULES: all loaded in ' + (Date.now() - that.start_time) + 'ms');
			LPBar.start_end();
			d.resolve();
		})
		.fail(function(e){
			console.log('ERR', e);
			d.reject();
		});

		return d.promise();
	},
	init: function(name){
		var that = this,
			d = $.Deferred();

		var tmp = window[name];
		if(typeof(tmp) == 'object'){

			if(typeof(tmp.init) == 'function'){
				try{
					var init = tmp.init();
					//Разделение инициализации асинхронных Модулей (можно просто заменить на when?)
					if(init && (typeof(init.done) === 'function')){
						init
						.done(function(){
							//TODO: перенести логирование выше, в load
							log.add('MODULES: inited ' + name + ' async');
							d.resolve(true);
						})
						.fail(function(){
							log.add('MODULES: init ' + name + ' failed');
							d.reject('fail');
						});
						//таймаут ожидания инициализации Модуля
						setTimeout(function(){
							d.reject('timeout');
						}, 5000);
					}else{
						//TODO: перенести логирование выше, в load
						log.add('MODULES: inited ' + name);
						d.resolve();
					}
				}catch(e){
					d.reject('init error: ' + e);
				}
			}else{
				d.reject('no init');
			}

		}else{
			d.reject('not an object');
		}

		return d.promise();
	}
};
