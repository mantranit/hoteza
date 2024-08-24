var Messages = {
	deps: ['CustomNotification'],
	init: function() {
		var d = $.Deferred();

		//из UI build_page
		// // в update_message_unread записывается цифровой id,
		// // а не message_page_`id`
		// if (obj.tplType == 'messages_page') {
		// 	data.idForMessageUnread = data.id.match(/\d/g).join('');
		// }

		if(!isset('structv2.config.messages')) {
			log.add('MESSAGES: off in struct');
			d.resolve();
		} else {
			css_append('modules/Messages/style.css');

			new LoadTemplates(['modules/Messages/messages_list.html', 'modules/Messages/messages_recipients.html', 'modules/Messages/messages_message.html'])
				.done(function() {

					Messages.render();

					$(HotezaTV).on('auth', function() {
						//TODO: update error handle (restart)
						if(Guest.token) {
							Messages.update()
								.done(function() {
									Messages.listen();
								});
						}
					});

					//Module init end
					d.resolve();

				});
		}

		return d.promise();
	},
	messages: [],
	update: function(fast) {
		var d = $.Deferred();

		if(Messages.updating) {
			log.add('MESSAGES: already updating');
			d.reject();
		} else {
			Messages.updating = true;
			Messages.get(fast)
				.done(function(data) {
					if(fast) {
						Messages.messages = Messages.messages.concat(data);
					} else {
						Messages.messages = data;
					}

					if(Messages.messages.length) {
						Messages.last.id = Messages.messages[Messages.messages.length - 1].id;
					}

					//TODO: перенести в проверку новых?
					Messages.render_messages();
					Messages.update_indicators();
					d.resolve();
				})
				.fail(function(err) {
					log.add('MESSAGES: failed ' + err);
					d.reject();
				})
				.always(function() {
					Messages.updating = false;
				});
		}

		return d.promise();
	},
	render: function() {

		var recipients = objectToArrayList(structv2.messages);
		//ресипиенты
		UI.register_page({id: 'messages'});
		UI.render(
			'messages',
			{
				title: getlang('messages'),
				backBtn: 0,
				messages: recipients
			},
			'messages_recipients'
		);
		//страницы сообщений
		for(var i in structv2.messages) {
			var page_id = 'messages_page_' + structv2.messages[i].id;
			UI.register_page({id: page_id, action: {func: Messages.update_unread, param: structv2.messages[i].id}});
			UI.render(
				page_id,
				Object.assign(
					{backBtn: 1, parentId: 'messages'},
					structv2.messages[i]
				),
				'messages_list'
			);
			//TODO: сделать нормально?
			$id(page_id).setAttribute('scroll_to_bottom', 'true');
			$id(page_id).setAttribute('keep_position', 'true');
		}

		//костылик пропуска ресипиентов при одном
		if(recipients.length == 1){
			var id = '#messages_page_' + recipients[0].id;

			//подмена ссылки на сообщения (надеемся, что меню ещё не построено)
			for(var i in structv2.menu){
				if(structv2.menu[i].link == '#messages'){
					structv2.menu[i].link = id;
				}
			}

			//подмена обратно ссылки со страницы
			$(id).find('div.back').attr('href','').attr('onvclick','navigate("#menu")');
		}

	},
	render_messages: function(messages) {

		$('.messages.content>DIV').empty();

		//TODO: сообщения без ресипиента (нет такого)

		if(!messages) {
			messages = Messages.messages || [];
		}

		var messagesByRecipient = {};
		for(var i in messages) {
			var msg = messages[i];
			if(!messagesByRecipient[msg.categoryId]) {
				messagesByRecipient[msg.categoryId] = {id: msg.categoryId, prev_date: '', messages: []};
			}

			var tmp_date = new Date(msg.timestamp * 1000);

			msg.time = tmp_date.getUTCHours() + ':' + lz(tmp_date.getUTCMinutes());

			if(tmp_date.toDateString() != messagesByRecipient[msg.categoryId].prev_date) {
				messagesByRecipient[msg.categoryId].prev_date = tmp_date.toDateString();
				messagesByRecipient[msg.categoryId].messages.push({
					direction: 'date',
					date: moment(tmp_date).utc().format('LL'),
					wasRead: msg.wasRead
				});
			}

			messagesByRecipient[msg.categoryId].messages.push(msg);
		}

		for(var o in messagesByRecipient) {
			var messages_list = $id('messages_' + o);
			if(messages_list) {
				//TODO: добавить перевод для "No messages" в шаблоне
				$(messages_list).parent().parent().find('.messages_no_messages').remove();
				messages_list.innerHTML = templates_cache['messages_message'].render(messagesByRecipient[o], {getlang: getlang});
			} else {
				log.add('MESSAGES: have ' + messagesByRecipient[o].messages.length + ' messages from inexistent recipient ' + o);
			}
		}

		//TODO: если после messages_page открыть меню или каналы (active_page не меняется), то не делается ресайз и не скроллится
		if(active_page_id.indexOf('messages_page_') == 0 && tv_cur_block == 'scroll') {
			resize_scroll($(active_page));
			scroll_to_bottom();
			//TODO: сделать нормально
			var categoryId = active_page_id.match(/messages_page_(.+)/)[1];
			Messages.update_unread(categoryId);
		}

		return true;
	},
	get: function(fast) {
		var d = $.Deferred();
		if(Guest.token) {

			var lastId = 0;

			if(fast) {
				lastId = Messages.last.id;
			}

			$.post(
        "https://18eb-58-187-184-107.ngrok-free.app/api/v1/im",
        {
          cmd: "read",
          lastId: lastId,
          token: Guest.token,
        },
        function (data) {
          if (typeof data == "object") {
            if (typeof data.result != "undefined") {
              switch (data.result) {
                case 0:
                  if (data.messageList && data.messageList.length) {
                    d.resolve(data.messageList);
                    //используется в CustomNotification
                    $(window).trigger("newmessage", data);
                  } else {
                    d.resolve([]);
                  }
                  break;
                case 1:
                  log.add("MESSAGES: Incorrect request");
                  d.reject("incorrect request");
                  break;
                case 2:
                  log.add("MESSAGES: Incorrect token");
                  d.reject("incorrect token");
                  break;
                case 3:
                  //checkout
                  log.add("MESSAGES: Guest checkout");
                  d.reject("checkout");
                  break;
                case 4:
                  log.add("MESSAGES: Guest cancelled");
                  d.reject("cancelled");
                  break;
                case 5:
                  log.add("MESSAGES: unknown command");
                  d.reject("unknown command");
                  break;
                case 9:
                  log.add("MESSAGES: Server error 9 (" + data.message + ")");
                  d.reject("server error");
                  break;

                default:
                  log.add("MESSAGES: Unknown server error " + data.result);
                  d.reject("unknown error");
                  break;
              }
            } else {
              log.add("MESSAGES: OMG! Request Error 57");
              //Объект да не тот
              d.reject("error 57");
            }
          } else {
            log.add("MESSAGES: OMG! Request Error 37");
            //Полный ахтунг: пришёл не объект а чёрти-что
            d.reject("error 37");
          }
        },
        "json"
      ).fail(function (err) {
        log.add(
          "MESSAGES: Request failure " + err.status + "|" + err.statusText
        );
        d.reject("request failure");
      });
		} else {
			d.reject('no auth');
		}
		return d.promise();
	},
	im_read: function(lastId, categoryId) {
		$.post(
			api_url + 'imRead',
			{
				lastId: lastId,
				categoryId: categoryId,
				token: Guest.token
			}
		)
			.done(function(data) {
				if(data && data.result == 0) {
					log.add('MESSAGES: reported');
				} else {
					log.add('MESSAGES: report read failed, result ' + data.result + ', ' + data.message);
				}
			})
			.fail(function(err) {
				log.add('MESSAGES: report read failed');
				// console.log('ERROR', err);
			});
	},
	update_unread: function(categoryId) {
		if(Messages.get_unread_count(categoryId)) {
			var lastId = 0;
			for(var i in Messages.messages) {
				if(Messages.messages[i].categoryId == categoryId) {
					Messages.messages[i].wasRead = true;
					lastId = Messages.messages[i].id;
				}
			}
			Messages.update_indicators();

			setTimeout(Messages.im_read, 2000, lastId, categoryId);
		}
	},
	type: 'none',
	listener: null,
	timer: null,
	last: {id: 0, tag: 0, time: 'none'},
	clean_abort: false,
	listen: function() {
		if(Messages.listener) {
			log.add('MESSAGES: already listening');
			return false;
		}
		var out = 'none';
		switch(isset('config.tv.messages_listener')) {
			case 'queue_longpoll':
			case 'longpoll':
				Messages._longpoll.listen();
				out = 'longpoll';
				break;
			case 'queue_poll':
			case 'poll':
				Messages._poll.listen();
				out = 'poll';
				break;
			case 'queue_ws':
			case 'ws':
				//проверка поддержки WS, LT760 поддерживает старое
				if('WebSocket' in window && WebSocket.CLOSING) {
					Messages._ws.listen();
					out = 'ws';
				} else {
					log.add('MESSAGES: WS not supported, fallback to longpoll');
					Messages._longpoll.listen();
					out = 'longpoll';
				}
				break;
			case 'im':
			case '':
				Messages._im.start();
				out = 'im';
				break;
			default:
				log.add('MESSAGES: unknown listen type:' + isset('config.tv.messages_listener'));
				break;
		}
		return out;
	},
	listen_stop: function() {
		//TODO: stop according to type
		switch(isset('config.tv.messages_listener')) {
			case 'queue_longpoll':
			case 'longpoll':
				Messages._longpoll.stop();
				break;
			case 'queue_poll':
			case 'poll':
				Messages._poll.stop();
				break;
			case 'queue_ws':
			case 'ws':
				Messages._ws.stop();
				break;
			case 'im':
			case '':
				Messages._im.stop();
				break;
			default:
				log.add('MESSAGES: unknown listen type:' + isset('config.tv.messages_listener'));
				break;
		}
		Messages.listener = null;
		Messages.timer = null;
		Messages.type = 'none';
	},
	_longpoll: {
		listen: function() {
			if(Guest.token) {
				Messages.type = 'longpoll';
				Messages.listener = $.ajax({
					url: isset('config.queue_url') + 'subv2/' + Guest.token + '?tag=' + Messages.last.tag + '&time=' + Messages.last.time,
					async: true,
					timeout: 60000,
					dataType: 'text',
					success: function(data, status, xhr) {
						if(data) {
							var obj = JSON.parse(data);
							var tmp = obj.length;
							log.add('MESSAGES: got ' + (tmp - 1) + ' messages');
							for(var i = 0; i < tmp; i++) {
								var tmp_cmd = obj[i];
								if(tmp_cmd != 0) {
									Messages.last.tag = tmp_cmd.tag;
									Messages.last.time = tmp_cmd.time;
									Messages.server_message_handle(tmp_cmd.text);
								}
							}
						}
						Messages.listener = null;
						Messages.timer = setTimeout(Messages.listen, 0);
					}
				}).fail(function(err, msg1) {
					Messages.listener = null;
					Messages.timer = null;
					Messages.type = 'none';

					if(msg1 == 'timeout') {
						Messages.timer = setTimeout(Messages.listen, 0);
					} else if(msg1 == 'abort') {
						if(Messages.clean_abort) {
							//TODO: может всё-таки выставлять блок?
							Messages.clean_abort = false;
							log.add('MESSAGES: Clean longpoll abort');
						} else {
							Messages.timer = setTimeout(Messages.listen, 10000);
							log.add('MESSAGES: Longpoll connection aborted. Retry in 10 secs');
						}
					} else {
						//TODO: resync after long disconnect
						Messages.timer = setTimeout(Messages.listen, 10000);
						log.add('MESSAGES: No connection: ' + err.status + '|' + err.statusText + '. Retry in 10 secs');
					}
				});
			} else {
				log.add('MESSAGES: tried to start LONGPOLL listener with empty token');
			}
		},
		stop: function() {
			if(Messages.listener) {
				Messages.clean_abort = true;
				Messages.listener.abort();
				log.add('MESSAGES: stop longpoll listening');
			} else {
				log.add('MESSAGES: cant stop longpoll listening: no listener');
			}
		}
	},
	_poll: {
		listen: function() {
			if(Guest.token) {
				Messages.type = 'poll';
				Messages.listener = $.ajax({
          url:
            "https://18eb-58-187-184-107.ngrok-free.app/api/v1/queue/subpoll/" +
            Guest.token +
            "?tag=" +
            Messages.last.tag +
            "&time=" +
            Messages.last.time,
          async: true,
          success: function (data, status, xhr) {
            //TODO: проверка получения заголовка
            //TODO: если прошло больше 10 минут то обновлять все сообщения
            Messages.last.time = xhr
              .getResponseHeader("Last-Modified")
              .replace(/-/g, " ");
            if (data) {
              var obj = JSON.parse(data);
              var tmp = obj.length;
              log.add("MESSAGES: got " + (tmp - 1) + " messages");
              for (var i = 0; i < tmp; i++) {
                var tmp_cmd = obj[i];
                if (tmp_cmd != 0) {
                  Messages.server_message_handle(tmp_cmd);
                }
              }
            }
            Messages.listener = null;
            Messages.timer = setTimeout(Messages.listen, 10000);
          },
        }).fail(function (err, msg1) {
          Messages.listener = null;
          Messages.timer = null;
          Messages.type = "none";

          if (msg1 == "timeout") {
            Messages.timer = setTimeout(Messages.listen, 10000);
          } else {
            Messages.timer = setTimeout(Messages.listen, 60000);
            log.add(
              "MESSAGES: No connection: " + err.status + "|" + err.statusText
            );
          }
        });
			} else {
				log.add('MESSAGES: tried to start POLL listener with empty token');
				return false;
			}
		},
		start: function() {
			if(Guest.token) {
			}
		},
		stop: function() {
			if(Messages.timer) {
				clearTimeout(Messages.timer);
				Messages.listener = null;
				Messages.timer = null;
				log.add('MESSAGES: stop im listening');
			} else {
				log.add('MESSAGES: cant stop im listening: no listener');
			}
		}
	},
	_ws: {
		CODES: {'1000': 'Normal Closure', '1001': 'Going Away', '1002': 'Protocol error', '1003': 'Unsupported Data', '1004': 'Reserved', '1005': 'No Status Rcvd', '1006': 'Abnormal Closure', '1007': 'Invalid frame payload data', '1008': 'Policy Violation', '1009': 'Message Too Big', '1010': 'Mandatory Ext.', '1011': 'Internal Error', '1012': 'Service Restart', '1013': 'Try Again Later', '1014': 'Bad Gateway', '1015': 'TLS handshake'},
		listen: function() {
			if(!Messages.listener) {
				if(Guest.token) {
					Messages.type = 'ws';
					Messages.listener = new WebSocket('ws' + isset('config.queue_url').replace(/^\/\//i, document.location.protocol + '//').replace(/^http/i, '') + 'subws/' + storage.getItem('token'));
					Messages.listener.onopen = function(evt) {
						log.add('WS: Connected');
						// console.log(evt);
					};
					Messages.listener.onclose = function(evt) {
						log.add('WS: closed');
						// console.log(evt);

						Messages.listener = null;
						Messages.timer = null;
						Messages.type = 'none';

						if(evt.wasClean) {
							log.add('MESSAGES: WS clean close');
						} else {
							Messages.timer = setTimeout(Messages.listen, 10000);
							log.add('MESSAGES: Connection failure, code: ' + evt.code + (Messages._ws.CODES[evt.code] ? (' (' + Messages._ws.CODES[evt.code] + ')') : ''));
						}

					};
					Messages.listener.onmessage = function(evt) {
						try {
							data = JSON.parse(evt.data);
						} catch(e) {
							log.add('WS: JSON parsing gone wrong: ' + data);
							return false;
						}
						Messages.server_message_handle(data.text);
					};
					Messages.listener.onerror = function(evt) {
						log.add('WS: ERROR');
						// console.log(evt);
					};
				} else {
					log.add('MESSAGES: tried to start WS listener with empty token');
					return false;
				}
			} else {
				log.add('MESSAGES: listen already started (WS)');
				return false;
			}
		},
		stop: function() {
			if(Messages.listener) {
				Messages.listener.close();
				log.add('MESSAGES: stop WS listening');
			} else {
				log.add('MESSAGES: cant stop WS listening: no listener');
			}
		}
	},
	_im: {
		start: function() {
			if(!Messages.timer) {
				if(Guest.token) {
					Messages.type = 'im';
					Messages.timer = setInterval(Messages._im.update, 60000);
				} else {
					log.add('MESSAGES: tried to start IM listener with empty token');
					return false;
				}
				return true;
			} else {
				log.add('MESSAGES: listen already started (IM)');
				return false;
			}
		},
		stop: function() {
			if(Messages.timer) {
				clearInterval(Messages.timer);
				Messages.timer = null;
				log.add('MESSAGES: stop im listening');
			} else {
				log.add('MESSAGES: cant stop im listening: no listener');
			}
		},
		update: function() {
			if(Guest.token) {
				//копипаста из обработчика команд
				Messages.update(true)
					.done(function() {
						Messages.render_messages();
					});
			} else {
				Messages._im.stop();
			}
		}
	},
	server_message_handle: function(data) {
		if(typeof (data) !== 'object') {
			try {
				data = JSON.parse(data);
			} catch(e) {
				log.add('msg handle: JSON parsing gone wrong');
				l(data);
				return false;
			}
		}
		switch(data.cmd) {
			case 'nav':
				navigate(data.id);
				break;
			case 'im':
				Messages.update(true)
					.done(function() {
						Messages.render_messages();
					});
				break;
			case 'imRead':
				if(data.lastId > Messages.last.id) {
					log.add('MESSAGES: imRead ID is greater!');
					// tv_log('MESSAGES: imRead ID is greater!');
					//return
				}
				var categoryId;
				for(var i in Messages.messages) {
					if(Messages.messages[i].id == data.lastId) {
						categoryId = Messages.messages[i].categoryId;
						continue;
					}
				}
				if(categoryId) {
					for(var o in Messages.messages) {
						if(Messages.messages[o].categoryId == categoryId && Messages.messages[o].id <= data.lastId) {
							Messages.messages[o].wasRead = true;
						}
					}
					Messages.update_indicators();
				} else {
					log.add('MESSAGES: imRead ID not found');
					// tv_log('MESSAGES: imRead ID not found');
				}
				break;
			case 'log':
				tv_log(data.text);
				break;
			case 'reauth':
				tv_auth();
				break;
			default:
				log.add('MESSAGES: Unknown command ' + data.cmd);
				break;
		}
	},
	get_unread_count: function(categoryId) {
		var count = 0;

		//TODO: учитывать только существующие категории?
		for(var i in Messages.messages) {
			if(Messages.messages[i].wasRead == false && (!categoryId || categoryId == Messages.messages[i].categoryId)) {
				count++;
			}
		}

		return count;
	},
	update_indicators: function() {
		for(var i in structv2.messages) {
			var count = Messages.get_unread_count(structv2.messages[i].id);
			if(count) {
				$('#messages_group_indicator_' + structv2.messages[i].id).html(count).show();
			} else {
				$('#messages_group_indicator_' + structv2.messages[i].id).html(0).hide();
			}
		}
		var total_count = Messages.get_unread_count();
		if(total_count) {
			$('#messages_indicator').html(total_count).show();
			//CustomNotification
			$('#notification_container .messages_group_indicator').html(total_count);
		} else {
			$('#messages_indicator').html(0).hide();
			$('#notification_container .messages_group_indicator').html(0);
			CustomNotification.hide();
		}
	}
};
