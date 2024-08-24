var currency_format,
	service_fee;

function shop_init_prices() {
	currency_format = structv2.config.currency;
	service_fee = structv2.cart;

	$('.price').each(function(){$(this).html(accounting.formatMoney($(this).html(), currency_format));});
}

/**
 * @param {string|object} _this – id товара
 *                                объект - ссылка на кнопку где произошло событие
 * @param {string} [productUniqueId] – передается, если на страницу товара перешли из Корзины
 *                                 для его редактирования
 * */
function shop_view_item(_this, productUniqueId) {
	var id = getProductId(_this),

		shopItem = $('#shopitem'),
		item = structv2.pages['id_' + id],

		editingData = shop_get_editing_data(productUniqueId),
		amount = productUniqueId ? editingData.amount : 1;

	if (item.serviceId) {
		return navigate('#' + item.id);
	}

	shopItem.attr('data-order-id', productUniqueId ? editingData.orderId : '');
	shopItem.attr('data-is-editing', productUniqueId ? 1 : 0);

	shopItem.find('.content').css('top', '0');

	shopItem.attr('itemid', id);
	shopItem.find('H1').html(item.title);

	//TODO: сделать нормально вёрстку, чтобы при отсутствии картинки текст был на весь экран
	shopItem.find('.wrap_img').css('backgroundImage', '');
	shopItem.find('.wrap_img').html('');
	if(item.image) {
		shopItem.find('.wrap_img').css('backgroundImage', 'url(' + item.image + ')');
	} else if(item.icon) {
		shopItem.find('.wrap_img').html(SVG.iconsValue[item.icon]);
	}

	shopItem.find('.shop_descr').html(item.text);
	shopItem.find('.shop_price').html(accounting.formatMoney(item.cost, currency_format));
	shopItem.find('#shop_amount').html(amount);

	$('.hide_on_addtocart').show();
	$('.show_on_addtocart').hide();

	isAdditionalInfoExist(item) ?
		shopItem.addClass('additional_info') : shopItem.removeClass('additional_info');

	shop_set_tags_on_shop_page(item);
	shop_set_hours_on_shop_page(item);
	shop_set_btn_data(item, productUniqueId);

	$('#shopitem_scroll').remove();

	// необходимо установить id магазина при переходе на shopitem
	// из любой части приложения в случае перехода через CustomNotification
	var shopId = getShopId(id);
	shopId && Services && Services.setShopId(shopId);

	navigate('#shopitem', null, true);

	// TODO: сделать эту ф-ию универсальной и использовать в shop_set_tags_on_shop_page, shop_set_hours_on_shop_page
	function isAdditionalInfoExist(product) {
		return (
			product.workingHours ||
			(
				product.tagFilter && product.tagFilter.length
			)
		);
	}
	function getProductId(data) {
		if (typeof data !== 'object') {
			return data;
		}

		return $(data).attr('shopitemid') ? $(data).attr('shopitemid') : parseInt($(data).attr('cartitemid'));
	}
}
/**
 * @param {string} orderId
 * @param {string} orderType
 * @param {array} [unavailableProducts] - список недоступных товаров на выбранное время
 *                                      передается в shop_order
 * */
function shop_view_order(orderId, orderType, unavailableProducts) {
	var page = Services.renderView(orderId, orderType, unavailableProducts);
	navigate('#' + page);
}
function shop_back(_this) {
	var container = $(_this).closest('.page'),
		isEditing = parseInt(container.attr('data-is-editing')),

		orderId, order;

	if (
		container.attr('id') === 'shopitem' &&
		!isEditing
	) {
		var parentId = getPageFromStruct(container.attr('itemid')).parentId;
		return navigate('#' + parentId, 'back');
	}

	if (isEditing) {
		orderId = container.attr('data-order-id');

		order = Services.updateOrderStatus({
			from: 'editing',
			to: 'not_placed',
			id: orderId
		});

		Services.renderView(order.id, 'not_placed');

		return navigate('#cart');
	}

	var id = $(_this).closest('.page').attr('data-product-id');
	Services.deleteProduct();

	shop_view_item(id);
}

function shop_repeat_order(_this, fromOrderType) {
	var orderId = $(_this).closest('.page').attr('data-order-id');

	var order = Services.updateOrderStatus({
		from: fromOrderType,
		to: 'not_placed',
		id: orderId,
		clone: true
	});

	shop_view_order(order.id, 'not_placed');
}

// TODO: объединить следующие две ф-ии в одну
function shop_set_tags_on_shop_page(product) {
	var container = $('#shopitem .info');

	clear_tags();
	if (!product.tagFilter || !product.tagFilter.length) {
		return false;
	}

	container.append(create_tags(product));

	function clear_tags() {
		container.find('.tags').remove();
	}
	function create_tags(product) {
		return templates_cache['tags_on_shop_page'].render(product);
	}
}
function shop_set_hours_on_shop_page(product) {
	var container = $('#shopitem .info');

	clear_hours();
	if (!product.workingHours) {
		return false;
	}

	container.append(create_hours(product));

	function clear_hours() {
		container.find('.working-hours').remove();
	}
	function create_hours(product) {
		return templates_cache['working_time_on_shop_page'].render(product);
	}
}

function shop_set_btn_data(product, productUniqueId) {
	var btn = document.querySelector('#shopitem .button_wrap .button');

	if(!btn){
		console.log('Shop: shop_set_btn_data button not exist');
		return false;
	}

	btn.setAttribute(
		'onvclick',
		productUniqueId ?
			'shop_next_order_step(this, \''+ productUniqueId +'\')' :
			'shop_next_order_step(this)'
	);

	if (product.toppings && product.toppings.length) {
		return btn.innerHTML = getlang('choose_options');
	}

	if (product.upsell || productUniqueId) {
		return btn.innerHTML = getlang('mobileAppContent-welcomePage-button-continue');
	}

	return btn.innerHTML = getlang('mobileAppContent-mainContent-label-addToCart');
}

function shop_next_order_step(_this, productUniqueId) {
	var parent = $(_this).closest('.page'),

		id = getProductId(parent),
		product = structv2.pages['id_' + id],

		editingData = typeof productUniqueId !== 'undefined' ?
			shop_get_editing_data(productUniqueId) : productUniqueId,

		fromPage = getFromPage(parent),
		toPage = getNextPage(fromPage, product, editingData);

	if (requiredField.has(fromPage) && !requiredField.isValid()) {
		return requiredField.showInvalidFields();
	}

	runRequiredAction({
		id: id,
		to: toPage,
		from: fromPage,
		parent: parent,
		editingData: editingData
	});
	prepareNextPage({
		to: toPage,
		product: product,
		parent: parent,
		editingData: editingData
	});

	navigate('#' + toPage);

	function getProductId(parent) {
		switch (parent.attr('id')) {
			case 'shopitem':
				return parent.attr('itemid');

			case 'toppings':
			case 'order_details':
				return parent.attr('data-product-id');

			default:
				return parent.attr('id');
		}
	}
	function getNextPage(from, product, editingData) {
		switch (from) {
			case 'services_wakeup':
				return 'time_picker';

			case 'service':
				if (product.toppings && product.toppings.length) {
					return 'toppings';
				}

				return 'delivery_service_information';

			case 'shopitem':
				if (product.toppings && product.toppings.length) {
					return 'toppings';
				}

				if (typeof editingData !== 'undefined') {
					return 'cart';
				}

				if (product.upsell) {
					return 'order_details';
				}

				return 'information';

			case 'toppings':
				if (typeof editingData !== 'undefined') {
					return 'cart';
				}

				if (product.serviceId) {
					return 'delivery_service_information';
				}

				if (product.upsell || Services.getProduct(product.id).toppings) {
					return 'order_details';
				}

				return 'information';

			case 'order_details':
				return 'information';
		}
	}
	function getFromPage(parent) {
		if (
			parent.hasClass('service_page') &&
			parent.attr('id') !== 'services_wakeup'
		) {
			return 'service';
		}

		return parent.attr('id');
	}
	function runRequiredAction(ctx) {
		switch (ctx.from) {
			case 'shopitem':
			case 'service':
				var amount = ctx.parent.find('#shop_amount').html();
				amount = isNaN(amount) ? 1 : amount;

				if (typeof ctx.editingData !== 'undefined') {
					Services.updateProduct(
						ctx.editingData.uniqueId,
						'amount',
						parseInt(amount),
						'editing'
					);
				}
				else {
					Services.setProduct({
						id: ctx.id,
						amount: parseInt(amount)
					});
				}
				break;

			case 'toppings':
				var toppings = getAddedToppings(ctx);
				if (toppings) {
					if (typeof ctx.editingData !== 'undefined') {
						Services.updateProduct(
							ctx.editingData.uniqueId,
							'toppings',
							toppings,
							'editing'
						);
					}
					else {
						Services.updateProduct(
							ctx.id,
							'toppings',
							toppings
						);
					}
				}

				break;

			case 'order_details':
				break;
		}

		function getAddedToppings(ctx) {
			var inputs = ctx.parent.find('.shop_plusminus, .shop_select, .shop_radio'),
				toppings = {},
				hasTopping = false;

			for (var i = 0; i < inputs.length; i++) {
				var input = inputs[i];

				if (input.classList.contains('shop_plusminus')) {
					var amount = parseInt(input.querySelector('[id="shop_amount"]').innerHTML);
					if (amount) {
						toppings[input.id] = {
							amount: amount,
							price: input.dataset.price.replace(' ', ''),
							title: input.dataset.title
						};
						hasTopping = true;

						continue;
					}
				}

				if (input.classList.contains('shop_radio')) {
					var isAdded = parseInt(input.querySelector('[id="shop_amount"]').dataset.value);
					if (isAdded) {
						toppings[input.id] = {
							amount: 1,
							price: input.dataset.price.replace(' ', ''),
							title: input.dataset.title
						};
						hasTopping = true;

						continue;
					}
				}

				if (input.classList.contains('shop_select')) {
					var selectedValue = parseInt(input.dataset.selectedValue);
					if (selectedValue) {
						toppings[selectedValue] = {
							amount: 1,
							price: input.dataset.price.replace(' ', ''),
							title: input.dataset.title
						};
						hasTopping = true;
					}
				}
			}

			return hasTopping ? toppings : null;
		}

		if (ctx.to === 'delivery_service_information') {
			var product = structv2.pages['id_' + ctx.id];
			if(product.hasChoiceOfTime === false){
				toPage = fromPage;
				service_post('undefined', 'now');
			}
		}
	}
}
function prepareNextPage(ctx) {
	var data,
		isEditing = typeof ctx.editingData !== 'undefined';

	switch (ctx.to) {
		case 'delivery_service_information':
			informationPage.open({
				type: 'dt',
				orderId: 'undefined',
				isService: true,
				back: 'navigate(HotezaTV.history.lastpage, \'back\');'
			});
			break;

		case 'toppings':
			data = {
				withoutContainer: true,
				backBtn: 1,
				onvclick: 'shop_back(this);',
				title: getlang('options'),
				content: {
					list: [{
						items: getToppings(ctx.product, ctx.editingData)
					}],
					buttons: [{
						title: getlang('mobileAppContent-welcomePage-button-continue'),
						type: 'onvclick',
						action: isEditing ?
							'shop_next_order_step(this, \''+ ctx.editingData.uniqueId +'\')' :
							'shop_next_order_step(this)'
					}]
				}
			};

			var toppings = document.getElementById('toppings');

			toppings.setAttribute('data-product-id', ctx.product.id);
			toppings.setAttribute('data-is-editing', isEditing ? '1' : '0');
			toppings.setAttribute(
				'data-order-id',
				isEditing ? Services.getOrders('editing')[Services.getShopId()].id : ''
			);
			toppings.innerHTML = '';
			toppings.insertAdjacentHTML(
				'beforeend',
				templates_cache["list_items_toppings"].render(data, {
					getlang: getlang,
					isRequired: (function () {
						var toppings = ctx.product.toppings,
							isRequired = false;

						for (var i = 0; i < toppings.length; i++) {
							var topping = toppings[i];
							if (topping.required) {
								isRequired = true;
								break;
							}
						}

						return function () {
							return isRequired;
						};
					})(),
					formatMoney: function (cost) {
						return accounting.formatMoney(cost, currency_format);
					}
				}));

			break;

		case 'order_details':
			data = {
				back: {
					type: 'onvclick',
					value: 'shop_back(this);'
				},
				content: getContentForOrderDetails('summary')
			};

			var summary = document.getElementById('order_details');

			summary.setAttribute('data-product-id', ctx.product.id);
			summary.innerHTML = '';
			summary.insertAdjacentHTML(
				'beforeend',
				templates_cache["list_of_products"].render(data, {
					getlang: getlang,
					checkProductAvailability: function () {
						return false;
					}
				})
			);

			renderUpSaleView(data);
			break;

		case 'time_picker':
			time_picker.open(
				'#' + ctx.product.id,
				'service_post(undefined, $(this).attr(\'time\'))',
				undefined,
				undefined,
				'Services.deleteProduct();'
			);

			break;

		case 'information':
			Services.updateOrderStatus({
				from: 'not_added',
				to: 'not_placed'
			});

			informationPage.open({ type: 'pa' });
			break;

		// режим редактирования товара из корзины
		case 'cart':
			var order = Services.updateOrderStatus({
				from: 'editing',
				to: 'not_placed',
				id: ctx.editingData.orderId
			});

			Services.renderView(order.id, 'not_placed');

			break;
	}

	function getToppings(product, editingData) {
		var items = [],
			addedToppings = typeof editingData !== 'undefined' && editingData.toppings ?
				editingData.toppings : {};

		for (var i = 0; i < product.toppings.length; i++) {
			var topping = Object.assign({}, product.toppings[i]);

			topping.title = topping.name;
			topping.price = getToppingPrice(topping, addedToppings);

			switch (topping.type) {
				case 'counter':
					topping.amount = addedToppings[topping.id] ?
						addedToppings[topping.id].amount / editingData.amount : 0;
					break;

				case 'select':
					topping = getSelectedTopping(topping, addedToppings);
					topping.values = JSON.stringify(topping.values);
					break;

				case 'radio':
					if (addedToppings[topping.id]) {
						topping.value = getlang('yes');
						topping.amount = 1;
					}
					else {
						topping.value = getlang('no');
						topping.amount = 0;
					}
					break;
			}

			items.push(topping);
		}

		return items;

		function getSelectedTopping(topping, addedToppings) {
			var selectedTopping = '', value = getlang('select_none');

			// режим редактирования товара
			if (Object.keys(addedToppings).length) {
				for (var i = 0; i < topping.values.length; i++) {
					var selectItem = topping.values[i];
					if (addedToppings[selectItem.id]) {
						selectedTopping = selectItem.id;
						value = selectItem.name;

						break;
					}
				}
			}
			// первоначальное добавление товара
			// если топпинг == required, устанавливаем первый в списке топпинг
			else if (topping.required) {
				selectedTopping = topping.values[0].id;
				value = topping.values[0].name;
			}

			return Object.assign(
				{},
				topping,
				{ selectedTopping: selectedTopping, value: value }
			);
		}
	}
	function renderUpSaleView(data) {
		var upsell = data.content.list[0].upsell;
		if (!upsell) {
			return false;
		}

		upsell.text = getlang('add') + ' ' + upsell.title + '?';
		upsell.price = accounting.formatMoney(upsell.cost, currency_format);

		upsell.content = {
			title: getlang('suggestions'),
			button_text: getlang('add')
		};

		var container = document.querySelector('#order_details .content');
		container.insertAdjacentHTML('afterbegin', templates_cache['features_up_sale'].render(upsell));
	}
}
function getToppingPrice(topping, addedToppings) {
	if (
		topping.type !== 'select' ||
		(
			// если у самого топпинга есть цена,
			// то используем ее, не перебирая дочерние элементы
			topping.type === 'select' &&
			topping.price !== ''
		)
	) {
		topping.isSamePrice = true;
		return topping.price ? topping.price : null;
	}

	var price, isSamePrice = true;
	for (var i = 0; i < topping.values.length; i++) {
		var toppingValue = topping.values[i];

		if (
			typeof price === 'undefined' ||
			addedToppings[toppingValue.id]
		) {
			price = toppingValue.price;
		}

		var nexToppingValue = typeof topping.values[i + 1] !== 'undefined' ?
			topping.values[i + 1] : null;

		if (nexToppingValue && price !== nexToppingValue.price) {
			isSamePrice = false;
		}
	}

	topping.isSamePrice = isSamePrice;
	return isSamePrice || Object.keys(addedToppings).length ?
		// используем рекурсию для получения цены, так как
		// передаваемый объект не имеет поля type
		getToppingPrice({ price: price }) :
		null;
}

/**
	* Формирование данных контента
	* @param {string} page - [ summary | cart | other_details ]
	* @param {string} orderId - id заказа
	* @param {string} [orderType] - [ not_placed | placed | completed ]
	* */
function getContentForOrderDetails(page, orderId, orderType) {
	orderType = getOrderType(page, orderType);

	var data = {},
		items = [],
		totalPrice = 0,
		upsell = null,
		order = Services.getOrder(orderType, orderId),
		products = order.products,
		isService = false;

	data.title = getlang('your_order');

	for (var i = 0; i < products.length; i++) {
		var price = 0,
			product = products[i],
			productFromStruct = getPageFromStruct(product.id),

			/**
				* если контент запрашивается для еще не оформленного заказа используем
				* стоимость указанную в struct
				* если для уже оформленного, используем данные с сервера на тот случай, если данные
				* о товаре изменились с момента заказа
				* */
			cost = (page !== 'cart' && product.price) ? product.price : productFromStruct.cost,
			item = Object.assign({}, {
				id: product.id,
				uniqueId: product.uniqueId,
				title: productFromStruct.title,
				amount: product.amount,
				pieces: getPieces(product.pieces)
			});

		cost = isNaN(cost) ? 0 : cost;

		isService = (
			!isService &&
			(
				productFromStruct.serviceId ||
				productFromStruct.type === 'service'
			)
		) ? true : isService;
		upsell = productFromStruct.upsell && !upsell ?
			Object.assign({}, getPageFromStruct(productFromStruct.upsell)) : upsell;

		item = setAction(item, page, orderId);

		if (product.toppings) {
			var toppings = [];

			for (var id in product.toppings) {
				var topping = Object.assign({}, product.toppings[id]);

				if (topping.price) {
					totalPrice += topping.amount * topping.price;
					topping.price = accounting.formatMoney(topping.amount * topping.price, currency_format);
				}

				toppings.push(topping);
			}

			item.toppings = toppings;
		}

		price += cost * product.amount;
		totalPrice += price;

		item.price = price ? accounting.formatMoney(price, currency_format) : price;

		items.push(item);

	}

	data.items = items;
	data.upsell = upsell;

	return {
		header: getHeader(page),
		totalPrice: getTotalPrice(page, totalPrice, order, isService),
		cutlery: getCutlery(page, orderId, orderType),
		isEmpty: !items.length,
		list: [data],
		buttons: getButtons(page, orderType, orderId, isService)
	};

	function setAction(item, page, orderId) {
		var action = null;

		if (page === 'cart') {
			action = {
				type: 'onvclick',
				action: 'shop_item_edit(\''+ item.uniqueId +'\', \''+ orderId +'\');'
			};
		}

		return action ? Object.assign(item, action) : item;
	}
	function getOrderType(page, orderType) {
		if (typeof orderType !== 'undefined') {
			return orderType;
		}

		switch (page) {
			case 'summary':
				return 'not_added';

			case 'cart':
				return 'not_placed';
		}
	}
	function getHeader(page) {
		switch (page) {
			case 'summary':
				return getlang('summary');

			case 'cart':
				return getlang('mobileAppContent-mainContent-label-cart');

			case 'order_details':
				return getlang('order_details');
		}
	}
	function getTotalPrice(page, totalPrice, order, isService) {
		var serviceFee;
		if (isService) {
			serviceFee = { fee: 0, feeType: '' };
		}
		else {
			serviceFee = typeof order.fee !== 'undefined' ?
				{ fee: order.fee, feeType: order.feeType } : null;
		}

		switch (page) {
			case 'summary':
				return {
					translation: getlang('bill_total'),
					value: accounting.formatMoney(totalPrice, currency_format)
				};

			case 'cart':
			case 'order_details':
				return totalPrice ? {
					translation: getlang('bill_total'),
					value: accounting.formatMoney(
						Math.round10(addServiceFee(totalPrice, serviceFee), -2),
						currency_format
					),
					service_fee: getServiceFee(serviceFee)
				} : totalPrice;
		}

		function getServiceFee(serviceFee) {
			if (serviceFee && !serviceFee.fee) {
				return null;
			}
			if (
				(!service_fee || !service_fee.fee) &&
				!serviceFee
			) {
				return null;
			}

			var appliedServiceFee = serviceFee ? serviceFee : service_fee;

			return {
				// текст в любом случае всегда берем из глобального service_fee
				// если он = undefined в верстке просто будет пустое место
				text: service_fee.text,
				value: appliedServiceFee.feeType === 'percent' ?
					appliedServiceFee.fee + '%' :
					accounting.formatMoney(Math.round(appliedServiceFee.fee*100)/100,currency_format)
			};
		}
	}
	function getButtons(page, orderType, orderId, isService) {
		switch (page) {
			case 'summary':
				return [{
					title: getlang('mobileAppContent-mainContent-label-addToCart'),
					type: 'onvclick',
					action: 'shop_next_order_step(this);'
				}];

			case 'cart':
				var shop = getPageFromStruct(Services.getShopId(orderType, orderId)),
					hasChoiceOfTime = typeof shop.hasChoiceOfTime === 'undefined' ? true : shop.hasChoiceOfTime;

				return [{
					title: getlang('mobileAppContent-mainContent-button-checkout'),
					type: 'onvclick',
					action: hasChoiceOfTime
						? 'informationPage.open({ type: \'dt\', orderId: \''+ (isService ? undefined : orderId) +'\', isService: '+ isService +' })'
						: 'shop_order(\'now\', \''+ orderId +'\');'
				}];

			case 'order_details':
				var buttons;

				if (orderType === 'placed') {
					buttons = [{
						title: getlang('cancel_order'),
						type: 'onvclick',
						action: 'shop_cancel_order(\''+ orderId +'\');'
					}];
				}
				else if (
					orderType === 'completed' ||
					orderType === 'canceled'
				) {
					buttons = [{
						title: getlang('repeat_order'),
						type: 'onvclick',
						action: 'shop_repeat_order(this, \''+ orderType +'\');'
					}];
				}
				else if (orderType === 'in_process') {
					buttons = [];
				}

				return buttons;
		}
	}
	function getCutlery(page, orderId, orderType) {
		if (
			page === 'cart' &&
			getPageFromStruct(Services.getShopId(orderType, orderId)).cutlery
		) {
			return {
				title: getlang('number_of_persons'),
				text: getlang('number_of_cutlery'),
				numOfPerson: order.numOfPerson
			};
		}

		return false;
	}
	function getPieces(pieces) {
		if (pieces === 'none') {
			return pieces;
		}

		return pieces ? getlang('pieces_' + pieces) : getlang('pieces_pcs');
	}
}

function shopitem_optionselect(id, values) {

	var tmp;
	try{
		tmp = JSON.parse(values);
	}catch(e){
	}
	values = tmp;
	select_page('Выбор', values, function(selected_id){
		if(selected_id === false){
			$('#shopitem_option_'+id).html(getlang('select_none'));
			$('#shopitem_option_'+id).attr('selectedvalue', null);
		}else{
			$('#shopitem_option_'+id).html(values[selected_id].name);
			$('#shopitem_option_'+id).attr('selectedvalue', values[selected_id].id);
		}
		navigate('#shopitem', null, true);
	}, 'shopitem');
}

var select_function = new Function;
function select_page(title, options, onselect, back) {
	var selectPage = $('#selectpage'),
		selectPageList;

	//TODO: Пока back - id страницы
	if (selectPage.length === 0) {
		$('#container').append(
			$(
				'<div class="page" id="selectpage">' +
					'<div class="content_wrapper">' +
						'<div class="content">' +
							'<div id="selectpagelist"></div>' +
						'</div>' +
					'</div>' +
					'<div class="header">' +
						'<div ' +
							'class="back" ' +
							'onvclick="navigate(\'#shopitem\', \'back\', true)" ' +
							'href_type="back"' +
						'>' +
							'Назад' +
						'</div>' +
					'</div>' +
				'</div>'
			)
		);

		selectPage = $('#selectpage');
		selectPage.find('.content').css({
			'position': 'relative',
			'top': '0px'
		});
	}

	selectPageList = $('#selectpagelist');
	selectPageList.empty();
	select_function = onselect;
	selectPageList.append('<div class="settings_button" onvclick="select_function(false);">'+getlang('select_none')+'</div>');
	var tmpobj = '';
	for (var key in options) {
		tmpobj += '<div class="settings_button" onvclick="select_function('+key+');">'+options[key].name+'</div>';
	}
	selectPageList.append($(tmpobj));
	selectPageList.children().first().addClass('top');
	selectPageList.children().last().addClass('bottom');

	navigate('#selectpage', null, true);
}

function shop_add_to_cart(id, nonav, amount, toppings) {
	// можно добавить товар без авторизации
	// if (!require_auth()) return;

	var shopItem = $("#shopitem");

	if(!id){
		id = shopItem.attr('itemid');
		amount = parseInt(shopItem.find('#shop_amount').html());
		var tmp = shopItem.find('#shopitemoptions [selectedvalue]');
		toppings = null;
		if(tmp.length){
			toppings = [];
			for(var i=0; i<tmp.length; i++){
				toppings.push($(tmp[i]).attr('selectedvalue'));
			}
		}

		//Анимация добавления в корзину
		$('#shop_addedtocart').html(amount);
		shopItem.find('#shop_amount').html(1);

		informationPage.open({ type: 'pa' });
	}

	if (!amount) amount = 1;

	var tmp = $('#shopcartlist').find('li[cartitemid='+id+']');
	if (tmp.length) {
		tmp = tmp.find('.amount');
		tmp.html(Math.min(parseInt(tmp.html())+amount,20));
	}
	else {
		$('#shopcartlist').append($('li[shopitemid='+id+']').clone()).find('.shopitemdescr').remove();
		$('#shopcartlist li[shopitemid='+id+']').attr('cartitemid', id).attr('shopitemid',null);
		$('#shopcartlist li[cartitemid='+id+']').append('<div class="shop_plusminus"><div class="shop_p" onvclick="shop_add_to_cart('+id+');">&nbsp;</div><div class="amount">'+Math.min(amount, 20)+'</div><div class="shop_m" onvclick="shop_rem_from_cart('+id+');">&nbsp;</div></div>');



		if((tmp = $('#shopcartlist li[cartitemid='+id+']').attr('shopitemoptions')) && toppings){
			try{
				tmp = JSON.parse(tmp);
				var tmpobj = '';
				for(var key in tmp){
					var tmpval = tmp[key];
					for(var i in tmpval.values){
						if(toppings.indexOf(tmpval.values[i].id) != -1){
							tmpobj += '<span style="height:auto;line-height:initial;font-size:12px;">'+tmpval.name+': '+tmpval.values[i].name+'</span>';
						}
					}
				}

				$('#shopcartlist li[cartitemid='+id+'] .shopitemname').after($(tmpobj));
			}catch(e){
				l('JSON error');
			}

			$('#shopcartlist li[cartitemid='+id+']').attr('toppings', JSON.stringify(toppings));
		}

	}

	if(!nonav) shop_recalc();
}

function shop_add_upsale(_this) {
	var upsellId = $(_this).closest('.up-sale').attr('data-product-id'),
		productId = $(_this).closest('.page').attr('data-product-id');

	Services.setProduct({ id: upsellId, amount: 1 });

	prepareNextPage({
		to: 'order_details',
		product: structv2.pages['id_' + productId]
	});

	active_page = null;
	navigate('#order_details');
}

function shop_rem_from_cart(id) {
	if($('#shopcartlist li[cartitemid='+id+']').length){
		if(parseInt($('#shopcartlist li[cartitemid='+id+'] .amount').html())==1){
			$('#shopcartlist li[cartitemid='+id+']').fadeOut(500,function(){$(this).remove();shop_recalc();});
		}else{
			$('#shopcartlist li[cartitemid='+id+']').find('.amount').html(parseInt($('#shopcartlist li[cartitemid='+id+']').find('.amount').html())-1);
		}
	}
	shop_recalc();
}

function shop_recalc() {
	var sum = 0;

	// Добавление сервисного сбора
	setViewServiceFee();

	$('#shop_total').hide();
	$('#shop_cart_empty').hide();
	$('#shopcartlist').find('li[cartitemid]').each(function(obj){
		sum += accounting.unformat($(this).find('.price').html(), currency_format.decimal)*parseInt($(this).find('.amount').html());
	});
	var items_in_cart = $('#shopcartlist').find('li[cartitemid]').length;
	if(items_in_cart){
		$('#shop_cart_indicator').html(items_in_cart).show();
		$('#shop_total').show();
		$('#shop_total_sum').html(accounting.formatMoney(Math.round10(addServiceFee(sum), -2),currency_format));
	}
	else{
		$('#shop_cart_indicator').hide();
		$('#shop_cart_empty').show();
	}
	shop_save();

	function setViewServiceFee() {
		if(!document.getElementById('service_fee')){
			if (service_fee.feeType && service_fee.feeType == 'percent') {
				$('#shop_total P').prepend('<span id="service_fee">' + service_fee.text + ': ' + service_fee.fee + '%</span><br/>');
			}
			else {
				$('#shop_total P').prepend('<span id="service_fee">' + service_fee.text + ': ' + accounting.formatMoney(Math.round(service_fee.fee*100)/100,currency_format) + '</span><br/>');
			}
		}
	}
}
function addServiceFee(sum, fee) {
	var total,
		appliedServiceFee = fee ? fee : service_fee;
	sum = parseFloat(sum);
	appliedServiceFee.fee = parseFloat(appliedServiceFee.fee);

	if (!appliedServiceFee.fee) {
		return sum;
	}

	if (appliedServiceFee.feeType === 'percent') {
		total = sum + (sum * (appliedServiceFee.fee / 100));
	}
	else {
		total = sum + appliedServiceFee.fee;
	}

	return total.toFixed(2);
}

function shop_order(when, orderId, confirmed, callback, withUnavailableProducts) {
	var token = check_auth();
	if (!token) {
		custom_alert(getlang('bill_loginreq'));
		return false;
	}

	// Только оформление сервиса попадает в этот блок кода с orderId === undefined
	if (
		typeof orderId === 'undefined' &&
		!confirmed
	) {
		order = Services.updateOrderStatus({
			from: 'not_added',
			to: 'not_placed'
		});

		orderId = order.id;

		// Проверка введена для заказа сервисов без стоимости
		// Не запрашиваем подтверждение, если у сервиса нет стоимости
		confirmed = hasCheckServicesConfirmed('not_placed', orderId);
	}

	var unavailableProducts = checkDeliveryTime(when, orderId);
	if (
		unavailableProducts.length &&
		!withUnavailableProducts
	) {
		return custom_confirm({
			title: getlang('alert'),
			text: getlang('product_is_unavailable_for_selected_time'),
			confirm: getlang('tv_back'),
			cancel: null,

			onConfirm: shop_view_order.bind(null, orderId, 'not_placed', unavailableProducts) // shop_order.bind(null, when, orderId, confirmed, callback, true),
		});
	}

	if (!confirmed && isset('config.shop.use_confirm_for_order')) {
		var onConfirm = typeof callback !== 'undefined' ?
			'shop_order(\\\''+ when +'\\\', \\\''+ orderId +'\\\', true, \\\''+ callback +'\\\', '+ withUnavailableProducts +');' :
			'shop_order(\\\''+ when +'\\\', \\\''+ orderId +'\\\', true, undefined, '+ withUnavailableProducts +');';

		return informationPage.open({
			type: 'cp',
			onConfirm: onConfirm
		});
	}

	var order = Services.getOrder('not_placed', orderId);

	order.orderTime = time_picker.get_ISO_string(null, true);
	order.deliveryTime = getDeliveryTime(when);

	var serializedOrder = Services.serialize(order)[0];

	$.post(
    "https://18eb-58-187-184-107.ngrok-free.app/api/v1/orderCreate",
    JSON.stringify(
      Object.assign(serializedOrder, { token: token, tvId: Events.TVID() })
    ), //TVID: Фильтрация будильника по зонам
    function (r) {
      /**
       * 0 - успех
       * 100 - успех, повторый заказ
       *
       * 1 - некорректные данные
       * 2 - некоректный токен
       * 3 - гость выселен или не сущуствует
       * 9 - exception
       * */
      switch (r.result) {
        case 0:
          successCallback({ orderId: r.orderId });

          if (typeof callback !== "undefined") {
            try {
              eval(callback)(when, r.orderId);
            } catch (e) {
              log.add("SERVICES: exec callback with error: " + e);
            }
          }
          return true;
        case 1:
          r.message = getErrorMsg(r.message, "incorrect data");
          break;
        case 2:
          r.message = getErrorMsg(r.message, "incorrect token");
          break;
        case 3:
          r.message = getErrorMsg(
            r.message,
            "guest was evicted or doesn't exist"
          );
          break;
        case 9:
          r.message = getErrorMsg(r.message, "server error");
          break;
        case 100:
          r.message = getErrorMsg(r.message, "order was already created");
          break;
        default:
          r.message = getErrorMsg(r.message, "unknown answer");
          break;
      }

      // выполняется если от сервера получен ответ отличный от 0
      log.add("SERVICES create order: " + r.message);
      errorCallback(r.message);
    }
  ).fail(function (err) {
    log.add(
      "SERVICES cancel order: failed req - " + err.status + "|" + err.statusText
    );
    errorCallback();
  });

	function successCallback(data) {
		order.id = data.orderId;

		Services.updateOrderStatus({
			from: 'not_placed',
			to: 'placed',
			id: order.id
		});

		// что показываем?
		// success_product || success_service || success_wakeup
		var type = getPageFromStruct(Services.shopId).type === 'service' ? 'ss' :
			getPageFromStruct(Services.shopId).type === 'wakeupcall' ? 'sw' :'sp';

		informationPage.open({
			type: type,
			approxTime: order.approxTime
		});
	}
	function errorCallback(msg) {
		msg = typeof msg === 'undefined' ? 'Something wrong. Check you network' : msg;
		custom_dialog(
			'error',
			getlang('create_order'),
			msg,
			'navigate(\'#orders\')'
		);
	}
	function getErrorMsg(msg, customErrMsg) {
		if (typeof msg !== 'undefined') {
			return msg;
		}

		return customErrMsg;
	}
	function hasCheckServicesConfirmed(orderType, orderId) {
		var shopId = Services.getShopId(orderType, orderId);

		return (
			!getPageFromStruct(shopId).cost ||
			!getPageFromStruct(shopId).price
		);
	}
	function checkDeliveryTime(when, orderId) {
		var order = Services.getOrder('not_placed', orderId),
			unavailableProducts = [];

		for (var i = 0; i < order.products.length; i++) {
			var product = getPageFromStruct(order.products[i].id);
			if (!product.workingHours || product.workingHours.indexOf('24') !== -1) {
				continue;
			}

			var workingHours = product.workingHours.split('-'),
				startTime = $.trim(workingHours[0]),
				finishTime = $.trim(workingHours[1]),

				// В данной реализация проверка производится только по
				// времени, без учета дня недели
				deliveryTime = getDeliveryTime(when).split(' ')[1];

			startTime = getMomentTime(startTime);
			finishTime = getMomentTime(finishTime);
			deliveryTime = getMomentTime(deliveryTime);

			// Это необходимо для кейса, когда доступное время переваливает за полночь
			// Пример: 10:00 - 01:00
			if (finishTime.diff(startTime) < 0) {
				finishTime.add(1, 'day');
			}

			if (
				deliveryTime.diff(startTime) <= 0 ||
				deliveryTime.diff(finishTime) >= 0
			) {
				unavailableProducts.push(product.id);
			}
		}

		return unavailableProducts;

		function getMomentTime(time) {
			return moment()
				.set('hour', parseInt(time.split(':')[0]))
				.set('minute', parseInt(time.split(':')[1]))
				.set('second', 0);
		}
	}
}
function getDeliveryTime(when) {
	if (when === 'now') {
		return time_picker.get_ISO_string(null);
	}

	return when;
}
function shop_cancel_order(orderId, inputSuccessCallback, inputErrorCallback) {
	var token = check_auth();
	if (!require_internet() || !token) {
		return false;
	}

	var type = getShopType('placed', orderId);
	if (!type) {
		log.add('SERVICES: Can\'t get shop type');
		return false;
	}

	$.post(
		api_url + 'orderCancel',
		JSON.stringify({
			token: token,
			orderId: orderId,
			type: type
		}),
		function (r) {
			// 0 - успех
			// 2 - некорректный токен
			// 3 - гость выселен
			// 4 - гость выселен/отменён (рудимент, по идее никогда не появится)
			// 5 - заказ с таким ID не найден
			// 6 - по каким-то причинам не удалось изменить статус заказа, надо попробовать ещё раз или обратиться на ресепшен
			// 9 - глобальная ошибка, всё накрылось
			switch (r.result) {
				case 0:
					successCallback(orderId);
					return true;
				case 2:
					log.add('SERVICES cancel order: token is incorrect');
					break;
				case 3:
					log.add('SERVICES cancel order: guest evicted');
					break;
				case 4:
					log.add('SERVICES cancel order: guest evicted or cancelled');
					break;
				case 5:
					log.add('SERVICES cancel order: order id ' + orderId + ' didn\'t find');
					break;
				case 6:
					log.add('SERVICES cancel order: order id ' + orderId + ' didn\'t change status');
					break;
				case 9:
					log.add('SERVICES cancel order: server error');
					break;
			}

			// Выполняется если от сервера получен ответ отличный от 0
			errorCallback(r.message);

		}
	).fail(function (err) {
		log.add('SERVICES cancel order: failed req - ' + err.status + '|' + err.statusText);
		errorCallback();
	});


	function successCallback(orderId) {
		Services.updateOrderStatus({
			from: 'placed',
			to: 'canceled',
			id: orderId
		});

		if (typeof inputSuccessCallback !== 'undefined') {
			return inputSuccessCallback();
		}

		custom_dialog(
			'alert',
			getlang('cancellation_order'),
			getlang('order_was_cancelled'),
			'navigate(\'#orders\')'
		);
	}
	function errorCallback(msg) {
		if (typeof inputErrorCallback !== 'undefined') {
			return inputErrorCallback();
		}

		msg = typeof msg === 'undefined' ? 'Something wrong. Check you network' : msg;
		custom_dialog(
			'error',
			getlang('cancellation_order'),
			msg,
			'navigate(\'#orders\')'
		);
	}
}

function shop_save() {
	var shop = {};
	$('#shopcartlist li[cartitemid]').each(function(obj){
		id = $(this).attr('cartitemid');
		var amount = parseInt($(this).find('.amount').html());
		shop[id] = {};
		shop[id].amount = amount;
		if($(this).attr('toppings')){
			shop[id].toppings = JSON.parse($(this).attr('toppings'));
		}
	});
	// storage.setItem('shop', JSON.stringify(shop));
}

function shop_clear() {
	// storage.removeItem('shop');
	Services.clear();
}

function shop_load() {
	$('#shopcartlist li[cartitemid]').remove();
	var tmp = ''+storage.getItem('shop');
	var shop = {};
	if(tmp){
		shop = JSON.parse(tmp);
	}
	for(var i in shop){
		shop_add_to_cart(i, true, shop[i].amount, shop[i].toppings);
	}
	shop_recalc();
}

function shop_plus(id) {
	var to = typeof id !== 'undefined' ? id : active_page,
		tmp = $(to).find('#shop_amount'),
		result = Math.min(parseInt(tmp.html())+1,20);

	tmp.html(result);
	return result;
}

function shop_minus(id) {
	var to = typeof id !== 'undefined' ? id : active_page,
		tmp = $(to).find('#shop_amount'),

		result = parseInt(tmp.html()) - 1;

	if (tv_cur_block === 'shopitem' && !result) {
		return false;
	}

	result = Math.max(result, 0);
	tmp.html(result);

	return result;
}

function shop_plus_persons() {
	var qnt = shop_plus(),
		orderId = tv_cur_elem.closest('.page').attr('data-order-id');

	if (!orderId) {
		return false;
	}

	Services.updateOrder('not_placed', orderId, 'numOfPerson', qnt);
}
function shop_minus_persons() {
	var qnt = shop_minus(),
		orderId = tv_cur_elem.closest('.page').attr('data-order-id');

	if (!orderId) {
		return false;
	}

	Services.updateOrder('not_placed', orderId, 'numOfPerson', qnt);
}

function shop_item_edit(id, orderId) {
	var order = Services.updateOrderStatus({
		from: 'not_placed',
		to: 'editing',
		id: orderId
	});
	var product = Services.getProduct(id, 'editing');
	if (!product) {
		return false;
	}

	shop_view_item(
		product.id,
		id
	);
}
function shop_get_editing_data(editingProductId) {
	return Services.getProduct(editingProductId, 'editing');
}
function shop_item_delete() {
	var productId = tv_cur_elem.attr('data-product-id'),
		orderId;

	if (!productId) {
		return false;
	}

	orderId = tv_cur_elem.closest('.page').attr('data-order-id');

	Services.deleteProduct(productId, 'not_placed', orderId);
	shop_view_order(orderId, 'not_placed');

	var products = Services.getProducts('not_placed', orderId);
	if (!products.length) {
		Services.deleteOrder('not_placed', orderId);
	}
}

function shop_change_radio(id) {
	if (typeof id === 'undefined') {
		return false;
	}

	var container = $(id).find('#shop_amount'),
		value = parseInt(container.attr('data-value')),
		newValue = value ? 0 : 1,
		newView = newValue ? getlang('yes') : getlang('no');

	container.attr('data-value', newValue);
	container.html(newView);
}

function shop_select_open(_this) {
	var items = JSON.parse(_this.dataset.values),
		isSamePrice = parseInt(_this.dataset.isSamePrice);

	for (var i = 0; i < items.length; i++) {
		var item = items[i];

		var price = getToppingPrice({ price: item.price });
		item.price = !isSamePrice && price ? price: null;

		item.name = item.price ?
			'<span class="topping_item_name">'+ item.name + '</span>' + ' ' + accounting.formatMoney(item.price,currency_format) :
			'<span class="topping_item_name">'+ item.name + '</span>';

		item.onvclick = 'shop_select_choose(this, '+ _this.id +');';
		item.dataset = [{
			name: 'id',
			value: item.id,
		}, {
			name: 'price',
			value: (item.price ? item.price : 0)
		}];
	}

	if (parseInt(_this.dataset.isRequired) === 0) {
		items.unshift({
			name: getlang('select_none'),
			onvclick: 'shop_select_choose(false, '+ _this.id +');'
		});
	}

	var data = {
		id: 'toppings_select',
		klass: '',
		lang: {
			title: _this.previousElementSibling.innerHTML
		},
		data: items,
		backBtn: '#toppings',
		tpl: true,
		tplType: 'popup_list',
		to: null,
		onclose: 'shop_select_close();'
	};

	UI.popup_list_page(data);

	navigate('#toppings_select');
}
function shop_select_close() {
	$('#toppings_select').remove();
}

function shop_select_choose(_this, selectId) {
	var inputSelect = document.getElementById(selectId),
		textValue = _this ? $.trim(_this.querySelector('.topping_item_name').innerHTML) : getlang('select_none');

	// проверка введена на случай когда цена топпингов отличается
	if (_this && _this.dataset.price) {
		inputSelect.setAttribute('data-price', _this.dataset.price);
	}

	inputSelect.setAttribute('data-selected-value', _this ? _this.dataset.id : '');
	inputSelect.setAttribute('data-title', textValue);
	inputSelect.querySelector('span').innerHTML = textValue;

	tv_back();
}

function getShopType(orderType, orderId) {
	var shopId = Services.getShopId(orderType, orderId),
		shop = getPageFromStruct(shopId);

	if (!shopId || !shop) {
		log.add('SERVICES: order with id ' + orderId + ' doesn\'t exist or Shop isn\'t defined');
		return false;
	}

	return shop.type === 'shop' ? 'shop' : 'service';
}

var requiredField = (function () {
	var fn = function () {};

	fn.has = function (page) {
		if (page !== 'toppings') {
			return false;
		}

		return document.querySelector('#toppings .is-required');
	};

	fn.isValid = function () {
		var fields = document.querySelectorAll('#toppings .is-required');
		if (!fields.length) {
			return true;
		}

		for (var i = 0; i < fields.length; i++) {
			var field = fields[i],
				select = field.nextElementSibling;

			if (!select.dataset.selectedValue) {
				return false;
			}
		}

		return true;
	};

	fn.getInvalidFields = function () {
		var fields = document.querySelectorAll('#toppings .is-required'),
			results = [];

		if (!fields.length) {
			return results;
		}

		for (var i = 0; i < fields.length; i++) {
			var field = fields[i],
				select = field.nextElementSibling;

			if (!select.dataset.selectedValue) {
				results.push(field);
			}
		}

		return results;
	};

	fn.showInvalidFields = function () {
		var fields = fn.getInvalidFields();
		for (var i = 0; i < fields.length; i++) {
			var field = fields[i];
			field.classList.add('is-required-dude');
		}

		setTimeout(function () {
			for (var i = 0; i < fields.length; i++) {
				var field = fields[i];
				field.classList.remove('is-required-dude');
			}
		}, 3000);
	};

	return fn;
})();

function getShopId(pageId) {
	var page = getPageFromStruct(pageId);
	if (Object.keys(page).length === 0) {
		return null;
	}

	if (page.type === 'shop') {
		return page.id;
	}

	return getShopId(page.parentId);
}
