var feedback_answers = {};
function fb_a(q_num, q_opt){
	var opt, tmp, index;
	if(typeof(q_opt) == 'undefined'){
		//DEPRECATED!!!
		opt = $(event.target);
		var parent = opt.parent();
		if(!parent.hasClass('stars')){
			return false;
		}
		var q_id = parent.attr('id');
		parent.find('DIV').removeClass();
		
		index = opt.index()+1;
		if(feedback_answers[q_num] == index){
			index--;
		}
		if(index<3){
			tmp = 'red';
		}else{
			tmp = 'green';
		}
		feedback_answers[q_num] = index;
		parent.children('div:lt('+index+')').addClass(tmp);
	}else{
		if($('#fb_q_'+q_num+'.stars').length){
			opt = $('#fb_q_'+q_num);
			index = q_opt;
			if(feedback_answers[q_num] == index){
				index--;
			}
			if(index<3){
				tmp = 'red';
			}else{
				tmp = 'green';
			}
			feedback_answers[q_num] = index;
			opt.children().removeClass();

			opt.children('div:lt('+index+')').addClass('icons8-star-filled ' + tmp);
			opt.children('div:eq('+index+'), div:gt('+index+')').addClass('icons8-star');

		}
		else if ($('#fb_q_'+q_num+'.emoticons').length) {
			opt = $('#fb_q_'+q_num);
			index = q_opt;
			if(feedback_answers[q_num] == index){
				index--;
			}
			if(index<3){
				tmp = 'red';
			}else{
				tmp = 'green';
			}
			feedback_answers[q_num] = index;
			opt.children().removeClass();

			opt.children().addClass('star-non-choose');

			opt.children('div:eq('+(index-1)+')').removeClass('star-non-choose').addClass('star-choose');
			opt.children('div:lt('+index+')').addClass(tmp);
		}
		else if($('#fb_q_'+q_num+' .feedback_checkbox').length){
			opt = $('#fb_q_'+q_num+'_'+q_opt);
			if(typeof feedback_answers[q_num] != 'object'){
				feedback_answers[q_num] = {};
			}
			if(opt.hasClass('selected')){
				opt.removeClass('selected');
				delete feedback_answers[q_num][q_opt];
			}else{
				opt.addClass('selected');
				feedback_answers[q_num][q_opt] = 1;
			}
		}else if($('#fb_q_'+q_num+' .feedback_select').length){
			opt = $('#fb_q_'+q_num+'_'+q_opt);
			if(typeof feedback_answers[q_num] != 'object'){
				feedback_answers[q_num] = {};
			}

			$('#fb_q_'+q_num+' .feedback_select').removeClass('selected');
			opt.addClass('selected');
			feedback_answers[q_num] = {};
			feedback_answers[q_num][q_opt] = 1;

		}

	}
}
function feedback_send(){
	if (!require_auth() || !require_internet()) {
		return custom_alert('Check your network or authorization');
	}

	var request = {};
	var tmp = $('#feedback_form').attr('inquiryid');
	if(tmp){
		request.inquiryId = tmp;
		request.questions = feedback_answers;
		request.token = storage.getItem('token');
		$.post(
      "http://103.153.72.195:8080/api/v1/feedback",
      request,
      function (d) {
        if (typeof d == "object") {
          if (typeof d.result != "undefined") {
            switch (d.result) {
              case 0:
                manageFeedbackSending.hasShowed();

                //блокировка формы для этого токена
                custom_dialog("success", "", getlang("feedback_sent"));
                break;
              case 1:
                custom_alert("Incorrect request");
                break;
              case 2:
                console.log("Incorrect token");
                //custom_alert('Incorrect auth token');
                break;
              case 3:
                //checkout
                console.log("guest checkout");
                break;
              case 4:
                console.log("guest canceled");
                break;
              case 5:
                custom_alert(getlang("feedback_invalidfeedback"));
                break;
              case 6:
                custom_alert("Incorrect Answers");
                break;
              case 7:
                custom_alert(getlang("feedback_alreadyanswered"));
                break;
              case 9:
                //custom_alert('Server error');
                break;

              default:
                custom_alert("FB: Server error " + d.result);
                break;
            }
          } else {
            //custom_alert('OMG! Request Error 57');
            //Объект да не тот
          }
        } else {
          //custom_alert('OMG! Error 37');
          //Полный ахтунг: пришёл не объект а чёрти-что
        }
      },
      "json"
    ).fail(function (e) {
      //custom_alert('OMG! Request failure');
      //console.log(e);
    });

	}else{
		l('Unknown Questionnairy ID');
	}
}

function manageFeedbackSending() {
	if (!isset('structv2.feedback')) {
		log.add('FEEDBACK: is not exist');
		return false;
	}

	var token = check_auth();
	if (!token) {
		log.add('FEEDBACK: token is not exist');
		return false;
	}

	var userData = load_data();
	if (typeof userData.isFeedbackSent === 'undefined') {
		return getServerCommandsAsync({
			payload: {
				token: token
			}
		})
			.done(function (payload) {

				var cmd = getCommandFromList('feedback', payload);
				if (cmd && cmd.data.showAlert) {
					manageFeedbackSending.pleaseRespond();
				}

			})
			.fail(function () {
				log.add('FEEDBACK: something with network');
				// manageFeedbackSending.pleaseRespond();
			});
	}

	if (!userData.isFeedbackSent) {
		manageFeedbackSending.showIndicator();
	}
}

manageFeedbackSending.showAlertFuncName = 'manageFeedbackSending.showAlert();';
manageFeedbackSending.pleaseRespond = function () {
	manageFeedbackSending.showIndicator();

	var menu = document.getElementById('menu'),
		attr = menu.getAttribute('onopen');

	// если событие уже навешено
	if (attr && attr.indexOf(manageFeedbackSending.showAlertFuncName) !== -1) {
		return false;
	}

	menu.setAttribute(
		'onopen',
		attr ? manageFeedbackSending.showAlertFuncName + attr : manageFeedbackSending.showAlertFuncName
	);
};

manageFeedbackSending.showAlert = function () {
	custom_confirm({
		title: isset('structv2.feedback.title') ?
			isset('structv2.feedback.title') : getlang('mobileAppContent-mainMenuPage-label-feedback'),
		text: isset('structv2.feedback.text') ?
			isset('structv2.feedback.title') : getlang('feedback_dialog_desc'),

		confirm: getlang('go_to_feedback'),
		cancel: null,

		onConfirm: navigate.bind(null, '#feedback')
	});

	manageFeedbackSending.setFeedbackValue(false);

	var menu = document.getElementById('menu'),
		attr = menu.getAttribute('onopen');

	attr = attr.replace(manageFeedbackSending.showAlertFuncName, '');
	if (attr) {
		menu.setAttribute('onopen', attr);
	}
	else {
		menu.removeAttribute('onopen');
	}
};

manageFeedbackSending.showIndicator = function () {
	var indicator = document.getElementById('feedback_indicator');
	if (!indicator) {
		return false;
	}

	indicator.style.display = 'block';
};

manageFeedbackSending.hideIndicator = function () {
	var indicator = document.getElementById('feedback_indicator');
	if (!indicator) {
		return false;
	}

	indicator.style.display = 'none';
};

manageFeedbackSending.hasShowed = function () {
	manageFeedbackSending.setFeedbackValue(true);
	manageFeedbackSending.hideIndicator();
};

manageFeedbackSending.setFeedbackValue = function (value) {
	var userData = load_data();
	userData.isFeedbackSent = value;
	save_data(userData);
};
