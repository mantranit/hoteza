var time_picker = {
	build: false,
	moment: null,
	/**
	 * Аргументы описаны в this.open()
	* */
	init: function (parent, cb, minShift, onOpen, onClose) {
		minShift = minShift ? minShift : isset('config.time_picker.minShift');
		if (!this.build) {
			renderPageOnTheStructv2(
				'time_picker',
				{
					title: getlang('select_time_date')
				},
				'time_picker',
				'time_picker new'
			);
			this.build = true;
		}

		time_picker.moment =
			time_picker.get_moment_with_current_time().add(
				minShift ? minShift : 5, 'm'
			);
		set_current_data();

		function set_current_data() {
			var time_picker_block = $('#time_picker');

			time_picker_block.attr('onopen', typeof onOpen !== 'undefined' ? onOpen : '');
			time_picker_block.attr('onclose', typeof onClose !== 'undefined' ? onClose : '');

			_set_imposition();
			_set_time();

			time_picker.set_time();

			function _set_imposition() {
				time_picker_block.find('.back').remove();
				time_picker_block.find('.menu').remove();
				if(parent){
					time_picker_block.find('.header').append(
						'<div class="back" href="'+
							(
								parent.toString().indexOf('#') === -1 ?
									'#' + parent :
									parent
							) +
						'" href_type="back">' +
							'Back' +
						'</div>'
					);
				}else{
					time_picker_block.find('.header').append(
						'<div class="menu" onvclick="show_menu()">' +
							'Back' +
						'</div>'
					);
				}

				if(cb){
					time_picker_block.find('.button').attr('onvclick', cb);
				}else{
					console.log('TIME_PICKER: Добавьте callback при открытии');
				}

			}
			function _set_time() {
				var minutes = time_picker.moment.minutes(),
					sub = minutes % 5;

				// округляем до ближайших 5 минут
				if(sub){
					if(sub > 2){
						time_picker.moment.add(5 - sub, 'm').minutes();
					}else{
						time_picker.moment.subtract(sub, 'm').minutes();
					}
				}

				time_picker_block.find('li').remove();
				__set_time('minutes');
				__set_time('hours');
				__set_time('days');

				function __set_time(type) {
					var moment_relative;
					var shift = type === 'minutes' ?
						5 : 1;

					var short_name = type === 'minutes' ?
						'm' :
						type === 'hours' ?
							'H' :
							'll';

					moment_relative = moment(time_picker.moment);
					var prev = moment_relative
						.subtract(shift, type);
					moment_relative = moment(time_picker.moment);
					var cur = moment_relative;
					moment_relative = moment(time_picker.moment);
					var next = moment_relative
						.add(shift, type);

					time_picker_block.find('[data-type="'+ type +'"] ul').append(
						'<li data-item="'+ prev.format() +'">' +
							(
								prev.format(short_name).length === 1 ?
									"0" + prev.format(short_name) :
									prev.format(short_name)
							) +
						'</li>' +
						'<li data-item="'+ cur.format() +'">' +
							(
								cur.format(short_name).length === 1 ?
									"0" + cur.format(short_name) :
									cur.format(short_name)
							) +
						'</li>' +
						'<li data-item="'+ next.format() +'">' +
							(
								next.format(short_name).length === 1 ?
									"0" + next.format(short_name) :
									next.format(short_name)
							) +
						'</li>'
					);
				}
			}
		}
	},
	get_moment_with_current_time: function (date) {
		return date ?
			moment.utc(date) :
			moment.utc(new Date(time.now()));
	},
	get_ISO_string: function (custom, currentTime) {
		if (currentTime) {
			return time_picker.get_moment_with_current_time().format('YYYY-MM-DDTHH:mm:ssZ');
		}

		var hours = time_picker.get_moment_with_current_time(
				$('[data-type="hours"]').find('li').eq(1).data('item')
			),
			minutes = time_picker.get_moment_with_current_time(
				$('[data-type="minutes"]').find('li').eq(1).data('item')
			),
			days = time_picker.get_moment_with_current_time(
				$('[data-type="days"]').find('li').eq(1).data('item')
			);

		return (typeof custom !== 'undefined') ?
			days.format('YYYY-MM-DD') + ' ' +
			hours.format('HH') + ':' +
			minutes.format('mm') + ':00'
			:
			time_picker.get_moment_with_current_time().set({
				'year': days.get('year'),
				'month': days.get('month'),
				'date': days.get('date'),
				'hour': hours.get('hour'),
				'minute': minutes.get('minute'),
				'second': 0
			}).toISOString();
	},
	set_time: function () {
		$('.time_picker .button').attr('time', time_picker.get_ISO_string('custom'));
	},
	/**
	 * @param {string} parent - куда возвращаемся при закрытии time_picker'а [{$id|menu}]
	 * @param {string|funciton} cb - вставляется в onvclick "confirm"
	 * @param {number} minShift - ближайшее время на которое можно установить заказ
	 * @param {string|function} [onOpen] – ф-ия - выполняемая при открытии
	 * @param {string|function} [onClose] – ф-ия - выполняемая при закрытии
	 * сдвиг указывается в минутах
	* */
	open: function (parent, cb, minShift, onOpen, onClose) {
		this.init(parent, cb, minShift, onOpen, onClose);
		navigate('#time_picker');
	},
	close: function () {
		tv_keydown_override = null;
		time_picker.moment = null;

		$('.time_picker')
			.find('.time_picker_item, .button')
			.removeClass('tv_sel tv_cur');
	},
	move: function (direct) {
		if (tv_cur_elem.hasClass('button')) {
			tv_cur_pos = 0;
			tv_sel_cur();
			return;
		}

		serve(direct);

		function serve(direct) {
			var type = tv_cur_elem.data('type'),
				which_delete = direct === 'down' ? 'first' : 'last',
				container = $('[data-type="'+ type +'"] ul'),
				abort_function = false;

			if (container.hasClass('animation')) return;
			container.addClass('animation');

			_add_item();
			_remove_item();

			function _add_item() {
				var moment_relative = moment.utc(
						container.find('li:eq(1)').data('item')
					),
					shift = type === 'minutes' ? 10 : 2,
					short_name = type === 'minutes' ?
						'm' :
						type === 'hours' ?
							'H' :
							'll',
					moment_with_shift =
						direct === 'up' ?
							moment_relative.clone().subtract(shift, type) :
							moment_relative.clone().add(shift, type);

				if (do_not_move()){
					abort_function = true;
					return true;
				}

				var elem =
					'<li style="height: 0;" data-item="'+ moment_with_shift.format() +'">' +
						(
							moment_with_shift.format(short_name).length === 1 ?
								"0" + moment_with_shift.format(short_name) :
								moment_with_shift.format(short_name)
						) +
					'</li>';

				if(direct === 'up'){
					container.prepend(elem);
				}else{
					container.append(elem);
				}

				container
					.find('[data-item="'+ moment_with_shift.format() +'"]')
					.animate({ height: 100 }, 300, function () {
						if (direct === 'up') container.removeClass('animation');
					});

				function do_not_move() {
					if (
						type === 'days' &&
						(
							(
								direct === 'down' &&
								Math.round(
									moment_relative.diff(
										time_picker.moment,
										'days',
										true
									)
								) === 2
							) ||
							(
								direct === 'up' &&
								Math.round(
									moment_relative.diff(
										time_picker.moment,
										'days',
										true
									)
								) === 0
							)
						)
					) {
						return true;
					}
					else {
						return false;
					}
				}
			}
			function _remove_item() {
				if (abort_function) {
					return container.removeClass('animation');
				}

				tv_cur_elem.find('li:' + which_delete).animate({ height: 0 }, 300, function () {
					$(this).remove();
					if (direct === 'down') container.removeClass('animation');
					time_picker.set_time();
				});
			}
		}
	},
	isNotValid: function () {
		var ISOObject =
			time_picker.get_moment_with_current_time(
				time_picker.get_ISO_string()
			);

		return (ISOObject.diff(time_picker.get_moment_with_current_time()) < 0);

	},
	server_keydown: function (e) {
		if (!e) e = event;
		var code = (e.keyCode ? e.keyCode : e.which);

		//Обработка shift для MAG
		if(e.shiftKey){
			code = 'S'+code;
		}

		switch(code){
			case 0:
				break;
			case tv_keys.NUM_0:
				break;
			case tv_keys.NUM_1:
				break;
			case tv_keys.NUM_2:
				break;
			case tv_keys.NUM_3:
				break;
			case tv_keys.NUM_4:
				break;
			case tv_keys.NUM_5:
				break;
			case tv_keys.NUM_6:
				break;
			case tv_keys.NUM_7:
				break;
			case tv_keys.NUM_8:
				break;
			case tv_keys.NUM_9:
				break;

			case tv_keys.INPUT:
				time_picker.close();
				navigate('#sources_page');
				break;

			case tv_keys.UP:
				time_picker.move('down');
				break;
			case tv_keys.DOWN:
				time_picker.move('up');
				break;
			case tv_keys.LEFT:
				tv_left();
				break;
			case tv_keys.RIGHT:
				tv_right();
				break;
			case tv_keys.ENTER:
				if (tv_cur_block === 'dialog') return tv_ok();

				if (tv_cur_elem.hasClass('button')) {
					if (time_picker.isNotValid()) return;

					tv_ok();
					time_picker.close();
				}
				// нажимая Enter на выбиралке смещаем курсор вправо
				else {
					tv_right();
				}

				break;
			case tv_keys.EXIT:
			case tv_keys.BACK:
				if (tv_cur_block === 'dialog') return tv_ok();

				time_picker.close();

				tv_back();
				break;
			case tv_keys.CH_UP:
				break;
			case tv_keys.CH_DOWN:
				break;

			case tv_keys.RED:
				time_picker.close();
				tv_mode();
				break;
			case tv_keys.GREEN:
				if(fullscreen && !tv_channellist_hidden){
					tv_channel_category_build();
				}else{
					//tv_log('не буду');
				}
				break;
			case tv_keys.YELLOW:
				break;
			case tv_keys.BLUE:
				time_picker.close();
				navigate('#language_select');
				break;

			case tv_keys.PORTAL:
			case tv_keys.GUIDE:
			case tv_keys.Q_MENU:
			case tv_keys.MENU:
			case tv_keys.HOME:
				time_picker.close();
				navigate('#menu');
				break;

			default:
				//tv_log('code ' + code);
				break;

		}
	}
};
