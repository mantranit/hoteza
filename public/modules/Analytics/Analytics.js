(function () {
  window.Analytics = {
    deps: [],
    url: "https://aae0-58-187-184-107.ngrok-free.app/api/v1/analytics/",
    observer: null,
    timer: {
      channels: null,
      pages: null,
      sendingData: null,
    },
    duration: T_MIN,
    // отправка данных раз в 30 минут
    sendingDelay: T_MIN * 30,
    init: function () {
      // Analytics.collector = Analytics.collector();

      $(HotezaTV).one("final", function () {
        $(window).on("analytics", Analytics.listener);

        setTimeout(function () {
          Analytics.sendData();
        }, 11000);

        // if ('MutationObserver' in window) {
        // 	Analytics.observer = new MutationObserver(Analytics.collector);
        //
        // 	document.getElementById('tv_channellist').classList.add('analytics_channel_list');
        //
        // 	Analytics.observer.observe(document.documentElement, {
        // 		attributes: true,
        // 		characterData: true,
        // 		childList: true,
        // 		subtree: true,
        // 		attributeOldValue: true,
        // 		characterDataOldValue: true
        // 	});
        // }
        // else {
        // 	$(document.body).addClass('analytics');
        // 	document.addEventListener("webkitAnimationStart", Analytics.collector, false);
        // }
      });
    },
    send: function (type) {
      var data = getData(type);

      if (data.length) {
        $.post(Analytics.url + type + "/" + get_hotelId(), { data: data })
          .done(function () {
            log.add("Analytics: sent " + data.length + " " + type);
            switch (type) {
              case "pages":
                return storage.setItem("nav_stat", JSON.stringify({}));
              case "channels":
                return storage.setItem("ch_stat", JSON.stringify({}));
              case "notifications":
                return storage.setItem("notification_stat", JSON.stringify({}));
            }
          })
          .fail(function () {
            log.add("Analytics: failed to send " + data.length + " " + type);
          });
      } else {
        log.add("Analytics: " + type + " nothing to send");
      }

      function getData(type) {
        var stat,
          data = [];

        switch (type) {
          case "channels":
            stat = getStat("ch_stat");

            if (Object.keys(stat).length === 0) {
              return data;
            }

            for (var id in stat) {
              data.push({
                room: tv_room,
                name: id,
                duration: stat[id],
                date: formatDate(),
              });
            }

            break;

          case "pages":
            stat = getStat("nav_stat");

            if (Object.keys(stat).length === 0) {
              return data;
            }

            for (var id in stat) {
              data.push({
                room: tv_room,
                name: id,
                count: stat[id],
                date: formatDate(),
              });
            }

            break;

          case "notifications":
            stat = getStat("notification_stat");

            if (Object.keys(stat).length === 0) {
              return data;
            }

            for (var id in stat) {
              data.push({
                room: tv_room,
                name: id,
                show: stat[id].show,
                goal: stat[id].goal,
                close: stat[id].close,
                timeout: stat[id].timeout,
                date: formatDate(),
              });
            }

            break;
        }

        return data;

        function formatDate() {
          var date = time.date;
          return (
            date.getFullYear() +
            "-" +
            lz(date.getMonth() + 1) +
            "-" +
            lz(date.getDate())
          );
        }
      }
    },

    sendData: function () {
      clearTimeout(Analytics.timer.sendingData);

      Analytics.send("pages");
      Analytics.send("notifications");

      Analytics.timer.sendingData = setTimeout(
        Analytics.sendData,
        Analytics.sendingDelay
      );
    },

    /**
     * Deprecated
     * */
    collector: function () {
      return "MutationObserver" in window
        ? collectorForMutationObserver
        : collectorForAnimation;

      function collectorForMutationObserver(mutations) {
        for (var i = 0; i < mutations.length; i++) {
          var mutation = mutations[i];

          if (isContinue(mutation)) {
            continue;
          }

          clearTimeout(Analytics.timer["channels"]);
          Analytics.timer["channels"] = setTimeout(
            Analytics.statChannels.bind(null, "channels"),
            Analytics.duration
          );
        }

        function isContinue(mutation) {
          if (tv_cur_block !== "tv_channellist" && tv_cur_block !== "channel") {
            return true;
          }

          if (tv_channellist_type === "mosaic") {
            return (
              mutation.target.id !== "preview_channel_information" &&
              mutation.target.id !== "bottom_channel_information"
            );
          } else {
            return (
              typeof mutation.target.className !== "undefined" &&
              mutation.target.className.indexOf("analytics_channel_list") === -1
            );
          }
        }
      }
      function collectorForAnimation(event) {
        if (isContinue(event)) {
          return;
        }

        clearTimeout(Analytics.timer["channels"]);
        Analytics.timer["channels"] = setTimeout(
          Analytics.statChannels.bind(null, "channels"),
          Analytics.duration
        );

        function isContinue(event) {
          if (event.animationName !== "nodeInserted") {
            return true;
          }
          if (tv_cur_block !== "tv_channellist" && tv_cur_block !== "channel") {
            return true;
          }

          if (tv_channellist_type === "mosaic") {
            return event.target.className !== "preview_header";
          } else {
            return (
              event.target.id !== "tv_channellist" &&
              event.target.id !== "tv_fullscreen_overlay"
            );
          }
        }
      }
    },

    hitsPages: function (page) {
      if (
        !page ||
        typeof page === "undefined" ||
        page.indexOf("movie_page") !== -1 ||
        page.indexOf("VODcategory") !== -1
      ) {
        return false;
      }

      var stat = getStat("nav_stat");
      stat = incrementData(stat, page ? page : active_page_id, 1);

      storage.setItem("nav_stat", JSON.stringify(stat));
    },

    /**
     * @param type - [channels]
     * @param [id]
     * @param [duration]
     * */
    statChannels: checkEnv(function (id, duration) {
      id = typeof id !== "undefined" ? id : getChannels()[tv_cur_channel].id;
      duration =
        typeof duration !== "undefined" ? duration : Analytics.duration;

      var stat = getStat("ch_stat");
      stat = incrementData(stat, id, duration);

      storage.setItem("ch_stat", JSON.stringify(stat));

      Analytics.timer["channels"] = setTimeout(
        Analytics.statChannels.bind(null, "channels"),
        Analytics.duration
      );
    }),

    /**
     * @param {String} payload.target - id рекламной компании
     * @param {Number} payload.[show | goal] - show - кол-во показов
     *                                       - goal - кол-во переходов
     * */
    hitsNotifications: function (payload) {
      var stat = getStat("notification_stat");
      var notice = stat[payload.target] || {
        show: 0,
        goal: 0,
        close: 0,
        timeout: 0,
      };
      for (var key in payload) {
        if (key !== "target" && key !== "type") {
          notice[key] += payload[key];
        }
      }

      stat[payload.target] = notice;
      storage.setItem("notification_stat", JSON.stringify(stat));
    },

    listener: function (jQueryEvent, payload) {
      switch (payload.type) {
        case "hitPage":
          return Analytics.hitsPages(payload.target);

        case "hitNotification":
          return Analytics.hitsNotifications(payload);
      }
    },
  };
  function checkEnv(callback) {
    return function (type, id, duration) {
      if (
        type === "channels" &&
        tv_cur_block !== "tv_channellist" &&
        tv_cur_block !== "channel"
      ) {
        clearTimeout(Analytics.timer[type]);
        Analytics.timer[type] = null;
        return true;
      }

      callback(id, duration);
    };
  }
  function getStat(type) {
    var stat;
    try {
      stat = JSON.parse("" + storage.getItem(type)) || {};
    } catch (e) {
      stat = {};
    }

    return stat;
  }
  function incrementData(stat, id, qnt) {
    stat[id] = stat[id] ? stat[id] + qnt : qnt;
    return stat;
  }
})();
