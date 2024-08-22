function custom_alert(text){
	text = text.toString();
	// //Samsung alert костыль
	// var arr = ['curWidget', 'Common\\\.API', '\\\[INFO\\\]'];
	// if(text.match(RegExp(arr.join('|'), 'i'))){
	// 	log.add('prevented alert from Samsung: ' + text);
	// 	return false;
	// }

	custom_dialog('alert', 'Alert', text);
}
function custom_info(text){
	custom_dialog('info','', text);
}
function custom_input(data){
	if(!system_started){
		log.add('DIALOGS: tried to show input before start! (' + data.text + ')');
		return false;
	}
	//TODO: удалить после реализации навигации по модулям
	if(tv_cur_block == 'tv_welcome'){
		console.log('DIALOGS: tried to show dialog on blocked page! (' + data.text + ')');
		log.add('DIALOGS: tried to show dialog on blocked page! (' + data.text + ')');
		return false;
	}
	//title string
	//text string
	//check string
	//confirm string
	//onConfirm func
	//onCancel func

	if (typeof (data) !== 'object') {
		data = {};
	}

	data.title = data.title || '';
	data.check = data.check || null;
	data.text = data.text || '';
	data.confirm = data.confirm || 'OK';

	data.onConfirm = data.onConfirm||function(){};
	data.onCancel = data.onCancel||function(){};

	//TODO: TV KEYS here???
	data.text +=
		'<br/><br/>' +
		'<div ontvkey="true" onvclick="$(\'#custom_dialog_confirm\').trigger(event_link);" style="width:100px;margin:auto;color: #000;">' +
			'<div id="custom_dialog_input" type="text"></div>' +
			'<div style="display:none;" on_NUM_1 onvclick="custom_input_key(1)"></div>' +
			'<div style="display:none;" on_NUM_2 onvclick="custom_input_key(2)"></div>' +
			'<div style="display:none;" on_NUM_3 onvclick="custom_input_key(3)"></div>' +
			'<div style="display:none;" on_NUM_4 onvclick="custom_input_key(4)"></div>' +
			'<div style="display:none;" on_NUM_5 onvclick="custom_input_key(5)"></div>' +
			'<div style="display:none;" on_NUM_6 onvclick="custom_input_key(6)"></div>' +
			'<div style="display:none;" on_NUM_7 onvclick="custom_input_key(7)"></div>' +
			'<div style="display:none;" on_NUM_8 onvclick="custom_input_key(8)"></div>' +
			'<div style="display:none;" on_NUM_9 onvclick="custom_input_key(9)"></div>' +
			'<div style="display:none;" on_NUM_0 onvclick="custom_input_key(0)"></div>' +
			'<div style="display:none;" on_LEFT onvclick="custom_input_key(-1)"></div>' +
		'</div>';

	if($('#custom_dialog').length){
		$('#custom_dialog').remove();
	}

	var append_block =
		'<div id="custom_dialog">' +
			'<div id="custom_dialog_wrapper">' +
				'<table id="custom_dialog_content">' +
					'<tr id="custom_dialog_title"><td>' + data.title + '</td></tr>' +
					'<tr id="custom_dialog_text"><td>' + data.text + '</td></tr>' +
					'<tr class="button_wrap' + (!data.confirm || !data.cancel ? ' contain' : '') + '">' +
						(
							data.confirm ?
								'<td class="button" id="custom_dialog_confirm" onvclick="" '+
									(data.btn_confirm === "hidden" ? 'style="display: none;"' : '') +
								'>' + data.confirm + '</td>'
								: ''
						) +
					'</tr>' +
				'</table>' +
			'</div>' +
		'</div>';

	$(document.body).append($(append_block));

	$('#custom_dialog_confirm').on(event_link, function(){

		if((data.check === null && $('#custom_dialog_input').html()) || $('#custom_dialog_input').html() == data.check){
			var value = $('#custom_dialog_input').html();
			custom_dialog_close();

			try{
				data.onConfirm(value);
			}catch(e){
				log.add('DIALOGS: Exception in onConfirm: ' + e);
			}
		}else{
			$('#custom_dialog_input').css('border-color', 'Red');
			setTimeout(function(){
				$('#custom_dialog_input').css('border-color', '');
				$('#custom_dialog_input').html('');
			}, 1000);
		}

	});

	custom_dialog_resize();

	if(typeof(tv_sel_block) != 'undefined'){
		tv_sel_block('dialog');
	}
}
function custom_input_check(checkedValue, successCallback, errorCallback) {
	var value = isset('config.tv.parental_lock') && parental_lock_status() ? pincode() : tv_room;

	successCallback = successCallback ? successCallback : function () {};
	errorCallback = errorCallback !== 'undefined' ? errorCallback : function () {
		var custom_input = document.getElementById('custom_dialog_input').closest('.input');

		custom_input.classList.add('error');
		setTimeout(function(){
			custom_input.classList.remove('error');
		}, 3000);
	};

	if (value == checkedValue) {
		return eval(successCallback);
	}

	return typeof errorCallback === 'function' ? errorCallback() : eval(errorCallback);
}
function custom_input_key(num){
	tv_channel_number = '';
	if(num >= 0){
		$('#custom_dialog_input').html(($('#custom_dialog_input').html() + num).substr(-6));
	}else{
		$('#custom_dialog_input').html($('#custom_dialog_input').html().substr(0, $('#custom_dialog_input').html().length-1));
	}
}

/**
 * @param {object} [data] - данные для построения
 *
 * @param {string} [data.type] - используется для добавления иконки. Смотрите customDialogGetIcon
 * @param {string} [data.icon] - используется для добавления иконки. Смотрите customDialogGetIcon
 *                               получаем в маркетинговой компании типа Alert
 *
 * @param {string} [data.title] - заголовок
 * @param {string} [data.text] - основное сообщение
 *
 * Если передать в [data.confirm || data.cancel] === null, эти кнопки не будут строится
 * @param {string} [data.confirm] - текст на кнопке confirm
 * @param {string} [data.cancel] - текст на кнопке cancel
 * @param {function} [data.onConfirm] - confirm callback
 * @param {function} [data.onCancel] - cancel callback (по умолчанию вызывается при закрытии диалогового окна)
 *
 * @param {boolean} [data.closeNotCancel] - флаг, при true любое закрытие диалогового окна не вызывает onCancel
 * */
function custom_confirm(data) {
	if(!system_started){
		log.add('DIALOGS: tried to show confirm before start! (' + data.text + ')');
		return false;
	}
	//TODO: удалить после реализации навигации по модулям
	if(tv_cur_block == 'tv_welcome'){
		console.log('DIALOGS: tried to show dialog on blocked page! (' + data.text + ')');
		log.add('DIALOGS: tried to show dialog on blocked page! (' + data.text + ')');
		return false;
	}

	//TODO: check vars
	//TODO: dialogs dispatcher
	//TODO: set default button
	//TODO: closeNotCancel переделать на onClose по умолчанию = onCancel

	if(typeof data !== 'object'){
		data = {};
	}

	data.title = data.title || '';
	data.text = data.text || '';

	// проверка на undefined введена для того чтобы передавать null в эти поля
	// при передаче null не строим эти кнопки
	// используется для создания custom_confirm с одной кнопкой
	data.confirm = typeof data.confirm === 'undefined' ? 'OK' : data.confirm;
	data.cancel = typeof data.cancel === 'undefined' ? 'Cancel' : data.cancel;

	data.onConfirm = data.onConfirm||function(){};
	data.onCancel = data.onCancel||function(){};

	data.closeNotCancel = !!data.closeNotCancel;

	if ($('#custom_dialog').length) {
		$('#custom_dialog').remove();
	}

	var append_block =
		'<div id="custom_dialog">' +
			'<div id="custom_dialog_wrapper">' +
				'<table id="custom_dialog_content">' +
					'<tr id="custom_dialog_title"><td>' + data.title + '</td></tr>' +
					(
						data.type ? '<tr id="custom_dialog_icon">' +
								'<td>'+ customDialogGetIcon(data.icon || ('dialog_' + data.type)) +'</td>' +
							'</tr>' : ''
					) +
					'<tr id="custom_dialog_text"><td>' + data.text + '</td></tr>' +
					'<tr class="button_wrap' + (!data.confirm || !data.cancel ? ' contain' : '') + '">' +
						(data.confirm ? '<td class="button" id="custom_dialog_confirm" onvclick="">' + data.confirm + '</td>' : '') +
						(data.cancel ? '<td class="button" id="custom_dialog_cancel" onvclick=""' + (data.closeNotCancel?'closeNotCancel="true"':'') + '>' + data.cancel + '</td>' : '') +
					'</tr>' +
				'</table>' +
			'</div>' +
		'</div>';

	$(document.body).append($(append_block));

	if (data.confirm) {
		$('#custom_dialog_confirm').on(event_link, function(){
			_custom_dialog_close();

			try {
				data.onConfirm();
			} catch (e) {
				log.add('DIALOGS: Exception in onConfirm');
			}
		});
	}

	if (data.cancel) {
		$('#custom_dialog_cancel').on(event_link, function(){
			_custom_dialog_close();

			try {
				data.onCancel();
			} catch (e) {
				log.add('DIALOGS: Exception in onCancel: ' + e);
			}
		});
	}

	custom_dialog_resize();
	if (typeof tv_sel_block !== 'undefined') {
		tv_sel_block('dialog');
	}
}

/**
 * @param {string} type - [alert | error | success | info]
 * @param {string} title
 * @param {string} text
 * @param {string} [cb] - ф-ия вызывающаяся при закрытии диалогового окна
 * */
function custom_dialog(type, title, text, cb){
	if(!system_started){
		log.add('DIALOGS: tried to show dialog before start! (' + text + ')');
		return false;
	}
	//TODO: удалить после реализации навигации по модулям
	if(tv_cur_block == 'tv_welcome'){
		console.log('DIALOGS: tried to show dialog on blocked page! (' + text + ')');
		log.add('DIALOGS: tried to show dialog on blocked page! (' + text + ')');
		return false;
	}

	cb = cb ? cb : '';

	if($('#custom_dialog').length){
		$('#custom_dialog').remove();
	}

	title = getlang(title.toLowerCase()) !== 'lang error' ? getlang(title.toLowerCase()) : title;

	$(document.body).append($(
		'<div id="custom_dialog">' +
			'<div id="custom_dialog_wrapper">' +
				'<table id="custom_dialog_content">' +
					(title != '' ? '<tr id="custom_dialog_title"><td>' + title + '</td></tr>' : '') +
					(type != 'info' ? '<tr id="custom_dialog_icon"><td>' + customDialogGetIcon('dialog_' + type) + '</td></tr>' : '') +
					'<tr id="custom_dialog_text"><td>' + text + '</td></tr>' +
					'<tr class="button_wrap contain">' +
						'<td class="button" id="custom_dialog_ok" onvclick="custom_dialog_close();'+ cb +'">OK</td>' +
					'</tr>' +
				'</table>' +
			'</div>' +
		'</div>'
	));

	custom_dialog_resize();

	if(typeof(tv_sel_block) != 'undefined'){
		tv_sel_block('dialog');
	}

}

function customDialogGetIcon(type) {
	if (typeof SVG === 'undefined') {
		return '';
	}
	if(SVG.iconsValue[type]){
		return '<div class="svg_icon">' + SVG.iconsValue[type] + '</div>';
	}else{
		return '' +
		'<svg class="svg_icon" viewBox="0 0 130 130">' +
			'<use xlink:href="#' + type + '"></use>'+
		'</svg>';
	}
}

function custom_dialog_resize(max_width){
	if(!$id('custom_dialog_wrapper')){
		return false;
	}

	var tmp_max_width;
	if(max_width){
		tmp_max_width = max_width;
	}else{
		tmp_max_width = parseInt(ww*0.8);
	}

	var obj = $('#custom_dialog_wrapper');

	obj.css({
		width: 'auto',
		height: '',
		top: '',
		left: ''
	});
	var coords = $id('custom_dialog_wrapper').getBoundingClientRect();
	var w,h;
	if(coords.width > tmp_max_width){
		w = tmp_max_width;
		obj.outerWidth(w);
		coords = $id('custom_dialog_wrapper').getBoundingClientRect();
	}else{
		w = Math.ceil(coords.width);
	}
	if(coords.height > (wh*0.98|0)){
		h = wh*0.98|0;
		obj.outerHeight(h);
	}else{
		h = coords.height;
	}
	obj.css({
		'top': (wh-h)/2 + 'px',
		'left': (ww-w)/2 + 'px'
	});
}

function custom_dialog_close(){
	if($id('custom_dialog_cancel') && $('#custom_dialog_cancel').attr('closeNotCancel')!=='true'){
		$('#custom_dialog_cancel').trigger(event_link);
	}
	_custom_dialog_close();
}
function _custom_dialog_close(){
	$('#custom_dialog').remove();
	if(typeof(tv_menu) != 'undefined'){
		tv_sel_block();
		//tv_menu();
	}
}
