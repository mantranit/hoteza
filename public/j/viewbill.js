function viewbill(){

	//построение. один раз. кнопка "назад" зависит от страницы с которой вызывается viewbill() первый раз
	if(!$id('viewbill')){
		var viewbill_object = {
			title: getlang('bill_page')
		};
		if(tv_cur_block == 'menu'){
			viewbill_object.backBtn = 0;
			viewbill_object.parentId = '';
		}else{
			viewbill_object.backBtn = 1;
			viewbill_object.parentId = active_page_id;
		}
		renderPageOnTheStructv2('viewbill', viewbill_object, 'viewbill');
	}

	$('#viewbill .button_wrap').remove();
	$('#viewbill_scroll').remove();

	navigate('#viewbill', 'now');

	if(require_auth()){
		$('#viewbill').find('.content').html('<p style="text-align:center;">' + getlang('bill_requesting') + '</p>');

		var response = false;
		var request = {};
		request.token = require_auth();
		var tmp = '<table style="width:100%;font-size:14px;padding: 0 30px 0 20px;">';
		$.ajax({
      type: "POST",
      url: "http://103.153.72.195:8080/api/v1/viewbill",
      data: request,
      timeout: 30000,
      success: function (d) {
        if (typeof d == "object") {
          if (typeof d.result != "undefined") {
            switch (d.result) {
              case 0:
                response = true;

                tmp +=
                  '<tr style="font-weight:bold;border-bottom:1px solid #4E4945;line-height: 20px;">' +
                  '<td style="width:100%;padding:10px 0px;">' +
                  getlang("tv_room") +
                  tv_room +
                  " " +
                  Guest.guestSurname +
                  '<span style="float:right;">' +
                  getlang("bill_total") +
                  ":&nbsp;</span>" +
                  "</td>" +
                  '<td style="white-space: nowrap;padding:10px 0px;vertical-align:bottom;">' +
                  accounting.formatMoney(d.total / 100, currency_format) +
                  "</td>" +
                  "</tr>";

                var old_date;
                for (var i = d.billItems.length - 1; i >= 0; i--) {
                  var billItem = d.billItems[i];

                  var tmp_date = new Date(
                    parseInt(billItem.itemTimestamp) * 1000
                  );
                  var new_date =
                    tmp_date.getYear() +
                    "/" +
                    tmp_date.getUTCMonth() +
                    "/" +
                    tmp_date.getUTCDay();
                  if (old_date != new_date) {
                    //Взято из messages_add_date
                    tmp +=
                      "<tr>" +
                      '<td style="padding:10px 0;border-top:1px solid #302D26;">' +
                      moment(tmp_date).utc().format("LL") +
                      "</td>" +
                      '<td style="border-top:1px solid #302D26;"></td>' +
                      "</tr>";
                    old_date = new_date;
                  }

                  tmp +=
                    "<tr>" +
                    '<td style="padding:10px 20px;color:#999999;">' +
                    tmp_date.getUTCHours() +
                    ":" +
                    lz(tmp_date.getUTCMinutes()) +
                    "&nbsp;&nbsp;" +
                    billItem.itemDescription +
                    "</td>" +
                    '<td style="white-space: nowrap;">' +
                    accounting.formatMoney(
                      billItem.itemAmount / 100,
                      currency_format
                    ) +
                    "</td>" +
                    "</tr>";
                }

                break;

              case 3:
                tmp =
                  '<p style="text-align:center;">' +
                  getlang("bill_checkedout") +
                  "</p>";
                break;

              default:
                log.add(
                  "Viewbill error: " +
                    d.result +
                    " (" +
                    (d.message || "no message") +
                    ")"
                );
                tmp =
                  '<p style="text-align:center;">' +
                  getlang("bill_error") +
                  " (" +
                  d.result +
                  ")</p>";
                break;
            }
          } else {
            tmp = '<h1 style="text-align:center;">Server error (1)</h1>';
            log.add("Viewbill error: Result undefined");
          }
        } else {
          tmp = '<h1 style="text-align:center;">Server error (2)</h1>';
          log.add("Viewbill error: Server returned non-object");
        }

        tmp += "</table>";

        $("#viewbill")
          .find(".content")
          .html("<div>" + tmp + "</div>");

        set_button(d.total);

        navigate("#viewbill");
        make_scroll($("#viewbill"));
      },
      dataType: "json",
    }).fail(function (err) {
      $("#viewbill")
        .find(".content")
        .html('<p style="text-align:center;">Server error (3)</p>');
      log.add(
        "Viewbill error: Request failed (" +
          err.status +
          "|" +
          err.statusText +
          ")"
      );
    });
	}
	else {
		$('#viewbill').find('.content').html('<p style="text-align:center;">' + getlang('bill_loginreq') + '</p>');
	}

	function set_button(sum) {
		if (response && isset('config.express_checkout')) {
			var button =
				'<div class="button_wrap">' +
					'<div class="button" onvclick="express_checkout(\''+ sum +'\')">' +
						getlang('viewbill_pay') +
					'</div>' +
				'</div>';

			$('#viewbill').find('.content_wrapper').after(button);
		}
	}
}

function express_checkout(total){
	total = total|0;

	if(require_auth()){
		Loader.start();

		var request = {
			total: total,
			token: require_auth()
		};

		$.ajax({
			type: "POST",
			url: api_url+'remoteCheckout',
			data: request,
			timeout: 30000,
			success: function(data){
				Loader.stop();

				if (typeof(data) == 'object') {
					if (typeof(data.result) != 'undefined') {

						switch(data.result){
							case 0:
								check_status(data.status);
								l(data);

								break;

							case 1:
								custom_alert(getlang('express_checkout_failed'));
								log.add('CHECKOUT: bad request, status 1');
								break;

							case 2:
								custom_alert(getlang('express_checkout_failed'));
								log.add('CHECKOUT: token error, status 2');
								break;

							case 3:
								custom_alert(getlang('express_checkout_failed'));
								log.add('CHECKOUT: guest checkout, status 3');
								break;

							case 4:
								custom_alert(getlang('express_checkout_failed'));
								log.add('CHECKOUT: guest canceled, status 4');
								break;

							case 5:
								custom_alert(getlang('express_checkout_failed'));
								log.add('CHECKOUT: connection problem, status 5');
								break;

							default:
								custom_alert(getlang('express_checkout_failed'));
								log.add('CHECKOUT: unknown response status ' + data.result);
								break;
						}
					}
					else {
						custom_alert('Checkout request failed');
						log.add('CHECKOUT: request failed, bad response in object');
					}
				}
				else {
					custom_alert('Checkout request failed');
					log.add('CHECKOUT: request failed, bad response');

				}

			},
			dataType: 'json'
		}).fail(function(err, msg1, msg2){
			Loader.stop();
			custom_alert('Checkout request failed');
			log.add('CHECKOUT: request failed ' + err.status + '|' + err.statusText);
		});
	}
	else {
		custom_alert('Authorization required for this action');
	}

	function check_status(status) {
		var message;

		switch(status) {
			case 0: // success
				message = getlang('express_checkout_success');
				break;

			case 1: // Balance mismatch
				message = getlang('express_checkout_failed');
 				log.add('EXPRESS_CHECKOUT failed: Balance mismatch');
				break;

			case 2: // Check-out date is not today
				message = getlang('express_checkout_failed');
				log.add('EXPRESS_CHECKOUT failed: Check-out date is not today');
				break;

			case 3: // Feature not enabled or Check-out process not running
				message = getlang('express_checkout_failed');
				log.add('EXPRESS_CHECKOUT failed: Feature not enabled or Check-out process not running');
				break;

			case 4: // Guest not found
				message = getlang('express_checkout_failed');
				log.add('EXPRESS_CHECKOUT failed: Guest not found');
				break;

			case 5: // Retry
				message = getlang('express_checkout_retry');
				log.add('EXPRESS_CHECKOUT failed: Retry');
				break;

			case 9: // Unprocessable request, this request cannot be carried out, no retry
				message = getlang('express_checkout_failed');
				log.add('EXPRESS_CHECKOUT failed: Unprocessable request, this request cannot be carried out, no retry');
				break;

			default:
				message = getlang('express_checkout_failed');
				log.add('EXPRESS_CHECKOUT failed: unknown response code - ' + status);
				break;
		}

		custom_alert(message);
	}

}
