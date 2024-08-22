var doing_service_post = false;

function service_post(orderId, when, confirmed, callback, isRepeatOrder) {
	if (isRepeatedOrder() && typeof isRepeatOrder === 'undefined') {
		return custom_confirm({
			title: getlang('alert'),
			text: getlang('order_already_exists'),
			type: 'error',

			confirm: getlang('mobileAppContent-welcomePage-button-continue'),
			cancel: getlang('download_cancel'),
			onConfirm: service_post.bind(null, orderId, when, confirmed, callback, true),
			onCancel: navigate.bind(null, '#orders')
		});
	}

	// orderId === 'undefined' - не ошибка,
	// данная конструкция необходима в сценариий Repeat Order
	orderId = orderId === 'undefined' ? undefined : orderId;
	shop_order(when, orderId, confirmed, callback);
}

// проверяем существует ли заказ с таким serviceId в списках
// confirmed == in_process
// new == placed
function isRepeatedOrder() {
	var serviceId = Services.getShopId(),
		existedOrders = Object.assign(
			{},
			Services.getOrders('in_process'),
			Services.getOrders('placed')
		);

	for (var shop in existedOrders) {
		// проверка на length введена, т.к. бывает случай когда магазин (сервис) есть,
		// а заказов внутри нет
		if (shop === serviceId && existedOrders[shop].length) {
			return true;
		}
	}

	return false;
}

// function service_post(orderId, when, confirmed) {
// 	var token = require_auth(),
// 		order;
//
// 	if(!require_internet() || !token){
// 		return false
// 	}
//
// 	if (!confirmed) {
// 		if (typeof orderId === 'undefined') {
// 			order = Services.updateOrderStatus({
// 				from: 'not_added',
// 				to: 'not_placed'
// 			});
//
// 			orderId = order.id;
// 		}
//
// 		return informationPage.open({
// 			type: 'cp',
// 			onConfirm: 'service_post(\\\''+ orderId +'\\\', \\\''+ when +'\\\', true);'
// 		})
// 	}
//
// 	order = Services.getOrder('not_placed', orderId);
//
// 	order.orderTime = time_picker.get_ISO_string(null, true);
// 	order.deliveryTime = getDeliveryTime(when);
//
// 	successCallback({orderId: generate_uuid(true)});
//
// 	function successCallback(data) {
// 		order.id = data.orderId;
//
// 		Services.updateOrderStatus({
// 			from: 'not_placed',
// 			to: 'placed',
// 			id: order.id
// 		});
//
// 		informationPage.open({
// 			type: 'ss',
// 			approxTime: order.approxTime
// 		});
// 	}
// 	function errorCallback(msg) {
// 	    console.error(msg);
// 	}
// }
