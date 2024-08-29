var storage = window.localStorage;

function _tv_vendor_init() {
	var d = $.Deferred();

	$(HotezaTV).one('splashshow', function(){
		tv_keys = {
			EXIT: 8536,
			DOWN: 40,
			UP: 38,
			LEFT: 37,
			RIGHT: 39,
			ENTER: 13,
			BACK: 8568,
			MENU: 8516,
			RED: 8512,
			GREEN: 8513,
			YELLOW: 8514,
			BLUE: 8515,
			CH_UP: 8492,
			CH_DOWN: 8494,
			VOL_UP: 8495,
			VOL_DOWN: 8496,
			MUTE: 8497,
			NUM_0: 48,
			NUM_1: 49,
			NUM_2: 50,
			NUM_3: 51,
			NUM_4: 52,
			NUM_5: 53,
			NUM_6: 54,
			NUM_7: 55,
			NUM_8: 56,
			NUM_9: 57,
		};
	});
	
	$(HotezaTV).one('final', function(){
		CEC.onEvent = cecEvents;
	});

	d.resolve();
	return d.promise();
}
function _tv_channel_show (id){
}

function _tv_channel_stop(){
}

function _tv_bg_prepare(){
	$(document.body).get(0).style['background'] = 'none';
}
function _tv_bg_restore(){
	$(document.body).get(0).style['background'] = '';
}

function _setHandlerKeydown() {
	document.removeEventListener('keydown', tv_keydown,false);
	document.addEventListener('keydown', tv_keydown,false);
}

function cecEvents(){
	tv_log('CEC:');
	var cecEvent = CEC.EventBody[0] + CEC.EventBody[1];

	ASTB.DebugString('CEC: ' + cecEvent);
	switch(cecEvent){
		case '36':
			tvPower = false;
			ASTB.DebugString('36 '+ tvPower);
			break;
		case '04':
			tvPower = true;
			ASTB.DebugString('04 '+ tvPower);
			break;

		case '4443':
			mute = true;
			break;

		case '45':
			myte = false;
			break;

		default:
			break;

	}

}

function _tv_get_network_info(){
	var d = $.Deferred();
	return d.promise();
}
