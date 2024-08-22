function VideoCollection() {
	var self = this;
	self.container = [];
	self.playing = false;
	self.deleting = false;

	self.add = function(key, video) {
		var has = false;
		for (var i = 0; i < self.container.length; i++) {
			if (Object.keys(self.container[i]).indexOf(key) !== -1) {
				has = true;
			}
		}

		if (!has) {
			var o = {};
			o[key] = video;
			self.container.push(o);
		}

		Media.set({ directType: 'video' });
	};
	self.start = function() {
		if (self.container.length === 0) {
			return false;
		}

		var currentPage = isGetVideoPage(),
			key;

		if (!currentPage) {
			return self.destroy();
		}

		if (!self.playing) {
			if (self.container.length === 1) {
				if (typeof self.container[0][currentPage] === 'undefined') {
					return self.destroy();
				}

				self.container[0][currentPage].play();
				self.playing = true;
			}
			else if (self.container.length === 2) {
				self.container = [];
				var video = new Video(currentPage);
				self.add(currentPage, video);
				self.play();
			}
		}
		else {
			if (self.container.length === 1) {
				key = videoCollection.get().page;

				if (key.indexOf(currentPage) === -1) {
					self.container[0][key].pause();
				}
				else {
					self.container[0][key].resume();
				}
			}
			else if (!self.deleting) {
				self.deleting = true;
				var index;

				for (var i = 0; i < self.container.length; i++) {
					var item = self.container[i];
					key = Object.keys(item)[0];

					if (key.indexOf(currentPage) !== -1) {
						index = i;
					}
				}

				var deletedIndex = index ? index - 1 : index + 1,
					deletedVideo = self.container[deletedIndex][Object.keys(self.container[deletedIndex])[0]];
				if (!self.container[index][currentPage].started) {

					if (!deletedVideo.started) {
						self.container[index][currentPage].play();
						self.container.splice(deletedIndex, 1);
						self.deleting = false;
						return;
					}

					deletedVideo.destroy().done(function() {
						var newCurrentPage = isGetVideoPage();

						if (currentPage === newCurrentPage) {
							self.container[index][currentPage].play();
							self.container.splice(deletedIndex, 1);
							self.deleting = false;
						}
						else {
							self.container.splice(deletedIndex, 1);
							self.add(newCurrentPage, new Video(newCurrentPage));

							self.deleting = false;
							self.start();
						}
					});
				}
				else {
					self.container.splice(deletedIndex, 1);
					self.deleting = false;
				}
			}
		}

	};
	self.destroy = function() {
		var d = $.Deferred();

		if (!self.deleting) {
			self.deleting = true;

			if (self.container.length) {
				var key = Object.keys(self.container[0])[0];

				if (self.container[0][key].started) {
					self.container[0][key].destroy().done(function() {
						self.container = [];
						self.playing = false;
						self.deleting = false;
						d.resolve();
					});
				}
				else {
					self.container = [];
					self.deleting = false;
					d.resolve();
				}
			}
			else {
				self.deleting = false;
				d.resolve();
			}

			Media.set({ directType: null });
		}

		return d.promise();
	};
	self.get = function() {
		if (self.container.length === 0) {
			console.log('Video collection is empty');
			return null;
		}
		if (self.container.length > 1) {
			console.log('Something wrong. Video collection more than one');
			return null;
		}

		return self.container[0][Object.keys(self.container[0])[0]];
	};

}
function Video(page) {

	var self = this;
	self.page = page;
	self.paused = false;

	this.getVideo = function() {
		if (tv_cur_block === 'VODplayer') {
			return self.container = document.getElementById('container');
		}
		if (
			active_page_id === 'wakeup' &&
			tv_cur_block !== 'menu'
		) {
			return self.container = document.getElementById('wakeup');
		}

		var to = document.getElementById(this.page);
		if (!to) {
			return false;
		}

		self.container = to.dataset.videoSrc ? to : to.querySelector('[data-video-src]');
		if (
			tv_lg_mark ||
			tv_samsung_mark ||
			tv_mag_mark ||
			tv_philips_mark ||
			(
				!tv_amino_mark &&
				!tv_philips_mark
			)
		) {
			return self.container;
		}
		else {
			return false;
		}

	};
	this.getUrl = function(){

		if (!this.getVideo() && tv_cur_block !== 'VODplayer') {
			return false;
		}
		else if (tv_cur_block === 'VODplayer') {
			return this.url;
		}
		return this.url = self.container.dataset.videoSrc;

	};
	this.play = function(listener) {

		var ctx = Object.assign(self, {
			url: self.getUrl(),
			loop: true,
			eventListener: listener ? listener : self.eventListener
		});

		if(this.drm){
			ctx.drm = this.drm;
		}

		_player_play(ctx);

	};
	this.resize = function() {

		var ctx = Object.assign({}, self, {coords: self.container.getBoundingClientRect()});
		_player_resize(ctx);

	};
	this.pause = function() {
		if (self.paused) {return;}

		_player_pause(self);

	};
	this.resume = function() {

		clip(self.container, self.page);
		_player_resume(self);

	};
	this.stop = function() {
		var d = $.Deferred();

		_player_stop(self).done(d.resolve);

		return d.promise();
	};
	this.destroy = function(listener) {
		var d = $.Deferred();

		managePoster(true);
		clip(null);
		var ctx = Object.assign(self, {
			eventListener: listener ? listener : self.eventListener
		});

		_player_destroy(ctx).done(d.resolve);

		return d.promise();
	};

	this.eventListener = (function () {
		var eventListenerSamsungTizen = {
			onbufferingstart: function() {
				// console.log("Buffering start.");
			},
			onbufferingprogress: function(percent) {
				// console.log("Buffering progress data : " +   percent);
			},
			onbufferingcomplete: function() {
				playStart();
			},
			oncurrentplaytime: function(currentTime) {
				// console.log("Current playtime: " + currentTime);
			},
			onevent: function(eventType, eventData) {
				// console.log("Event type error : " + eventType + ", eventData: " + eventData);
			},
			onerror: function(errorData) {
				// console.log("Event type error : " + errorData);
				if (videoCollection.get()) {
					playError();
				}
			},
			onsubtitlechange: function(duration, text, data3, data4)   {
				// console.log("Subtitle Changed.");
			},
			ondrmevent: function(drmEvent, drmData) {
				// console.log("DRM callback: " + drmEvent + ", data: " + drmData);
			},
			onstreamcompleted: function() {
				if(Vendor.get() == 'tizen_tep'){
					if(videoCollection.get().loop){
						webapis.avplay.stop();
						webapis.avplay.prepareAsync(function(){
							webapis.avplay.play();
						});
					}
				}
				//console.log("Stream Completed");
			}
		};

		if (tv_lg_mark) {
			return eventListenerLG;
		}
		else if (tv_mag_mark) {
			return eventListenerMag;
		}
		else if (tv_samsung_mark) {
			if (tv_samsung_tizen_mark) {
				return eventListenerSamsungTizen;
			}

			return eventListenerSamsung;
		}
		else {
			return eventListenerDesktop;
		}

		function eventListenerLG(param) {
			if (param.eventType === 'play_start' && !self.paused) {
				playStart();
			}

			if (param.eventType === 'play_end') {
				// используем repeatCount
			}
			else if (param.eventType === 'file_not_found') {
				playError();
			}
		}
		function eventListenerSamsung(event) {
			if (event === 7) { // play start
				playStart();
			}
			else if (event === 8) {
				managePoster(true);

				self.stop();
				self.play();
			}
			else if (event === 1 && videoCollection.container[0]) {
				playError();
			}
		}
		function eventListenerMag(event) {
			switch (event) {
				case '1':
					if (tv_manufacturer === 'tvip') {
						self.play();
					}
					break;
				case '4': // Начало отображаться видео и/или воспроизводиться звук
					playStart();

					break;
				case '5': // Ошибка открытия контента: нет такого контента на сервере или произошёл отказ при соединении с сервером
					playError();
			}
		}
		function eventListenerDesktop(e) {
			switch (e.type) {
				case 'play':
					playStart();
			}
		}

		function playStart() {
			managePoster(false);

			if (tv_desktop_mark || tv_manufacturer == 'vestel') {
				return true;
			}

			clip(self.container, self.page);
			self.resize();
		}
		function playError() {
			log.add('Видео на странице с id: '+ videoCollection.get().page +' не доступно для проигрывания');
			managePoster(true);
			videoCollection.destroy();
		}

	})();
	function managePoster(show) {
		var poster = self.container.querySelector('.poster');

		if (
			tv_cur_block === 'VODplayer' ||
			active_page_id === 'wakeup' ||
			!poster
		) {
			return false;
		}

		if (show) {
			poster.style.opacity = 1;
		}
		else {
			poster.style.opacity = 0;
		}
	}

}
