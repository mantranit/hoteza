/**
 * Все timestamp с которыми мы работаем указаны в секундах
 * */
(function () {

	var FIRST_PROGRAMME_TIME = null,
		LAST_PROGRAMME_TIME = null,
		PROGRAMMES_TIME = null,
		PROGRAMMES_WIDTH = null,

		/**
		 * Данные для временной риски в час
		 * Видимая область в секундах LENGTH_IN_TIME = 2h 20m = 140 * 60 = 8400s
		 * LENGTH_ITEM_IN_TIME = 60m = 60m * 60s = 3600s
		 * LENGTH_IN_PX = 490
		 * LENGTH_ITEM_IN_PX = 210
		 * */
		// Данные взяты из макета
		// Видимая область в секундах 1h 10m = 70 * 60 = 4200s
		LENGTH_IN_TIME = 70 * 60,
		// 30m = 30m * 60s = 1800s
		LENGTH_ITEM_IN_TIME = 30 * 60,
		// Видимая область в пикселях
		// Изменил ширину, чтобы избавится от дробных частей
		LENGTH_IN_PX = 497,
		// Длинна 30 минут в пикселях
		LENGTH_ITEM_IN_PX = 213,

		DESC_TIMELINE_WIDTH = 280,

		PROGRAMME_MARGIN_RIGHT = 5,

		// timer обновления контента
		timer = null,
		INTERVAL = 15 * 1000,
		MINUTE = 60,
		HOUR = 60 * 60;

	var View = {

		/**
		 * Ф-ия обновляет отображение сейчас идущих программ
		 * @param {boolean} [isRequire] - если передать true, то ф-ия выполнится полностью,
		 *                                в не зависимости от того изменился список программ или нет
		 * */
		updateCurrentProgrammes: function (isRequire) {
			var ids = Epg.getCurrentProgrammesIds();

			// проверяем изменились ли данные с последнего апдейта
			if (
				equals(Epg.currentProgrammesIds, ids) &&
				typeof isRequire === 'undefined'
			) {
				return false;
			}

			Epg.currentProgrammesIds = ids;

			var currentProgrammes = document.querySelectorAll('#programmes_content .current_programme'),
				currentProgramme;

			for (var i = 0; i < currentProgrammes.length; i++) {
				currentProgramme = currentProgrammes[i];
				currentProgramme.classList.remove('current_programme');
			}

			for (var i = 0; i < ids.length; i++) {
				var id = ids[i];
				currentProgramme = document.querySelector('[data-programme-id="'+ id +'"]');

				// на всякий случай
				if (!currentProgramme) {
					continue;
				}

				currentProgramme.classList.add('current_programme');
			}
		},

		updatePositions: function (position) {
			Epg.setProgrammesPosition(position);
			Epg.setLinePosition();
		},

		updateTopPosition: function () {
			var TARGET_POSITION = 147,
				content = document.querySelector('#tv_programmes_list .content'),
				targetElemTop = tv_cur_elem.get(0).getBoundingClientRect().top;

			if (content && targetElemTop) {
				var contentTop = content.getBoundingClientRect().top;
				content.style.top = contentTop + TARGET_POSITION - targetElemTop + 'px';
			}
		},

		updateDay: function (programme) {
			if (!programme) {
				return false;
			}

			document.getElementById('preview_day').innerHTML = getDay(programme);

			function getDay(programme) {
				var mNow = moment(new Date(Date.now())),
					m = moment(programme.startTimestamp * 1000),

					numberOfNowDay = mNow.format('D'),
					numberOfTargetDay = m.format('D');

				if (numberOfTargetDay === numberOfNowDay) {
					return getlang('today');
				}

				if (parseInt(numberOfTargetDay) - parseInt(numberOfNowDay) === 1) {
					return getlang('tomorrow');
				}

				return m.format('ddd, Do');
			}
		},

		intervalUpdate: function () {
			if (tv_cur_block !== 'tv_programmes_list') {
				return clearTimeout(timer);
			}

			Epg.updateView();
			View.updateCurrentProgrammes();

			timer = setTimeout(View.intervalUpdate, INTERVAL);
		}
	};

	window.Epg = {
		deps: [],
		data: null,

		currentProgrammesIds: [],
		currentElemId: null,
		lastCurrentProgrammeId: null,

		init: function () {
			$(HotezaTV).on('tv_ready', function () {
				if (tv_channellist_type !== 'mosaic' && tv_channellist_type !== 'vertical_new') {
					return false;
				}

				Epg.load().done(function (data) {

					new LoadTemplates([
						'modules/Epg/templates/list_header_epg.html',
						'modules/Epg/templates/list_channels_epg.html',
						'modules/Epg/templates/list_programmes_epg.html',
						'modules/Epg/templates/new_preview_epg.html',
						'modules/Epg/templates/programmes_timeline.html'
					])
					.done(function () {
						Epg.data = prepareData(data);

						
					});

				}).fail(function () {
					Epg.disable();
				});

			});
		},

		open: function () {
			Epg.render('channels');
			Epg.render('programmes');
			Epg.render('header');

			tv_sel_block('tv_programmes_list');

			View.updateTopPosition();
			View.updatePositions();
			View.updateCurrentProgrammes(true);

			timer = setTimeout(View.intervalUpdate, INTERVAL);

			Epg.currentElemId = tv_cur_elem.attr('data-programme-id');

		},

		disable: function () {
			$('#tv_mosaic .guide').addClass('displaynone');
		},

		updateView: function (programmeId) {
			// Прерываем выполнение, если tv_cur_elem === 'No information'
			if (typeof Epg.currentElemId === 'undefined') {
				return false;
			}

			programmeId = typeof programmeId !== 'undefined' ? programmeId : tv_cur_elem.attr('data-programme-id');

			var channelId = Epg.getChannelId('left'),
				epgName = Epg.getEpgName(channelId),
				programmes = Epg.getProgrammes(epgName),

				programme = Epg.getProgramme(programmes, 0, programmeId),

				shift = Epg.getShift(programme),
				position = Epg.getPosition(false, shift);

			/*if (programme.noInformation) {
				return false
			}*/

			Epg.render('programmes', true, undefined, programme);

			Epg.render('preview_epg', false, 'new_preview_epg');

			View.updateCurrentProgrammes(true);

			Epg.calcSelectedElements();

			View.updatePositions(position);

			View.updateDay(programme);

		},

		move: function (direct) {
			var channelId = Epg.getChannelId(direct);
			if (!channelId) {
				return false;
			}

			var index = getIndex(direct, channelId);
			if (!index && index !== 0) {
				return false;
			}

			var nextCurrentElement = tv_sel_list[index];

			if (
				(
					direct === 'left' ||
					direct === 'right'
				) &&
				Epg.getChannelId(direct, $(nextCurrentElement)) !== channelId
			) {
				return false;
			}

			tv_cur_pos = index;
			tv_sel_cur();

			Epg.currentElemId = tv_cur_elem.attr('data-programme-id');
			Epg.setLastCurrentProgrammeId();

			function getIndex(direct, nextChannelId) {
				var channel, programmes, programme;

				/** <LEFT_RIGHT> */
				if (direct === 'right') {
					return tv_cur_pos < tv_max_pos - 1 ? tv_cur_pos + 1 : tv_cur_pos;
				}

				if (direct === 'left') {
					return tv_cur_pos > 0 ? tv_cur_pos - 1 : tv_cur_pos;
				}
				/** </LEFT_RIGHT> */

				/** <UP_DOWN> */
				channel = document.querySelector('[data-channel-id="'+ nextChannelId +'"]');

				// если у канала нет программы, устнанавливаем курсор на "No Information"
				if (channel.classList.contains('no_programme')) {
					return tv_sel_list.index(channel.querySelector('.programme'));
				}

				/** <Механизм перемещения по сейчас идущим программам> * */

				var programmeId = Epg.getLastCurrentProgrammeId(direct),
					programmeItem = programmeId ?
						document.querySelector('[data-programme-id="'+ programmeId +'"]') : null;

				if (programmeItem) {
					return tv_sel_list.index(programmeItem);
				}

				/** </Механизм перемещения по сейчас идущим программам> * */

				// Если программы есть ищем ближайшую в течении часа
				programmes = Epg.getProgrammes(channel.dataset.epgName);

				var shift = Epg.getShift() + MINUTE * 5;
				programme = getNearestProgramme(programmes, shift);

				if (programme) {
					return tv_sel_list.index(programme);
				}

				// Если список каналов закончился –> ничего не делаем
				nextChannelId = Epg.getChannelId(direct, undefined, nextChannelId);
				if (!nextChannelId) {
					return false;
				}

				// Перебираем каналы дальше, пока они не закончатся
				return getIndex(direct, nextChannelId);
				/** </UP_DOWN> */

				// ф-ия перебирает ближайший час
				function getNearestProgramme(programmes, shift) {
					var programme = null;

					for (var i = 0; i < 12; i++) {
						var programmeData = Epg.getProgramme(programmes, shift + MINUTE * 5 * i);
						programme = programmeData ? document.querySelector('[data-programme-id="'+ programmeData.id +'"]') : null;

						if (programme) {
							break;
						}
					}

					return programme;
				}

			}
		},

		/**
		 * Перемещение на большие промежутки времени
		 * @param {number} [duration] - кол-во часов.
		 *                              Если ничего не передать вернемся к currentTimestamp
		 * */
		bounce: function (duration) {
			if (isNoProgramme()) {
				return false;
			}

			var channelId = Epg.getChannelId('left'),
				epgName = Epg.getEpgName(channelId),
				programmes = Epg.getProgrammes(epgName),

				shift = typeof duration !== 'undefined' ? Epg.getShift() + HOUR * duration : duration,
				programme = Epg.getProgramme(programmes, shift);

			if (!programme) {
				return Epg.bounce(duration - 1);
			}

			Epg.currentElemId = programme.id;

			Epg.updateView(programme.id);
		},

		/**
		 * Ф-ия вычисляет временной сдвиг относительно tv_cur_elem
		 * используется для того чтобы перемещаться вверх/вниз по списку каналов где бы мы не находились
		 * @param {object} [programme] - данные программы
		 * */
		getShift: function(programme) {
			// Если ф-ия вызывается в первый раз и мы еще не в интерфейсе EPG,
			// возвращаем нулевой сдвиг
			if (
				!tv_cur_elem[0].closest('.programme_content')
			) {
				return 0;
			}

			var timestamp;
			if (typeof programme !== 'undefined' && !programme.noInformation) {
				timestamp = programme.startTimestamp;
			}
			else {
				var noProgramme = tv_cur_elem[0].closest('.no_programme'),
					item = noProgramme ? noProgramme : tv_cur_elem[0],
					left = parseInt(item.style.left);

				timestamp = FIRST_PROGRAMME_TIME + (left / LENGTH_ITEM_IN_PX) * LENGTH_ITEM_IN_TIME;
			}


			return timestamp - Epg.getCurrentTimestamp();

		},

		getEpgName: function(id) {
			var channel = document.querySelector('[data-channel-id="'+ id +'"]');
			return channel ? channel.dataset.epgName : undefined;
		},

		/**
		 * В ф-ию обязательно долны быть переданы direct, ( elem | id )
		 *
		 * @param {string} direct - направление движения [up | right | down | left]
		 * @param {object} [elem] - tv_cur_elem
		 * @param {string} [channelId] - id канала
		 *
		 * @returns {string|null}
		 * */
		getChannelId: function (direct, elem, channelId) {
			var channel;

			elem = typeof elem !== 'undefined' ? elem : tv_cur_elem;
			channelId = typeof channelId !== 'undefined' ? channelId : elem.closest('.programme_content').attr('data-channel-id');

			// защита от дурака
			if (!channelId) {
				return null;
			}

			// left / right
			if (direct === 'left' || direct === 'right') {
				return channelId;
			}

			// up / down
			channel = direct === 'down' ?
				document.querySelector('[data-channel-id="'+ channelId +'"]').nextElementSibling :
				document.querySelector('[data-channel-id="'+ channelId +'"]').previousElementSibling;

			return channel ? channel.dataset.channelId : null;

		},

		getProgrammes: function (epgName) {
			var isNotEpgName = typeof epgName === 'undefined' || epgName === '';
			if (isNotEpgName) {
				return null;
			}

			return (
				typeof Epg.data[epgName] !== 'undefined' &&
				typeof Epg.data[epgName].epg !== 'undefined'
			) ? Epg.data[epgName].epg : null;

		},

		/**
		 * @returns {array} - Ф-ия отдает массив id программ, которые идут в данное время
		 * */
		getCurrentProgrammesIds: function () {
			var ids = [];

			for (var i = 0; i < _tv_channels.length; i++) {
				var channel = _tv_channels[i],
					programmes = Epg.getProgrammes(channel.epg);

				if (channel.state !== 'show' || !programmes) {
					continue;
				}

				var programme = Epg.getProgramme(programmes);
				if (programme) {
					ids.push(programme.id);
				}
			}

			return ids;
		},

		getLastCurrentProgrammeId: function (direct) {
			var programmeIndex = Epg.currentProgrammesIds.indexOf(Epg.lastCurrentProgrammeId);

			if (programmeIndex !== -1) {
				var index = direct === 'up' ? programmeIndex - 1 : programmeIndex + 1;
				return Epg.currentProgrammesIds[index] ? Epg.currentProgrammesIds[index] : null;
			}

			return null;
		},

		setLastCurrentProgrammeId: function () {
			/*if (isNoProgramme()) {
				return false;
			}*/

			var currentProgrammeIndex = getCurrentProgrammeIndex();
			Epg.lastCurrentProgrammeId = currentProgrammeIndex !== -1 ?
				parseInt(tv_cur_elem.attr('data-programme-id')) : undefined;

			function getCurrentProgrammeIndex() {
				var currentProgrammeId = parseInt(tv_cur_elem.attr('data-programme-id'));

				return Epg.currentProgrammesIds.indexOf(currentProgrammeId);
			}
		},

		/**
			* Ф-ия вычисляет какая программа идет в данное время
			*
			* @param {array} programmes - список программ
			* @param {number} [shift] - сдвиг по времени (значение передается в секундах)
			* @param {number|string} [programmeId] - сгенерированный id программы, для первого способа поиска
			*
			* @returns {number|null} id - id сейчас идущей программы
			* */
		getProgramme: function (programmes, shift, programmeId) {
			if (!programmes) {
				return null;
			}

			if (programmes[0].noInformation) {
				return programmes[0];
			}

			if (
				typeof shift !== 'undefined' && shift !== 0 ||
				typeof shift === 'undefined' && typeof programmeId === 'undefined'
			) {
				return Epg.getProgrammeByTime(programmes, shift);
			}

			return Epg.getProgrammeById(programmes, programmeId);

		},

		getProgrammeByTime: function (programmes, shift) {
			var currentTimestamp = Epg.getCurrentTimestamp(shift);

			for (var i = 0; i < programmes.length; i++) {
				var programme = programmes[i];

				if (
					currentTimestamp >= programme.startTimestamp &&
					currentTimestamp <= programme.stopTimestamp
				) {
					return programme;
				}

			}

			return null;
		},

		getProgrammeById: function (programmes, programmeId) {

			for (var i = 0; i < programmes.length; i++) {
				var programme = programmes[i];

				if (programme.id === parseInt(programmeId)) {
					return programme;
				}

			}

			return null;
		},

		/**
			* Ф-ия возвращает сдвиг списка программ и указателя текущего времени
			* от начала первой программы
			* @param {boolean} [accuracy] - при присваивании параметру true ф-ия возвращает не округленное значение
			*                               используется для получения положения текущего времени (timeline)
			* @param {number} [shift] - сдвиг по времени
			* */
		getPosition: function (accuracy, shift) {
				// timestamp в секундах
			var currentTimestamp = Epg.getCurrentTimestamp(shift),

				// вычисляем сколько времени прошло сначала первой программы
				currentShiftTimestamp = currentTimestamp - FIRST_PROGRAMME_TIME,

				// подсчитываем кол-во делений равных 30 минутам для сдвига программ
				// и долю в px от 30 минут для timeline'a
				itemCounts = accuracy ?
					currentShiftTimestamp / LENGTH_ITEM_IN_TIME :
					// ( currentShiftTimestamp % LENGTH_ITEM_IN_TIME ) / LENGTH_ITEM_IN_TIME :
					Math.floor(currentShiftTimestamp / LENGTH_ITEM_IN_TIME);

			// возвращаем вычисленный сдвиг
			return itemCounts * LENGTH_ITEM_IN_PX;
		},

		setProgrammesPosition: function (position) {
			position = typeof position !== 'undefined' ? position : Epg.getPosition();

			document.getElementById('programmes_content').style.left = '-' + position + 'px';
			document.getElementById('time_scale').style.left = '-' + position + 'px';

			// Чтобы пункт No information всегда был виден
			var noProgrammes = document.querySelectorAll('.programme_content.no_programme');
			for (var i = 0; i < noProgrammes.length; i++) {
				var noProgramme = noProgrammes[i];
				noProgramme.style.left = position + 'px';
			}
		},

		setLinePosition: function () {
			var timeline = document.getElementById('programmes_timeline');
			if (!timeline) {
				document.getElementById('programmes_content')
					.insertAdjacentHTML('afterbegin', templates_cache['programmes_timeline'].render());
				timeline = document.getElementById('programmes_timeline');
			}

			timeline.style.left = Epg.getPosition(true) + 'px';
		},

		getHeaderTime: function (index, type) {
			var date = new Date(
				( FIRST_PROGRAMME_TIME + ( LENGTH_ITEM_IN_TIME * index ) ) * 1000
			);

			if (type === 'timestamp') {
				return ( date.getTime() / 1000 );
			}

			return lz(date.getHours()) + ':' + lz(date.getMinutes());
		},

		/**
			* @param {number} [shift] сдвиг по времени в секундах
			* @returns {number} timestamp в секундах
			* */
		getCurrentTimestamp: function (shift) {
			shift = typeof shift === 'undefined' ? 0 : shift;
			return Math.round( ( new Date().getTime() + shift * 1000) / 1000 );
		},

		getCurrentChannel: function () {
			var channelId = Epg.getChannelId('left');

			for (var i = 0; i < _tv_channels.length; i++) {
				var channel = _tv_channels[i];
				if (channel.id === channelId) {
					return i;
				}
			}
		},

		/**
			* Ф-ия инициализирует tv_cur_pos в момент открытия EPG
			* @returns {number}
			* */
		getCurrentItemPosition: function () {
			var currentChannel = _tv_channels[tv_mosaic.current_channel],
				epgName = currentChannel.epg,
				programmes = Epg.getProgrammes(epgName),
				currentElement;

			// если программа для канала отсутствует
			// устанавливаем курсор на "No information" для этого канала
			if (!programmes) {
				currentElement = $('[data-channel-id="'+ currentChannel.id +'"] .programme');
				return tv_sel_list.index(currentElement);
			}

			var programmeData = Epg.getProgramme(programmes),
				id = programmeData ? programmeData.id :  null;
			// Если в данный момент нет информации о программе, возвращаем нулевой индекс.
			// TODO: по хорошему надо вычислять ближайший индекс,
			//  но для этого надо предпринять много доп действий и проверок. Можно заняться в следующей итерации
			if (!id) {
				return 0;
			}

			currentElement = $('[data-programme-id="'+ id +'"]');

			return tv_sel_list.index(currentElement);
		},

		/**
			* @param {string} type - channels | programmes | header | preview_epg
			* @param {boolean} [reRender] - передаем true, чтобы построить программы без контейнера
			* @param {string} [template] - имя темплэйта
			* @param {object} [currentProgramme] - целевая программа.
			*                                      Используется для перемещения вперед / назад
			*                                      на большие интервалы времени
			* */
		render: function (type, reRender, template, currentProgramme) {
			var templateName = typeof template !== 'undefined' ? template : 'list_' + type + '_epg',
				WITH_CONTAINER = typeof reRender === 'undefined',
				container = getContainer(type, WITH_CONTAINER, templateName);

			container.innerHTML = templates_cache[templateName].render(
				getData(type, currentProgramme),
				{
					getProgrammes: Epg.getProgrammes,
					getTime: Epg.getHeaderTime,
					getlang: getlang
				}
			);

			function getData(type, currentProgramme) {
				var data = {},
					shift = Epg.getShift(currentProgramme),
					currentTimestamp = Epg.getCurrentTimestamp(shift);

				switch (type) {
					case 'channels':

						data = {
							channels: _tv_channels
						};

						break;

					case 'programmes':

						data = {
							data: getChannels(Epg.getChannelId('left'))
						};

						break;

					case 'header':

						data = {
							counts: new Array( Math.ceil( PROGRAMMES_TIME / LENGTH_ITEM_IN_TIME ) )
						};

						break;

					case 'preview_epg':

						var channel = tv_cur_elem[0].closest('.programme_content');
						if (!channel || channel.closest('.no_programme')) {
							return false;
						}

						var programmes = Epg.getProgrammes(channel.dataset.epgName),
							programme = Epg.getProgramme(programmes, 0, Epg.currentElemId);

						data = programme ?
							Object.assign(
								{},
								programme,
								{ alreadyPlayed: getAlreadyPlayed(programme) }
							) :
							{};

						function getAlreadyPlayed(programme) {
							var timestamp = Epg.getCurrentTimestamp();

							if (
								timestamp < programme.startTimestamp ||
								timestamp > programme.stopTimestamp
							) {
								return false;
							}

							var programmeDuration = programme.stopTimestamp - programme.startTimestamp,
								shift = timestamp - programme.startTimestamp,

								start = moment(programme.startTimestamp * 1000),
								stop = moment(programme.stopTimestamp * 1000);

							return {
								startWarTime: start.format('HH:mm'),
								stopWarTime: stop.format('HH:mm'),
								duration: (DESC_TIMELINE_WIDTH * shift) / programmeDuration
							};
						}

						break;
				}

				return Object.assign({}, data, {
					PROGRAMMES_WIDTH: PROGRAMMES_WIDTH,
					LENGTH_ITEM_IN_PX: LENGTH_ITEM_IN_PX,
					BUILD_FROM_TIME: ( currentTimestamp - HOUR ),
					// BUILD_UNTIL_TIME: ( currentTimestamp + LENGTH_IN_TIME /* видимая область */ + HOUR ),
					BUILD_UNTIL_TIME: ( currentTimestamp + getUntilShift(currentProgramme) /* видимая область */ + HOUR ),
					WITH_CONTAINER: WITH_CONTAINER
				});

				function getUntilShift(currentProgramme) {
					return (
						currentProgramme &&
						typeof currentProgramme !== 'undefined' &&
						!currentProgramme.noInformation
					) ? currentProgramme.duration : LENGTH_IN_TIME;
				}
			}
			function getContainer(type, WITH_CONTAINER, templateName) {
				if (!WITH_CONTAINER && type === 'programmes') {
					return document.querySelector('#programmes_content');
				}

				return document.querySelector('#' + templateName);
			}
			/**
				* Ф-ия возвращает массив каналов для построения
				* Также вычисляет кол-во индекс видимого канала, для того чтобы вычислить все вилимые каналы
				* Данная оптимизация увеличивает скорость перестроения в среднем в 10 раз
				* */
			function getChannels(channelId) {
				var index = null,

					data = {
						fromIndex: -1,
						untilIndex: _tv_channels.length,
						channels: []
					};

				for (var i = 0; i < _tv_channels.length; i++) {
					var channel = _tv_channels[i];
					if (channel.state === 'show') {
						data.channels.push(channel);

						if (channel.id === channelId) {
							index = data.channels.length - 1;
						}
					}
				}

				if (index || index === 0) {
					data.fromIndex = index - getIndex('from', channelId);
					data.untilIndex = index + getIndex('until', channelId);
				}

				return data;

				function getIndex(type, channelId) {
					var ITEM_HEIGHT = 62,
						HEIGHT = 800,
						top = document.querySelector('[data-channel-id="'+ channelId +'"]')
							.getBoundingClientRect().top;

					if (type === 'from') {
						return Math.ceil(top / ITEM_HEIGHT);
					}

					return Math.ceil((HEIGHT - top) / ITEM_HEIGHT);
				}
			}

		},

		calcSelectedElements: function () {

			tv_cur_elem = $('[data-programme-id="'+ Epg.currentElemId +'"]');
			tv_sel_list = $('#tv_programmes_list').find('.programme');
			tv_cur_pos = tv_sel_list.index(tv_cur_elem[0]);
			tv_max_pos = tv_sel_list.length;

			tv_sel_cur();

		},

		load: function () {
			var d = $.Deferred(),
        path =
          "https://aae0-58-187-184-107.ngrok-free.app/api/v1/epg?_=" +
          Math.random();

			$.get(
				path,
				function(data){
					if (typeof data !== 'undefined' && typeof(data.length) == 'undefined') {
						return d.resolve(data);
						// return d.resolve(JSON.parse(EPG_test));
					}

					log.add("EPG: no data");
					return d.reject();
				},
				'json'
			).fail(function(error){
				log.add('EPG: no file');
				d.reject();
			});

			return d.promise();
		},

		isFirstLine: function () {
			var channelId = Epg.getChannelId('left'),
				channel = document.querySelector('[data-channel-id="'+ channelId +'"]');

			if (!channel) {
				return false;
			}

			return !channel.previousElementSibling;

		}
	};

	function prepareData(data) {

		data = setConstant(data);
		data = setPositions(data);

		return data;

		function setConstant(data) {
			for (var channel in data) {
				var programmes = data[channel].epg,
					length = typeof programmes !== 'undefined' ? programmes.length : null;

				if (!length) {
					continue;
				}

				FIRST_PROGRAMME_TIME =
					getProgrammeTime(FIRST_PROGRAMME_TIME, programmes[0].startTimestamp, true);

				LAST_PROGRAMME_TIME =
					getProgrammeTime(LAST_PROGRAMME_TIME, programmes[length - 1].stopTimestamp, false);
			}

			FIRST_PROGRAMME_TIME = round(FIRST_PROGRAMME_TIME, 'floor');
			LAST_PROGRAMME_TIME = round(LAST_PROGRAMME_TIME, 'ceil');

			PROGRAMMES_TIME = LAST_PROGRAMME_TIME - FIRST_PROGRAMME_TIME;
			PROGRAMMES_WIDTH = getPixels(PROGRAMMES_TIME);

			return data;

			function getProgrammeTime(programmeTime, epgProgrammeTime, isStartTime) {
				if (!programmeTime) {
					return epgProgrammeTime;
				}

				return isStartTime ?
					// ищем самое раннее время начала программы
					programmeTime > epgProgrammeTime ? epgProgrammeTime : programmeTime :
					// ищем самое позднее время окончания программы
					programmeTime < epgProgrammeTime ? epgProgrammeTime : programmeTime;

			}
			/**
				* Ф-ия округляет время для ближайших 0 или 30 минут
				* @param {number} programmeTime - время начала или конца программы
				* @param {string} type - floor | ceil
				* */
			function round(programmeTime, type) {
				var minutes = new Date( programmeTime * 1000 ).getMinutes();

				if (type === 'floor' && minutes < 30) {
					return (programmeTime|0) - minutes * 60;
				}

				if (type === 'ceil' && minutes > 30) {
					return (programmeTime|0) + ( 60 - minutes ) * 60;
				}

				return programmeTime;
			}
		}
		function setPositions(data) {
			var countId = 0;

			for (var i = 0; i < _tv_channels.length; i++) {
				var channel = _tv_channels[i],
					epgName = getEpgName(channel),
					programmes = getProgrammes(epgName, data);

				// Делаем так, чтобы у каналов без EPG, тоже был item с id
				if (typeof programmes === 'undefined') {
					channel.epg = epgName;
					data[epgName] = {
						epg: [{ noInformation: true, id: countId }]
					};

					countId++;
					continue;
				}

				for (var j = 0; j < programmes.length; j++, countId++) {
					var programme = programmes[j],
						duration = programme.stopTimestamp - programme.startTimestamp,
						position = programme.startTimestamp - FIRST_PROGRAMME_TIME;

					programme.duration = duration;
					programme.width = getPixels(duration) - PROGRAMME_MARGIN_RIGHT;
					programme.left = getPixels(position);
					programme.id = countId;
				}
			}

			return data;

			function getEpgName(channel) {
				return typeof channel.epg === 'undefined' || channel.epg === '' ? channel.id : channel.epg;
			}
			function getProgrammes(epgName, data) {
				return typeof data[epgName] !== 'undefined' && typeof data[epgName].epg !== 'undefined' ?
					data[epgName].epg : undefined;
			}

		}
		function getPixels(duration) {
			var percent = ( duration * 100 ) / LENGTH_IN_TIME;
			return Math.round( LENGTH_IN_PX * ( percent / 100 ) );
		}

	}

	function isNoProgramme() {
		return tv_cur_elem[0].closest('.no_programme');
	}

})();
