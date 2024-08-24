(function () {
	var timeout = 15 * 1000,
		showTimer = null,
		defferTimer = null,

		hasFinished = false,

		isShowing = false,
		currentNotificationType = null,

		detachKeydown = null,

		prevActivePage = null,
		prevCurBlock = null,

		fullscreenValue = false,

		knownTypes = [
			'newmessage',
			'textMessage',
			'notificationChannel',
			'alert'
		],

		specialBlocks = [
			'menu',
			'tv_channellist',
			'channel',
			'tv_programmes_list',
			'category',
			'language',
			'tv_radiolist',
			'genre',
			'VODplayer',
			'mod_playlist'
		],

		hardBlocks = [
			'popup',
			'tv_welcome',
			'dialog',
			'shopitem',
			'toppings',
			'order_details',
			'time_picker'
		];

	window.CustomNotification = {
		deps: ['Events'],
		queue: [],
		init: function () {
			var d = $.Deferred();

			css_append('modules/CustomNotification/style.css');
			new LoadTemplates([
				'modules/CustomNotification/templates/notification.html',
				'modules/CustomNotification/templates/notification_message.html'
			])
			.done(function () {
				d.resolve();
			});

			$(window).on('newmessage', CustomNotification.listen);
			$(HotezaTV).one('final', function () {
				setTimeout(function(){
					CustomNotification.pull();
					hasFinished = true;
				}, 1000);
			});

			Events.registerListener('marketing', CustomNotification.listen);

			//Module init end
			return d.promise();
		},
		/**
		 * @param {String} payload.target - id рекламной компании
		 * @param {Number} payload.[show | goal] - количество показов или переходов
		 * */
		count: function (payload) {
			payload &&
			payload.target &&
			payload.target !== 'undefined' &&
			$(window).trigger('analytics', Object.assign(
				{ type: 'hitNotification' }, payload
			));
		},
		show: function (payload) {
			isShowing = true;
			currentNotificationType = payload.type;

			if(!payload.onopen){
				payload.onopen = '';
			}

			switch (payload.type) {
				case 'newmessage':
					renderPageOnTheStructv2(
						'notification_container',
						Object.assign(payload, { onopen: payload.onopen + 'metro_menu_calc();' }),
						'notification_message', 'popup', 'body'
					);
					break;

				case 'textMessage':
				case 'notificationChannel':
					var targetPage = getPageFromStruct(payload.link),
						onvclick = targetPage.type === 'shopProduct'
							? 'shop_view_item(\''+ targetPage.id +'\')'
							: null;

					renderPageOnTheStructv2(
						'notification_container',
						Object.assign(payload, {
							onopen: payload.onopen + 'metro_menu_calc();',
							onvclick: onvclick
						}),
						'notification', 'popup ' + payload.type, 'body'
					);
					break;

				case 'alert':
					custom_confirm(payload);
					//TODO: исправить размер стандартных иконок (используются в меню), после удалить
					$('#custom_dialog_icon').find('svg')[0].setAttribute('viewBox', '24 10 82 88');
					break;
			}

			switchState(true);

			new PreloadMedia('#notification_container').done(function () {
				var el = document.getElementById('notification_message');

				runAnimate(el, { top: '29px' }, {
					type: dynamics.bezier,
					duration: 300,
					points: [{'x':0,'y':0,'cp':[{'x':0.338,'y':0.042}]},{'x':1,'y':1,'cp':[{'x':0.275,'y':0.988}]}]
				});

				navigate('#notification_container', 'notification', true);
			});
		},
		isShow: function () {
			return isShowing;
		},
		/**
		 * @param {Object} payload
		 * @param {String} payload.target - (id маркетинговой компании) передается когда пользователь переходит на рекламируемую страницу
		 *                                  заведено, чтобы не нагромождать вызовы ф-ий в onvclick
		 * @param {Number} payload.[goal | close | timeout] -
		 *                                goal - переход на рекламируемую страницу
		 *                                close - закрытие нотификации пользователем
		 *                                timeout - закрытие нотификации по timeout'у
		 * */
		hide: function (payload) {
			// генерация события для статистики Маркетинговых компаний
			CustomNotification.count(payload);

			if (isShowing === false) {
				return false;
			}

			isShowing = false;
			clearTimeout(showTimer);

			switchState(false);

			switch (currentNotificationType) {
				case 'newmessage':
				case 'textMessage':
				case 'notificationChannel':
					$('#notification_container').remove();
					break;
			}

			if (specialBlocks.indexOf(prevCurBlock) !== -1) {
				active_page = prevActivePage;
				active_page_id = prevActivePage.replace('#', '');
				tv_sel_block(prevCurBlock);
			}
			else {
				navigate(prevActivePage);
			}

			currentNotificationType = null;

			// помещаем вызов ф-ии в конец стэка
			// чтобы в случае перехода на страницу по "See details"
			// сначала происходил переход на страницу, а затем показывалась новая реклама
			runDeferredEvent(0);
		},
		deffer: function (payload) {
			// Механизм обновления показываемой нотификации
			if (isShowing && currentNotificationType === payload.type) {
				switch(payload.type) {
					case 'newmessage':
						return Messages.update_unread();
				}
			}

			return CustomNotification.queue.push(payload);
		},
		pull: function () {
			var d = $.Deferred();

			if(Guest.token){
				getServerCommandsAsync({
          url: "http://localhost:8080/api/v1/marketing",
          method: "POST",
          payload: {
            cmd: "get",
            token: storage.getItem("token"),
          },
        }).done(function (payload) {
          if (Array.isArray(payload)) {
            return $(payload).each(function (i, item) {
              CustomNotification.processCmd(item);
            });
          }

          CustomNotification.processCmd(payload);
        });
			}

			return d.promise();
		},
		listen: function (e, payload) {
			// в случае генерации события из модуля Events
			// e === payload
			payload = e.cat ? e : payload;

			if (payload.cmd === 'pull') {
				return CustomNotification.pull();
			}

			// e - jQuery объект события
			CustomNotification.processCmd(Object.assign(payload, { type: e.type }));
		},
		/**
		 * @param {Object||Array} payload - {
		 *     type: String, - Required
		 *     [link]: String,
		 *     [title]: String,
		 *     [text]: String
		 * }
		 * */
		processCmd: checks(function (payload) {
			var title = null, text = null, image = null;

			if (isShowing) {
				return CustomNotification.deffer(payload);
			}
			if (
				hardBlocks.indexOf(tv_cur_block) !== -1 ||
				hasFinished === false
			) {
				CustomNotification.deffer(payload);
				return runDeferredEvent(5000);
			}

			switch (payload.type) {
				case 'newmessage':
					if (payload.messageList) {
						// со слов Антона по факту ни одна гостиница не пользуется отправкой
						// сообщений в разные каналы и этот функционал планируют выпиливать
						// поэтому перенаправляю пользователя в первый же канал
						payload.categoryId = payload.messageList[0].categoryId;

						// для этого типа событий показываем уведомление единожды
						// return $(payload.messageList).each(function (i, message) {
						//     CustomNotification.processCmd(Object.assign(message, { type: payload.type }));
						// })
					}

					var unreadCount = Messages.get_unread_count();
					if(!unreadCount){
						return false;
					}
					text = getlang('you_have_newmessage') + '<span class="messages_group_indicator messages_indicator">' + unreadCount + '</span>';
					payload.link = '#messages_page_' + payload.categoryId;

					break;

				case 'textMessage':
					title = payload[get_language()].title;
					text = payload[get_language()].text;

					if (!title && !text) {
						log.add('CustomNotification: language '+ get_language() +' doesn\'t exist');
						return true;
					}

					image = payload[get_language()].image;

					break;

				case 'alert':
					title = payload[get_language()].title;
					text = payload[get_language()].text;

					if (!title && !text) {
						log.add('CustomNotification: language '+ get_language() +' doesn\'t exist');
						return true;
					}

					payload.cancel = null;
					payload.confirm = payload.link
						? getlang('mobileAppContent-welcomePage-button-continue')
						: getlang('mobileAppContent-mainContent-button-close');

					payload.onConfirm = function () {
						CustomNotification.hide(Object.assign(
							{ target: payload.id },
							payload.link ? { goal: 1 } : { close: 1 }
							));

						if (payload.link) {
							var targetPage = getPageFromStruct(payload.link);

							targetPage.type === 'shopProduct'
								? shop_view_item(targetPage.id)
								: navigate(payload.link);
						}
					};

					break;

				case 'notificationChannel':
					var channelId = getChannels()[tv_cur_channel].id;

					// проверяем включены ли каналы
					// проверяем канал, если реклама показывается на определенном
					if (
						// при инициализации fullscreen = undefined
						fullscreen !== true ||
						(
							payload.tv_channels.length !== 0 &&
							payload.tv_channels.indexOf(channelId) === -1
						)
					) {
						CustomNotification.deffer(payload);
						return runDeferredEvent(5000);
					}

					title = payload[get_language()].title;
					text = payload[get_language()].text;

					if (!title && !text) {
						log.add('CustomNotification: language '+ get_language() +' doesn\'t exist');
						return true;
					}

					image = payload[get_language()].image;

					break;
			}

			// не показываем нотификацию, если пользователь находится
			// на странице куда ведет нотификация
			// Поместил здесь, т.к. надо вычислить link
			if (payload.link === active_page) {
				return true;
			}

			payload.onopen = 'CustomNotification.count({ target: \''+ payload.id +'\', show: 1 });';

			var guestName = tv_get_guest_name();
			payload.title = setGuestNameIntoText(title, guestName);
			payload.text = setGuestNameIntoText(text, guestName);
			payload.image = image;

			payload.text = cutString(payload);

			CustomNotification.show(payload);

			showTimer = payload.duration && setTimeout(function () {
				CustomNotification.hide({ target: payload.id, timeout: 1 });
			}, payload.duration);
		}),
		keydown: function (e) {
			var code = getKeyCode(e);
			if(!isAnimating){
				switch (code) {
					case tv_keys.LEFT:
					case tv_keys.RIGHT:
					case tv_keys.ENTER:
						tv_keydown(e, true);
						break;
				}
			}
		},

		rcCheck: function (cmd) {
			switch(cmd) {
				case 'channel':
				case 'sleep_timer':
					CustomNotification.hide();
			}
		},
		tests: function(){
			var tests_list = [
				{'name': 'New Message', 'method': 'test_message'},
				{'name': 'Marketing Message', 'method': 'test_marketing'},
				{'name': 'Marketing Alert', 'method': 'test_alert'}
			];
			return tests_list;
		},
		test_marketing: function(){
			CustomNotification.show({
				type: 'textMessage',
				image: 'i/loading.gif',
				title: 'Test Marketing Message',
				text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas a fermentum orci.',
				link: '#menu',
				onopen: ''
			});
		},
		test_message: function(){
			CustomNotification.show({
				type: 'newmessage',
				text: getlang('you_have_newmessage') + '<span class="messages_group_indicator messages_indicator">1</span>',
				link: '#messages'
			});
		},
		test_alert: function(){
			CustomNotification.show({
				type: 'alert',
				icon: 'spa-new',
				title: 'Test Alert Message',
				text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas a fermentum orci.',
				onConfirm: function(){
					CustomNotification.hide();
				},
				onCancel: function(){
					CustomNotification.hide();
				}
			});
		}
	};

	function checks(processCmd) {
		return function (payload) {
			if (
				isKnownTypes(payload) === false ||
				checkDevices(payload) === false
			) {
				return false;
			}

			return processCmd(payload);
		};
	}
	function isKnownTypes(payload) {
		if (knownTypes.indexOf(payload.type) === -1) {
			log.add('CustomNotification: unknown marketing type: ' + payload.type);
			return false;
		}

		return true;
	}
	function checkDevices(payload) {
		if (
			typeof payload.devices === 'undefined' ||
			payload.devices.length === 0 ||
			payload.devices.indexOf('tv') !== -1
		) {
			return true;
		}

		log.add('CustomNotification: marketing campaign for devices - ' + payload.devices.toString());
		return false;
	}
	function cutString(payload) {
		var requestedSetting = 'config.modules_settings.CustomNotification.'+ payload.type +'.text_length',
			textLength = isset(requestedSetting);

		if (textLength) {
			textLength = payload.image ? textLength.small : textLength.big;
			return payload.text.length > textLength ?
				payload.text.slice(0, textLength) + '...' :
				payload.text;
		}

		return payload.text;
	}
	function switchState(show) {
		if (show) {
			detachKeydown = tv_keydown_override;
			tv_keydown_override = CustomNotification.keydown;

			prevActivePage = active_page;
			prevCurBlock = tv_cur_block;

			fullscreenValue = fullscreen;
			fullscreen = false;
		}
		else {
			tv_keydown_override = detachKeydown;
			detachKeydown = null;

			fullscreen = fullscreenValue;
			fullscreenValue = false;
		}
	}
	function runDeferredEvent(_timeout) {
		clearTimeout(defferTimer);
		defferTimer = setTimeout(function () {
			var payload = CustomNotification.queue.shift();
			payload && CustomNotification.processCmd(payload);
		}, _timeout);
	}
})();
