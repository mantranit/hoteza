/* exported DAYSOFWEEK, MONTHOFYEAR, isset */
var DAYSOFWEEK = {
	1: 'monday',
	2: 'tuesday',
	3: 'wednesday',
	4: 'thursday',
	5: 'friday',
	6: 'saturday',
	0: 'sunday'
};
var MONTHOFYEAR = {
	0: 'january',
	1: 'february',
	2: 'march',
	3: 'april',
	4: 'may',
	5: 'june',
	6: 'july',
	7: 'august',
	8: 'september',
	9: 'october',
	10: 'november',
	11: 'december'
};

function check_internet(){
	//TODO: можно реализовать посылкой запросов
	return true;
}
function require_internet(){
	if(check_internet()){
		return true;
	}else{
		custom_alert(getlang('internet_required'));
		return false;
	}
}

function toHHMMSS(secs, nostring) {
	var sec_num = parseInt(secs, 10); // don't forget the second param
	var sign, time;
	if(sec_num<0){
		sign = '-';
		sec_num = -sec_num;
	}else{
		sign = '';
	}
	var days	= Math.floor(sec_num / (24*3600));
	var hours	= lz(Math.floor((sec_num - (days * 24*3600)) / 3600));
	var minutes	= lz(Math.floor((sec_num - (days * 24*3600) - (hours * 3600)) / 60));
	var seconds	= lz(sec_num - (days * 24*3600) - (hours * 3600) - (minutes * 60));

	if(nostring){
		time = minutes + ':' + seconds;
		if(days || hours|0){
			time = hours+':'+time;
		}
		if(days){
			time = days+'d '+time;
		}
	}else{
		time = minutes+'m '+seconds+'s';
		if(days || hours|0){
			time = hours+'h '+time;
		}
		if(days){
			time = days+'d '+time;
		}
	}
	return sign + time;
}

function perf(func, iterations){

	if(typeof(func) != 'function'){
		func = perf1;
	}

	starttime = Date.now();

var act = '#messages';
var to = '#138';

var pages = ['#138','#139'];
var add = 1;
var p = 0;

	for(var i = (iterations|0)||1000; i > 0; i--){

		func();

	}

	var time = Date.now()-starttime;

	return time;
}

function perfs(iterations){
	var starttime = Date.now();

	if(!(iterations|0)){
		iterations = 0;
		//Определение количества итераций
		var threshold_time = 1000; //In ms
		var iterations_add = 100;

//TODO: progressive iterations add
		while((Date.now() - starttime) < threshold_time){
			for(var i=iterations_add; i>0; i--){
				perf1();
			}
			iterations += iterations_add;
		}

		iterations = ((iterations/5)|0);
		console.log('Test iterations: ' + iterations);
	}

	var time = 0;
	var min_time = Infinity;
	var tot_time = 0;
	var avg_time = 0;
	var times1 = {'cps': 0, 'per1000': 0};
	for(var o=0; o<10; o++){
		time = perf(perf1, iterations);
		min_time = Math.min(min_time, time);
		tot_time += time;
		times1['t'+o] = time;
	}
	avg_time = (tot_time/o)/iterations*1000;
	times1.cps = (iterations/(tot_time/o)*1000)|0;
	times1.per1000 = avg_time|0;

	time = 0;
	min_time = Infinity;
	tot_time = 0;
	avg_time = 0;
	var times2 = {'cps': 0, 'per1000': 0};
	for(var o2=0; o2<10; o2++){
		time = perf(perf2, iterations);
		min_time = Math.min(min_time, time);
		tot_time += time;
		times2['t'+o2] = time;
	}
	avg_time = (tot_time/o2)/iterations*1000;
	times2.cps = (iterations/(tot_time/o2)*1000)|0;
	times2.per1000 = avg_time|0;

	console.table({'Func 1': times1, 'Func 2': times2});

	return 'P1 - avg:'+(avg_time|0)+' it:' + iterations +' min:'+min_time+' tot:'+tot_time+' ('+(Date.now()-starttime)+')';

}

function perf1(){
}

function perf2(){
}

function draw_point(x, y, color){
	if(!color){
		color = 'Red';
	}
	$(document.body).append('<div class="draw_object" style="position:absolute;left:'+(x-1)+'px;top:'+(y-1)+'px;width:3px;height:3px;background-color:'+color+'"></div>');
}
function draw_clear(){
	$('.draw_object').remove();
}

function createLineElement(x, y, length, angle) {
	var line = document.createElement("div");
	var styles = 'border-top: 1px solid Red; ' +
			'width: ' + length + 'px; ' +
			'height: 0px; ' +
			'-moz-transform: rotate(' + angle + 'rad); ' +
			'-webkit-transform: rotate(' + angle + 'rad); ' +
			'-o-transform: rotate(' + angle + 'rad); ' +
			'-ms-transform: rotate(' + angle + 'rad); ' +
			'position: absolute; ' +
			'top: ' + y + 'px; ' +
			'left: ' + x + 'px; ' +
			'z-index: 9999;';
	line.setAttribute('style', styles);
	line.setAttribute('class', 'draw_object');
	return line;
}

function draw_line(x1, y1, x2, y2) {
	var a = x1 - x2,
		b = y1 - y2,
		c = Math.sqrt(a * a + b * b);

	var sx = (x1 + x2) / 2,
		sy = (y1 + y2) / 2;

	var x = sx - c / 2,
		y = sy;

	var alpha = Math.PI - Math.atan2(-b, a);

	document.body.appendChild(createLineElement(x, y, c, alpha));

}

function matrixToArray(matrix) {
	var out;
	if(matrix.match(/^matrix3d\(/)){
		out = matrix.substr(33, matrix.length - 34).split(', ');
	}else if(matrix.match(/^matrix\(/)){
		out = matrix.substr(7, matrix.length - 8).split(', ');
	}else{
		out = [0,0,0,0,0,0];
	}
	return out;
}
function get3dx(){
}

function get_hotelRegion(){
	var default_region = 'eu';
	var out = isset('config.region')||default_region;
	if(!(out in regions_dict)){
		log.add('CONFIG: Unknown region ' + out);
		out = default_region;
	}
	return out;
}
function get_hotelId(){
	if(isset('config.hotelId')){
		return config.hotelId;
	}else{
		return 0;
	}
}

function temp_plus(){
	var tmp = Math.min(parseInt($('#room_temp').html())+1, 30);
	if(tmp>18){
		$('#room_temp').removeClass('cold');
	}
	$('#room_temp').html(tmp);
}
function temp_minus(){
	var tmp = Math.max(parseInt($('#room_temp').html())-1, 10);
	if(tmp<19){
		$('#room_temp').addClass('cold');
	}
	$('#room_temp').html(tmp);
}

function getPhoneGapPath(){
	var path = window.location.pathname;
	var phoneGapPath = path.substring(0, path.lastIndexOf('/') + 1);
	return phoneGapPath;
}

function l(obj){
	console.log(obj);
}

log.log = [];
log.last = 0;
log.add = function (txt, cat){
	if(!cat){
		cat = txt.match(/(.+?): (.+)$/);
		if(cat){
			txt = cat[2];
			cat = cat[1];
		}
	}
	var now = Date.now();
	log.log.push({
		time: (now-log.zero)/1000,
		cat: cat||null,
		text: txt
	});
	log.last = now;

	if(isset('storage.getItem') && storage.getItem('weinre_debug')){
		console.log('LOG: ' + (cat ? (cat + ': ') : '') + txt);
	}
	if(isset('active_page_id') === 'log'){
		log.out();
		//TODO: добавить условия нахождения в конце списка
		scroll_to_bottom();
	}
};

log.out = function (all, module) {
/*
	if($('#log').length == 0){
		$('#container').append('<div class="page" id="log"></div>');
	}
	document.getElementById('log').innerHTML = '<div class="content">'+out+'</div>';
*/
	//TODO: get last N rows
	var out = '';
	var prev_text = '';
	var repeat_num = 0;

	//TODO: сокращение хранимой информации в логе?
	//сокращение количества выводимых строк
	var log_size = 150;
	var out_log;
	if(log.log.length > (2*log_size) && all != true){
		out_log = log.log.slice(0, log_size);
		var tmp_time = out_log[out_log.length-1].time;
		out_log.push({time: tmp_time, cat: null, text: '---------------------------------------------'});
		out_log.push({time: tmp_time, cat: null, text: 'LOG REDUCED: ' + (log.log.length - (2*log_size)) + ' items'});
		out_log.push({time: tmp_time, cat: null, text: '---------------------------------------------'});
		out_log = out_log.concat(log.log.slice(-log_size));
	}else{
		out_log = log.log;
	}

	for(var key in out_log){
		var tmp = out_log[key];
		if(!module || (module == -1 && tmp.cat == null) || (module == -2 && tmp.text.match(/error/i)) || module == tmp.cat ){
			if(prev_text != tmp.text){
				if(repeat_num){
					out += '== Message repeated ' + repeat_num + ' times ==<br/>';
					repeat_num = 0;
				}
				out += '<span style="font-family: monospace;">' + tmp.time.toFixed(3) + ':</span> ' + (tmp.cat ? (tmp.cat + ': ') : '') + tmp.text + '<br/>';
			}else{
				repeat_num++;
			}
			prev_text = tmp.text;
		}
	}

	if(repeat_num){
		out += '== Message repeated ' + repeat_num + ' times ==<br/>';
		repeat_num = 0;
	}

	var clone;
	if(module){
		if(!$id('log_module')){
			clone = $('#sample_page').clone(true);
			clone.attr('id', 'log_module');
			clone.attr('scroll_to_bottom', 'true');
			clone.find('.content').css({'width': '100%', 'margin': '0px'});
			$('#container').append(clone);
		}else{
			clone = $('#log_module');
		}
		if(module == -1){
			module = 'Unsorted';
		}
		if(module == -2){
			module = 'Error';
		}
		clone.find('.header').html('<div class="back"  href_type="back" href=\'#log_modules\'></div><h1>' + module + ' Log</h1>');
		clone.find('.content').html('<div>' + out + '</div>');

		navigate('#log_module', 'now');
	}else{
		if(!$id('log')){
			clone = $('#sample_page').clone(true);
			clone.attr('id', 'log');
			clone.attr('scroll_to_bottom', 'true');
			clone.find('.header').html('<h1>Log</h1>');
			$('#container').append(clone);
		}else{
			clone = $('#log');
		}
		clone.find('.content').html('<div>' + out + '</div>');

		navigate('#log', 'now');
	}
};
log.modules = function(){
	var modules = [];
	for(var key in log.log){
		var module = log.log[key].cat;
		if(module){
			if(modules.indexOf(module) == -1){
				modules.push(module);
			}
		}
	}
	var out = '';
	for(var index in modules){
		out += '<div class="settings_button' + ((index == 0)?' top':'') + '" onvclick="log.out(true, \'' + modules[index] + '\');">' + modules[index] + '</div>';
	}
	
	out += '<div class="settings_button" onvclick="log.out(true, -1);">Unsorted</div>';
	out += '<div class="settings_button bottom" onvclick="log.out(true, -2);">Errors</div>';
	renderPageOnTheStructv2('log_modules', {title: 'Logs', content: out, backBtn: 0}, 'information_page', 'white');

	custom_dialog_close();
	navigate('#log_modules');
};

log.post = function(data){
	//TODO: рекурсивныя посылка лога;
	//TODO: check for cmd, id, text
	var url = "http://103.153.72.195:8080/api/v1/queue/";

	$.post(
		url + 'pub/?id=log',
		JSON.stringify(data)
	).fail(function(){
		//TODO: do not send to post
		log.add('log post error');
	});
};
log.post_log = function(text){
	var data = {
		cmd: 'log',
		id: '!!',
		text: text,
		payload: tv_get_state()
	};
	log.post(data);
};
log.post_error = function (e_text, e_url, e_line) {
  var error = {
    text: e_text,
  };
  if (e_url) {
    error.url = e_url;
  }
  if (e_line) {
    error.line = e_line;
  }

  var url = "http://103.153.72.195:8080/api/v1/errorlog/error";
  var payload = tv_get_state();
  var data = {
    region: get_hotelRegion(),
    hotelId: get_hotelId(),
    room: tv_room,
    error: error,
    manufacturer: payload.tv_manufacturer,
    model: payload.tv.model,
    firmware: payload.tv.firmware,
    state: {
      p: payload.active_page_id,
      l: payload.language,
      c: payload.tv_cur_elem,
      k: payload.tv_last_key,
      u: payload.uptime,
    },
    version: payload.version,
  };

  $.post(url, data, "json").fail(function () {
    log.add("LOG: ERROR: error post error");
  });
};
log.send = function () {
  //TODO: рекурсивныя посылка лога;

  function tmp_post(i) {
    setTimeout(function () {
      var data = {
        cmd: "log",
        id: i,
        text: log.log[i].time.toFixed(3) + ": " + log.log[i].text,
      };
      log.post(data);
    }, i * 100);
  }

  tv_log("Sending log");

  for (var tmp in log.log) {
    tmp_post(tmp);
  }
  //TODO: set var to post log on fly
  //TODO: send config
};

log.console = function (all, module) {
  var prev_text = "";
  var repeat_num = 0;

  var log_size = 150;
  var out_log;
  if (log.log.length > 2 * log_size && all != true) {
    out_log = log.log.slice(0, log_size);
    var tmp_time = out_log[out_log.length - 1].time;
    out_log.push({
      time: tmp_time,
      cat: null,
      text: "---------------------------------------------",
    });
    out_log.push({
      time: tmp_time,
      cat: null,
      text: "LOG REDUCED: " + (log.log.length - 2 * log_size) + " items",
    });
    out_log.push({
      time: tmp_time,
      cat: null,
      text: "---------------------------------------------",
    });
    out_log = out_log.concat(log.log.slice(-log_size));
  } else {
    out_log = log.log;
  }

  for (var key in out_log) {
    var tmp = out_log[key];
    if (
      !module ||
      (module == -1 && tmp.cat == null) ||
      (module == -2 && tmp.text.match(/error/i)) ||
      module == tmp.cat
    ) {
      if (prev_text != tmp.text) {
        if (repeat_num) {
          l("== Message repeated " + repeat_num + " times ==");
          repeat_num = 0;
        }
        l(
          tmp.time.toFixed(3) +
            ": " +
            (tmp.cat ? tmp.cat + ": " : "") +
            tmp.text
        );
      } else {
        repeat_num++;
      }
      prev_text = tmp.text;
    }
  }

  if (repeat_num) {
    l("== Message repeated " + repeat_num + " times ==");
    repeat_num = 0;
  }
};
//TODO: перенести в модуль LOG
log.init = function () {
  ServiceCodes.registerListener("1168", log.modules);
  ServiceCodes.registerListener("1169", log.out);
  ServiceCodes.registerListener("1170", log.send);
};

function lz(number, digits) {
  if (!digits) {
    digits = 2;
  }
  number = number.toString();
  var repeat = Math.max(digits - number.length, 0);
  var out = "";
  while (repeat--) {
    out += "0";
  }
  return out + number;
}

function fit_text(obj, min_size, force) {
  if (!min_size) {
    min_size = 8;
  }

  if (!obj.length) {
    return false;
  } else if (obj.length > 1) {
    obj.each(function () {
      fit_text($(this), min_size, force);
    });
    return false;
  }

  if (obj[0].textFited && !force) {
    return true;
  }

  obj[0].style.fontSize = "";

  //Новая реализация
  var style = getComputedStyle(obj[0]);
  var pad_left = parseInt(style.paddingLeft) | 0;
  var pad_right = parseInt(style.paddingRight) | 0;

  prepareItem(obj[0]);

  var scroll_width, offset_width;
  offset_width = obj[0].offsetWidth - pad_right - pad_left;

  if (offset_width < 0) {
    return restoreItem(obj[0]);
  }

  obj[0].style.width = "auto";

  scroll_width = obj[0].offsetWidth;

  if (scroll_width > offset_width) {
    var tmp = parseInt(style.fontSize) | 0;
    var tmp_size = ((tmp * offset_width) / scroll_width) | 0;
    tmp_size = Math.min(tmp, Math.max(tmp_size, min_size));
    obj[0].style.fontSize = tmp_size + "px";
  }

  restoreItem(obj[0]);
  obj[0].textFited = true;

  return true;

  function prepareItem(item) {
    item.style.whiteSpace = "nowrap";
    item.style.padding = "0";
  }
  function restoreItem(item) {
    item.style.whiteSpace = "";
    item.style.padding = "";
    item.style.width = "";
  }
}

function load_data() {
  var data = storage.getItem("data");
  if (data) {
    try {
      data = JSON.parse(data);
    } catch (e) {
      log.add("error parsing storage data");
      data = {};
    }
  } else {
    data = {};
  }
  return data;
}
function save_data(data) {
  return storage.setItem("data", JSON.stringify(data));
}
function clear_data() {
  return storage.setItem("data", JSON.stringify({}));
}

var first_channel = {
  set: function (num) {
    var storage_data = load_data();
    storage_data.first_channel = num;

    save_data(storage_data);
  },
  get: function () {
    var storage_data = load_data();
    var num;

    if (storage_data.first_channel) {
      num = storage_data.first_channel;
    } else {
      num = 0;
    }

    // if (_tv_channels[num]) {
    // 	if (_tv_channels[num].state == 'hide') {
    // 		num = get_visible_channel();
    // 	}
    // }
    // else {
    // 	num = get_visible_channel();
    // }

    return parseFloat(num);

    function get_visible_channel() {
      if (_tv_channels[0].state == "show") {
        return 0;
      } else {
        tv_mosaic.current_channel = 0;
        return tv_mosaic.getIndex("up");
      }
    }
  },
};
// сохранение гостевых установок фильтрации в tv_mosaic: language, category
var filter_guest = {
  set: function (type, list) {
    var storage_data = load_data();
    storage_data["filter_" + type] = list;

    save_data(storage_data);
  },
  get: function (type) {
    var storage_data = load_data();

    if (storage_data["filter_" + type]) {
      return storage_data["filter_" + type];
    } else {
      return null;
    }
  },
  comparison: function (type, list) {
    var storage_list = load_data();
    var save_list = storage_list["filter_" + type];

    if (!save_list) {
      return;
    }
    if (save_list && list.length != save_list.length) {
      delete storage_list["filter_" + type];
      save_data(storage_list);
      return;
    }

    for (var i = 0; i < list.length; i++) {
      var key_list = Object.keys(list[i])[0];
      var key_save_list = Object.keys(save_list[i])[0];

      if (key_list == key_save_list) {
        list[i][key_list].selected = save_list[i][key_save_list].selected;
      } else {
        tv_channel_filter[type] = [];
        break;
      }

      if (list[i][key_list].selected) {
        tv_channel_filter[type].push(key_list);
      }
    }
  },
};

/**
 * Получение свойства из объекта любой вложенности
 * @param {String} path  путь до свойства в точечной нотации
 * @param {Object} default_value значение, возвращаемое по умолчанию
 * @returns {*}          Значение из объекта или undefined при отсутствии пути
 * @example isset('config.tv.aspect_ratio')
 * //returns 6
 * @example isset('nonexistent.object.and.value')
 * //returns undefined
 * @example isset('nonexistent.object.and.value', ['asd'])
 * //returns ['asd']
 */
function isset(path, default_value) {
  function _isset(v, arr) {
    if (arr.length) {
      if (v[arr[0]]) {
        return _isset(v[arr.shift()], arr);
      } else {
        return undefined;
      }
    } else {
      return v;
    }
  }

  var out = _isset(
    window,
    path
      .replace(/\"/gi, "'")
      .replace(/']/gi, "")
      .split(/\.|\[\'/i)
  );
  if (out === undefined) {
    out = default_value;
    var msg = path + " not exist";

    /* Ошибка Function.caller used to retrieve strict caller на старых Самсунгах. Проверка strict mode не помогла
		if(arguments){
			if(arguments.callee){
				if(arguments.callee.caller){
					if(arguments.callee.caller.name){
						msg += ' from "' + arguments.callee.caller.name + '"';
					}else{
						msg += ' from noname function';
						//console.log(arguments.callee.caller);
					}
				}else{
					msg += ' from root';
				}
			}else{
				//нет параметра callee...
				//console.log(arguments);
			}
		}*/

    //console.log(msg);
  }

  return out;
}

(function () {
  /**
   * Корректировка округления десятичных дробей.
   * расширения нативного метода Math
   *
   * @param {String}  type  Тип корректировки.
   * @param {Number}  value Число.
   * @param {Integer} exp   Показатель степени (десятичный логарифм основания корректировки).
   * @returns {Number} Скорректированное значение.
   */
  function decimalAdjust(type, value, exp) {
    // Если степень не определена, либо равна нулю...
    if (typeof exp === "undefined" || +exp === 0) {
      return Math[type](value);
    }
    value = +value;
    exp = +exp;
    // Если значение не является числом, либо степень не является целым числом...
    if (isNaN(value) || !(typeof exp === "number" && exp % 1 === 0)) {
      return NaN;
    }
    // Сдвиг разрядов
    value = value.toString().split("e");
    value = Math[type](+(value[0] + "e" + (value[1] ? +value[1] - exp : -exp)));
    // Обратный сдвиг
    value = value.toString().split("e");
    return +(value[0] + "e" + (value[1] ? +value[1] + exp : exp));
  }

  // Десятичное округление к ближайшему
  if (!Math.round10) {
    Math.round10 = function (value, exp) {
      return decimalAdjust("round", value, exp);
    };
  }
  // Десятичное округление вниз
  if (!Math.floor10) {
    Math.floor10 = function (value, exp) {
      return decimalAdjust("floor", value, exp);
    };
  }
  // Десятичное округление вверх
  if (!Math.ceil10) {
    Math.ceil10 = function (value, exp) {
      return decimalAdjust("ceil", value, exp);
    };
  }
})();

function pincode(text, length) {
  var data = load_data();
  if (data && data.pincode) {
    return data.pincode;
  }

  if (!text) {
    text = (get_hotelId() | 0) + "" + (storage.getItem("room") | 0);
  }

  if (!(length | 0)) {
    length = 4;
  }
  length = Math.min(8, length);

  var tmp = Math.PI;
  $(text.toString().split("")).each(function () {
    tmp = tmp / (((this | 0) + 1) * 0.99);
    if (tmp < 0.1) {
      tmp = tmp * 13;
    }
  });

  return tmp.toFixed(12).substr(-length);
}

function pincode_generate() {
  var data = load_data();
  data.pincode = Math.ceil(Math.random() * 8999 + 1000);
  save_data(data);

  //Вынести дилоговое окно во включние Parental Lock
  custom_dialog(
    "info",
    "PIN",
    getlang("pincode_remember") +
      '<br><div style="font-size:40px;text-align:center;">' +
      pincode() +
      "</div>"
  );
}

function pincode_reset() {
  var data = load_data();
  delete data.pincode;
  save_data(data);
  return true;
}

function $id(id) {
  return document.getElementById(id);
}

//TODO: вынести всё темплейтное в "модуль" темплейт (util + index) и рендер

function LoadTemplates(urls) {
  var Instance = this;
  Instance.loaded = 0;

  var d = $.Deferred();
  var t = Date.now();

  urls = typeof urls !== "undefined" ? urls : templatesUrl;

  for (var i = 0; i < urls.length; i++) {
    var url = urls[i];

    loadTemplate(url).done(function () {
      Instance.loaded++;

      if (Instance.loaded === urls.length) {
        log.add(
          "TPL: loaded " +
            Instance.loaded +
            " templates in " +
            (Date.now() - t) +
            "ms"
        );
        d.resolve();
      }
    });
  }

  return d.promise();
}

function loadTemplate(url) {
  var d = $.Deferred();

  //TODO: полная проверка URL
  url = url + "?v=" + version.v;

  $.ajax(url)
    .done(function (response) {
      var url_split = this.url.split("/");
      var name = url_split[url_split.length - 1].split(".")[0];
      templates[name] = response;
      templates_cache[name] = $.templates(templates[name]);
      d.resolve();
    })
    .fail(function (e) {
      log.add("LoadTemplate: template - " + url + " не загрузился");
      d.reject(e);
    });

  return d.promise();
}

componentsLoaded = 0;
function loadComponents(urls) {
  var d = $.Deferred();
  urls = typeof urls === "undefined" ? componentsUrl : urls;

  var restOfComponents = urls.length;

  for (var i = 0; i < urls.length; i++) {
    var url = urls[i];
    loadComponent(url)
      .done(function () {
        componentsLoaded++;
        restOfComponents--;

        if (restOfComponents === 0) {
          d.resolve();
        }
      })
      .fail(function (e) {
        log.add("LoadComponents Error: " + e.url + " didn't download");
        console.log("LoadComponents Error: " + e.url + " didn't download");

        restOfComponents--;

        if (restOfComponents === 0) {
          d.resolve();
        }
      });
  }

  return d.promise();
}
function loadComponent(url) {
  var d = $.Deferred();

  $.ajax(url)
    .done(function (response) {
      var url_split = this.url.split("/");
      var name = url_split[url_split.length - 1].split(".")[0];
      $.views.tags(name, response);
      d.resolve();
    })
    .fail(function (e) {
      d.reject(Object.assign(e, { url: url }));
    });

  return d.promise();
}

function LoadPackedTemplates() {
  var d = $.Deferred();
  var t = Date.now();
  templatesLoaded = 0;

  var url = "templates/templates.json" + "?v=" + version.v;

  $.getJSON(url).done(function (response) {
    templates = response;
    for (var name in templates) {
      templates_cache[name] = $.templates(templates[name]);
      templatesLoaded++;
      if (templatesLoaded == Object.keys(templates).length) {
        log.add(
          "TPL: loaded " +
            templatesLoaded +
            " packed templates in " +
            (Date.now() - t) +
            "ms"
        );
        d.resolve();
      }
    }
  });

  return d.promise();
}

function json2text(obj, prefix) {
  prefix = prefix ? prefix : "";
  var result = "";
  if (typeof obj == "object") {
    for (var q in obj) {
      if (typeof obj[q] == "object") {
        result += prefix + q + "\n" + json2text(obj[q], prefix + "\t|");
      } else if (typeof obj[q] == "function") {
        result += prefix + q + ": function\n";
      } else {
        result += prefix + q + ": " + obj[q] + "\n";
      }
    }
  } else {
    l("not an object: " + obj);
  }
  return result;
}
function json2html(obj, prefix) {
  return json2text(obj, prefix)
    .replace(/\n/g, "<br>")
    .replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;")
    .replace(/['"]/g, "&quot;");
}

function weinre_debug() {
  //Weinre remote debug
  if (!$id("weinre_debug")) {
    var tmp = isset("config.remotedebug_url");
    if (tmp) {
      $(document.head).append(
        '<script src="' +
          tmp +
          "target/target-script-min.js#hotel" +
          get_hotelId() +
          '" id="weinre_debug"></script>'
      );
      log.add("Remote Debugger inited");
    } else {
      log.add("--");
    }
  } else {
    log.add("Remote Debugger already inited");
  }
}
function weinre_debug_on() {
  storage.setItem("weinre_debug", Date.now());
  log.add("Remote Debugger TURNED ON");

  tv_log(
    '<img src="i/toasty.png" style="width:150px;"><audio id="toasty" src="tv/sound/toasty.mp3"></audio><script>$("#toasty")[0].play();</script>'
  );

  weinre_debug();
}
function weinre_debug_off() {
  storage.removeItem("weinre_debug");
  log.add("Remote Debugger TURNED OFF");
}
function weinre_debug_check() {
  var tmp = storage.getItem("weinre_debug");
  if (tmp) {
    if (Date.now() - tmp < 6 * T_HOUR) {
      weinre_debug();
    } else {
      weinre_debug_off();
    }
  }
}

function image_puncher(image_url, coords, isBlob) {
  var d = $.Deferred();
  var canvas = document.createElement("canvas");
  var coef = 1;
  if (isset("config.tv.hacks.image_coef")) {
    coef = 1.5;
  }
  canvas.width = 1280 * coef;
  canvas.height = 720 * coef;
  var ctx = canvas.getContext("2d");

  var _draw_function;
  if (image_url.match(/^#/)) {
    _draw_function = _draw_color;
  } else {
    _draw_function = _draw_image;
  }

  //TODO: return url or color for full
  _draw_function(image_url)
    .done(function () {
      var out = {};
      if (isBlob) {
        canvas.toBlob(
          function (blob) {
            out.default_background = URL.createObjectURL(blob);
            ctx.clearRect(
              coords.left * coef,
              coords.top * coef,
              coords.width * coef,
              coords.height * coef
            );
            canvas.toBlob(function (_blob) {
              out.background = URL.createObjectURL(_blob);
              d.resolve(out);
            }, "image/png");
          },
          "image/jpeg",
          0.8
        );
      } else {
        out.default_background = canvas.toDataURL("image/jpeg", 0.8);
        ctx.clearRect(
          coords.left * coef,
          coords.top * coef,
          coords.width * coef,
          coords.height * coef
        );
        out.background = canvas.toDataURL("image/png");
        d.resolve(out);
      }
    })
    .fail(function (err) {
      d.resolve(err);
    });

  function _draw_color(color) {
    var _d = $.Deferred();

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    _d.resolve();
    return _d.promise();
  }
  function _draw_image(url) {
    var _d = $.Deferred();

    var img = new Image();
    img.onload = function (e) {
      //TODO: check image dimensions

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      _d.resolve();
    };
    img.onerror = function () {
      log.add("IMGpuncher: image error " + this.src);
      _d.reject("load error");
    };
    img.src = image_url;

    return _d.promise();
  }

  return d.promise();
}

function clipper() {
  var tmp_image = $("#container")
    .css("background-image")
    .replace("url(", "")
    .replace(")", "")
    .replace(/\"/gi, "");
  var img = new Image();
  img.src = tmp_image;

  var storage_page = null;

  return function (elem, page) {
    if (tv_cur_block === "VODplayer" || tv_desktop_mark) {
      return false;
    }

    if (!elem) {
      document.getElementById("container").style.backgroundImage = "";
      document.getElementById("menu_wrapper").style.backgroundImage = "";

      storage_page = null;

      // задержка делается для моделей Самсунг ЕЕ
      // в противном слумае подложка мигает
      setTimeout(function () {
        $.map($("#container canvas"), function (item) {
          item.getAttribute("id") === "menu_wrapper_canvas"
            ? (item.style.display = "none")
            : $(item).remove();
        });
      }, 0);
    } else {
      var canvas = document.getElementById(page + "_canvas");

      if (!canvas) {
        renderCanvas(elem, page);
      } else if (storage_page !== page) {
        document.getElementById("container").style.backgroundImage = "none";
        document.getElementById("menu_wrapper").style.backgroundImage = "none";
        document.body.style.backgroundImage = "none";
        document.body.style.backgroundColor = "transparent";
      }

      if (canvas && page === "menu_wrapper") {
        document.getElementById("menu_wrapper_canvas").style.display = "block";
      }

      if (tv_lg_mark) {
        elem.style.backgroundImage = "url(tv:)";
      } else {
        elem.style.background = "none";
      }
    }

    return true;

    function renderCanvas(elem, page) {
      storage_page = page;

      $("#container").prepend(
        '<canvas id="' +
          page +
          '_canvas" width=1280 height=720 style="position:absolute;top:0px;left:0px;">'
      );

      var ctx = document.getElementById(page + "_canvas").getContext("2d");
      ctx.drawImage(img, 0, 0, 1280, 720);

      var tmp_rect = elem.getBoundingClientRect();
      var top = Math.max(0, tmp_rect.top);
      var height = Math.max(0, tmp_rect.height);

      ctx.clearRect(tmp_rect.left, top, tmp_rect.width, height);

      setTimeout(function () {
        document.getElementById("container").style.backgroundImage = "none";
        document.getElementById("menu_wrapper").style.backgroundImage = "none";
        document.body.style.backgroundImage = "none";
        document.body.style.backgroundColor = "transparent";
      }, 200);
    }
  };
}

function render_canvas(data) {
  var cont = $("#" + data.container);
  cont.prepend(
    '<canvas id="' +
      data.id +
      '_canvas" width=1280 height=720 style="position:absolute;top:0px;left:0px;">'
  );

  var tmp_image = cont
    .css("background-image")
    .replace("url(", "")
    .replace(")", "")
    .replace(/\"/gi, "");
  var img = new Image();

  var ctx = document.getElementById(data.id + "_canvas").getContext("2d");

  img.onload = function (e) {
    ctx.drawImage(img, 0, 0, 1280, 720);

    var tmp_rect = data.elem.getBoundingClientRect();

    var top, left, width, height;
    if (data.rect) {
      top = data.rect.top;
      left = data.rect.left;
      width = data.rect.width;
      height = data.rect.height;
    } else {
      top = Math.max(0, tmp_rect.top);
      left = Math.max(0, tmp_rect.left);
      width = Math.max(0, tmp_rect.width);
      height = Math.max(0, tmp_rect.height);
    }

    ctx.clearRect(left, top, width, height);
    cont.css("background-image", "none");
  };

  img.onerror = function (e) {
    log.add(
      "Error: image " +
        this.src +
        " from container" +
        data.container +
        "was not loaded"
    );
  };

  img.src = tmp_image;
}

function isGetVideoPage() {
  var page;

  if (tv_mag_mark && !isset("config.tv.hacks.MAG")) {
    page = null;
  }

  if (
    tv_cur_block === "menu" &&
    (isset("config.menu") === "metro" || isset("config.menu") === "scandic")
  ) {
    page = "menu_wrapper";
  } else {
    if (
      tv_cur_block === "tv_channellist" ||
      tv_cur_block === "category" ||
      tv_cur_block === "language" ||
      tv_cur_block === "channel" ||
      tv_cur_block === "choosing_list" ||
      tv_cur_block === "VODplayer" ||
      tv_cur_block === "tv_radiolist" ||
      tv_cur_block === "genre" ||
      tv_cur_block === "mod_playlist" ||
      tv_cur_block === "dialog" ||
      tv_cur_block === "toppings" ||
      active_page_id === "minibar" ||
      active_page_id === "welcome" ||
      active_page_id === "MOD" ||
      active_page_id === "notification_container"
    ) {
      page = null;
    } else {
      page = active_page_id;
    }
  }

  return page;
}

function reload_app(hardreset) {
  //TODO: переделать на промис сохранения
  if (is_saving_storage_process) {
    return setTimeout(function () {
      reload_app(hardreset);
    }, 100);
  }

  //Принудительный рестарт через 5 секунд
  setTimeout(function () {
    document.location.reload(true);
  }, 5000);

  if (!hardreset) {
    _tv_channel_stop();
    Media.stop({ directType: null }).done(function () {
      $(document.body).empty();
      setTimeout(function () {
        document.location.reload(true);
      }, 100);
    });
  } else {
    setTimeout(function () {
      document.location.reload(true);
    }, 100);
  }
}

var importScript = (function (oHead) {
  function loadError(oError) {
    throw new URIError(
      "The script " + oError.target.src + " is not accessible."
    );
  }

  return function (sSrc, fOnload, fOnerror) {
    var oScript = document.createElement("script");
    oScript.type = "text/javascript";
    oScript.onerror = loadError;
    if (fOnload) {
      oScript.onload = fOnload;
    }
    if (fOnerror) {
      oScript.onerror = fOnerror;
    }
    oHead.appendChild(oScript);
    oScript.src = sSrc;
  };
})(document.head || document.getElementsByTagName("head")[0]);

/**
 * Принимает фильм, категорию фильмов или канал
 * Если контент не надо показывать, возвращаем true
 * @param item - фильм, категория фильмов, каналов
 * @param direct - "video"
 * @returns {boolean}
 */
function filterRightsContent(item, direct) {
  var types = item.contentTypes;
  if (!types || types.length === 0) {
    return false;
  }

  var rights;
  try {
    rights = Guest.rightsContent[direct];
  } catch (e) {
    return types.indexOf("pay") !== -1 || types.indexOf("xxx") !== -1;
  }

  switch (rights) {
    case 0:
      return false;
    case 1:
      return types.indexOf("pay") !== -1;
    case 2:
      return types.indexOf("xxx") !== -1;
    case 3:
      return true;
    default:
      return types.indexOf("pay") !== -1 || types.indexOf("xxx") !== -1;
  }
}
function handlerNopost(list, index, action) {
  var types = list[index].contentTypes,
    nopost = false;

  if (!types || types.length === 0) {
    return action;
  }

  try {
    nopost = parseFloat(Guest.rightsContent.nopost);
  } catch (e) {
    return action;
  }

  if (nopost) {
    // если tv_cur_channel платный при nopost
    // сдвигаем канал вправо
    if (
      (list[index].type === "ip" || list[index].type === "rf") &&
      tv_cur_channel == index
    ) {
      tv_cur_channel++;
    }

    action =
      "custom_dialog(" +
      "'alert'," +
      " '" +
      getlang("tv_nottelevision") +
      "'," +
      " '" +
      getlang("not_available_content") +
      "'" +
      ")";
  }

  return action;
}

/**
 * Управление тенями на content_wrapper
 *
 * @param {object} data.to – если to есть, то к этому блоку добавляется нижняя тень,
 * передается из make_scroll
 * @param {number} data.shift, data.val – вычисляются в move_scroll
 * @param {object} data.scroll – передается из move_scroll
 *
 * @param {string} data.id – с какой страницы удалить
 * @param {boolean} data.remove – удалить тени
 *
 * */
function manageShadowOnPage(data) {
  if (tv_manufacturer === "tvip") {
    // добавление тени на TVip сильно все ломает
    return false;
  }

  if (
    tv_cur_block !== "service_page" &&
    tv_cur_block !== "scroll" &&
    tv_cur_block !== "shopitem"
  ) {
    return;
  }

  if (typeof data.to !== "undefined") {
    return data.to.find(".content_wrapper").addClass("bottom_shadow_mask");
  } else if (data.remove && tv_cur_block === "shopitem") {
    return $("#" + data.id + " .content_wrapper").removeClass(
      "shadow_mask top_shadow_mask bottom_shadow_mask"
    );
  }

  if (
    typeof data.shift === "undefined" ||
    typeof data.value === "undefined" ||
    typeof data.scroll === "undefined"
  ) {
    return false;
  }

  var content_wrapper = $(active_page).find(".content_wrapper");
  if (data.shift === 0) {
    content_wrapper.removeClass("shadow_mask top_shadow_mask");
    content_wrapper.addClass("bottom_shadow_mask");
  } else if (data.value + 1 === data.scroll.max) {
    content_wrapper.removeClass("shadow_mask bottom_shadow_mask");
    content_wrapper.addClass("top_shadow_mask");
  } else if (!content_wrapper.hasClass("shadow_mask")) {
    content_wrapper.removeClass("top_shadow_mask bottom_shadow_mask");
    content_wrapper.addClass("shadow_mask");
  }
}

function get_language() {
  //TODO: учитывать structv2.config.defaults?
  if (typeof storage != "undefined" && typeof storage.getItem != "undefined") {
    return (
      storage.getItem("language") || isset("config.defaults.language") || "en"
    );
  } else {
    return "notset";
  }
}

// CASE: SCANDIC_MENU
// перемещаемся вправо со сдвигом меню влево и быстро нажимаем на лево
// пока не закончилась анимация.
// Это действие приводило к тому, что не правильно расчитывалось положение курсора
var cursorMovingPermitted = {
  State: {},

  /**
   * @param {String} data.key - tv_cur_block
   * @param {String} data.direct - направление движения [top|right|bottom|left]
   * @param {Number} data.time - время анимации
   * @param {Boolean} data.animation - [true - анимация была | false - не было]
   * */
  set: function (data) {
    var state = this.State[data.key];
    if (typeof state !== "undefined") {
      clearTimeout(state.timer);
    }

    this.State[data.key] = data;

    if (data.animation) {
      this.State[data.key].timer = setTimeout(
        function (data) {
          this.State[data.key].animation = false;
        }.bind(this, data),
        data.time
      );
    }
  },

  /**
   * @param {String} data.key - tv_cur_block
   * @param {String} data.direct - направление движения [top|right|bottom|left]
   * */
  get: function (data) {
    var state = this.State[data.key];

    if (typeof state === "undefined" || !state.animation) {
      return true;
    }

    return state.direct === data.direct;
  },
};

var previousPosition = {
  state: {},

  /**
   * Запоминаем позицию
   * */
  set: function (index, block) {
    block = previousPosition.getBlock(block);

    if (block !== "menu" && block !== "channel") {
      return false;
    }

    previousPosition.state[block] = index;

    return true;
  },

  /**
   * Отдаем сохраненную позицию
   * @param {string} block - tv_cur_block.
   * В случае, если block передан, но пользователь находится в другом tv_cur_block возвращает undefined
   * */
  get: function (block) {
    block = previousPosition.getBlock(block);
    return previousPosition.state[block];
  },

  /**
   * Особенность работы см. в описании previousPosition.get()
   * */
  getBlock: function (block) {
    return typeof block !== "undefined" && block !== tv_cur_block
      ? undefined
      : tv_cur_block;
  },
};

function Running_string(target, speed, width) {
  var MARGIN = 20;

  this.timer = null;
  this.target = document.querySelector(target);
  this.width = this.target.clientWidth;
  this.speed = speed;
  this.content = this.target.innerHTML;

  this.start = function () {
    _render.call(this, true);
    setTimeout(
      function () {
        _start.call(this, true);
      }.bind(this),
      500
    );

    function _render(refresh) {
      if (refresh) {
        this.wrapper = document.createElement("span");
        this.wrapper.classList.add("wrapper_running_string");

        var inner_1 = document.createElement("span");
        inner_1.classList.add("inner_running_string");
        inner_1.innerHTML = this.content;
        var inner_2 = document.createElement("span");
        inner_2.classList.add("inner_running_string");
        inner_2.innerHTML = this.content;

        inner_1.style.transitionDuration = this.speed / 1000 + "s";
        inner_1.style.webkitTransitionDuration = +this.speed / 1000 + "s";
        inner_2.style.transitionDuration = +this.speed / 1000 + "s";
        inner_2.style.webkitTransitionDuration = +this.speed / 1000 + "s";

        inner_1.style.marginLeft = "0px";
        inner_2.style.marginLeft = "0px";
        inner_1.style.marginRight = MARGIN + "px";
        inner_2.style.marginRight = MARGIN + "px";

        this.wrapper.appendChild(inner_1);
        this.wrapper.appendChild(inner_2);

        this.target.innerHTML = "";
        this.target.appendChild(this.wrapper);
      } else {
        this.wrapper.firstElementChild.style.marginLeft = "0px";
        this.wrapper.appendChild(this.wrapper.firstElementChild);

        _start.call(this, false);
      }
    }
    function _start(init) {
      this.wrapper.firstElementChild.style.marginLeft =
        "-" + (this.width + MARGIN) + "px";

      if (init) {
        this.timer = setInterval(_render.bind(this, false), this.speed);
      }
    }
  };
  this.stop = function () {
    clearInterval(this.timer);
    this.target.innerHTML = this.content;
  };
}

//printf
String.prototype.format = function (args) {
  var newStr = this;
  for (var key in args) {
    newStr = newStr.replace("{" + key + "}", args[key]);
  }
  return newStr;
};
//------

/**
 * Предзагрузчик изображений
 *
 * @param {string} target - контейнер в котором ищем изображения и загружаем,
 * принимает "#id" и ".class"
 *
 * @param {function} [cb] – коллбек отображение прогресс бара загрузки изображений
 *
 */
function PreloadMedia(target) {
  var Instance = this,
    d = $.Deferred();

  Instance.container = document.querySelector(__checkID(target));
  Instance.elements = Instance.container
    ? Instance.container.querySelectorAll("[image_url]")
    : [];

  if (!Instance.elements.length) {
    return d.resolve();
  }

  var i = Instance.elements.length;
  Instance.sources = [];
  while (i--) {
    Instance.sources.push(Instance.elements[i].getAttribute("image_url"));
  }

  new _PreloadMedia(Instance.sources)
    .progress(function (a, b) {
      d.notify(a, b);
    })
    .done(function () {
      __loadEnd();
    });

  return d.promise();

  function __loadEnd() {
    for (var j = 0; j < Instance.elements.length; j++) {
      var element = Instance.elements[j];
      if (element.getAttribute("image_url") === "") {
        continue;
      }

      if (element.tagName.toLowerCase() !== "img") {
        element.style.cssText = element.style.cssText.replace(
          "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=",
          element.getAttribute("image_url")
        );
      } else {
        element.setAttribute("src", element.getAttribute("image_url"));
      }

      $(element).removeAttr("image_url");
    }
    d.resolve(Instance.sources.length);
  }

  // устранение ошибки поиска #Number
  // https://stackoverflow.com/questions/20306204/using-queryselector-with-ids-that-are-numbers
  function __checkID(target) {
    if (target.indexOf("#") === -1) {
      return target;
    }

    var targetValue = target.slice(1);
    if (isNaN(targetValue)) {
      return target;
    }

    return '[id="' + targetValue + '"]';
  }
}

function _PreloadMedia(images) {
  var Instance = this,
    d = $.Deferred();

  Instance.loaded = 0;

  if (!images || !images.length) {
    return d.resolve();
  }

  Instance.sources = images;

  var length = Instance.sources.length,
    index = 0;

  var threads =
    isset("config.preload_images") === 1
      ? Instance.sources.length
      : isset("config.preload_threads")
      ? isset("config.preload_threads")
      : 1;

  while (threads--) {
    __load();
  }

  return d.promise();

  function __load() {
    var src = Instance.sources[index];
    index++;
    if (Instance.loaded < length) {
      if (index <= length) {
        var img = new Image();

        img.onload = function (src) {
          Instance.loaded++;
          d.notify(Instance.loaded, length);
          __load();
        }.bind(null, src);

        img.onerror = function (src) {
          Instance.loaded++;
          d.notify(Instance.loaded, length);
          __load();
          log.add("Preload: ERROR: Image load error " + src);
        }.bind(null, src);

        if (src) {
          img.src = src;
        } else {
          Instance.loaded++;
          d.notify(Instance.loaded, length);
          __load();
        }
      }
    } else {
      d.resolve();
    }
  }
}

var equals;
(function setEquals() {
  var isArray = Array.isArray;
  var keyList = Object.keys;
  var hasProp = Object.prototype.hasOwnProperty;

  equals = function (a, b) {
    if (a === b) {
      return true;
    }

    if (a && b && typeof a == "object" && typeof b == "object") {
      var arrA = isArray(a),
        arrB = isArray(b),
        i,
        length,
        key;

      if (arrA && arrB) {
        length = a.length;
        if (length != b.length) {
          return false;
        }
        for (i = length; i-- !== 0; ) {
          if (!equals(a[i], b[i])) {
            return false;
          }
        }
        return true;
      }

      if (arrA != arrB) {
        return false;
      }

      var dateA = a instanceof Date,
        dateB = b instanceof Date;
      if (dateA != dateB) {
        return false;
      }
      if (dateA && dateB) {
        return a.getTime() == b.getTime();
      }

      var regexpA = a instanceof RegExp,
        regexpB = b instanceof RegExp;
      if (regexpA != regexpB) {
        return false;
      }
      if (regexpA && regexpB) {
        return a.toString() == b.toString();
      }

      var keys = keyList(a);
      length = keys.length;

      if (length !== keyList(b).length) {
        return false;
      }

      for (i = length; i-- !== 0; ) {
        if (!hasProp.call(b, keys[i])) {
          return false;
        }
      }

      for (i = length; i-- !== 0; ) {
        key = keys[i];
        if (!equals(a[key], b[key])) {
          return false;
        }
      }

      return true;
    }

    return a !== a && b !== b;
  };
})();

// полифилл для bind
Function.prototype.bind =
  Function.prototype.bind ||
  function (b) {
    if (typeof this !== "function") {
      throw new TypeError(
        "Function.prototype.bind - what is trying to be bound is not callable"
      );
    }
    var a = Array.prototype.slice,
      f = a.call(arguments, 1),
      e = this,
      c = function () {},
      d = function () {
        return e.apply(
          this instanceof c ? this : b || window,
          f.concat(a.call(arguments))
        );
      };
    c.prototype = this.prototype;
    d.prototype = new c();
    return d;
  };

// полифилл Object.assign
Object.assign ||
  Object.defineProperty(Object, "assign", {
    enumerable: !1,
    configurable: !0,
    writable: !0,
    value: function (e, r) {
      "use strict";
      if (void 0 === e || null === e) {
        throw new TypeError("Cannot convert first argument to object");
      }
      for (var t = Object(e), n = 1; n < arguments.length; n++) {
        var o = arguments[n];
        if (void 0 !== o && null !== o) {
          for (
            var i = Object.keys(Object(o)), a = 0, c = i.length;
            a < c;
            a++
          ) {
            var b = i[a],
              l = Object.getOwnPropertyDescriptor(o, b);
            void 0 !== l && l.enumerable && (t[b] = o[b]);
          }
        }
      }
      return t;
    },
  });

// полифилл для dataset для MAG254
if (
  !document.documentElement.dataset &&
  // FF is empty while IE gives empty object
  (!Object.getOwnPropertyDescriptor(Element.prototype, "dataset") ||
    !Object.getOwnPropertyDescriptor(Element.prototype, "dataset").get)
) {
  var propDescriptor = {
    enumerable: true,
    get: function () {
      "use strict";
      var i,
        that = this,
        HTML5_DOMStringMap,
        attrVal,
        attrName,
        propName,
        attribute,
        attributes = this.attributes,
        attsLength = attributes.length,
        toUpperCase = function (n0) {
          return n0.charAt(1).toUpperCase();
        },
        getter = function () {
          return this;
        },
        setter = function (attrName, value) {
          return typeof value !== "undefined"
            ? this.setAttribute(attrName, value)
            : this.removeAttribute(attrName);
        };
      try {
        // Simulate DOMStringMap w/accessor support
        // Test setting accessor on normal object
        ({}).__defineGetter__("test", function () {});
        HTML5_DOMStringMap = {};
      } catch (e1) {
        // Use a DOM object for IE8
        HTML5_DOMStringMap = document.createElement("div");
      }
      for (i = 0; i < attsLength; i++) {
        attribute = attributes[i];
        // Fix: This test really should allow any XML Name without
        //         colons (and non-uppercase for XHTML)
        if (
          attribute &&
          attribute.name &&
          /^data-\w[\w\-]*$/.test(attribute.name)
        ) {
          attrVal = attribute.value;
          attrName = attribute.name;
          // Change to CamelCase
          propName = attrName.substr(5).replace(/-./g, toUpperCase);
          try {
            Object.defineProperty(HTML5_DOMStringMap, propName, {
              enumerable: this.enumerable,
              get: getter.bind(attrVal || ""),
              set: setter.bind(that, attrName),
            });
          } catch (e2) {
            // if accessors are not working
            HTML5_DOMStringMap[propName] = attrVal;
          }
        }
      }
      return HTML5_DOMStringMap;
    },
  };
  try {
    // FF enumerates over element's dataset, but not
    //   Element.prototype.dataset; IE9 iterates over both
    Object.defineProperty(Element.prototype, "dataset", propDescriptor);
  } catch (e) {
    propDescriptor.enumerable = false; // IE8 does not allow setting to true
    Object.defineProperty(Element.prototype, "dataset", propDescriptor);
  }
}

// полифилл для closest
(function () {
  // matches
  // проверяем поддержку
  if (!Element.prototype.matches) {
    // определяем свойство
    Element.prototype.matches =
      Element.prototype.matchesSelector ||
      Element.prototype.webkitMatchesSelector ||
      Element.prototype.mozMatchesSelector ||
      Element.prototype.msMatchesSelector;
  }

  // closest
  // проверяем поддержку
  if (!Element.prototype.closest) {
    // реализуем
    Element.prototype.closest = function (css) {
      var node = this;
      while (node) {
        if (node.matches(css)) {
          return node;
        } else {
          node = node.parentElement;
        }
      }
      return null;
    };
  }
})();

function getPageFromStruct(id, initialItem) {
  id = typeof id === "undefined" ? "" : id;
  id = id.replace("#", "");
  id = id.toString().indexOf("id_") !== -1 ? id : "id_" + id;

  var product = structv2.pages[id];
  return typeof product !== "undefined"
    ? product
    : typeof initialItem !== "undefined"
    ? initialItem
    : {};
}
function getRcuPageFromStruct(id, initialItem) {
  id = typeof id === "undefined" ? "" : id;
  id = id.replace("#", "");
  id = id.toString().indexOf("id_") !== -1 ? id : "id_" + id;

  var product = structv2.rcu[id];
  return typeof product !== "undefined"
    ? product
    : typeof initialItem !== "undefined"
    ? initialItem
    : {};
}

function settings_fill() {
  if ($id("parental_lock_toggle")) {
    parental_lock_fill();
  }
}

function guestData_clear() {
  log.add("TV: cleared Guest data");

  Guest.token = false;
  Guest.guestSurname = "";
  Guest.guestName = "";
  Guest.guestTitle = "";

  // Compatibility (not used)
  storage.removeItem("guestName");
  storage.removeItem("guestTitle");
  storage.removeItem("surname");
  storage.removeItem("rightsContent");

  storage.removeItem("messages");
  storage.removeItem("message_unread");
  storage.removeItem("message_lastId");
  storage.removeItem("message_lasttime");
  //--------------

  storage.removeItem("token");
  storage.removeItem("wakeupMode");

  $("#messages_indicator").html(0).hide();
  $(".messages_group_indicator").html(0).hide();

  $(".in, .out, .date").remove();

  shop_clear();

  if (tv_channellist_type === "mosaic" && tv_mosaic && tv_mosaic.build) {
    tv_mosaic.toggle_filter_item();
    tv_mosaic.filter_channels();
    tv_mosaic.build_channel_list(true);
  }

  clear_data();

  if (typeof _tv_checkout == "function") {
    _tv_checkout();
  }
}

function setLocationURL(url) {
  if (!url.match(/^https?:\/\//gi)) {
    var link = server_url.replace(/#(.+)/, "").split("/"); //удаление hash
    link.pop(); //удаление файла или пустого

    url = url.split("/");
    if (url[0] == "") {
      //абсолютный url
      link = link.slice(0, 3);
      url.shift();
    }

    url = link.concat(url).join("/");
  }

  return url;
}

function encodeString(str) {
  if (str.indexOf("%") === -1) {
    return encodeURI(str);
  } else {
    return str;
  }
}

// ограничение числа отрезком
Number.prototype.constrain = function (min, max) {
  return Math.max(min, Math.min(this, max));
};

function perfomance_test() {
  $("*").each(function (d) {
    var that = this;
    var tmp = $(this).css("backgroundImage");

    if (tmp == "none") {
      tmp = this.src;
      if (tmp) {
        tmp.match(/\/c\/i\//);
      }
    } else {
      tmp = tmp.match(/url\((.+\/c\/i\/.+)\)/);
      if (tmp) {
        tmp = tmp[1].split('"').join("");
      }
    }

    if (tmp) {
      //list.push(tmp.match(/url\((.+\/c\/i\/.+)\)/)[1].split('"').join(''))

      var im = new Image();
      im.onload = function () {
        //l(this.src);
        //TODO: сравнивать с размерами элемента 2х
        if (this.width > 640) {
          //l('w:' + this.width);
          log.add("Perf: " + this.src + ", " + this.width + "px");
          $(that).css("outline", "1px solid Red");
        }
        if (this.height > 1200) {
          //l('h:' + this.height);
        }
      };
      im.onerror = function (d) {
        l("error: " + this.src);
      };
      im.src = tmp;
    }
  });
}

function tv_set_start_volume() {
  if (isset("config.tv.start_volume.enabled")) {
    _tv_change_mute(0);
    tv_set_volume(isset("config.tv.start_volume.volume"));
  }
}

function select_item() {
  tv_sel_list.removeClass("selected");
  tv_cur_elem.addClass("selected");
}

var first_page_in_classic_menu = {
  id: 0,
  menu_item: null,
  get_page: function () {
    //дублирование из tv_sel_block чтобы получить первую
    var list = $("#menu")
      .find("[href]")
      .filter(function () {
        return $(this).is(":visible") && this.tagName.toLowerCase() !== "use";
      });
    this.menu_item = list.eq(this.id);
    var onvclick = this.menu_item[0].getAttribute("onvclick");

    if (onvclick == "tv_mode();" || onvclick == "RADIO.open();") {
      this.id++;
      this.get_page();
    }

    return this.menu_item;
  },
};

function delete_splash() {
  var splash = $("#splashscreen"),
    d = $.Deferred();

  deleteLoader();
  $("#tv_fullscreen_overlay").css("visibility", "");

  if (splash.length) {
    splash.on(css_transitionend, function () {
      log.add("final");
      $(this).remove();
      HotezaTV.metrics.final = time.uptime();
      $(HotezaTV).trigger("final");
      d.resolve();
    });
    splash.addClass("hidden");
  } else {
    d.resolve();
  }

  return d.promise();
}
function deleteLoader() {
  $(document.body).removeClass("loading");
}
function deleteFeaturesSubstrate(target) {
  $("#" + target + " #features_substrate").remove();
}
function initAjaxSetup() {
  $.ajaxSetup({
    timeout: 10000, //Time in milliseconds
  });
}
jQuery.cachedScript = function (url, options) {
  // Allow user to set any option except for dataType, cache, and url
  options = $.extend(options || {}, {
    dataType: "script",
    cache: true,
    url: url,
  });

  // Use $.ajax() since it is more flexible than $.getScript
  // Return the jqXHR object so we can chain callbacks
  return jQuery.ajax(options);
};

/**
 * Gets all event-handlers from a DOM element.
 * Events with namespace are allowed.
 *
 * @param  {Element} node: DOM element
 * @param  {String} eventns: (optional) name of the event/namespace
 * @return {Object}
 */
function getEventHandlers(element, eventns) {
  var $ = window.jQuery;
  var i = (eventns || "").indexOf("."),
    event = i > -1 ? eventns.substr(0, i) : eventns,
    namespace = i > -1 ? eventns.substr(i + 1) : void 0,
    handlers = Object.create(null);
  element = $(element);
  if (!element.length) {
    return handlers;
  }
  // gets the events associated to a DOM element
  var listeners = $._data(element.get(0), "events") || handlers;
  var events = event ? [event] : Object.keys(listeners);
  if (!eventns) {
    return listeners;
  } // Object with all event types
  events.forEach(function (type) {
    // gets event-handlers by event-type or namespace
    return (listeners[type] || []).forEach(getHandlers, type);
  });
  // eslint-disable-next-line
  function getHandlers(e) {
    var type = this.toString();
    var eNamespace = e.namespace || (e.data && e.data.handler);
    // gets event-handlers by event-type or namespace
    if (
      (event === type && !namespace) ||
      (eNamespace === namespace && !event) ||
      (eNamespace === namespace && event === type)
    ) {
      handlers[type] = handlers[type] || [];
      handlers[type].push(e);
    }
  }
  return handlers;
}
var server_url;
var regions_dict = {
  local: {
    admin_url: "admin",
    static_url: "static",
    queue_url: "queue",
    remotedebug_url: "weinre",
    stat_url: "stat",
  },
  eu: {
    admin_url: "api.hoteza.com",
    static_url: "static.hoteza.com",
    queue_url: "queue.hoteza.com",
    remotedebug_url: "weinre.hoteza.com",
    stat_url: "stat.hoteza.com",
  },
};
var CONFIG = {
  config_default: {},
  config_loaded: {},
  load: function () {
    $.getScript("tv/config_def.js")
      .done(function () {
        CONFIG.config_default = config;
        log.add("CONFIG: defaults loaded");

        $.getScript("tv/config.js")
          .done(function () {
            CONFIG.config_loaded = config;
            config = Object.assign(
              {},
              CONFIG.merge(CONFIG.config_default, CONFIG.config_loaded)
            );
            log.add("CONFIG: loaded");

            tv_size_init();
          })
          .fail(function (err, msg1, msg2) {
            CONFIG.error = "default";
            log.add("CONFIG: load ERROR: " + msg2 + "; Using default");
          })
          .always(function () {
            //определение server_url
            var base_url = isset("base_url");
            var tmp;
            if (base_url) {
              tmp = base_url;
            } else {
              tmp = document.location.href;
            }
            tmp = tmp.split("/");
            tmp[tmp.length - 1] = "";
            server_url = tmp.join("/");
            //--------------------

            //TODO: 'custom' region
            var region = get_hotelRegion();
            var urls = ["admin", "static", "queue", "remotedebug", "stat"];
            for (var i in urls) {
              config[urls[i] + "_url"] = CONFIG.url_get(urls[i]);
            }
            //----

            api_url = isset("config.admin_url") + "jsonapi/";
            tv_api_url = isset("config.admin_url") + "tvconnect/";
            res_url = isset("config.static_url") + "files/";

            log.add("APP: SERVER " + server_url);
            log.add("APP: REGION " + region.toUpperCase());
            log.add("APP: Hotel ID " + get_hotelId());
            log.add("DEVICE: UserAgent " + ua);

            tv_vendor_load2();

            function tv_vendor_load2() {
              Vendor.load()
                .done(function () {
                  //TODO: переделать как-то в вендора?...
                  if (typeof __tv_set_window_size != "undefined") {
                    __tv_set_window_size().done(function (res) {
                      switch (res) {
                        case "hd720upscaled":
                          $("html").addClass("hd720upscaled");
                          log.add("FULL HD MODE");
                          break;
                        default:
                          $("html").addClass("hd720");
                          break;
                      }
                    });
                  } else {
                    $("html").addClass("hd720");
                  }

                  //Check room number
                  if (!storage.room || storage.room == "0") {
                    if (!isset("config.tv.configure_hide")) {
                      $(HotezaTV).one("final", function () {
                        setTimeout(function () {
                          tv_configure();
                        }, 1000);
                      });
                    }
                    log.add("DEVICE: ROOM NOT SET");
                  } else {
                    tv_room = storage.room;
                    log.add("DEVICE: ROOM " + tv_room);
                  }

                  tv_get_network_info()
                    .done(function (d) {
                      tv_mac = d.mac;
                      tv_ip = d.ip;
                    })
                    .always(function (d) {
                      tv_load_nav();
                    });
                })
                .fail(function (e) {
                  log.add("Vendor load error");
                  console.log("Vendor load error!!!");
                  console.log(e);
                  setTimeout(tv_vendor_load2, 5000);
                });
            }
          });
      })
      .fail(function (err, msg1, msg2) {
        CONFIG.error = "critical";
        log.add("CONFIG defaults load ERROR: " + msg2);
      });
  },
  merge: function (obj1, obj2) {
    if (typeof obj1 !== "object") {
      obj1 = {};
    }
    for (var i in obj2) {
      //~ if(typeof(obj1[i]) != 'object'){
      //~ obj1[i] = {};
      //~ }
      //~ l(i + ': ');
      if (obj2[i] != null && typeof obj2[i] === "object" && !obj2[i].length) {
        //~ l('[');
        obj1[i] = CONFIG.merge(obj1[i], obj2[i]);
        //~ l(']');
      } else {
        obj1[i] = obj2[i];
        //~ l(obj1[i]);
      }
    }
    return obj1;
  },
  test: function () {
    var tmp = [];
    var tmp_diff = [];
    tmp = tmp.concat(
      list_diff(
        Object.keys(CONFIG.config_default),
        Object.keys(CONFIG.config_loaded)
      )
    );
    for (var i in CONFIG.config_default) {
      if (
        typeof CONFIG.config_default[i] === "object" &&
        typeof CONFIG.config_loaded[i] === "object"
      ) {
        tmp_diff = list_diff(
          Object.keys(CONFIG.config_default[i]),
          Object.keys(CONFIG.config_loaded[i])
        );
        tmp_diff = tmp_diff.map(function (q) {
          return i + ":" + q;
        });
        tmp = tmp.concat(tmp_diff);
      }
      for (var o in CONFIG.config_default[i]) {
        if (
          typeof CONFIG.config_default[i][o] === "object" &&
          typeof CONFIG.config_loaded[i][o] === "object"
        ) {
          tmp_diff = list_diff(
            Object.keys(CONFIG.config_default[i][o]),
            Object.keys(CONFIG.config_loaded[i][o])
          );
          tmp_diff = tmp_diff.map(function (q) {
            return i + ":" + o + ":" + q;
          });
          tmp = tmp.concat(tmp_diff);
        }
      }
    }
    if (tmp.length) {
      tv_log("Config lacks parameters:");
      tv_log(tmp.join(", "));
    } else {
      tv_log("Config is OK");
    }
  },
  url_get: function (url) {
    //TODO: реализовать определение auto ssl
    var protocol = "http" + (isset("config.use_ssl") ? "s" : "") + "://";
    var out = isset("config." + url + "_url");
    var region = get_hotelRegion();
    if (out) {
      if (out.match(/^\/\//)) {
        out = protocol + out.slice(2);
      }
      log.add("CONFIG: Using override url for " + url);
    } else {
      out = regions_dict[region][url + "_url"] + "/";

      if (region != "local") {
        out = protocol + out;
      }
    }
    return out;
  },
};

function extendStruct(structure, lang) {
  var d = $.Deferred();

  $.getJSON(
    tv_content_url + "struct/structShop_" + lang + ".json?_r=" + Math.random()
  )
    .done(function (data) {
      structure.pages = Object.assign(
        {},
        extendServicePage(structure.pages),
        data
      );
      structure.pages = extendPagesByWakeup(structure);
      d.resolve(structure);
    })
    .fail(function () {
      structure.pages = extendServicePage(structure.pages);
      structure.pages = extendOldStructure(structure.pages);
      structure.pages = extendPagesByWakeup(structure);
      d.resolve(structure);
    });

  return d.promise();

  function extendServicePage(pages) {
    for (var id in pages) {
      var page = pages[id],
        serviceId = page.serviceId;

      if (serviceId) {
        var service = pages["id_" + serviceId];
        if (typeof service === "undefined") {
          continue;
        }

        page.cost = service.cost;
        page.workingHours = service.workingHours;
        page.customField = service.customField;
        page.pieces = service.pieces;
        page.toppings = service.toppings;
        page.buttonName = service.buttonName;
        page.hasChoiceOfTime =
          typeof service.hasChoiceOfTime === "undefined"
            ? true
            : service.hasChoiceOfTime;
      }
    }

    return pages;
  }

  function extendOldStructure(pages) {
    for (var id in pages) {
      var page = pages[id];
      if (page.type === "shopCategory") {
        for (var childId in page.children) {
          if (page.children[childId].type === "shopProduct") {
            pages[childId] = Object.assign(
              {},
              page.children[childId],
              pages[childId],
              { parentId: page.id }
            );
          }
        }
      }
    }

    return pages;
  }

  function extendPagesByWakeup(structure) {
    if (typeof structure.wakeupcall === "undefined") {
      return structure.pages;
    }

    var addedPages = {};
    addedPages.id_services_wakeup = structure.wakeupcall;
    addedPages.id_services_wakeup.id = "services_wakeup";
    addedPages["id_" + structure.wakeupcall.serviceId] = structure.wakeupcall;

    return Object.assign({}, structure.pages, addedPages);
  }
}

/**
 * @param channel - объект с данными канала
 * @returns {number} - индекс массива в списке каналов
 * */
function getChannelIndex(channel) {
  var index,
    channels = getChannels();

  for (var i = 0; i < channels.length; i++) {
    var item = channels[i];
    if (channel === item.id) {
      index = i;
      break;
    }
  }

  return index;
}

function channelCategories(channel, channelCategories) {
  if (channel.category && channelCategories.indexOf(channel.category) === -1) {
    channelCategories.push(channel.category);
  }
}
channelCategories.addFilter = function (categoryIndex) {
  var filters = channelCategories.getFiltersList();
  filters.push(categoryIndex);
};
channelCategories.removeFilter = function (categoryIndex) {
  var filters = channelCategories.getFiltersList();
  for (var i = 0; i < filters.length; i++) {
    var filter = filters[i];
    if (filter == categoryIndex) {
      filters.splice(i, 1);
      break;
    }
  }
};
channelCategories.getFiltersList = function () {
  if (typeof tv_channel_filter === "undefined") {
    window.tv_channel_filter = {};
  }
  if (typeof tv_channel_filter.category === "undefined") {
    tv_channel_filter.category = [];
  }

  return tv_channel_filter.category;
};
channelCategories.getNamesFiltersList = function (allNames) {
  var filters = channelCategories.getFiltersList(),
    results = [];

  if (tv_channel_categories.length === 0) {
    return results;
  }

  if (allNames) {
    return tv_channel_categories;
  }

  for (var i = 0; i < filters.length; i++) {
    var filter = filters[i];
    results.push(tv_channel_categories[filter]);
  }

  return results;
};
channelCategories.hasFilter = function (index) {
  index = parseInt(index);
  var filters = channelCategories.getFiltersList();
  return filters.indexOf(index) !== -1;
};

function getChannels() {
  //TODO: выпилить это
  return typeof _tv_channels !== "undefined" ? _tv_channels : tv_channels;
}
function getFiltratedChannelList() {
  var filterList = channelCategories.getNamesFiltersList(),
    channels = getChannels(),
    result = [];

  if (filterList.length === 0) {
    return channels;
  }

  for (var i = 0; i < channels.length; i++) {
    var channel = channels[i];
    if (filterList.indexOf(channel.category) !== -1) {
      result.push(channel);
    }
  }

  return result;
}
//TODO: убрать в RemoteControl
//TODO: переделать схему синхронизации списка
function sendChannelsToMobile() {
  var channels = getFiltratedChannelList();
  var out_array = [];
  for (var o in channels) {
    out_array.push({
      id: channels[o].id,
      name: channels[o].name,
      image: channels[o].image,
      state: channels[o].state,
      epg: channels[o].epg,
    });
  }
  Events.send("set_channels", out_array);
}
function sendChannelId(id) {
  Events.send("set_channel", id);
}

function changeCartItemLink(menu) {
  for (var id in menu) {
    var item = menu[id];
    if (item.link === "#cart") {
      item.link = "#orders";
      // item.title = isset('structv2.config.my_orders.title');
    }
  }

  return menu;
}

var informationPage = {
  page: null,
  Dict: {
    pa: "product_added",
    dt: "delivery_time",
    sp: "success_shop", // вообще-то это success_product
    ss: "success_service",
    sw: "success_wakeup",
    cp: "confirmation_page",
  },
  /**
   * Открытие информационной страницы.
   *
   * @param {Object} data - контекст (данные).
   * @param {string} data.type - sp = success_product,
   *                             ss = success_service,
   *                             dt = delivery_time,
   *                             pa = product_added,
   *                             cp = confirmation_page
   *                             sw = success_wakeup
   * @param {string} [data.back] - куда возвращаемся. Полезно для type === 'delivery_time'
   * @param {number} [data.approxTime] - примерное время выполнения заказа
   *
   * Используется в type === confirmation_page
   * @param {function} [data.onConfirm] - ф-ия выполняется, если прошла валидация вводимых данных
   * @param {function} [data.onError] – ф-ия выполняется, если валидация вводимых данных не прошла
   */
  open: function (data) {
    informationPage.render(data);
    navigate("#information", null, true);
  },
  render: function (data) {
    data = getData(data);

    var html = templates_cache.information.render(data);

    if (!informationPage.page) {
      document
        .getElementById("container")
        .insertAdjacentHTML("beforeend", html);
      informationPage.page = document.getElementById("information");
    } else {
      informationPage.page.innerHTML = "";
      informationPage.page.insertAdjacentHTML("beforeend", html);
    }

    function getData(data) {
      if (typeof data === "undefined" || typeof data.type === "undefined") {
        data = { type: "pa" };
      }

      if (!informationPage.page) {
        data.firstInit = true;
      }
      if (data.approxTime) {
        data.approximate_text = getlang("approximate_time");
      }

      data.title = getTitle(data);
      data.content = getContent(data);
      data.lang = {
        back: getlang("mobileAppContent-default-label-back"),
      };

      data.backBtn = 1;
      data.onvclick =
        typeof data.back === "undefined"
          ? "navigate(HotezaTV.history.lastpage, 'back');"
          : data.back;

      if (data.type === "cp") {
        data.onvclick += "$('#information .content_wrapper').remove();";
      }

      return data;
    }
    function getContent(data) {
      var text = isset(
          "structv2.config." + informationPage.Dict[data.type] + ".text"
        ),
        textTooltip = isset(
          "structv2.config." + informationPage.Dict[data.type] + ".text_tooltip"
        ),
        textError = isset(
          "structv2.config." + informationPage.Dict[data.type] + ".text_error"
        );

      switch (data.type) {
        case "pa":
          return {
            text: text ? text : getlang("product_added_text"),
            buttons: [
              {
                type: "onvclick",
                translate: getlang(
                  "mobileAppContent-mainContent-button-continueshopping"
                ),
                action: "navigate(HotezaTV.history.lastpage, 'back');",
              },
              {
                type: "href",
                translate: getlang(
                  "mobileAppContent-mainContent-button-gotocart"
                ),
                action: "#cart",
              },
            ],
          };

        case "dt":
          var order = Services.getOrders("not_placed", data.orderId);
          return {
            text: text
              ? text
              : getlang("mobileAppContent-mainContent-label-shopordertext"),
            buttons: data.isService
              ? [
                  {
                    type: "onvclick",
                    translate: getlang(
                      "mobileAppContent-mainContent-select-deliverOrder-now"
                    ),
                    action: "service_post('" + data.orderId + "', 'now');",
                  },
                  {
                    type: "onvclick",
                    translate: getlang(
                      "mobileAppContent-contentPage-input-hotelServiceRequest-selectTime"
                    ),
                    action:
                      "time_picker.open(HotezaTV.history.lastpage, 'service_post(\\'" +
                      data.orderId +
                      "\\', $(this).attr(\\'time\\'))')",
                  },
                ]
              : [
                  {
                    type: "onvclick",
                    translate: getlang(
                      "mobileAppContent-mainContent-select-deliverOrder-now"
                    ),
                    action: "shop_order('now', '" + data.orderId + "');",
                  },
                  {
                    type: "onvclick",
                    translate: getlang(
                      "mobileAppContent-contentPage-input-hotelServiceRequest-selectTime"
                    ),
                    action:
                      "time_picker.open('#orders', 'shop_order($(this).attr(\\'time\\'), \\'" +
                      data.orderId +
                      "\\')', " +
                      (order && order[Services.shopId]
                        ? order[Services.shopId].approxTime | 0
                        : 0) +
                      ")",
                  },
                ],
          };

        case "sp":
          return {
            text: text ? text : getlang("success_product_text"),
            approxTime: data.approxTime,
            buttons: [
              {
                type: "onvclick",
                translate: getlang("back_to_menu"),
                action: "navigate('#menu');",
              },
              {
                type: "href",
                translate: getlang("my_orders"),
                action: "#orders",
              },
            ],
          };

        case "ss":
          return {
            text: text ? text : getlang("success_service_text"),
            approxTime: data.approxTime,
            buttons: [
              {
                type: "onvclick",
                translate: getlang("back_to_menu"),
                action: "navigate('#menu');",
              },
              {
                type: "href",
                translate: getlang("my_orders"),
                action: "#orders",
              },
            ],
          };

        case "sw":
          return {
            text: text ? text : getlang("success_service_text"),
            approxTime: data.approxTime,
            buttons: [
              {
                type: "onvclick",
                translate: getlang("back_to_menu"),
                action: "navigate('#menu');",
              },
              {
                type: "href",
                translate: getlang("my_orders"),
                action: "#orders",
              },
            ],
          };

        case "cp":
          var isPinCode =
              isset("config.tv.parental_lock") && parental_lock_status(),
            action =
              "custom_input_check(" +
              "$('#custom_dialog_input').html(), " +
              "'" +
              data.onConfirm +
              "', " +
              "'" +
              data.onError +
              "'" +
              ");";

          return {
            text: text ? text : getlang("confirmation_page_text"),
            textTooltip: textTooltip
              ? textTooltip
              : getlang("confirmation_page_text_tooltip"),
            textConfirm: isPinCode
              ? getlang("confirmation_page_pin_code")
              : getlang("confirmation_page_room_number"),
            textError: textError
              ? textError
              : getlang("confirmation_page_text_error"),
            check: isPinCode ? pincode() : tv_room,
            buttons: [
              {
                type: "onvclick",
                translate: getlang("confirm"),
                action: action,
                onvmove:
                  "blinkedCursor.off(document.querySelector('#information .input'))",
              },
            ],
          };
      }
    }
    function getTitle(data) {
      var title = isset(
        "structv2.config." + informationPage.Dict[data.type] + ".title"
      );

      switch (data.type) {
        case "pa":
          return title ? title : getlang("product_added_header");

        case "dt":
          return title ? title : getlang("delivery_time_header");

        case "sp":
          return title ? title : getlang("success_product_header");

        case "ss":
          return title ? title : getlang("success_service_header");

        case "sw":
          return title ? title : getlang("success_service_header");

        case "cp":
          return title ? title : getlang("confirmation_page_header");
      }
    }
  },
};

/**
 * Для работы объекту требуется контейнер в который добавляется курсор
 * Также контейнер должен сожержать блок #custom_dialog_input
 * */
var blinkedCursor = {
  timer: null,
  on: function (container) {
    var blinkedCursor = container.querySelector("#blinked_cursor");
    if (!blinkedCursor) {
      clearTimeout(this.timer);
      createCursor(container);
    }

    this.blinking(container);

    function createCursor(container) {
      container
        .querySelector("#custom_dialog_input")
        .insertAdjacentHTML("afterend", '<div id="blinked_cursor"></div>');
    }
  },
  off: function (container) {
    clearTimeout(blinkedCursor.timer);
    container
      .querySelector("#blinked_cursor")
      .classList.add("cursor_invisible");
  },
  blinking: function (container) {
    clearTimeout(blinkedCursor.timer);

    var cursor = container.querySelector("#blinked_cursor");
    if (!cursor) {
      return false;
    }

    cursor.classList.toggle("cursor_invisible");

    blinkedCursor.timer = setTimeout(
      blinkedCursor.blinking.bind(null, container),
      900
    );
  },
};

function cursorAnimation() {
  if (
    !isset("config.tv.cursor_animation") ||
    isset("config.menu") === "classic" ||
    isset("config.menu") === ""
  ) {
    return false;
  }

  css_append("s/cursor-animation.css");
}
function generateMockData(items, count) {
  var min = 0,
    max = 1000000000,
    data = [];

  var k = count ? count : 100;
  while (k) {
    for (var j = 0; j < items.length; j++) {
      var item = items[j];
      data.push(Object.assign({}, item));
    }

    k--;
  }

  for (var i = 0; i < data.length; i++) {
    data[i].id = randomInteger(min, max);
  }

  return data;
}

function generate_uuid(withoutColon) {
  var tmp = lz(((Math.random() * 255) | 0).toString(16));
  for (var i = 0; i < 5; i++) {
    tmp +=
      (withoutColon ? "" : ":") + lz(((Math.random() * 255) | 0).toString(16));
  }
  return tmp;
}

function hex2a(hexx) {
  var hex = hexx.toString(); //force conversion
  var str = "";
  for (var i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return str;
}
function a2hex(string) {
  var hex = "";
  for (var i = 0; i < string.length; i++) {
    hex += string.charCodeAt(i).toString(16);
  }
  return hex;
}

//Document location hash manipulation
var hash = {
  _hash_obj: function (hash_obj) {
    if (typeof hash_obj == "undefined") {
      hash_obj = {};
      var hash = document.location.hash && document.location.hash.split("#")[1];
      if (hash) {
        hash = hash.split("&");
        hash.map(function (hash_str) {
          hash_str = hash_str.split("=");
          hash_obj[hash_str[0]] = hash_str[1] || true;
        });
      }
      return hash_obj;
    } else {
      var hash_str = [];
      for (var item in hash_obj) {
        if (hash_obj[item] !== true) {
          hash_str.push(item + "=" + hash_obj[item]);
        } else {
          hash_str.push(item);
        }
      }
      hash_str = "#" + hash_str.join("&");
      document.location.hash = hash_str;
      return hash_str;
    }
  },
  get: function (key) {
    return this._hash_obj()[key];
  },
  set: function (key, value) {
    var obj = this._hash_obj();
    if (value !== null) {
      obj[key] = value || true;
    } else {
      delete obj[key];
    }
    this._hash_obj(obj);
    return this._hash_obj()[key];
  },
};

/**
 * Ф-ия выполнения действии по открытию/закрытию страницы
 *
 * @param {object} page - jQuery объект страницы
 * @param {string} type - close | open
 * */
function execAction(page, type) {
  if (!page || !page.length) {
    return false;
  }

  var action = page[0].getAttribute("on" + type);

  if (!action) {
    return false;
  }

  try {
    eval(action); //jshint ignore: line
  } catch (e) {
    log.add("NAV: on" + type + " error: " + e);
  }
}

jQuery.fn.extend({
  cycleClass: function (classes) {
    var classes_arr = classes.split(" ");
    return this.each(function () {
      var tmp = -1;
      for (var i in classes_arr) {
        if ($(this).hasClass(classes_arr[i])) {
          tmp = i;
        }
      }

      tmp++;
      if (tmp >= classes_arr.length) {
        tmp = 0;
      }

      $(this).removeClass(classes);
      $(this).addClass(classes_arr[tmp]);
    });
  },
});

function isEpgFirstLine() {
  if (typeof Epg === "undefined") {
    return false;
  }

  return Epg.isFirstLine();
}

/**
 * Ф-ия получения команд от сервера
 * @param {object} data - данные
 * @param {object} data.payload - данные для запроса
 * @param {string} [data.payload.token] - токен пользователя
 * @param {string} [data.payload.cmd] - имя запрашиваемой команды используется когда хотим получить данные конкретной команды
 * @param {string} [data.url] - запрашиваемый url
 * @param {string} [data.method] - HTTP метод
 *
 * @param {object} [options] - используется для передачи дополнительных параметров, например contentType
 *
 * @returns {object}
 * @example {
 * 	"result": 0,
 * 	"message": "OK",
 * 	"payload": [
 * 		{
 * 		"cmd": "feedback",
 * 		"data": {
 * 			"showAlert": true
 * 		}
 * 		}
 * 	]
 * }
 * @example коды ответа r.result
 * 		0 - успех
 * 		1 - некоректные входные данные
 * 		2 - некорректный токен
 * 		3 - гость выселен
 * 		4 - гость отменён (по сути выселен, рудимент со старых времён)
 */
function getServerCommandsAsync(data, options) {
  var d = $.Deferred(),
    url = "http://103.153.72.195:8080/api/v1/getTask";

  if (!url) {
    log.add("GET CMD ASYNC: url is not exist");
    return d.reject();
  }

  $.ajax(
    Object.assign(
      {
        url: url,
        method: data.method ? data.method : "POST",
        data: data.payload,
        success: defaultResponseHandler("getServerCommandsAsync", function (r) {
          if (r.result === 0) {
            return d.resolve(r.payload || r.data);
          }

          log.add("GET CMD ASYNC ERROR: " + r.message);
          d.reject(r);

          return false;
        }),
        error: function (xhr, error) {
          log.add("GET CMD ASYNC: network error");
          return d.reject();
        },
      },
      options
    )
  );

  return d.promise();
}

/**
	* @param {string} [name] - имя ф-ии
	* @param {function} [handler] - ф-ия обработчик. Должна вернуть true, если ответ обработан.
	* */
function defaultResponseHandler(name, handler) {
	name = name ? name : 'Default';
	handler = handler ? handler : function() {return false;};

	return function (res) {
		if (handler(res)) {
			return true;
		}

		/**
			* 0 - успех
			* 100 - успех, повторый заказ
			*
			* 1 - некорректные данные
			* 2 - некоректный токен
			* 3 - гость выселен или не существует
			* 9 - exception
			* */
		switch (res.result) {
			case 0:
				log.add('ResHandler '+ name +': ok');
				return true;
			case 1:
				log.add('ResHandler '+ name +': incorrect data');
				break;
			case 2:
				log.add('ResHandler '+ name +': incorrect token');
				break;
			case 3:
				log.add('ResHandler '+ name +': guest was evicted or doesn\'t exist');
				break;
			case 9:
				log.add('ResHandler '+ name +': server error');
				break;
			default:
				log.add('ResHandler '+ name +': unknown answer');
				break;
		}

		// выполняется если от сервера получен ответ отличный от 0
		log.add('ResHandlerError '+ name +': '+ res.message);
	};
}

/**
	* Ф-ия получающая команду из списка команд по имени
	* @param {string} cmd - имя команды
	* @param {array} list - список команд
	* @returns { object | null }
	* */
function getCommandFromList(cmd, list) {
	if (!cmd || !list) {
		return null;
	}

	for (var i = 0; i < list.length; i++) {
		var listElement = list[i];
		if (listElement.cmd === cmd) {
			return listElement;
		}
	}

	return null;
}
function css_append(link, id){
	if ($('#' + id).length) {
		return false;
	}

	link += (version?'?v='+version.v:'?_noversion');

	link = typeof id !== 'undefined' ?
		'<link id="'+ id +'" href="' + link + '" rel="stylesheet" type="text/css">' :
		'<link href="' + link + '" rel="stylesheet" type="text/css">';

	if($id('customization_css')){
		$('#customization_css').before(link);
	}else{
		$(document.head).append(link);
	}
}

function getKeyCode(e) {
	if (!e) {e = event;}
	var code = (e.keyCode ? e.keyCode : e.which);

	//Обработка shift для MAG
	if(e.shiftKey){
		code = 'S'+code;
	}

	return code;
}

/**
	* @param {object} elem - элемент к которому перемещаемся
	* @param {number} offset - сдвиг относительно вычисляемого значения,
	*                          чтобы эл-т был не в самом вверху, а чуть ниже
	* @param {object} [content] - .content
	* @param {object} [wrapper] - .content_wrapper
	* */
function goToElement(elem, offset, content, wrapper) {
	if (!elem) {
		return false;
	}

	content = content ? content : elem.closest('.content');
	wrapper = wrapper ? wrapper : elem.closest('.content_wrapper');
	offset = offset ? offset : 0;

	if (!content || !wrapper) {
		return false;
	}

	var shiftElem = elem.getBoundingClientRect().top,
		shiftContent = !!parseInt(content.style.top) ? parseInt(content.style.top) : 0,
		shiftWrapper = wrapper.getBoundingClientRect().top;

	var shift = shiftElem - shiftWrapper;
	content.style.top = shiftContent - shift + offset + 'px';

	move_scroll(parseInt(content.style.top));
}
function deleteDisableModulesFromList(list) {
	var disable_modules = isset('config.tv.hacks.disable_modules');
	if (disable_modules && disable_modules.length) {
		for (var i = 0; i < disable_modules.length; i++) {
			var disable_module = disable_modules[i],
				index = list.indexOf(disable_module);

			if (index !== -1) {
				list.splice(index, 1);
			}
		}
	}

	return list;
}

var Cache = function () {
	this.cache = {};

	this.hasItem = function (key) {
		return !!this.cache[key];
	};

	this.setItem = function (key, data) {
		return this.cache[key] = data;
	};

	this.getItem = function (key) {
		return this.cache[key];
	};

	this.deleteItem = function (key) {
		return delete this.cache[key];
	};
};
function setGuestNameIntoText(text, insert) {
	if (!text || typeof text === 'undefined') {
		return text;
	}

	return text.replace('{username}', insert ? insert : '');
}

// http://dynamicsjs.com/ - подбор вида анимации
var isAnimating = false;
// Ф-ия используется для запуска отложенных до окончания анимации ф-ий
function runAnimate(el, params, options) {
	isAnimating = true;
	var defaultOptions = {
			type: dynamics.spring,
			duration: 500
		},
		completeFn = function () {
			isAnimating = false;
			$(window).trigger('finish_animate');
		};

	// если анимация выключена в конфиге
	// применяем css правила сразу и выходим из ф-ии
	if (isset('config.animation.spring.used') === false) {
		$(el).css(params);
		return completeFn();
	}

	try {
		options = Object.assign(defaultOptions, options);
		options.complete && $(window).one('finish_animate', options.complete);

		options.complete = completeFn;

		dynamics.animate(el, params, options);
	}
	catch (e) {
		completeFn();
	}
}

function arrayToObject(arr) {
	var imageList = [];
	for (var i = 0; i < arr.length; i++) {
		var obj = {};
		obj.count = i;
		obj.src = arr[i];
		imageList.push(obj);
	}
	return imageList;
}
function objectToArrayList(obj) {
	var arr = [];
	for (var key in obj) {
		if (obj[key] === true) {continue;}
		arr.push(obj[key]);
	}
	return arr;
}

//TODO: ужс, переделать на модуль
var QR = {
	//TODO: почистить после удаления YandexStation
	/**
		* @param id - id пункта меню или страницы
		* @param type - тип [menu, page]
		* @param [payload] - данные для формирования uri
		* @param [apiUri] - метод по которому обращаемся к серверу за QR'ом
		* */
	get: function (id, type, payload, apiUri) {
		if (typeof id === 'object') {
			for (var key in id) {
				var item = id[key];
				item.type === 'authQR' && QR.get(item.id, 'menu', item.payload);
			}

			return false;
		}

		var apiUrl = isset('config.admin_url') + (apiUri || 'jsonapi/getAuthTag');

		getServerCommandsAsync({
			url: apiUrl,
			method: 'POST',
			payload: JSON.stringify({
				sign: GibberishAES.enc(get_hotelId(), isset('config.secret')),
				hotelId: get_hotelId(),
				token: storage.getItem('token'),
				uri: QR.getUri(id, type, payload),
				base64: true,
			})
		}, { contentType: 'application/json' })
			.done(function (r) {
				QR.handlerSuccess(Object.assign({
					id: id,
					type: type
				}, r));
			})
			.fail(function (err) {
				QR.handlerError(Object.assign({ type: type }, err));
				log.add('QR Code: something with network');
			});
	},

	getUri: function (id, type, payload) {
		payload = typeof payload === 'undefined' ? getPageFromStruct(id).payload : payload;
		if (payload.link) {
			var to = getPageFromStruct(payload.link);
			to = to.type ? to : getRcuPageFromStruct(payload.link);
			switch (to.type) {
				case 'page':
					return '/page/'+ to.parentId +'/?modalType=page&modalId='+ to.id;

				case 'shopProduct':
					return '/page/'+ getParent(to, 2).id +'/?modalType=page&modalId='+ to.id;

				case 'hotezaremote':
					return '/hotezaremote';

				default:
					return '/page/'+ to.id;
			}
		}

		return '';

		function getParent(page, depth) {
			if (depth === 0) {
				return page;
			}

			return getParent(getPageFromStruct(page.parentId), --depth);
		}
	},

	render: function (payload) {
		switch (payload.type) {
			case 'menu':
				$('[data-id="' + payload.id + '"]').css('background-image', 'url('+ payload.qrCode +')');
				break;

			default:
				$('#' + payload.id + ' .wrap_img').css('background-image', 'url('+ payload.qrCode +')');
				break;
		}
	},

	handlerSuccess: function (payload) {
		QR.render({
			id: payload.id,
			type: payload.type,
			qrCode: payload.qrCode
		});
	},

	handlerError: function (r) {
		//custom_alert(r.message);
		log.add('QR: getAuthTag error: ' + r.message);
	}
};

//TODO: вынести модуль
var YandexStation = {
	deps: [],
	init: function(){
		if(true || isset('structv2.yandex_station.type' == 'hdmi')){
			UI.register_page({
				id: 'yandex_station',
				action: YandexStation.open
			});
		}else{
			//TODO: строить страницу с инструкцией
		}
	},
	open: function(){
		if(true || isset('structv2.yandex_station.type' == 'hdmi')){
			if(isset('structv2.yandex_station.hdmi') != false){
				tv_source(['HDMI',(parseInt(structv2.yandex_station.hdmi) - 1)]);
			}else{
				custom_alert('Yandex HDMI not set');
			}
		}else{

			//Переход на страницу с инструкцией
		}
	},

	init_old: function () {
		var d = $.Deferred();
		renderPageOnTheStructv2(
			'yandex_station',
			Object.assign({
				onopen: 'YandexStation.get()',
				onclose: 'clearTimeout(YandexStation.yandexStationTimer)'
			}, structv2.yandex_station),
			'yandex_station',
			'white'
		);
		d.resolve();
		return d.promise();
	},
	yandexStationTimer: null,
	activated: false,
	get: function(){
		if(check_auth()){
			var that = this;
			var apiUrl = isset('config.admin_url') + 'jsonapi/GetYandexStationState';
			$.post(
				apiUrl,
				JSON.stringify({
					sign: GibberishAES.enc(get_hotelId(), isset('config.secret')),
					hotelId: get_hotelId(),
					token: storage.getItem('token'),
	//				uri: QR.getUri(id, type, payload),
					base64: true,
				}),
				'application/json'
			)
			.done(function (r) {
				if(r.result == '0' || r.result == '5'){
					that.hSuccess(r);
				}else{
					that.hError(r);
				}
			})
			.fail(function (err) {
				that.hError(err);
				log.add('QR Code: something with network');
			});
		}else{
			custom_alert(getlang('bill_loginreq'));
		}
	},
	hSuccess: function(r){
		var that = this;
		if(r.result == '5'){
			Loader.start();
			that.yandexStationTimer = setTimeout(function () {
				that.get();
			}, 1000);
		}else{
			Loader.stop();
			var payload = r.data;
			if (payload.state === 'active') {
				document.getElementById('yandex-not-activated').style.display = 'none';
				document.getElementById('yandex-activated').style.display = 'block';

				if(structv2.yandex_station.image){
					$('#yandex_station .wrap_img').css('background-image', 'url('+ structv2.yandex_station.image +')');
				}else{
					$('#yandex_station .wrap_img').css('background-image', 'none');
				}

				that.activated = true;
			}else if (payload.state === 'need_activate') {
				QR.render({
					id: 'yandex_station',
					type: 'yandex_station',
					qrCode: payload.qrCode
				});

				// перезапускаем проверку статуса станции
				that.yandexStationTimer = setTimeout(function () {
					that.get();
				}, 5000);
			}else{
				log.add('YandexStation: unknown device state ' + payload.state);
			}
		}
	},
	hError: function(r){
		Loader.stop();

		var message;
		if(r.result === 8 && structv2.yandex_station.textNotAvailable){
			message = structv2.yandex_station.textNotAvailable;
		}else{
			message = r.message;
		}
		custom_confirm({
			type: 'alert',
			title: 'Alert',
			text: message,
			cancel: null,
			onConfirm: function () {
				YandexStation.get();
			}
		});
	},
	kinopoisk: function() {
		if(this.activated){
			tv_source(['HDMI',(parseInt(structv2.yandex_station.hdmi) - 1)]);
		}else{
			custom_dialog('alert', 'Alert', getlang('yandex_station_notyet'));
		}
	}
};

/**
	* Поочерёдное выполнение promise
	* @param {array} functions_array - Массив функций, возвращающих promise
	* @returns {promise}
	*/
function chain_promises(functions_array){
	var _d = $.Deferred();
	var chained_promise = _d.promise();
	for(var index in functions_array){
		chained_promise = _nest_promise(chained_promise, index);
	}

	var d = $.Deferred();
	var returns = [];

	chained_promise
	.done(function(data){
		returns.shift();
		returns.push(data);
		d.resolve(returns);
	});

	_d.resolve();

	return d.promise();

	function _nest_promise(promise, index){
		return promise.then(function(data){
			d.notify(((1 + parseInt(index))/functions_array.length).toFixed(2));
			returns.push(data);
			return functions_array[index]();
		});
	}
}

/**
	* Обёртка для jQ Deferred, которая всегда резолвится, но при реджекте внутреннего промиса резолвится объектом со свойством error
	* удобно использовать в $.when
	* @param {Deferred.promise} promise 
	* @returns {Deferred.promise}
	*/
function wrap_promise(promise){
	var d = $.Deferred();
	promise
	.done(function(data){
		d.resolve(data);
	})
	.fail(function(err){
		d.resolve({error: err});
	});
	return d.promise();
}

function get_file(url){
	var d = $.Deferred();
	var oReq = new XMLHttpRequest();
	oReq.open("GET", url, true);
	oReq.responseType = "arraybuffer";
	oReq.onload = function(oEvent) {
		d.resolve(oReq.response);
	};
	oReq.onerror = function(){s.reject();};
	oReq.send();
	return d.promise();
}
function _arrayBufferToBase64( buffer ) {
	var binary = '';
	var bytes = new Uint8Array( buffer );
	var len = bytes.byteLength;
	for (var i = 0; i < len; i++) {
		binary += String.fromCharCode( bytes[ i ] );
	}
	return 'data:image;base64,' + btoa(binary);
}
function humanize(size) {
	var units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
	var ord = Math.floor(Math.log(size) / Math.log(1024));
	ord = Math.min(Math.max(0, ord), units.length - 1);
	var s = Math.round((size / Math.pow(1024, ord)) * 100) / 100;
	return s + ' ' + units[ord];
}