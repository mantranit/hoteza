(function () {
	var Get = {
			id: function (id) {
				id = typeof id !== 'undefined' ? id : active_page_id;
				return id.indexOf('id_') !== -1 ? id : 'id_' + id;
			},

			orderType: function (orderType) {
				return typeof orderType !== 'undefined' ? orderType : 'not_added';
			},

			shopId: (function () {
				var cache = new Cache();

				/**
				 * @param {string} [orderType] - статус заказа
				 * @param {string} [orderId] - ID заказа
				 * @param {string} [shopId] - ID магазина
				 * */
				return function (orderType, orderId, shopId) {
					if (cache.hasItem(orderType + orderId)) {
						return cache.getItem(orderType + orderId);
					}

					if (shopId) {
						return shopId;
					}
					if (orderType && orderId) {
						return getId(orderType, orderId);
					}

					return Services.shopId;

					function getId(orderType, orderId) {
						var orders = OrdersMethods.get(orderType);

						if (
							orderType === 'not_placed' ||
							orderType === 'editing'
						) {
							for (var key in orders) {
								if (orders[key].id === orderId) {
									return cache.setItem(orderType + orderId, key);
								}
							}
						}

						for (var key in orders) {
							var orderArray = orders[key];
							for (var i = 0; i < orderArray.length; i++) {
								var orderArrayElement = orderArray[i];
								if (orderArrayElement.id === orderId) {
									return cache.setItem(orderType + orderId, key);
								}
							}
						}

						return null;
					}
				};
			})(),

			/**
			 * Подготовка данных для рендера выбора фильтра
			 * */
			dataOfFiltersForRender: function () {
				var data = [],
					isAllSelected = true,

					filters = Services.getFilters();

				for (var key in filters) {
					isAllSelected = isAllSelected && filters[key].selected ? false : isAllSelected;

					data.push({
						item: key,
						name: key,
						itemName: false,
						selected: filters[key].selected,
						onvclick: "Services.setFilter('"+ key +"');"
					});
				}

				data.unshift({
					item: getlang('all'),
					name: getlang('all'),
					itemName: false,
					selected: isAllSelected,
					onvclick: "Services.resetFilters(\'"+ active_page_id +"\');tv_back();"
				});

				return {
					id: 'choose_filters',
					data: data,
					lang: {
						title: getlang('filter'),
						itemName: null
					},
					backBtn: active_page,
					tpl: true,
					tplType: 'popup_list',
					klass: '',
					to: null,
					onclose: 'Services.closeChooseFilters()'
				};
			},

			/**
			 * Быстрая ссылка на легенду
			 * @param {Boolean} [enabled] –
			 *      true - отдается ссылка на enabled
			 *      undefined - отдается ссылка на всю легенду
			 * */
			filterLegend: function (enabled) {
				if (!Blocks.filterLegend) {
					Blocks.filterLegend = document.getElementById('tv_fullscreen_btn_filters');
					Blocks.filterEnabledLegend = document.getElementById('tv_fullscreen_btn_filters_enabled');
				}

				return typeof enabled !== 'undefined' ?
					Blocks.filterEnabledLegend :
					Blocks.filterLegend;
			}
		},

		Product = {
			get: function (id, orderType) {
				orderType = typeof orderType !== 'undefined' ? orderType : 'not_added';
				var product = get(id, orderType);

				return product ? product : get(id, 'not_placed');

				function get(id, orderType) {
					var orderIdType = orderType === 'editing' ? 'uniqueId' : 'id',
						products = Services.getProducts(orderType);

					for (var i = products.length - 1; i >= 0; i--) {
						var product = products[i];
						if (product[orderIdType] == id) {
							return product;
						}
					}

					return null;
				}
			},
			set: function (addedProduct, orderType, shopId) {
				/**
					* isProductUnavailable && checkProductToppings
					* используются для того, чтобы отфильтровать товары и топпинги
					* которые не доступны сейчас (удалены или поставлены на стоп)
					* но клиент успел их заказать ранее
					* */
				if (isProductUnavailable(addedProduct.id)) {
					return false;
				}

				addedProduct = checkProductToppings(addedProduct);

				shopId = Get.shopId(null, null, shopId);
				orderType = Get.orderType(orderType);

				var order = OrdersMethods.get(orderType, shopId),
					products = order.products;

				setApproxTime(order, addedProduct.id);

				for (var i = products.length - 1; i >= 0; i--) {
					var product = products[i],

						productToppings = typeof product.toppings !== 'undefined' ? product.toppings : {},
						addedProductToppings = typeof addedProduct.toppings !== 'undefined' ? addedProduct.toppings : {};

					if (
						product.id == addedProduct.id &&
						equals(Object.keys(productToppings), Object.keys(addedProductToppings))
					) {
						if (product.toppings) {
							for (var topping in product.toppings) {
								product.toppings[topping].amount += addedProduct.toppings[topping].amount;
							}
						}

						return product.amount += addedProduct.amount;
					}
				}

				products.push({
					id: addedProduct.id,
					uniqueId: addedProduct.uniqueId ?
						addedProduct.uniqueId :
						generate_uuid(true),
					amount: addedProduct.amount,
					toppings: addedProduct.toppings
				});

				function isProductUnavailable(id) {
					var product = getPageFromStruct(id);
					return !Object.keys(product).length;
				}
				function checkProductToppings(product) {
					if (!product.toppings) {
						return product;
					}

					for (var key in product.toppings) {
						if (typeof product.toppings[key].title === 'undefined') {
							delete product.toppings[key];
						}
					}

					return product;
				}
			},
			update: function (id, type, data, orderType) {
				var product = Product.get(id, orderType);
				if (!product) {
					return false;
				}

				// изменение кол-ва товаров в
				// режиме редактирования корзины
				if (type === 'amount' && product.toppings) {
					resetToppingsQnt(product.toppings, product.amount);
					calcToppingsQnt(product.toppings, data);
				}

				// умножаем все топпинги на кол-во товаров
				if (type === 'toppings') {
					calcToppingsQnt(data, product.amount);
				}

				return product[type] = data;

				function resetToppingsQnt(toppings, amount) {
					for (var key in toppings) {
						toppings[key].amount = toppings[key].amount / amount;
					}
				}
				function calcToppingsQnt(toppings, amount) {
					for (var key in toppings) {
						toppings[key].amount = toppings[key].amount * amount;
					}
				}
			},

			/**
				* Удаление товара из заказа.
				* @param {string} [id] - уникальный id, присваеваемый в Product.set()
				* @param {string} [orderType] – not_added || not_placed
				* @param {string} [orderId] – id заказа
				* */
			deleteItem: function (id, orderType, orderId) {
				var order = OrdersMethods.get(orderType, Get.shopId(orderType, orderId)),
					products = order.products,
					deletedProduct = null;

				order.approxTime = null;

				// удаляем весь заказ
				if (typeof id === 'undefined') {
					return order.products = [];
				}

				for (var i = 0; i < products.length; i++) {
					var product = products[i];
					if (product.uniqueId === id) {
						deletedProduct = products.splice(i, 1)[0];
					}
					else {
						setApproxTime(order, product.id);
					}
				}

				Storage.set();

				return deletedProduct;
			}
		},

		Blocks = {
			filterLegend: null,
			filterEnabledLegend: null
		},

		Storage = {
			set: function () {
				storage.setItem('shop', JSON.stringify(Object.assign(
					{},
					{
						not_placed: Orders.not_placed,
						placed: Orders.placed,
						completed: Orders.completed,
						in_process: Orders.in_process,
						canceled: Orders.canceled
					}
				)));
			},
			get: function () {
				var orders = '' + storage.getItem('shop');
				return orders && orders !== 'null' ? JSON.parse(storage.getItem('shop')) : {};
			}
		},

		View = {
			/**
				* Рендер страниц My orders, Cart, Order details
				* @param {string} page - [ orders | order_details | cart ]
				* @param {string} [orderId] - идентификатор заказа, для заказов типа placed && completed
				*                             orderId получаем с сервера при отправке заказа
				* @param {string} [orderType] - статус заказа
				* @param {array} [unavailableProducts] - список не доступных товаров на выбранное время
				*                                        передается в shop_order
				* */
			update: function (page, orderId, orderType, unavailableProducts) {
				var data = {
					title: getTitle(page),
					content: getContent(page, orderId, orderType),
					lang: {
						back: getlang('mobileAppContent-default-label-back')
					}
				},
					shopId = Get.shopId(orderType, orderId);

				data = Object.assign(data, getButton(page), { metro_menu: config.menu !== '' });

				var container = document.getElementById(page),
					templateName = page === 'orders' ? "list_of_orders" : "list_of_products";

				container.innerHTML = '';
				container.insertAdjacentHTML(
					'beforeend',
					templates_cache[templateName].render(data, {
						getlang: getlang,
						checkProductAvailability: function (id) {
							unavailableProducts = typeof unavailableProducts === 'undefined' ?
								[] : unavailableProducts;

							return unavailableProducts.indexOf(id) !== -1;
						}
					})
				);

				switch (page) {
					case 'cart':
						if (!data.content.isEmpty) {
							container.setAttribute(
								'onopen',
								'Services.setShopId(\''+ shopId +'\')'
							);

							container.insertAdjacentHTML(
								'beforeend',
								templates_cache['features_order_details_legend'].render({
									edit_lang: getlang('edit'),
									delete_lang: getlang('delete')
								})
							);
						}

					case 'order_details':
						if (orderType === 'completed') {
							break;
						}

						// чтобы показывался approxTime в корзине при переходе с товара
						orderType = page === 'cart' && !orderType ? 'not_placed' : orderType;

						var order = OrdersMethods.get(orderType, shopId, orderId);
						if (!order.approxTime) {
							break;
						}

						container.querySelector('.content').insertAdjacentHTML(
							'afterbegin',
							templates_cache['features_approximate'].render({
								title: getlang('approx_time'),
								value: order.approxTime + ':00'
							})
						);

				}

				container.setAttribute('data-order-id', orderId);

				updateCartIndicator();

				if (tv_cur_block === page) {
					navigate('#' + page);
				}

				function getContent(page, orderId, orderType) {
					return page === 'orders' ? getOrders() : getContentForOrderDetails(page, orderId, orderType);
				}
				function getButton(page) {
					switch (page) {
						case 'orders':
							return {
								backBtn: structv2.cart.backBtn,
								parentId: structv2.cart.parentId
							};

						case 'order_details':
						case 'cart':
							return {
								backBtn: 1,
								parentId: 'orders'
							};
					}
				}
				function getTitle(page) {
					switch (page) {
						case 'orders':
							return isset('structv2.cart.title') ?
								isset('structv2.cart.title') : getlang('my_orders');

						case 'summary':
							return getlang('summary');

						case 'cart':
							return getlang('cart');

						case 'order_details':
							return getlang('order_details');
					}
				}
				function updateCartIndicator() {
					var ordersQnt = Object.keys(Services.getOrders('not_placed')).length,
						cartIndicator = document.getElementById('shop_cart_indicator');

					if (!cartIndicator) {
						return false;
					}

					cartIndicator.innerHTML = ordersQnt;
					cartIndicator.style.display = ordersQnt ? 'inline-block' : 'none';
				}
			}
		},

		/**
			* Хранилище заказов
			* @example {
			*     // Obj.not_added[ShopId] && Obj.not_placed[ShopId] = {}
			*     // все остальные статусы заказов === []
			*
			*     [ not_added | not_placed | placed | completed | in_process | canceled ]: {
			*         [ShopId]: [{
			*             // до отправки на сервер создаем сами, после получаем от сервера
			*             id: String – уникальное значение
			*
			*             numOfPerson: $NUM,
			*             approxTime: $NUM – указывается в минутах,
			*
			*             // null, если type === 'not_placed'
			*             orderTime: [null | Date] - когда сделан заказ
			*             when: [ null | Date ] - к какому времени доставить заказ
			*
			*             // используем такое построение, чтобы можно было заказать один и
			*             // тот же товар - один с топпингом, второй без
			*             products: [
			*                 {
			*                     id: [ProductId]
			*                     amount: $NUM,
			*                     toppings: { [id]: { price: $NUM, amount: $NUM }, ... }
			*                 },
			*                 ...
			*             ]
			*         }],
			*         [ShopId]: ...
			*     }
			* }
			* */
		Orders = {
			editing: {},
			not_added: {},
			not_placed: {},
			placed: {},
			in_process: {},
			completed: {},
			canceled: {}
		},

		OrdersMethods = {
			init: function (orders) {
				orders = typeof orders !== 'undefined' ? orders : {};
				Orders = Object.assign(Orders, Storage.get(), orders);
			},
			cache: new Cache(),
			get: function (orderType, shopId, orderId) {
				if (OrdersMethods.cache.hasItem(orderType + shopId + orderId)) {
					return OrdersMethods.cache.getItem(orderType + shopId + orderId);
				}

				if (typeof orderType === 'undefined') {
					return Orders;
				}

				if (!shopId) {
					return Orders[orderType];
				}

				if (typeof orderId !== 'undefined') {
					for (var i = 0; i < Orders[orderType][shopId].length; i++) {
						var order = Orders[orderType][shopId][i];
						if (order.id === orderId) {
							return OrdersMethods.cache.setItem(orderType + shopId + orderId, order);
						}
					}
				}

				if (Orders[orderType][shopId]) {
					return Orders[orderType][shopId];
				}

				return OrdersMethods.create(orderType, shopId);
			},
			create: function (orderType, shopId) {
				orderType = Get.orderType(orderType);

				if (
					orderType === 'not_added' ||
					orderType === 'not_placed' ||
					orderType === 'editing'
				) {
					return Orders[orderType][shopId] = {
						id: generate_uuid(true),
						numOfPerson: 1,
						approxTime: null,
						orderTime: null,
						deliveryTime: null,
						products: []
					};
				}

				return Orders[orderType][shopId] = [];
			},
			deleteItem: function (orderType, shopId, orderId) {
				if (typeof shopId === 'undefined') {
					return Orders[orderType] = {};
				}

				switch (orderType) {
					case 'not_added':
					case 'not_placed':
					case 'editing':
						OrdersMethods.cache.deleteItem(orderType + shopId + orderId);
						delete Orders[orderType][shopId];

						break;

					case 'placed':
					case 'completed':
					case 'in_process':
					case 'canceled':
						var shop = Orders[orderType][shopId];
						for (var i = 0; i < shop.length; i++) {
							var order = shop[i];
							if (order.id === orderId) {
								OrdersMethods.cache.deleteItem(orderType + shopId + orderId);
								shop.splice(i, 1);
								break;
							}
						}

						break;
				}

				Storage.set();
			},
			update: function (ctx) {
				ctx.from = ctx.from ? ctx.from : 'not_added';
				ctx.to = ctx.to ? ctx.to : 'not_placed';

				var shopId = shopInit(ctx),
					orders;

				updateOrder(ctx, shopId);
				orders = OrdersMethods.get(ctx.to, shopId);

				ctx = updateOrderId(ctx, orders);

				updateView(ctx);

				Storage.set();

				return orders;

				function shopInit(ctx) {
					var shopId = Get.shopId(ctx.from, ctx.id);
					Orders[ctx.to][shopId] = OrdersMethods.get(ctx.to, shopId);

					return shopId;
				}

				function updateOrder(ctx, shopId) {
					switch (ctx.to) {
						case 'not_placed':
						case 'editing':
							var products = Services.getProducts(ctx.from, ctx.id);
							for (var i = 0; i < products.length; i++) {
								var product = products[i];
								Product.set(product, ctx.to, shopId);
							}

							break;

						case 'placed':
						case 'completed':
						case 'in_process':
						case 'canceled':
							Orders[ctx.to][shopId] = OrdersMethods.get(ctx.to, shopId);
							Orders[ctx.to][shopId].push(OrdersMethods.get(ctx.from, shopId, ctx.id));

							break;
					}

					if (!ctx.clone) {
						OrdersMethods.deleteItem(ctx.from, shopId, ctx.id);
					}
				}

				function updateView(ctx) {
					switch (ctx.to) {
						case 'not_placed':
							View.update('cart', ctx.id);

						case 'placed':
						case 'completed':
						case 'in_process':
						case 'canceled':
							return View.update('orders');
					}
				}

				function updateOrderId(ctx, orders) {
					if (typeof orders === 'object') {
						Object.assign(ctx, {id: orders.id});
					}

					return ctx;
				}
			}
		},

		Dict = {0: 'placed', 1: 'in_process', 2: 'completed', 3: 'canceled'};

	window.Services = {
		deps: ['Events', 'SVG'],
		init: function () {
			var d = $.Deferred();

			if (!isset('structv2.config.cart')) {
				log.add('Cart isn\'t defined in config from Struct');
				return false;
			}

			Services.filters = createFilterList();

			createRequiredPages({ id: 'toppings', className: 'new list_items_toppings' });
			createRequiredPages({ id: 'order_details', className: 'new list_of_products' });
			createRequiredPages({ id: 'cart', className: 'new list_of_products' });
			createRequiredPages({ id: 'orders', className: 'new list_of_orders' });

			new LoadTemplates([
				'modules/Services/templates/service_page.html',
				'modules/Services/templates/shop_products.html',
				'modules/Services/templates/tags_on_shop_page.html',
				'modules/Services/templates/working_time_on_shop_page.html',
				'modules/Services/templates/list_of_products.html',
				'modules/Services/templates/features_up_sale.html',
				'modules/Services/templates/features_approximate.html',
				'modules/Services/templates/features_order_details_legend.html',
				'modules/Services/templates/list_of_orders.html'
			])
			.done(function () {

				//TODO: проверить!!!! data.lang = getObjectLang();
				for(var i in structv2.pages) {
					var page = structv2.pages[i];

					//Страницы сервисов
					if (page.type === 'page' && page.serviceId) {
						var images = [page.image];
						if(isset('config.tv.use_imagewide')){
							images.push(page.imageWide);
						}
						UI.register_page({id: page.id, action: Services.onnavigate, images: images});
						UI.render(
							i,
							Object.assign(
								{
									onopen: 'Services.setShopId(\''+ page.serviceId +'\')',
									lock_ordering: isset('config.shop.lock_ordering')
								},
								page
							),
							'service_page',
							'white service_page'+
							(page.workingHours || page.customField ? ' additional_info' : '') +
							(page.pieces === 'none' && !page.cost ? ' without_pieces' : '') +''
						);
					}

					//Страницы магазинов
					if (page.type === 'shop' || page.type === 'shopCategory') {
						page.childrenArr = objectToArrayList(page.children);

						if (page.childrenArr.length) {

							if (page.type === 'shop') {
								page.onopen = 'Services.setShopId(\''+ page.id +'\');';
							}

							page.onopen = page.onopen ?
								page.onopen + 'Services.checkView(\''+ page.id +'\');' :
								'Services.checkView(\''+ page.id +'\');';

							page.onclose = 'Services.legend.hide();';

							var images = [];
							if(isset('config.tv.use_imagewide')){
								images.push(page.imageWide);
							}

							for (var o = 0; o < page.childrenArr.length; o++) {
								//TODO: пересмотреть это место
								page.childrenArr[o] = getPageFromStruct(page.childrenArr[o].id, page.childrenArr[i]);
								if(page.childrenArr[o].image){
									images.push(page.childrenArr[o].image);
								}
								if(page.childrenArr[o].icon){
									page.childrenArr[o].iconVal = SVG.iconsValue[page.childrenArr[o].icon];
								}
							}

							UI.register_page({id: page.id, action: Services.onnavigate, images: images});
							UI.render(i, page, 'shop_products');
						}else{
							//empty category
						}
					}

				}

				//TODO: переделать на нормальное построение, убрать использование root.symbol в шаблоне, currency.symbol в index
				$('.price').each(function(){$(this).html(accounting.formatMoney($(this).html(), currency_format));});

				// будильник
				UI.register_page({id: 'services_wakeup', action: Services.onnavigate, images: [structv2.wakeupcall.image]});
				UI.render(
					'services_wakeup',
					Object.assign(
						{
							onopen: 'Services.setShopId(\''+ structv2.wakeupcall.serviceId +'\')',
							content: structv2.wakeupcall.text,
							pieces: 'none'
						},
						structv2.wakeupcall
					),
					'service_page',
					'white service_page without_pieces'
				);

				$(HotezaTV).on('auth', function(){
					Services.updateOrdersFromServer();
				});

				//Module init end
				d.resolve();
			});

			Events.registerListener('shop', processCmd);

			return d.promise();
		},
		onnavigate: function(){
			console.log('Shop nav');
		},

		getOrders: function (orderType) {
			return OrdersMethods.get(orderType);
		},

		getOrder: function (orderType, orderId) {
			return OrdersMethods.get(orderType, Get.shopId(orderType, orderId), orderId);
		},

		deleteOrder: function (orderType, orderId) {
			OrdersMethods.deleteItem(orderType, Get.shopId(orderType, orderId), orderId);
			View.update('orders');
		},

		updateOrder: function (orderType, orderId, field, data) {
			var order = Services.getOrder(orderType, orderId);
			order[field] = data;

			Storage.set();
		},

		/**
			* Изменение статуса заказа
			* Описание параметров в Orders.update
			* @return id перенесенного заказа. В случае "completed" –> "not_placed" ID будет новым
			* */
		updateOrderStatus: function (ctx) {
			return OrdersMethods.update(ctx);
		},

		renderView: function (orderId, orderType, unavailableProducts) {
			var page = orderType === 'not_placed' ? 'cart' : 'order_details';
			View.update(page, orderId, orderType, unavailableProducts);

			return page;
		},

		getProduct: function (id, orderType) {
			return Product.get(id, orderType);
		},

		getProducts: function (orderType, orderId) {
			orderType = Get.orderType(orderType);
			var shopId = Get.shopId(orderType, orderId);

			if (!shopId) {
				return [];
			}

			return OrdersMethods.get(orderType, shopId, orderId).products;
		},

		/**
			* @param {object} data
			* @param {string} data.id - id товара взятое из struct
			* @param {number} data.amount - кол-во товара
			* @param {string} [orderType] - тип заказа
			* */
		setProduct: function (data, orderType) {
			Product.set(data, orderType);
		},

		deleteProduct: function (id, orderType, orderId) {
			orderType = Get.orderType(orderType);
			return Product.deleteItem(id, orderType, orderId);
		},

		/**
			* @param {string} id - id товара
			* @param {string} type - обновляемое поле
			* @param {string|number|object} data - данные
			* @param {string} [orderType] - статус заказа
			* */
		updateProduct: function (id, type, data, orderType) {
			Product.update(id, type, data, orderType);
		},

		/**
			* Обновление данных заказов
			* а также при получении команды orderUpdateData
			* */
		updateOrdersFromServer: function () {

			getOrdersFromServer().done(function (orders) {
				OrdersMethods.init(orders);
				View.update('orders');
			});

		},
		/**
			* @param {string} shopId - id магазина на котором находится пользователь
			* */
		shopId: null,

		/**
			* Получение shopId.
			* Используется при построение Cart
			* */
		getShopId: function (orderType, orderId) {
			return Get.shopId(orderType, orderId);
		},

		/**
			* Список фильтров
			* @param {Boolean} filters.filterApplied["shopId"] - используется для быстрой проверки,
			* есть ли выбранные фильтры в конкретном магазине
			* @param {Object} filters.list - общий список магазинов фильтров, имеет вид –
			* {
			*     "shopId" - id магазина: {
			*         "Vegan": { selected: true|false },
			*         "Halal": { selected: true|false }
			*     }
			* }
			* */
		filters: {
			filterApplied: {},
			list: {}
		},

		/**
			* Быстрая проверка, того, есть ли тэги на странице, чтобы понять
			* показывать кнопку Filter или нет
			*
			* @param {string} id - идентификатор страницы
			* @returns {Boolean}
			* */
		hasFilters: function (id) {
			var page = getPageFromStruct(Get.id(id));

			return !!page && !!page.tagFilter && !!page.tagFilter.length;
		},

		/**
			* Проверяем применен ли фильтр в этом магазине
			* */
		isFilterApplied: function () {
			return Services.filters.filterApplied[Get.shopId()];
		},

		/**
			* @param {string} [id] - идентификатор страницы на которой находимся
			* @param {Boolean} [isApplied] —
			*      true - возвращать только примененные фильтры
			*      false - возвращать все фильтры
			* @returns {Object|Boolean} Возвращает объект объектов или false в случае отсутствия тэгов на странице
			* @example returns { "Vegan": { selected: true|false }, "Halal": { selected: true|false } }
			* */
		getFilters: function (id, isApplied) {
			id = Get.id(id);

			if (!Services.hasFilters(id)) {
				return false;
			}

			var page = getPageFromStruct(id),
				list = {},
				hasFilters = false;

			for (var i = 0; i < page.tagFilter.length; i++) {
				var tag = page.tagFilter[i];

				// возвращаем только примененные фильтры
				if (isApplied && !Services.filters.list[Get.shopId()][tag].selected) {
					continue;
				}

				hasFilters = true;
				list[tag] = Services.filters.list[Get.shopId()][tag];
			}

			return hasFilters ? list : false;
		},

		/**
			* @param {string} tag - добавление фильтра
			* @param {Boolean} [value] – true - фильтр выбран; false - фильтр отменен,
			*      если параметр не передан, значение выставляется на противоположное предыдущему
			* */
		setFilter: function (tag, value) {
			var filterApplied = false,
				list = Services.filters.list[Get.shopId()];

			value = typeof value !== 'undefined' ? value : !list[tag].selected;

			list[tag].selected = value;
			Services.setViewItem(tag, value);

			for (var key in list) {
				if (list[key].selected) {
					filterApplied = true;
					break;
				}
			}

			Services.filters.filterApplied[Get.shopId()] = filterApplied;

			return list[tag];
		},

		/**
			* Устанавливает или убирает класс selected на item'e
			* */
		setViewItem: function (tag, value) {
			var item = $('#choose_filters [data-item="'+ tag +'"]'),
				all = $('#choose_filters [data-item]').get(0);

			if (!item) {
				return false;
			}

			if (all) {
				$(all).removeClass('selected');
			}

			if (value) {
				return item.addClass('selected');
			}

			return item.removeClass('selected');
		},

		/**
			* Устанавливает ID магазина, используется в onopen главнй страницы магазина
			* @param {string} [id] - id магазина
			* */
		setShopId: function (id) {
			return Services.shopId = id;
		},

		/**
			* Снимает все фильтры на выбранной странице
			* @param {string} [id] - id страницы
			* при передаче id фильтры удаляются с нее
			* без передачи используется active_page_id
			* */
		resetFilters: function (id) {
			var tags = Services.getFilters(id);

			for (var key in tags) {
				Services.setFilter(key, false);
			}
		},

		/**
			* Фильтр применяется ко всему магазину,
			* скрывая / показывая отфильтрованные пункты
			* */
		applyFilters: function () {
			var filters = Services.getFilters(Get.shopId(), true),
				shopPage = getPageFromStruct(Get.id(Get.shopId()));

			for (var page in shopPage.children) {
				applyFilter(getPageFromStruct(page), filters);
			}

			function applyFilter(page, filters) {
				page.isVisible = filters ? getVisible(page.tagFilter, filters) : true;

				applyView(page);

				// проверяем дочерние пункты, только если родительский пункт виден
				if (page.type === 'shopCategory' && page.isVisible) {
					for (var child in getPageFromStruct(page.id).children) {
						applyFilter(getPageFromStruct(child), filters);
					}
				}

				function getVisible(tags, filters) {
					var visible = false;
					for (var filter in filters) {
						if (tags.indexOf(filter) !== -1) {
							visible = true;
							break;
						}
					}

					return visible;
				}
			}
			function applyView(page) {
				var item = page.type === 'shopCategory' ?
					$('[href="#'+ page.id +'"]') :
					$('[shopitemid="'+ page.id +'"]');

				return page.isVisible ?
					item.removeClass('filtrated_by_service') :
					item.addClass('filtrated_by_service');
			}
		},

		/**
			* Проверяем есть ли на этой странице фильтры и применены ли они,
			* чтобы отображать легенду – [Filter|Filter enabled]
			* @param {string} [id] - ID страницы
			* */
		checkView: function (id) {
			if (!Services.hasFilters(id)) {
				return Services.legend.hide();
			}

			Services.legend.show();

			if (Services.isFilterApplied()) {
				return Services.legend.show(true);
			}

			Services.legend.hide(true);
		},

		/**
			* Открывает окно выбора фильтров
			* @param {string} [id] - ID страницы
			* */
		openChooseFilters: function (id) {
			if (!Services.hasFilters(id)) {
				return false;
			}

			UI.popup_list_page(Get.dataOfFiltersForRender());

			navigate('#choose_filters');
		},

		closeChooseFilters: function () {
			$('#choose_filters').remove();

			Services.applyFilters();

			tv_sel_block();
			make_scroll($(active_page));
			metro_menu_calc(tv_sel_list, true);
		},

		/**
			* Управление показом легенды
			* */
		legend: {
			/**
				* @param {Boolean} [enabled] -
				*      true - показ "Фильтр включен"
				*      undefined - показ "Фильтр"
				* */
			show: function (enabled) {
				Get.filterLegend().style.display = 'inline';

				if (enabled) {
					Get.filterLegend(true).style.display = 'inline';
				}
			},

			/**
				* @param {Boolean} [enabled] -
				*      true - скрыть "... включен"
				*      undefined - скрыть "Фильтр включен"
				* */
			hide: function (enabled) {
				if (enabled) {
					return Get.filterLegend(true).style.display = 'none';
				}

				Get.filterLegend().style.display = 'none';
				Get.filterLegend(true).style.display = 'none';
			}
		},

		serialize: function (orders, orderType) {
			orderType = orderType ? orderType : 'not_placed';
			return serialize(orders.length ? orders : [orders], orderType);
		},

		clear: function () {
			storage.removeItem('shop');

			for (var orderType in Services.getOrders()) {
				OrdersMethods.deleteItem(orderType);
			}

			OrdersMethods.init();
		}
	};

	/**
		* Начальная генерация списка фильтров,
		* описание выходных данных перед Services.filters
		* */
	function createFilterList() {
		var filters = {
			filterApplied: {},
			list: {}
		};

		for (var key in structv2.pages) {
			var page = structv2.pages[key];

			if (
				page.type === 'shop' &&
				page.tagFilter &&
				page.tagFilter.length
			) {

				filters.list[page.id] = {};
				filters.filterApplied[page.id] = false;
				for (var i = 0; i < page.tagFilter.length; i++) {
					var tag = page.tagFilter[i];
					filters.list[page.id][tag] = { selected: false };
				}

			}
		}

		return filters;
	}

	function createRequiredPages(data) {
		var sample = document.getElementById('sample_page').cloneNode();
		sample.setAttribute('id', data.id);

		sample.setAttribute('data-product-id', '');
		sample.setAttribute('data-dont-save', data.id === 'cart' ? '0' : '1');

		sample.classList.remove('white');
		$(sample).addClass(data.className);

		document.getElementById('container').appendChild(sample);
	}

	function setApproxTime(order, id) {
		var approxTime = getPageFromStruct(id).approxTime;

		if (
			approxTime === '' ||
			typeof approxTime === 'undefined'
		) {
			return false;
		}
		else {
			approxTime = parseInt(approxTime);
		}

		if (!order.approxTime) {
			return order.approxTime = approxTime;
		}

		return order.approxTime = order.approxTime < approxTime ? approxTime : order.approxTime;
	}

	function getOrders() {
		var orders = OrdersMethods.get(),
			list = [],
			ordersTitle = isset('structv2.cart.title');

		for (var key in orders) {
			if (
				Object.keys(orders[key]).length === 0 ||
				key === 'not_added'
			) {
				continue;
			}

			var order = {
				title: getTitle(key),
				className: getClassName(key),
				items: getItems(orders[key], key)
			};

			list.push(order);
		}

		return {
			list: list
		};

		function getTitle(orderType) {
			switch (orderType) {
				case 'not_placed':
					return getlang('cart');

				case 'canceled':
					return getlang('cancelled');

				case 'in_process':
					return getlang('confirmed');

				default:
					return getlang(orderType);

			}
		}
		function getClassName(orderType) {
			if (orderType === 'completed' || orderType === 'canceled') {
				return 'shadow_orders';
			}

			return null;
		}
		function getItems(orders, orderType) {
			var items = [],
				order;

			for (var key in orders) {
				var shop = orders[key];

				if (orderType === 'not_placed') {
					order = getContent(shop, orderType, getPageFromStruct(key).title);
					items.push(order);
				}
				else if (
					orderType === 'placed' ||
					orderType === 'completed' ||
					orderType === 'in_process' ||
					orderType === 'canceled'
				) {
					for (var i = 0; i < shop.length; i++) {
						var shopElement = shop[i];
						order = getContent(shopElement, orderType, getPageFromStruct(key).title);
						items.push(order);
					}
				}
			}

			items = items.sort(sortOfDate);

			return items;

			function getContent(order, orderType, title) {
				var orderTime = order.deliveryTime ?
					time_picker
						.get_moment_with_current_time(order.deliveryTime)
						.format('DD MMM Y (LT)')
					:
						order.deliveryTime;

				return {
					title: title,
					orderTime: orderTime,
					orderTimeInMomentSyntax: order.orderTime,
					button: {
						text: getlang('details'),
						type: 'onvclick',
						value: 'shop_view_order(\''+ order.id +'\', \''+ orderType +'\');'
					}
				};
			}
			function sortOfDate(a, b) {
				a = time_picker.get_moment_with_current_time(a.orderTimeInMomentSyntax);
				b = time_picker.get_moment_with_current_time(b.orderTimeInMomentSyntax);

				var diff = a.diff(b);

				if (diff < 0) {
					return 1;
				}

				if (diff > 0) {
					return -1;
				}

				return 0;
			}
		}
	}

	function getOrdersFromServer() {
		var d = $.Deferred();

		var token = check_auth();
		if (!require_internet() || !token) {
			return d.resolve({});
		}

		$.post(
			api_url + 'orderList',
			JSON.stringify({ token: token }),
			function (r) {
				switch(r.result){
					case 0:
						return d.resolve(deserialize(r.data));
					case 2:
						log.add('SERVICES get orders: token is incorrect');
						break;
					case 3:
						log.add('SERVICES get orders: guest evicted');
						break;
					case 4:
						log.add('SERVICES get orders: guest evicted or cancelled');
						break;
					case 9:
						log.add('SERVICES get orders: Unknown error');
						break;
					default:
						log.add('SERVICES get orders: Unknown answer');
						break;
				}

				// выполняется если ответ сервера отличен от 0
				return d.resolve({});
			}
		).fail(function (err) {
			log.add('SERVICES get orders: failed req - ' + err.status + '|' + err.statusText);
			d.resolve({});
		});

		return d.promise();
	}

	/**
		* Обработка сообщений получаемых с сервера
		* Пример получаемых данных
		* @param {object} msg - пример получаемых данных ниже
		* @example {
			"cat": "shop",
		"ch": "0",
		"cmd": "orderUpdate",
		"data": {
			"orderId": "123",
			"type": "shop",
			"fromStatus": "0",
			"toStatus": "2",
		}
		}
	* */
	function processCmd(msg) {
		switch (msg.cmd) {
			case 'orderUpdate':
				var order = Services.getOrder(Dict[msg.data.fromStatus], msg.data.orderId);
				if (!Object.keys(order).length) {
					log.add(
						'SERVICES: can\'t find order with status: ' +
						Dict[msg.data.status] +
						' - orderId: '+
						msg.data.orderId
					);
					return false;
				}

				Services.updateOrderStatus({
					id: msg.data.orderId,
					from: Dict[msg.data.fromStatus],
					to: Dict[msg.data.toStatus]
				});

				break;

			case 'orderUpdateData':
				Services.updateOrdersFromServer();

				break;

			default:
				log.add('SERVICES process cmd: unknown command from server - ' + msg.cmd);
				break;
		}
	}

	function serialize(data, orderType) {
		if (!data || !data.length) {
			return {};
		}

		var orders = [];

		for (var i = 0; i < data.length; i++) {
			var order = Object.assign({}, data[i]);

			order.shopId = Services.shopId;

			order.type = getShopType(orderType, order.id);
			order.data = serializeProducts(order.products);
			order.fee = structv2.cart.fee;
			order.feeType = structv2.cart.feeType;

			delete order.products;

			orders.push(order);
		}

		return orders;

		function serializeProducts(products) {
			var serializedProducts = [];

			for (var i = 0; i < products.length; i++) {
				var product = Object.assign({}, products[i]),
					pageFromStruct = getPageFromStruct(product.id);

				product.price = pageFromStruct.cost;
				product.pieces = pageFromStruct.pieces;

				delete product.uniqueId;

				if (
					!product.toppings ||
					!Object.keys(product.toppings).length
				) {
					product.toppings = [];
					serializedProducts.push(product);
					continue;
				}

				var toppings = [];
				for (var key in product.toppings) {
					var topping = Object.assign({}, product.toppings[key]);
					topping.id = key;
					delete topping.title;

					toppings.push(topping);
				}
				product.toppings = toppings;

				serializedProducts.push(product);
			}

			return serializedProducts;
		}

	}
	function deserialize(data) {
		if (!data || !data.length) {
			return {};
		}

		var orders = {};

		for (var i = 0; i < data.length; i++) {
			var order = data[i],
				status = Dict[order.status],
				shopId = order.shopId;

			orders[status] = orders[status] ? orders[status] : {};
			orders[status][shopId] = orders[status][shopId] ? orders[status][shopId] : [];

			orders[status][shopId].push({
				id: order.id,
				orderTime: order.createDate,
				deliveryTime: order.deliveryTime,
				fee: order.fee,
				feeType: order.feeType,
				products: deserializeProducts(order.data, order.type)
			});
		}

		orders = ordersExtension(orders);

		return orders;

		function deserializeProducts(products, type) {
			products = type === 'service' ? [products] : products;

			for (var i = 0; i < products.length; i++) {
				var product = products[i];
				// В случае с сервисом данные "товара" должны браться из данных "сервиса"
				product.id = type === 'service' ? product.shopId : product.id;

				var productFromStruct = getPageFromStruct(product.id, product);

				if (!product.toppings.length) {
					product.toppings = null;
					continue;
				}

				var toppings = {};
				for (var j = 0; j < product.toppings.length; j++) {
					var topping = product.toppings[j];
					toppings[topping.id] = {
						id: topping.id,
						price: topping.price,
						amount: topping.amount,
						title: getToppingTitle(topping.id, productFromStruct.toppings)
					};
				}

				product.toppings = toppings;

			}

			return products;

			function getToppingTitle(id, toppings) {
				if (typeof toppings === 'undefined') {
					return null;
				}

				for (var i = 0; i < toppings.length; i++) {
					var topping = toppings[i];
					if (topping.type === 'select') {
						for (var j = 0; j < topping.values.length; j++) {
							var value = topping.values[j];
							if (value.id === id) {
								return value.name;
							}
						}
					}

					if (topping.id === id) {
						return topping.name;
					}
				}
			}
		}
		/**
			* Ф-ия применяется для след случая.
			* Пользователь сделал заказ и выкл. ТВ
			* Статус этого заказа поменялся на сервере, но в storage все еще остается в
			* начальном состоянии.
			* Для этого переопределяем эти заказы, принимая данные с сервера за истину
			* */
		function ordersExtension(orders) {
			var dict = ['placed', 'in_process', 'completed', 'canceled'];
			for (var i = 0; i < dict.length; i++) {
				var status = dict[i];
				if (!(status in orders)) {
					orders[status] = {};
				}
			}

			return orders;
		}
	}
})();
