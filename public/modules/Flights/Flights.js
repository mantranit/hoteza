(function () {
	var flights = {
			departures: {
				LED: {
					airport_town: 'St. Petersburg',                  // город аэропорта вылета
					airport_name: 'Pulkovo Airport',                 // название аэропорта вылета
					airport_code: 'LED',                             // iata-код аэропорта вылета
					airport_dateTime: '2020-01-10T12:34:53+03:00',   // дата и время аэропорта вылета
					departures: [
						{
							dateTime: '2020-01-10T12:00:00+03:00',   // дата и время вылета
							gate: null,                                 // номер выхода на посадку
							terminal: null,
							flight: 'DP 206',                        // номер рейса
							airline: 'Pobeda',                       // название авиакомпании
							destination: 'Moscow',                   // город прибытия
							destination_iata: 'BKA',                 // iata-код аэропорта города прибытия
							status: null                               // статус рейса
						},
						{
							dateTime: '2020-01-10T12:00:00+03:00',
							gate: null,
							terminal: null,
							flight: 'N4 267',
							airline: 'Nordwind Airlines',
							destination: 'Rostov-on-Don',
							destination_iata: 'ROV',
							status: null
						}
					]
				},
				BCN: {
					airport_town: 'Barcelona',
					airport_name: 'Barcelona-El Prat',
					airport_code: 'BCN',                             // iata-код аэропорта вылета
					airport_dateTime: '2020-01-10T12:34:53+03:00',   // дата и время аэропорта вылета
					departures: [
						{
							dateTime: '2020-01-10T12:00:00+03:00',   // дата и время вылета
							gate: null,                                 // номер выхода на посадку
							terminal: null,
							flight: 'DP 206',                        // номер рейса
							airline: 'Pobeda',                       // название авиакомпании
							destination: 'Moscow',                   // город прибытия
							destination_iata: 'BKA',                 // iata-код аэропорта города прибытия
							status: null                               // статус рейса
						},
						{
							dateTime: '2020-01-10T12:00:00+03:00',
							gate: null,
							terminal: null,
							flight: 'N4 267',
							airline: 'Nordwind Airlines',
							destination: 'Rostov-on-Don',
							destination_iata: 'ROV',
							status: null
						}
					]
				},
				MAD: {
					airport_town: 'Madrid',
					airport_name: 'Madrid-Barajas Airport',
					airport_code: 'MAD',                            // iata-код аэропорта вылета
					airport_dateTime: '2020-01-10T12:34:53+03:00',   // дата и время аэропорта вылета
					departures: [
						{
							dateTime: '2020-01-10T12:00:00+03:00',   // дата и время вылета
							gate: null,                                 // номер выхода на посадку
							terminal: null,
							flight: 'DP 206',                        // номер рейса
							airline: 'Pobeda',                       // название авиакомпании
							destination: 'Moscow',                   // город прибытия
							destination_iata: 'BKA',                 // iata-код аэропорта города прибытия
							status: null                               // статус рейса
						},
						{
							dateTime: '2020-01-10T12:00:00+03:00',
							gate: null,
							terminal: null,
							flight: 'N4 267',
							airline: 'Nordwind Airlines',
							destination: 'Rostov-on-Don',
							destination_iata: 'ROV',
							status: null
						}
					]
				}
			},

			arrivals: {
				LED: {
					airport_town: 'St. Petersburg',                  // город аэропорта вылета
					airport_name: 'Pulkovo Airport',                 // название аэропорта вылета
					airport_code: 'LED',                             // iata-код аэропорта вылета
					airport_dateTime: '2020-01-10T12:51:59+03:00',   // дата и время аэропорта вылета
					arrivals: [
						{
							dateTime: '2020-01-10T11:55:00+03:00',   // дата и время вылета
							terminal: 1,
							flight: 'HY 637',                        // номер рейса
							airline: 'Uzbekistan Airways',                       // название авиакомпании
							from: 'Urgench',                   // город прибытия
							from_iata: 'UGC',                 // iata-код аэропорта города прибытия
							status: null                               // статус рейса
						},
						{
							dateTime: '2020-01-10T11:55:00+03:00',
							terminal: 1,
							flight: 'SU 6324',
							airline: 'Rossia',
							from: 'Kaliningrad',
							from_iata: 'KGD',
							status: null
						}
					]
				},
				BCN: {
					airport_town: 'Barcelona',
					airport_name: 'Barcelona-El Prat',
					airport_code: 'BCN',                             // iata-код аэропорта вылета
					airport_dateTime: '2020-01-10T12:34:53+03:00',   // дата и время аэропорта вылета
					arrivals: [
						{
							dateTime: '2020-01-10T12:00:00+03:00',   // дата и время вылета
							gate: null,                                 // номер выхода на посадку
							terminal: null,
							flight: 'DP 206',                        // номер рейса
							airline: 'Pobeda',                       // название авиакомпании
							destination: 'Moscow',                   // город прибытия
							destination_iata: 'BKA',                 // iata-код аэропорта города прибытия
							status: null                               // статус рейса
						},
						{
							dateTime: '2020-01-10T12:00:00+03:00',
							gate: null,
							terminal: null,
							flight: 'N4 267',
							airline: 'Nordwind Airlines',
							destination: 'Rostov-on-Don',
							destination_iata: 'ROV',
							status: null
						}
					]
				}
			}
		},
		airports = [
			{
				city: 'St. Petersburg',
				name: 'Pulkovo Airport',
				code: 'LED'
			},
			{
				city: 'Barcelona',
				name: 'Barcelona-El Prat',
				code: 'BCN'
			},
			{
				city: 'Madrid',
				name: 'Madrid-Barajas Airport',
				code: 'MAD'
			}],
		directions = ['departures', 'arrivals'];

	/** @example {string} [departures | arrivals] */
	var Direction = null,
		Airport = null,

		PARENT = null,
		ID = null,
		PAGE = null,

		timer = null,

		Statuses = {
			SCHEDULED: 'scheduled',
			DELAYED: 'delayed',
			DIVERTED: 'diverted',
			CANCELED: 'canceled',
			LANDED: 'landed',
			DEPARTED: 'departed'
		},
		Colors = {
			SCHEDULED: null,
			DELAYED: 'color-attention',
			DIVERTED: 'color-attention',
			CANCELED: 'color-attention',
			LANDED: null,
			DEPARTED: null
		};

	window.Flights = {
		deps: [],
		init: function (id, data) {
			if (!id || !data) {
				return false;
			}

			renderMenuItem(data);

			ID = id;
			PAGE = '#' + id;
			airports = data.widget.data;

			if (!airports || !airports.length) {
				log.add('FLIGHTS: List of airports does\'t exist');
				return false;
			}

			return Flights;
		},

		/**
		 * @param {string} type - [flights, airports, directions]
		 * */
		open: function (type) {
			type = typeof type !== 'undefined' ? type : 'flights';
			tv_keydown_override = Flights.serverKeydown;

			if (!PARENT) {
				PARENT = Menu.opened ? 'menu' : HotezaTV.history.lastpage;
			}

			var airport = getAirport();
			if (type === 'flights' && !airport) {
				return Flights.open('airports');
			}

			if (type === 'flights') {
				Loader.start();
				return getData(airport.code, getDirection()).done(function (dataReceived) {
					Loader.stop();

					if (!dataReceived) {
						custom_dialog('alert', getlang('tv_nottelevision'), getlang('bill_error'));
						return Flights.close();
					}

					update();

					render(type);
					navigate(PAGE);

					make_scroll($(PAGE));
					$(PAGE + '_scroll').css('right', '39px');

					var shadows = document.getElementById(ID).querySelectorAll('tr.shadow');
					goToElement(shadows[shadows.length - 1].nextElementSibling, 150);
				});
			}

			render(type);
			return navigate('#' + type);
		},

		close: function () {
			clearTimeout(timer);
			tv_keydown_override = null;
		},

		set: function (type, value) {
			var func = type === 'direction' ? setDirection : setAirport;
			func(value);
		},

		serverKeydown: function (e) {
			var code = getKeyCode(e);
			switch (code) {
				case tv_keys.GREEN:
					Flights.open(active_page_id === 'airports' ? 'flights' : 'airports');
					return true;

				case tv_keys.YELLOW:
					var direction = setDirection((getDirection() === 'departures' ? 'arrivals' : 'departures'));
					Flights.open('flights');
					return true;
			}

			return tv_keydown(e, true);
		}
	};

	/**
	 * @param {string} type - [flights, airports, directions]
	 * @param {string} [to] - ${#id}
	 * */
	function render(type, to) {
		var items = [], data, item,
			direction, airport, flights;

		switch (type) {
			case 'flights':
				direction = getDirection();
				airport = getAirport();
				flights = getFlights(airport, direction);

				data = {
					backBtn: 1,
					parentId: PARENT,
					itemWidth: '25%',
					title: getlang(direction) + ' (' + airport.code + ')',
					content: {
						head: [
							{title: 'time'},
							{title: 'flight'},
							direction === 'departures' ? {title: 'destination'} : {title: 'from'},
							direction === 'departures' ? {title: 'gate'} : {title: 'terminal'},
							{title: 'status'}
						],
						body: flights
					},
					onclose: 'Flights.close();'
				};

				renderPageOnTheStructv2(ID, data, 'table', 'table', null,
					{
						getTitle: function (title, data) {
							switch (title) {
								case 'time':
									return getTime(data.dateLocal);

								case 'destination':
									return data.destination_city + ' (' + data.destination_airport_code + ')';

								case 'from':
									return data.from_city + ' ' + data.from_airport_code;

								case 'status':
									var time = null;
									if (data) {
										if (
											data['status'] === 'LANDED' ||
											data['status'] === 'DEPARTED'
										) {
											time = getTime(data.actualDateLocal);
										}

										if (
											data['status'] === 'SCHEDULED' ||
											data['status'] === 'DELAYED'
										) {
											time = getTime(data.estimatedDateLocal);
										}
									}

									return data ?
										getlang(Statuses[data['status']]) + (time ? ' ' + time : '') :
										data[title];

								default:
									return data[title];
							}
						},
						getClass: function (title, data) {
							var now = (new Date()).getTime(),
								dataTime = data && (new Date(data.dateLocal)).getTime(),
								className = data && now > dataTime ? 'shadow' : '';

							switch (title) {
								case 'terminal':
									return className + ' text-center';

								case 'status':
									var color = data && Colors[data[title]];
									className = className + ' without-carryover';

									return color ? className + ' ' + color : className;

								default:
									return className;
							}
						}
					}
				);

				render('legend', PAGE);

				return true;

			case 'legend':
				var btns = [{
					color: 'yellow',
					title: getlang(getDirection() === 'departures' ? 'arrivals' : 'departures')
				}];

				if (airports.length > 1) {
					btns.unshift({
						color: 'green',
						title: getlang('change_airport')
					});
				}

				$(to).append(templates_cache['features_legend'].render({
					id: 'features_flights_legend',
					buttons: btns
				}));

				return;

			case 'airports':
				for (var i = 0; i < airports.length; i++) {
					item = airports[i];
					items.push({
						name: item.name + ' (' + item.code + ')',
						onvclick: 'Flights.set(\'airport\', ' + i + ');Flights.open(\'flights\');'
					});
				}

				data = {
					id: 'airports',
					klass: '',
					lang: {
						title: getlang('choose_airport')
					},
					data: items,
					backBtn: Menu.opened ? '#menu' : HotezaTV.history.lastpage,
					tpl: true,
					tplType: 'popup_list',
					to: null,
					onclose: '$(\'#airports\').remove();'
				};

				UI.popup_list_page(data);

				render('legend', '#airports');

				return true;

			case 'directions':
				for (var i = 0; i < directions.length; i++) {
					item = directions[i];
					items.push({
						name: getlang(item) + ' ' + (item === 'departures' ? '<img src=\'i/airplane-take-off.svg\'>' : '<img src=\'i/airplane-landing.svg\'>'),
						onvclick: 'Flights.set(\'directions\', \'' + item + '\');Flights.open(\'flights\');'
					});
				}

				airport = getAirport();
				data = {
					id: 'directions',
					klass: '',
					lang: {
						title: airport.name + ' (' + airport.code + ')'
					},
					data: items,
					backBtn: PAGE,
					tpl: true,
					tplType: 'popup_list',
					to: null
				};

				return UI.popup_list_page(data);
		}
	}

	//TODO: переделать на общее построение
	function renderMenuItem(data) {
		var menuItem = document.querySelector('li[href="' + data.link + '"]');
		if (menuItem === null) {
			return false;
		}

		menuItem.insertAdjacentHTML(
			'afterbegin',
			templates_cache['inner_menu_item'].render(data)
		);
	}

	function update() {
		clearTimeout(timer);

		timer = setTimeout(function () {
			if (active_page === PAGE) {
				Flights.open('flights');
			}
		}, 60 * 1000);
	}

	function getData(code, direction) {
		var d = $.Deferred();

		$.post(
      "https://aae0-58-187-184-107.ngrok-free.app/api/v1/getScheduleAirport",
      JSON.stringify({
        code: [code],
        type: direction,
      }),
      function (r) {
        switch (r.result) {
          case 0:
            var result = updateData(r.data, direction);
            result === false && Flights.set("airport", null);

            d.resolve(result);
            break;

          default:
            log.add(
              "Flights: ERROR: Get Schedule Airport, message from server - " +
                r.message
            );
            d.resolve(false);
            break;
        }
      }
    ).fail(function (e) {
      d.resolve(false);
    });

		return d.promise();

		function updateData(data, direction) {
			if (data.length === 0) {
				return false;
			}

			var airports = Object.keys(data);
			for (var i = 0; i < airports.length; i++) {
				var airport = airports[i];
				if (typeof data[airport][direction] === 'undefined') {
					return false;
				}

				flights[direction][airport] = data[airport];
			}

			return true;
		}
	}

	function getTime(date) {
		if (!date) {
			return '';
		}

		date = new Date(date);
		return lz(date.getHours()) + ':' + lz(date.getMinutes());
	}

	function getFlights(airport, direction) {
		var output = null;
		try {
			output = flights[direction][airport.code][direction];
		} catch (e) {
			console.log('Error', e);
			log.add('Error: ' + e);
		}
		return output;
	}

	function getDirection() {
		if (Direction) {
			return Direction;
		}

		var data = load_data();
		data.flights = typeof data.flights !== 'undefined' ? data.flights : {};
		Direction = data.flights.direction = typeof data.flights.direction !== 'undefined' ? data.flights.direction : 'departures';
		save_data(data);

		return Direction;
	}

	function setDirection(direction) {
		var data = load_data();
		Direction = data.flights.direction = direction;
		save_data(data);

		return Direction;
	}

	function getAirport() {
		var data = load_data();
		if (data.flights && data.flights.airport) {
			Airport = data.flights.airport;
		}

		return Airport;
	}

	/**
	 * @param {number|null} airport - индекс элемента в массиве Airports
	 * */
	function setAirport(airport) {
		var data = load_data();
		data.flights = typeof data.flights !== 'undefined' ? data.flights : {};
		Airport = data.flights.airport = airport === null ? airport : airports[airport];
		save_data(data);

		return true;
	}
})();
