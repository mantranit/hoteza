var Media = {
	init: function () {

	},
	deps: [],
	/**
	 * @param {string} type - все параметры перечисленны в stoppingList
	 * */
	type: null,
	stoppingList: {
		ip: '_tv_channel_stop',
		rf: '_tv_channel_stop',
		video: 'videoCollection.destroy',
		radio: 'RADIO.close',
		wakeup: 'Wakeupcall.close',
		music: 'MOD.close',
		VOD: 'VOD.destroy'
	},
	/**
	 * @param {string} param.directType - при передачи параметра работает как setter, без параметра работает как getter
	 * */
	shutdown: (function () {
		var needShutdown = false;

		return function (param) {
			if (!tv_lg_mark) {
				return false;
			}

			if (param) {
				if (
					param.directType === 'video' ||
					param.directType === 'wakeup' ||
					param.directType === 'music' ||
					param.directType === 'radio' ||
					param.directType === 'VOD'
				) {

					needShutdown = true;

				}
				else if (
					param.directType === 'ip' ||
					param.directType === 'rf'
				) {

					needShutdown = false;

				}
			}
			else {
				return needShutdown;
			}
		};
	})(),
	set: function (param) {
		Media.type = param.directType;
		Media.shutdown(param);
	},
	/**
	 * @param {string|object} param.directType – [все параметры перечисленны в stoppingList] – куда переходим. Зная куда переходим, знаем что стопорить
	 * */
	stop: function (param) {
		param = param ? param : {};

		var d = $.Deferred();

		if (
			Media.type === null ||
			Media.type === param.directType
		) {
			if (Media.shutdown()) {
				_player_shutdown().done(d.resolve);
			}
			else {
				d.resolve();
			}

			Media.type = param.directType;
			Media.shutdown(param);
		}
		else {

			if (
				Media.type === 'video' ||
				Media.type === 'wakeup' ||
				Media.type === 'music' ||
				Media.type === 'radio' ||
				Media.type === 'VOD'
			) {
				isset(Media.stoppingList[Media.type])().done(function () {
					if (
						Media.shutdown() &&
						(
							param.directType === 'ip' ||
							param.directType === 'rf'
						)
					) {
						_player_shutdown().done(d.resolve);
					}
					else {
						d.resolve();
					}

					Media.type = param.directType;
					Media.shutdown(param);
				});
			}
			else {
				isset(Media.stoppingList[Media.type])();

				Media.type = param.directType;
				Media.shutdown(param);
				d.resolve();
			}

		}


		return d.promise();

	}

};
