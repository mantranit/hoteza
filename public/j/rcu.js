var rcu_requesting = false;
//TODO: сделать из этого Модуль
//Иначе остаётся только надеяться на Events
try {
	Events.registerListener('rcu', rcu_events_listener);
} catch (error) {
	log.add('RCU: ERROR! Events not initialized');
}
function rcu_events_listener(obj){
	if(!obj.ch || (obj.ch && obj.ch == Events.TVID())){
		switch(obj.cmd){
			//WAWELBERG door eye
			case 'doorbell':
				custom_confirm({
					title: 'DoorBell',
					text:'<img id="doorbell_photo" data-image="' + (obj.data||'i/placeholder.png') + '" src="' + (obj.data||'i/placeholder.png') + '" style="width:640px;height:240px;margin:45px 0px;">',
					//TODO: lang
					confirm: "I'm coming",
					onConfirm: function(){
						rcu_doorbell_send_close_event();
						//rcu_press(1, 1, 'mur', {deviceLocation: "MUR"});
					},
					cancel: "Do not disturb",
					onCancel: function(){
						rcu_doorbell_send_close_event();
						rcu_press(1, 1, 'dnd', {deviceLocation: "DND"});
					},
					closeNotCancel: true
				});
				rcu_doorbell_photo_update();

				setTimeout(function(){
					custom_dialog_close();
				}, 3*T_MIN);
				break;
			case 'doorbell_closed':
				if($id('doorbell_photo')){
					custom_dialog_close();
				}
				break;
			default:
				log.add('EV: unknown rcu event ' + obj.cmd);
				break;
		}
	}
}
var rcu_doorbell_timer;
function rcu_doorbell_photo_update(){
	if(rcu_doorbell_timer){
		clearTimeout(rcu_doorbell_timer);
	}

	if($id('doorbell_photo')){
		var image = $('#doorbell_photo').data('image');
		$('#doorbell_photo').attr('src', image + '?_=' + Math.random());
		rcu_doorbell_timer = setTimeout(rcu_doorbell_photo_update, 300);
	}
}
function rcu_doorbell_send_close_event(){
	//TODO: переделать нормально на Events с указанием CAT
	var tmp = GibberishAES.enc(
		JSON.stringify ({
			'cat': 'rcu',
			'room': storage.getItem('room'),
			'ch': '',
			'cmd': 'doorbell_closed',
			'data': ''
		}), Events.secret
	);
	//TODO: local queue url?
	$.post(
    "http://103.153.72.195:8080/api/v1/queue/pub/?id=" + Events.channel + "T",
    JSON.stringify({ c: tmp })
  );
}

function build_rcu(struct){
	//Построение рум контрола
	if(isset('structv2.rcu')){
		var tmp_arr = {};
		if(!struct){
			tmp_arr = structv2['rcu'];
		}else{
			tmp_arr = struct;
		}
		var tmp_stat = {
			pages: 0,
			categories: 0,
			items: 0
		};

		var device = 'tv';
		_filter(tmp_arr, device);
		for (var key in tmp_arr) {
			for (var key2 in tmp_arr[key].items) {
				var tmp_item = tmp_arr[key].items[key2];
				if (tmp_item.type == 'rcuCategory') {
					_filter(tmp_item.items, device);
				}
			}
			_filter(tmp_arr[key].items, device);
		}

		for(var i in tmp_arr){//pages
			tmp_stat['pages']++;
			var tmp_page = tmp_arr[i];
			var tmp = '';

			renderPageOnTheStructv2(tmp_page.id, tmp_page, 'rcu', 'rcu_page');

			for(var o in tmp_page.items){
				var tmp_rcu = tmp_page.items[o];

				if(tmp_rcu.type === 'rcuCategory'){
					tmp_stat['categories']++;

					tmp += '<div id="rcu_'+tmp_rcu['id']+'" groups=\''+JSON.stringify(tmp_rcu['groups'])+'\' class="rcu category" onvclick="navigate(\'#'+tmp_rcu['id']+'\')">';
					if(tmp_rcu['icon']){
						tmp += '<div class="title">' + SVG.iconsValue[tmp_rcu['icon']] + tmp_rcu['title'] + '</div>';
					}else if(tmp_rcu['image']){
						tmp += '<div class="title" style="background-image:url(' + tmp_rcu['image'] + ');">' + tmp_rcu['title'] + '</div>';
					}
					tmp += '</div>';

					//TODO: переделать на UI
					//Построение новой страницы
					$('#container').append('' +
						'<div ' +
							'class="page rcu_page" ' +
							'id="'+tmp_rcu['id']+'"  ' +
							'groups=\''+JSON.stringify(tmp_rcu['groups']||[])+'\' ' +
							'onopen="rcu_check_states_start(\''+tmp_rcu['id']+'\')"' +
							'onclose="rcu_check_states_stop()"' +
						'>' +
							'<div class="content_wrapper">' +
								'<div class="content"></div>' +
							'</div>' +
							'<div class="header">' +
								'<div ' +
									'class="back" ' +
									'onvclick="navigate(\'#'+tmp_page['id']+'\',\'back\');" ' +
									'href_type="back"' +
								'></div>' +
								'<h1>'+tmp_rcu['title']+'</h1>' +
							'</div>' +
						'</div>');

					var tmp2 = '';
					var tmp_rcu_item;
					for(var p in tmp_rcu.items){
						tmp_stat['items']++;
						tmp_rcu_item = tmp_rcu.items[p];
						tmp2 += rcu_build_item(tmp_rcu_item);
					}
					$('#'+tmp_rcu['id']+' .content').html(tmp2);

				}
				else{
					tmp_stat['items']++;
					tmp += rcu_build_item(tmp_rcu);
				}
			}
			if(tmp_page){
				$('#'+tmp_page['id']+' .content').html(tmp);
			}
		}

		log.add('RCU: ' + tmp_stat.pages + ' pages with ' + tmp_stat.items + ' items in ' + tmp_stat.categories + ' categories');

		filter_content_by_group();

	}else{
		log.add('RCU: no RCU struct');
	}

	//TODO: сделать нормальную фильтрацию любого контента (переделать filter_content_by_device_for_struct)
	function _filter(o, device) {
		for (var key in o) {
			if (
				(
					o[key].devices &&
					!o[key].devices.length
				) ||
				!o[key].devices ||
				o[key].devices.indexOf('') !== -1
			) {
				//tmp_i2++;
				continue;
			}

			if (o[key].devices.indexOf(device) === -1) {
				//tmp_i++;
				delete o[key];
			}
		}
	}

}

function rcu_test(){
	//TODO: сделать смену урл обратно?
	config.rcu_url = 'http://rcudemo.hoteza.com/';
	$.getJSON('modules/Tests/rcu_test.json')
	.done(function(d){
		build_rcu(d);
		var tmp = '#' + d[Object.keys(d)[0]].id;
		navigate(tmp);
	})
	.fail(function(e){
		custom_alert('Failed to load Test RCUs: ' + e);
	});
}

var rcu_data = {};
function rcu_build_item(item){
	rcu_data[item.id] = item;

	var tmp2 = '';
	switch(item['itemType']){
		case 'light':
		tmp2 += '<div id="rcu_'+item['id']+'" class="rcu off" ontvkey="true" onvclick="rcu_press(\''+item['id']+'\')" groups=\''+JSON.stringify(item['groups']||[])+'\' type="light">';
		if(item['icon']){
			tmp2 += '<div class="title">' + SVG.iconsValue[item['icon']] + item['title'] + '</div>';
		}else if(item['image']){
			tmp2 += '<div class="title" style="background-image:url(' + item['image'] + ');">' + item['title'] + '</div>';
		}
		tmp2 += '<div class="bb bl" on_CH_DOWN onvclick="rcu_press(\''+item['id']+'\',0)">Off</div>';
		tmp2 += '<div class="bb br" on_CH_UP onvclick="rcu_press(\''+item['id']+'\',1)">On</div>';
		tmp2 += '</div>';
		break;

		case 'dimmer':
		tmp2 += '<div id="rcu_'+item['id']+'" class="rcu plusminus" ontvkey="true" groups=\''+JSON.stringify(item['groups']||[])+'\' type="dimmer">';
		if(item['icon']){
			tmp2 += '<div class="title">' + SVG.iconsValue[item['icon']] + item['title'] + '</div>';
		}else if(item['image']){
			tmp2 += '<div class="title" style="background-image:url(' + item['image'] + ');">' + item['title'] + '</div>';
		}
		tmp2 += '<div class="bb bl" on_CH_DOWN onvclick="rcu_press(\''+item['id']+'\',0)"><span>&ndash;</span></div>';
		tmp2 += '<div class="bb br" on_CH_UP onvclick="rcu_press(\''+item['id']+'\',1)"><span>+</span></div>';
		tmp2 += '</div>';
		break;

		case 'light3btn':
		tmp2 += '<div id="rcu_'+item['id']+'" class="rcu on" ontvkey="true" onvclick="rcu_press(\''+item['id']+'\')" groups=\''+JSON.stringify(item['groups']||[])+'\' type="light3btn">';
		if(item['icon']){
			tmp2 += '<div class="title">' + SVG.iconsValue[item['icon']] + item['title'] + '</div>';
		}else if(item['image']){
			tmp2 += '<div class="title" style="background-image:url(' + item['image'] + ');">' + item['title'] + '</div>';
		}
		tmp2 += '<div class="bb bl rcu-icon-moon" on_CH_DOWN onvclick="rcu_press(\''+item['id']+'\',0)"></div>';
		tmp2 += '<div class="bb bc rcu-icon-half-moon" onvclick="rcu_press(\''+item['id']+'\',1)"></div>';
		tmp2 += '<div class="bb br rcu-icon-full-moon" on_CH_UP onvclick="rcu_press(\''+item['id']+'\',2)"></div>';

		tmp2 += '</div>';
		break;

		case 'scene':
		tmp2 += '<div id="rcu_'+item['id']+'" class="rcu category off" groups=\''+JSON.stringify(item['groups']||[])+'\' onvclick="rcu_press(\''+item['id']+'\')" type="scene">';
		if(item['icon']){
			tmp2 += '<div class="title">' + SVG.iconsValue[item['icon']] + item['title'] + '</div>';
		}else if(item['image']){
			tmp2 += '<div class="title" style="background-image:url(' + item['image'] + ');">' + item['title'] + '</div>';
		}
		tmp2 += '</div>';
		break;

		case 'dnd':
		tmp2 += '<div id="rcu_'+item['id']+'" class="rcu category" groups=\''+JSON.stringify(item['groups']||[])+'\' onvclick="rcu_press(\''+item['id']+'\')" type="dnd">';
		tmp2 += '<div class="title">' + item['title'] + '</div>';
		tmp2 += '<div style="width:100%;height:100px;position:absolute;top:65px;fill:currentColor;text-align: center;">';
		tmp2 += '<svg width="48px" height="100px" viewBox="0 0 48 100" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M23.4545455,0.00382350036 C12.7159091,0.291753954 3.57102327,7.57467331 1.02272727,17.6183261 L0.954545455,17.6183261 C0.937501091,17.6606681 0.971592,17.7114803 0.954545455,17.7538223 C-0.196023273,21.7933015 2.87215855,26.086837 7.22727273,26.086837 C10.125,26.086837 12.7329556,24.1052066 13.4318182,21.2089747 C13.4403404,21.1751007 13.4914778,21.1751007 13.5,21.1412267 C14.9914778,15.7637217 20.3096596,12.2069471 26.3863636,13.4856928 C30.5710233,14.391824 33.8607949,17.5929201 34.7727273,21.7509594 L34.7045455,21.7509594 C36.1875011,28.9491948 30.9886364,34.9618364 24,34.9618364 L10.9090909,34.9618364 C8.57386473,34.9618364 6.298296,34.7501242 4.09090909,35.436073 C2.98295564,35.7748135 1.85795564,36.4522943 1.09090909,37.5362637 C0.323864727,38.6202331 0,39.9751949 0,41.4656528 L0,89.1603061 C0,95.1136698 4.91761309,100 10.9090909,100 L37.0909091,100 C43.0823869,100 48,95.1136698 48,89.1603061 L48,24.5963791 C48,12.012173 38.4375011,1.02851278 25.7045455,0.0715715874 L25.6363636,0.0715715874 C24.9119324,0.029229575 24.1704545,-0.0131124374 23.4545455,0.00382350036 Z M23.5909091,4.40744916 C24.1875011,4.39051322 24.7585222,4.37357512 25.3636364,4.40744916 C35.7613636,5.18655216 43.6363636,14.1970477 43.6363636,24.5963791 L43.6363636,89.1603061 C43.6363636,92.7509547 40.7045455,95.6641224 37.0909091,95.6641224 L10.9090909,95.6641224 C7.29545455,95.6641224 4.36363636,92.7509547 4.36363636,89.1603061 L4.36363636,41.4656528 C4.36363636,40.5679917 4.51704655,40.2123132 4.63636364,40.042943 C4.75568291,39.8735727 4.90909091,39.7126705 5.38636364,39.5687063 C6.34090909,39.2723079 8.44602327,39.297714 10.9090909,39.297714 L24,39.297714 C33.596592,39.297714 41.0028415,30.5751489 39,20.8702343 C37.7301142,15.0608369 33.1193193,10.4793709 27.2727273,9.21756334 C18.9886364,7.47305118 11.2414778,12.5456876 9.20454545,20.1250054 C8.99147782,21.1496946 8.22443127,21.7509594 7.22727273,21.7509594 C5.52272727,21.7509594 4.62784145,20.4637458 5.11363636,18.9055398 C7.19318182,10.5979312 14.6931818,4.6360995 23.5909091,4.40744916 Z" id="Shape" fill-rule="nonzero"></path></svg>';
		tmp2 += '</div>';
		tmp2 += '<div class="on">On</div><div class="off">Off</div>';
		tmp2 += '</div>';
		break;

		case 'mur':
		tmp2 += '<div id="rcu_'+item['id']+'" class="rcu off" onvclick="rcu_press(\''+item['id']+'\')" groups=\''+JSON.stringify(item['groups']||[])+'\' type="mur">';
		tmp2 += '<div class="title">' + item['title'] + '</div>';
		tmp2 += '<div style="width:100%;height:100px;position:absolute;top:65px;fill:currentColor;text-align: center;">';
		tmp2 += '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><path fill-rule="nonzero" d="M21.044 0c-2.735 0-5.525 1.39-7.774 2.72A37.042 37.042 0 0 0 9.343 5.4a1.275 1.275 0 0 0-.12 1.92s1.677 1.655 3.926 3.32c2.25 1.665 5.04 3.44 7.895 3.44 3.891 0 7.052-3.155 7.052-7.04 0-3.885-3.16-7.04-7.052-7.04zm0 2.56c2.519 0 4.488 1.965 4.488 4.48 0 2.515-1.969 4.48-4.488 4.48-1.633 0-4.293-1.425-6.372-2.96-1.382-1.02-1.793-1.47-2.404-2.04.631-.465.962-.78 2.284-1.56 2.079-1.23 4.738-2.4 6.492-2.4zM3.532 12.8c-.45.035-.921.17-1.362.4-.025.015-.055-.015-.08 0C.006 14.205-.555 16.85.567 18.72l6.171 10.12.04-.04c.37.675.912 1.145 1.483 1.44.6.31 1.212.48 1.883.48.41 0 .787-.105 1.162-.24l-4.929 15.2a1.281 1.281 0 0 0 1.203 1.68h6.411v12.8c0 2.104 1.738 3.84 3.847 3.84a3.83 3.83 0 0 0 2.564-1 3.83 3.83 0 0 0 2.565 1c2.109 0 3.847-1.736 3.847-3.84v-12.8h3.847a1.282 1.282 0 0 0 1.242-1.64l-.28-.92c.064.005.135 0 .2 0h.36c.08.01.16.01.24 0 .231-.04.432-.12.642-.2l1.242 1.12-.36.4a1.275 1.275 0 0 0-.04 1.64l3.205 4c.08.095.175.175.28.24.311 2.135 1.408 4.62 2.966 6.88C42.216 61.574 44.84 64 48.092 64c.34.01.676-.12.921-.36l12.703-12.68c.426-.42.506-1.08.185-1.59a1.285 1.285 0 0 0-1.507-.53s-1.708.56-4.93.56c-3.11 0-7.543-.565-12.822-2.84a1.236 1.236 0 0 0-.36-.36l-4.208-2.96a1.288 1.288 0 0 0-.882-.24 1.3 1.3 0 0 0-.801.44l-.36.4-1.003-.92c.501-.885.652-1.895.481-2.92v-.08l-4.367-18.64v-.08h-.04c-.667-3.4-3.757-5.84-7.374-5.84h-6.411c-2.585 0-4.909 1.265-6.412 3.36l-.04.04-.68 1-3.046-5.08-.04-.04a4.235 4.235 0 0 0-2.244-1.68 3.5 3.5 0 0 0-1.323-.16zm.2 2.52c.411-.025.857.23 1.203.72.015.02.03.02.04.04l.36.6a1.31 1.31 0 0 0-.52-.04c-.496.075-.907.43-1.042.915-.14.48.02 1 .4 1.325L12.189 26l-1.042 1.56c-.35.52-.47.6-1.002.6-.1 0-.456-.065-.721-.2a1.254 1.254 0 0 1-.44-.36c-.011-.04-.026-.08-.041-.12L2.771 17.4c-.4-.665-.19-1.575.48-1.88a.605.605 0 0 0 .081-.08.978.978 0 0 1 .4-.12zm13.585 2.6h6.411c2.51 0 4.493 1.615 4.889 3.8.01.025.025.055.04.08l4.328 18.6v.08c.055.46-.025.9-.2 1.2-.186.32-.406.495-.802.56h-.16c-.586 0-1.077-.355-1.202-.92v-.04l-3.326-13.44a1.283 1.283 0 0 0-2.485.64l1.723 6.88-14.826-13.2 1.282-1.96c1.062-1.485 2.55-2.28 4.328-2.28zm-2.605 10.32l11.901 10.6c.156.155.351.265.561.32l1.724 5.64h-8.255a1.305 1.305 0 0 0-.521 0h-4.568a1.202 1.202 0 0 0-.401-.04c-.04.01-.08.025-.12.04h-5.69l5.37-16.56zm45.441 8.88c-2.109 0-3.847 1.735-3.847 3.84 0 2.105 1.738 3.84 3.847 3.84S64 43.065 64 40.96c0-2.105-1.738-3.84-3.847-3.84zm0 2.56c.721 0 1.282.56 1.282 1.28s-.56 1.28-1.282 1.28c-.721 0-1.282-.56-1.282-1.28s.56-1.28 1.282-1.28zm-8.335 2.56c-1.062 0-1.923.86-1.923 1.92s.861 1.92 1.923 1.92 1.924-.86 1.924-1.92-.862-1.92-1.924-1.92zm-14.305 3.72l2.124 1.48L38.194 49l-1.603-2 .922-1.04zm-20.957 1.4h2.564V60.16c0 .71-.57 1.28-1.282 1.28-.711 0-1.282-.57-1.282-1.28v-12.8zm5.129 0h2.564v12.8c0 .71-.57 1.28-1.282 1.28-.711 0-1.282-.57-1.282-1.28V47.36zm20.276 1.6c5.444 2.28 10.163 3 13.504 3 .741 0 1.147-.11 1.763-.16l-5.29 5.28c-4.072-.18-6.17-2.84-6.17-2.84a1.279 1.279 0 0 0-1.243-.48c-.45.08-.821.395-.981.82-.156.43-.07.91.22 1.26 0 0 2.119 2.565 5.93 3.48l-1.963 1.96c-1.788-.196-3.747-1.66-5.25-3.84-1.497-2.175-2.404-4.785-2.524-6.24l2.004-2.24z"/></svg>';
		tmp2 += '</div>';
		tmp2 += '<div class="bb bl" onvclick="rcu_press(\''+item['id']+'\',0)">Off</div>';
		tmp2 += '<div class="bb br" onvclick="rcu_press(\''+item['id']+'\',1)">On</div>';
		tmp2 += '</div>';
		break;

		case 'curtain':
		tmp2 += '<div id="rcu_'+item['id']+'" class="rcu" ontvkey="true" groups=\''+JSON.stringify(item['groups']||[])+'\' type="curtain">';
		if(item['icon']){
			tmp2 += '<div class="title">' + SVG.iconsValue[item['icon']] + item['title'] + '</div>';
		}else if(item['image']){
			tmp2 += '<div class="title" style="background-image:url(' + item['image'] + ');">' + item['title'] + '</div>';
		}
		tmp2 += '<div class="bb bl rcu-icon-curtain_close" on_CH_DOWN onvclick="rcu_press(\''+item['id']+'\',0)"></div>';
		tmp2 += '<div class="bb br rcu-icon-curtain_open" on_CH_UP onvclick="rcu_press(\''+item['id']+'\',1)"></div>';
		tmp2 += '</div>';
		break;

		case 'curtainPause':
		case 'curtainPause3Register':
		tmp2 += '<div id="rcu_'+item['id']+'" class="rcu" ontvkey="true" groups=\''+JSON.stringify(item['groups']||[])+'\' type="curtainPause">';
		if(item['icon']){
			tmp2 += '<div class="title">' + SVG.iconsValue[item['icon']] + item['title'] + '</div>';
		}else if(item['image']){
			tmp2 += '<div class="title" style="background-image:url(' + item['image'] + ');">' + item['title'] + '</div>';
		}
		tmp2 += '<div class="bb bl rcu-icon-curtain_close" on_CH_DOWN onvclick="rcu_press(\''+item['id']+'\',0)"></div>';
		tmp2 += '<div class="bb bc rcu-icon-curtain_pause" on_ENTER onvclick="rcu_press(\''+item['id']+'\',2)"></div>';
		tmp2 += '<div class="bb br rcu-icon-curtain_open" on_CH_UP onvclick="rcu_press(\''+item['id']+'\',1)"></div>';
		tmp2 += '</div>';
		break;

		case 'tv':
		tmp2 += '<div id="rcu_'+item['id']+'" class="rcu plusminus" ontvkey="true" groups=\''+JSON.stringify(item['groups']||[])+'\' type="tv">';
		if(item['icon']){
			tmp2 += '<div class="title">' + SVG.iconsValue[item['icon']] + item['title'] + '</div>';
		}else if(item['image']){
			tmp2 += '<div class="title" style="background-image:url(' + item['image'] + ');">' + item['title'] + '</div>';
		}
		tmp2 += '<div class="bb bl" on_CH_DOWN onvclick="rcu_press(\''+item['id']+'\',0)"><span>&ndash;</span></div>';
		tmp2 += '<div class="bb br" on_CH_UP onvclick="rcu_press(\''+item['id']+'\',1)"><span>+</span></div>';
		tmp2 += '</div>';
		break;

		case 'tvonoff':
		tmp2 += '<div id="rcu_'+item['id']+'" class="rcu off" ontvkey="true" onvclick="rcu_press(\''+item['id']+'\')" groups=\''+JSON.stringify(item['groups']||[])+'\' type="tvonoff">';
		if(item['icon']){
			tmp2 += '<div class="title">' + SVG.iconsValue[item['icon']] + item['title'] + '</div>';
		}else if(item['image']){
			tmp2 += '<div class="title" style="background-image:url(' + item['image'] + ');">' + item['title'] + '</div>';
		}
		tmp2 += '<div class="bb bl" on_CH_DOWN onvclick="rcu_press(\''+item['id']+'\',0)">Off</div>';
		tmp2 += '<div class="bb br" on_CH_UP onvclick="rcu_press(\''+item['id']+'\',1)">On</div>';
		tmp2 += '</div>';
		break;

		case 'fcu':
		tmp2 += '<div id="rcu_'+item['id']+'" ontvkey="true" onvclick="rcu_ac_press(\''+item['id']+'\',false,\'mode\')" class="rcu off" groups=\''+JSON.stringify(item['groups']||[])+'\' type="fcu">';
		if(item['icon']){
			tmp2 += '<div class="title">' + SVG.iconsValue[item['icon']] + item['title'] + '</div>';
		}else if(item['image']){
			tmp2 += '<div class="title" style="background-image:url(' + item['image'] + ');">' + item['title'] + '</div>';
		}
		tmp2 += '<div class="bb bl" on_CH_DOWN onvclick="rcu_ac_press(\''+item['id']+'\',0,\'mode\')">Off</div>';
		tmp2 += '<div class="bb br" on_CH_UP onvclick="rcu_ac_press(\''+item['id']+'\',1,\'mode\')">On</div>';
		tmp2 += '</div>';
		tmp2 += '<div id="rcu_'+item['id']+'_fan" class="rcu plusminus" ontvkey="true" groups=\''+JSON.stringify(item['groups']||[])+'\'>';
		tmp2 += '<div class="title"><div id="rcu_'+item['id']+'_fan_value" class="rcu_fan3level"><div class="fl1 rcu-icon-fan3"></div><div class="fl2 rcu-icon-fan3fill"></div></div></div>';
		tmp2 += '<div class="bb bl" on_CH_DOWN onvclick="rcu_ac_press(\''+item['id']+'\',0,\'fan\')"><span>&ndash;</span></div>';
		tmp2 += '<div class="bb br" on_CH_UP onvclick="rcu_ac_press(\''+item['id']+'\',1,\'fan\')"><span>+</span></div>';
		tmp2 += '</div>';
		tmp2 += '<div id="rcu_'+item['id']+'_temperature" class="rcu plusminus" ontvkey="true" groups=\''+JSON.stringify(item['groups']||[])+'\'>';
		tmp2 += '<div class="title"><div style="font-size: 50px;margin-top: 40px;" id="rcu_'+item['id']+'_temperature_value">N/A</div></div>';
		tmp2 += '<div class="bb bl" on_CH_DOWN onvclick="rcu_ac_press(\''+item['id']+'\',0,\'temperature\')"><span>&ndash;</span></div>';
		tmp2 += '<div class="bb br" on_CH_UP onvclick="rcu_ac_press(\''+item['id']+'\',1,\'temperature\')"><span>+</span></div>';
		tmp2 += '</div>';
		break;

		//Костыль из управления кондеем для 7132
		case 'fcutemponly':
		tmp2 += '<div id="rcu_'+item['id']+'" class="rcu plusminus" ontvkey="true" groups=\''+JSON.stringify(item['groups']||[])+'\' type="fcu">';
		tmp2 += '<div class="title">' + item['title'];
		tmp2 += '<table style="width:100%;"><tr><td style="text-align: right;color:#999;" id="rcu_'+item['id']+'_temperature_value_cur">N/A</td>';
		tmp2 += '<td style="text-align: center;" class="rcu-icon-nav_right"></td>';
		tmp2 += '<td style="text-align: left;" id="rcu_'+item['id']+'_temperature_value_set">N/A</td></tr></table></div>';
		tmp2 += '<div class="bb bl" on_CH_DOWN onvclick="rcu_ac_press(\''+item['id']+'\',0,\'temperature\')"><span>&ndash;</span></div>';
		tmp2 += '<div class="bb br" on_CH_UP onvclick="rcu_ac_press(\''+item['id']+'\',1,\'temperature\')"><span>+</span></div>';
		tmp2 += '</div>';
		break;

		case 'fcu7lvl':
		tmp2 += '<div id="rcu_'+item['id']+'" ontvkey="true" onvclick="rcu_ac_press(\''+item['id']+'\',false,\'mode\')" class="rcu off" groups=\''+JSON.stringify(item['groups']||[])+'\' type="fcu">';
		if(item['icon']){
			tmp2 += '<div class="title">' + SVG.iconsValue[item['icon']] + item['title'] + '</div>';
		}else if(item['image']){
			tmp2 += '<div class="title" style="background-image:url(' + item['image'] + ');">' + item['title'] + '</div>';
		}
		tmp2 += '<div class="bb bl" on_CH_DOWN onvclick="rcu_ac_press(\''+item['id']+'\',0,\'mode\')">Off</div>';
		tmp2 += '<div class="bb br" on_CH_UP onvclick="rcu_ac_press(\''+item['id']+'\',1,\'mode\')">On</div>';
		tmp2 += '</div>';
		tmp2 += '<div id="rcu_'+item['id']+'_fan" class="rcu plusminus" ontvkey="true" groups=\''+JSON.stringify(item['groups']||[])+'\'>';
		tmp2 += '<div class="title"><div id="rcu_'+item['id']+'_fan_value" class="rcu_fan5level"><div class="fl1 rcu-icon-fan5"></div><div class="fl2 rcu-icon-fan5fill"></div></div></div>';
		tmp2 += '<div class="bb bl" on_CH_DOWN onvclick="rcu_ac_press(\''+item['id']+'\',0,\'fan\')"><span>&ndash;</span></div>';
		tmp2 += '<div class="bb br" on_CH_UP onvclick="rcu_ac_press(\''+item['id']+'\',1,\'fan\')"><span>+</span></div>';
		tmp2 += '</div>';
		tmp2 += '<div id="rcu_'+item['id']+'_temperature" class="rcu plusminus" ontvkey="true" groups=\''+JSON.stringify(item['groups']||[])+'\'>';
		tmp2 += '<div class="title"><div style="font-size: 50px;margin-top: 40px;" id="rcu_'+item['id']+'_temperature_value">N/A</div></div>';
		tmp2 += '<div class="bb bl" on_CH_DOWN onvclick="rcu_ac_press(\''+item['id']+'\',0,\'temperature\')"><span>&ndash;</span></div>';
		tmp2 += '<div class="bb br" on_CH_UP onvclick="rcu_ac_press(\''+item['id']+'\',1,\'temperature\')"><span>+</span></div>';
		tmp2 += '</div>';
		break;

		case 'hotezaremote':
			break;

		default:
			log.add('RCU: unsupported item type = ' + item['itemType']);
			break;
	}
	return tmp2;
}

function rcu_ac_press(id, state, param){
	if(rcu_requesting){
		return false;
	}

	if(typeof(state) === 'undefined' || state === false){
		state = $('#rcu_'+id).hasClass('off')?1:0;
	}

	if(!guestData['rcu_data']){
		guestData['rcu_data'] = {};
	}
	if(!guestData['rcu_data'][id]){
		guestData['rcu_data'][id] = {'fan':0, 'mode':1, 'temperature_cur':23, 'temperature_set':23};
	}

	var params = rcu_data[id].params;

	var tmp_fan_max = 3;
	if($('#rcu_'+id+'_fan_value').hasClass('rcu_fan5level')){
		tmp_fan_max = 5;
	}

	switch(param){
		case 'mode':
			guestData['rcu_data'][id]['mode'] = state;
			break;
		case 'fan':
			if(state){
				guestData['rcu_data'][id]['fan'] = Math.min(tmp_fan_max ,((guestData['rcu_data'][id]['fan']|0)+1));
				$('#rcu_'+id+'_fan').addClass('off');
				setTimeout(function(){
					$('#rcu_'+id+'_fan').removeClass('off');
				}, 500);
			}else{
				guestData['rcu_data'][id]['fan'] = Math.max(0,((guestData['rcu_data'][id]['fan']|0)-1));
				$('#rcu_'+id+'_fan').addClass('on');
				setTimeout(function(){
					$('#rcu_'+id+'_fan').removeClass('on');
				}, 500);
			}
			break;
		case 'temperature':
			if(state){
				guestData['rcu_data'][id]['temperature'] = ((guestData['rcu_data'][id]['temperature_set']|0)+1).constrain(isset('config.rcu_ac_temp_range.min')||16, isset('config.rcu_ac_temp_range.max')||32);
				guestData['rcu_data'][id]['temperature_set'] = guestData['rcu_data'][id]['temperature'];
				$('#rcu_'+id+'_temperature').addClass('off');
				setTimeout(function(){
					$('#rcu_'+id+'_temperature').removeClass('off');
				}, 500);
			}else{
				guestData['rcu_data'][id]['temperature'] = ((guestData['rcu_data'][id]['temperature_set']|0)-1).constrain(isset('config.rcu_ac_temp_range.min')||16, isset('config.rcu_ac_temp_range.max')||32);
				guestData['rcu_data'][id]['temperature_set'] = guestData['rcu_data'][id]['temperature'];
				$('#rcu_'+id+'_temperature').addClass('on');
				setTimeout(function(){
					$('#rcu_'+id+'_temperature').removeClass('on');
				}, 500);
			}
			break;
		default:
			break;
	}
	$.extend(params, guestData['rcu_data'][id]);

	rcu_press(id, state, 'fcu', params);
	rcu_ac_fill(id, guestData['rcu_data'][id]);
}

function rcu_ac_fill(id, params){
	if(typeof(params) == 'undefined'){
		if(guestData['rcu_data'] && guestData['rcu_data'][id]){
			params = guestData['rcu_data'][id];
		}
	}

	if(rcu_data[id].itemType != 'fcutemponly'){
		if(params['mode'] == 0){
			$('#rcu_' + id).removeClass('on').addClass('off');
		}else{
			$('#rcu_' + id).removeClass('off').addClass('on');
		}
	}
	$('#rcu_' + id + '_fan_value').removeClass('l0 l1 l2 l3 l4 l5 l6 l7 l8 l9 l10').addClass('l' + params['fan']);
	$('#rcu_' + id + '_temperature_value').html(params['temperature_set'] + '&deg;C');

	//7132
	if(params['temperature_cur']){
		$('#rcu_' + id + '_temperature_value_cur').html(Math.round(params['temperature_cur']) + '&deg;C');
	}
	if(params['temperature_set']){
		$('#rcu_' + id + '_temperature_value_set').html(Math.round(params['temperature_set']) + '&deg;C');
	}else{
		$('#rcu_' + id + '_temperature_value_set').html('<span style="opacity:0.5">' + Math.round(params['temperature_cur']) + '&deg;C</span>');
	}

}

function rcu_press(id, state, type, params){
	if(rcu_requesting){
		return false;
	}

	type = type?type:rcu_data[id].itemType;
	params = params?params:rcu_data[id].params;

	if(!guestData['rcu_data']){
		guestData['rcu_data'] = {};
	}

	if(typeof(state) == 'undefined' || state === false){
		if(type == 'light3btn'){
			if(guestData['rcu_data'] && typeof(guestData['rcu_data'][id])){
				state = guestData['rcu_data'][id] + 1;
				state = (state <= 2)?state:0;
			}else{
				state = 1;
			}
		}else{
			state = $('#rcu_'+id).hasClass('off')?1:0;
		}
	}

	if(storage.getItem('room')){

		rcu_requesting = true;

		if(type == 'dimmer'){
			if(!guestData['rcu_data'][id]){
				guestData['rcu_data'][id] = {'level':0};
			}

			var level = 0;
			var rcu_dimmer_max = 100;
			var rcu_dimmer_increment = 10;
			//TODO: max, increment from config
			if(state == 1){
				level = Math.min(rcu_dimmer_max, ((guestData['rcu_data'][id]['level']|0) + rcu_dimmer_increment));
			}else{
				level = Math.max(0, ((guestData['rcu_data'][id]['level']|0) - rcu_dimmer_increment));
			}
			params.level = level;
		}


		var data = {
			'room': storage.getItem('room'),
			'type': type,
			'state': state,
			'params': encodeURIComponent(JSON.stringify(params))
		};

		$.ajax({
			url: config['rcu_url']+'push.php',
			data: data,
			timeout: 2000
		}).done(function(data){
			if(data == 'OK'){
				switch(type){
					case 'light':
					case 'dnd':
					case 'mur':
					case 'tvonoff':
					case 'scene':
						if(state == 1){
							$('#rcu_'+id).removeClass('off').addClass('on');
						}else{
							$('#rcu_'+id).removeClass('on').addClass('off');
						}
						break;
					case 'dimmer':
						if(level > guestData['rcu_data'][id]['level']){
							$('#rcu_'+id).addClass('off');
							setTimeout(function(){
								$('#rcu_'+id).removeClass('off');
							}, 500);
						}else if(level < guestData['rcu_data'][id]['level']){
							$('#rcu_'+id).addClass('on');
							setTimeout(function(){
								$('#rcu_'+id).removeClass('on');
							}, 500);
						}else{
						}
						guestData['rcu_data'][id]['level'] = level;
						break;
					case 'light3btn':
						if(state == 1){
							$('#rcu_'+id).removeClass('on off pause').addClass('pause');
						}else if(state == 2){
							$('#rcu_'+id).removeClass('on off pause').addClass('on');
						}else{
							$('#rcu_'+id).removeClass('on off pause').addClass('off');
						}
						guestData['rcu_data'][id] = state;
						break;
					case 'curtain':
					case 'curtainPause':
					case 'curtainPause3Register':
						if(state == 1){
							$('#rcu_'+id).addClass('off');
							setTimeout(function(){
								$('#rcu_'+id).removeClass('off');
							}, 500);
						}else if(state == 2){
							$('#rcu_'+id).addClass('pause');
							setTimeout(function(){
								$('#rcu_'+id).removeClass('pause');
							}, 500);
						}else if(state == 0){
							$('#rcu_'+id).addClass('on');
							setTimeout(function(){
								$('#rcu_'+id).removeClass('on');
							}, 500);
						}
						break;
					case 'tv':
						if(state == 1){
							$('#rcu_'+id).addClass('off');
							setTimeout(function(){
								$('#rcu_'+id).removeClass('off');
							}, 200);
						}else{
							$('#rcu_'+id).addClass('on');
							setTimeout(function(){
								$('#rcu_'+id).removeClass('on');
							}, 200);
						}
						break;
					case 'fcu':
					case 'fcutemponly':
					case 'fcu7lvl':
						break;
					default:
						break;
				}
			}else{
				log.add('RCU: ' + type + ' push request failed: ' + data);
			}
		}).fail(function( err, textStatus, errorThrown ) {
			custom_alert('Room Control unreachable');
			log.add('RCU: error ' + textStatus + ', ' + errorThrown);
		}).always(function(){
			rcu_requesting = false;
		});
	}else{
		custom_alert(getlang('bill_loginreq'));
	}
}

function rcu_state(id){
	var type = rcu_data[id].itemType;
	var params = rcu_data[id].params;

	if(!guestData['rcu_data']){
		guestData['rcu_data'] = {};
	}

	var supported_types = ['light', 'light3btn', 'dnd', 'mur', 'scene', 'dimmer', 'fcu', 'fcutemponly', 'fcu7lvl'];
	if(supported_types.indexOf(type) == -1){
		log.add('rcu state unsupported type ' + type);
		return false;
	}

	if(type == 'fcutemponly'){
		type = 'fcu';
	}

	if(storage.getItem('room')){
		var data = {
			'room': storage.getItem('room'),
			'type': type,
			'params': encodeURIComponent(JSON.stringify(params))
		};
		$.ajax({
			url: config['rcu_url']+'state.php',
			data: data,
			timeout: 2000,
			dataType: 'json'
		}).done(function(data){

			if(data.error){
				log.add('RCU: ' + type + ' state failed: ' + data.error);
				return;
			}

			if(Object.keys(data).length){
				switch(type){
					case 'light':
					case 'dnd':
					case 'mur':
					case 'scene':
						if(data.state == 1){
							$('#rcu_'+id).removeClass('off').addClass('on');
						}else{
							$('#rcu_'+id).removeClass('on').addClass('off');
						}
						break;
					case 'dimmer':
						guestData['rcu_data'][id] = data;
						break;
					case 'light3btn':
						if(data.state == 1){
							$('#rcu_'+id).removeClass('on off pause').addClass('pause');
						}else if(data.state == 2){
							$('#rcu_'+id).removeClass('on off pause').addClass('on');
						}else{
							$('#rcu_'+id).removeClass('on off pause').addClass('off');
						}
						guestData['rcu_data'][id] = data.state;
						break;
					case 'fcu':
					case 'fcutemponly':
					case 'fcu7lvl':
						if(!guestData['rcu_data']){
							guestData['rcu_data'] = {};
						}

						if(!guestData['rcu_data'][id]){
							guestData['rcu_data'][id] = {};
						}

						//7132 (KNX)
						if($id('rcu_' + id + '_temperature_value_cur')){ //fcutemponly
							data['temperature_cur'] = data['temperature'];
							data['temperature_set'] = data['temperature2'];
							if(data['curTemperature']){ //Iridium
								data['temperature_set'] = data['temperature'];
								data['temperature_cur'] = data['curTemperature'];
							}
						}else{
							data['temperature_set'] = data['temperature'];
						}
						$.extend(guestData['rcu_data'][id], data);

						rcu_ac_fill(id, guestData['rcu_data'][id]);
						break;
					default:
						log.add('rcu state unsupported type ' + type);
						break;
				}
			}else{
				log.add('RCU: ' + type + ' state request failed: (keys) ' + data);
			}
		}).fail(function(){
			log.add('RCU: state request failed ' + id);
			//custom_alert('Room Control unreachable');
		}).always(function(){
		});
	}else{
		//custom_alert('not auth');
	}
}

function rcu_check_states(id){
	var iterator = 0;
	id = id?id:active_page_id;
	$('#'+id+' .content').find('.rcu[type]:not(.forbidden_by_group)').each(function(){
		iterator++;
		var that = $(this);
		setTimeout(function(){
			rcu_state(that.attr('id').replace('rcu_',''));
		},
		iterator*100);
	});
}

var rcu_check_states_timer;
function rcu_check_states_start(id){
	rcu_check_states_stop();

	rcu_check_states(id);

	if(isset('config.rcu.periodical_check')){
		rcu_check_states_timer = setInterval(function(){
			rcu_check_states(id);
		}, (isset('config.rcu.check_interval')||5000));
	}
}
function rcu_check_states_stop(){
	if(rcu_check_states_timer){
		clearInterval(rcu_check_states_timer);
		rcu_check_states_timer = null;
	}
}

