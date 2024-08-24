var Housekeeping = {
	deps: ['ServiceCodes'],
	init: function () {
		if (dataIsAvailable()){
			Housekeeping.data = getData();
		}else{
			log.add('Housekeeping: data unavailable');
			return false;
		}

		Housekeeping.render('housekeeping');

		ServiceCodes.registerListener('7001', function(){
			Housekeeping.open();
		});


		function dataIsAvailable() {
			return (
				isset('structv2.housekeeping') &&
				isset('structv2.housekeeping').length !== 0
			);
		}
		function getData() {
			var data = isset('structv2.housekeeping');

			if (
				!('minibar' in data) ||
				data.minibar.length === 0
			) {
				delete data.minibar;
			}

			if (
				!('roomStatus' in data) ||
				data.roomStatus.length === 0
			) {
				delete data.roomStatus;
			}

			return data;
		}
	},
	data: false,
	open: function (to) {
		if (!Housekeeping.data) custom_dialog('alert', 'Housekeeping is not available', '');

		to = typeof to === "undefined" ?
			'#housekeeping' :
			to.indexOf('#') === -1 ? '#' + to : to;

		switch (to) {
			case '#room_status_page':
				Housekeeping.render('roomStatus');
				break;

			case '#minibar':
				Housekeeping.render('minibar');
				break;
		}

		navigate(to);
	},
	close: function (type) {
		$('#' + type).remove();
	},
	send: function (type, data) {
		var request = createRequestData(type, data);

		if (!request) return custom_dialog('alert', 'Please enter data', '');

		Loader.start();

		$.post(
      "http://103.153.72.195:8080/api/v1/housekeeping",
      request,
      function (response) {
        switch (response.result) {
          case 0:
            success();
            log.add("HOUSEKEEPING: data was send");
            break;
          case 2:
            fail(2);
            log.add("HOUSEKEEPING: hotel id is wrong");
            break;

          case 3:
            fail(3);
            log.add("HOUSEKEEPING: service is turn off");
            break;

          case 4:
            fail(4);
            log.add("HOUSEKEEPING: room number is wrong");
            break;

          case 5:
            fail(5);
            log.add("HOUSEKEEPING: data are invalid");
            break;
          default:
            fail();
            log.add("Housekeeping: response unknown");
            break;
        }

        Loader.stop();
      },
      "json"
    ).fail(function (e) {
      Loader.stop();
      fail();
    });

		function createRequestData(type, data) {
			switch (type) {
				case 'roomStatus' :
					return {
						hotelId: get_hotelId(),
						roomNumber: tv_room,
						type: type,
						data: data
					};

				case 'minibar':
					var returnedData = {
						hotelId: get_hotelId(),
						roomNumber: tv_room,
						type: type
					},
						hasData = false;

					var items = document.querySelectorAll('#minibar .shop_plusminus');
					for (var i = 0; i < items.length; i++) {
						var item = items[i],
							amount = item.querySelector('#shop_amount'),
							qnt = parseInt(amount.innerHTML);

						if (qnt) {
							hasData = true;
							returnedData['data['+ item.getAttribute('id') +']'] = qnt;
						}
					}

					return hasData ? returnedData : null;

			}
		}
		function success() {
			switch (type) {
				case 'roomStatus':

					$id('room_status_item').innerHTML = Housekeeping.data.roomStatus[data].title;
					Housekeeping.open('housekeeping');

					break;

				case 'minibar':

					$id('minibar_item').innerHTML = 'Minibar refill checked';
					Housekeeping.open('housekeeping');

					break;
			}
		}
		function fail(responseCode) {
			Housekeeping.open('housekeeping');

			switch(responseCode) {
				case 2:
					custom_dialog('error', 'Hotel id is wrong', '');
					break;

				case 3:
					custom_dialog('error', 'Housekeeping turn off', '');
					break;

				case 4:
					custom_dialog('error', 'Room number is wrong', '');
					break;

				case 5:
					custom_dialog('error', 'Data are invalid', '');
					break;

				default:
					custom_dialog('error', 'Something is wrong. Check network or ask your administrator', '');
					break;
			}
		}
	},
	render: function (type) {
		var data,
			items = [],
			html;

		switch (type) {
			case 'housekeeping':
				var keys = Object.keys(structv2.housekeeping);

				if (keys.length === 2) {
					items = [
						{
							id: 'room_status_item',
							className: 'selectable',
							title: 'Select room status',
							action: 'Housekeeping.open(\'room_status_page\');'
						},
						{
							id: 'minibar_item',
							className: null,
							title: 'Check minibar refill',
							action: 'Housekeeping.open(\'minibar\');'
						}
					];
				}
				else if (keys.indexOf('roomStatus') !== -1) {
					items = [
						{
							id: 'room_status_item',
							className: 'selectable',
							title: 'Select room status',
							action: 'Housekeeping.open(\'room_status_page\');'
						}
					];
				}
				else {
					items = [
						{
							id: 'minibar_item',
							className: null,
							title: 'Check minibar refill',
							action: 'Housekeeping.open(\'minibar\');'
						}
					];
				}

				data = {
					id: 'housekeeping',
					backBtn: 0,
					title: 'Room ' + tv_room + ' – Service Menu',
					content: {
						list: items,
						buttons: [{
							title: 'Quit Service Menu',
							type: 'onvclick',
							action: 'navigate(\'#menu\');'
						}]
					}
				};

				html = templates_cache["list_items"].render(data);
				document.getElementById('container').insertAdjacentHTML('beforeend', html);

				break;

			case 'roomStatus':
				for (var i in Housekeeping.data.roomStatus) {
					var roomStatus = Housekeeping.data.roomStatus[i],
						item = {};

					// if (
					// 	storage.getItem('token') !== '' &&
					// 	storage.getItem('token') &&
					// 	!roomStatus.checkin
					// ) continue;

					item.name = roomStatus.title;
					item.onvclick = 'Housekeeping.send(\'roomStatus\', '+ parseInt(i) +');';

					items.push(item);
				}

				data = {
					id: 'room_status_page',
					klass: '',
					lang: {
						title: 'Select room status'
					},
					data: items,
					backBtn: '#housekeeping',
					tpl: true,
					tplType: 'popup_list',
					to: null,
					onclose: 'Housekeeping.close(\'room_status_page\');'
				};

				UI.popup_list_page(data);

				break;

			case 'minibar':
				for (var i in Housekeeping.data.minibar) {
					var receivedItem = Housekeeping.data.minibar[i],
						item = {};

					if (receivedItem.type === 'category') {
						item.title = receivedItem.title;
						item.items = [];

						for (var j in receivedItem.items) {
							var child = {
								id: receivedItem.items[j].id,
								title: receivedItem.items[j].title,
								type: 'counter'
							};

							item.items.push(child);
						}
					}
					else {
						item.id = receivedItem.id;
						item.title = receivedItem.title;
						item.type = 'counter';
					}

					items.push(item);
				}

				data = {
					id: 'minibar',
					backBtn: 1,
					parentId: 'housekeeping',
					title: 'Minibar',
					lang: getObjectLang(),
					content: {
						list: items,
						buttons: [{
							title: 'Confirm',
							type: 'onvclick',
							action: 'Housekeeping.send(\'minibar\');'
						}]
					},
					onclose: 'Housekeeping.close(\'minibar\');'
				};

				//TODO: использовать нормальные обёртки как везде
				html = templates_cache["list_items_toppings"].render(data);
				document.getElementById('container').insertAdjacentHTML('beforeend', html);

				break;
		}

	}
};
