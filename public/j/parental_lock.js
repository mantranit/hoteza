function parental_lock_page(){
	if(!$id('parental_lock_page')){
		renderPageOnTheStructv2('parental_lock_page', {
			title: getlang('parental_lock'),
			backBtn: 1,
			parentId: 'settings'
		}, 'parental_lock');
	}
	parental_lock_fill();
	navigate('#parental_lock_page');
}

function parental_lock_toggle(){
	if(parental_lock_status()){
		parental_lock_disable();
	}else{
		parental_lock_enable();
	}
}

function parental_lock_enable(){
	var data = load_data();

	data.parental_lock_enabled = true;

	save_data(data);
	parental_lock_fill();

	pincode_generate();
}

function parental_lock_disable(confirmed){
	if(!confirmed){
		custom_input({
			title: getlang('parental_lock'),
			text: getlang('parental_lock_disable_confirm'),
			check: pincode(),
			onConfirm: function(){
				parental_lock_disable(true);
			}
		});
	}else{
		var data = load_data();
		data.parental_lock_enabled = false;
		save_data(data);

		pincode_reset();
		parental_lock_fill();
	}
	//TODO: confirm by enter

}

function parental_lock_fill(){
	var data = load_data();
	if(data && data.parental_lock_enabled == true){
		$('#parental_lock_toggle .checkbox').addClass('selected');
		parental_lock_status_visible(true);
	}else{
		$('#parental_lock_toggle .checkbox').removeClass('selected');
		parental_lock_status_visible(false);
	}
}

function parental_lock_status_visible(visible) {
	if (!isset('config.tv.parental_lock_status_exist')) return;

	if (visible) {
		$('#tv_fullscreen_parental_lock').css('display', 'block');
	}
	else {
		$('#tv_fullscreen_parental_lock').css('display', 'none');
	}
}

function parental_lock_status(){
	var data = load_data();
	if(data && data.parental_lock_enabled == true){
		return true;
	}else{
		return false;
	}
}
