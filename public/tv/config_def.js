var tv_daemon_url = "http://103.153.72.195:8080/api/v1/";
var tv_channellist_type = "mosaic"; // vertical, vertical_new, not_vertical(classic), mosaic
var tv_auth_function; // callback on auth

//off, on
var tv_key_source = "off";
var tv_key_menu = "off";

var config = {
  region: "eu", //['eu'(default), 'ru', 'cn', 'bn', 'local'] Вместо admin_url и т.д.
  use_ssl: true, //[true, false] потом 'auto'

  hotelId: 2,
  timezone: "Asia/Ho_Chi_Minh",
  defaults: { language: "en" },

  rcu_url: "http://103.153.72.195:8080/api/v1/",
  rcu_ac_temp_range: {
    min: 16,
    max: 32,
  },
  rcu: {
    periodical_check: true,
    batch_check: false,
    check_interval: 5000,
  },
  secret: "hoteza",
  modules: [
    "RADIO", // Радио станции
    "Wakeupcall", // установка будильника с красочными фонами и приятными мелодиями
    "ScandicWelcome", // Welcome экран в стиле Scandic
    "RemoteControl", // Управление ТВ из Hoteza App

    //		'VOD',				// Video on Demand (Native) рекомендовано
    //		'VODhtml5',			// VOD (HTML5)
    //		'AirStream',		// AirStream
    //		'Housekeeping',		// Housekeeping модуль, управление статусом комнат
    //		'MOD',				// Music on Demand
    //		'VerticalChannel',	// Новый вертикальный список каналов (simple) (при tv_channellist_type = vertical_new)

    // кастомные модули
    //		'UpdateInfoGorki',	// состояние трасс Горки Город
    //		'Sanatorium',		// расписание процедур Sanatorium
    //		'DoorEye',			// Реализация китайского глазка с переключением на AV
    //		'Peninsula_rs232',	// Приём команд от пультов Peninsula
  ],
  weather: {
    enabled: true,
    icon: true,
    plus: true,
  },
  express_checkout: false,
  production: false,
};

config["widgets"] = {
  weather: {
    // преднастройки
    // "С" - Celsius, or "F" - Fahrenheit
    valueTemperature: "C",
    // "Kmph" - km per hour, or Miles
    valueWind: "Kmph",
    // "fade" - затухание и появлени (использовать на старых телевизорах)
    // "rotate" - анимация повората по горизонтали (работает на новых телевизорах)
    howInterfaceSwitches: "fade",
  },
  wakeup: {
    welcome_text: "nice_day",
    tracks: [
      {
        title: "Inspiration_Morning",
        audio: "i/wakeup/audio/01.mp3",
        video: "i/wakeup/video/01.mp4",
        image: "i/wakeup/image/01.jpg",
      },
      {
        title: "Birds_in_a_Forest",
        audio: "i/wakeup/audio/02.mp3",
        video: "i/wakeup/video/02.mp4",
        image: "i/wakeup/image/02.jpg",
      },
      {
        title: "Morning_Touch",
        audio: "i/wakeup/audio/03.mp3",
        video: "i/wakeup/video/03.mp4",
        image: "i/wakeup/image/03.jpg",
      },
      {
        title: "Brand_New_Day",
        audio: "i/wakeup/audio/04.mp3",
        video: "i/wakeup/video/04.mp4",
        image: "i/wakeup/image/04.jpg",
      },
      {
        title: "Summer_Jump",
        audio: "i/wakeup/audio/05.mp3",
        video: "i/wakeup/video/05.mp4",
        image: "i/wakeup/image/05.jpg",
      },
    ],
  },
};

config["modules_settings"] = {
  CustomNotification: {
    newmessage: {
      text_length: {
        small: 83,
        big: 113,
      },
    },
    textMessage: {
      text_length: {
        small: 83,
        big: 113,
      },
    },
  },
};

config["animation"] = {
  spring: {
    used: true,
  },
};

config["menu"] = "scandic";
config["preload_images"] = 2; // false - без предзагрузки, 1 - параллельно, быстрее, но залипает; 2 - последовательно, медленнее, но визуальнее; 3 - в процессе навигации, существенно ускоряет старт ТВ
config["preload_threads"] = 3; // количество потоков предзагрузки. только для preload_images == 2;
config["error_reporting"] = true; // Отправка глобальных ошибок на сервер для отладки
config["shop"] = {
  lock_ordering: false,
  use_confirm_for_order: true,
};
config["time_picker"] = {
  minShift: null,
};
config["tv"] = {
  aspect_ratio: 6, // 6 - original  |  2 - 16:9  |  4 - zoom
  welcome_format: "{w}, {t} {l}",
  greeting_format: "{t} {l}",
  date_format: "dd.mm.yy",
  date_status_exist: true,
  parental_lock_status_exist: false,
  time_status_exist: true,
  wakeup_status_exist: true,
  channel_sorting: false,
  wakeup: {
    channel: 1,
    start_volume: 1,
    end_volume: 20,
  },
  start_volume: {
    enabled: false,
    volume: 10,
  },
  volume_control: "native",
  mosaic_clock: {
    enabled: false,
  },
  messages_listener: "longpoll", // longpoll для longpoll, poll для im по куям, ws для websocket, epmty для обычного запроса im
  vod: {
    enabled: false,
    categories_in_menu: false,
    use_pay: false,
    use_media_fragment_uri: true,
    confirm_by: "room", // room, pin, sum. default - room
    use_purchases: false,
  },

  welcome_screen: {
    //object {'channel': 2, 'volume': 10}
    enabled: true,
    always: true,
    channel: 0,
    volume: 10,
    useGroupsInWelcome: true,
  },
  parental_lock: false,
  sleep_timer: {
    //For custom timers add "data": [10,20,30] (mins)
    enabled: true,
  },
  checkin_action: "",
  checkout_action: "poweroff",
  allowed_apps: ["Tanks", "YouTube"],
  additional_apps: {}, //'youtube': ['app_id']
  external_devices: ["SOURCES", "MIRACAST", "USB"],
  allowed_sources: [
    ["HDMI", 0],
    ["HDMI", 1],
  ],
  roomcontrol: false,

  //true in production
  suppress_log: false,
  service_codes_lock: false,
  configure_hide: false,

  welcome_select_language: false,

  channels_languages_override: [], //Add or replace languages here
  channels_languages_order: ["locale"], //Reorder languages in channels filter. e.g. ['locale', 'en'] puts interface language first, English second, then the rest languages
  settings_languages_order: [], //Reorder languages on change language page. e.g. ['ar'] puts Arabic to first place

  allow_register_by_pin: false,

  tvids: ["not set", "Bedroom", "Living Room", "Bathroom"],
  hacks: {
    tv_registration_v2: false,
    tvip_handle_power_button: false,
    tvip_handle_cec: false,
    lg_magic_pixel: false,

    // добавлено для случая, когда звук транслируется сторонним устройством и громкостью управляет оно (приставка к ТВ, ТВ с саундбаром)
    volume_control_disable: false,
  },

  mouse_control: false,
  cursor_animation: false,
  reboot_in_standby: false, //Reboot instead of reload
};
