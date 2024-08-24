var tv_daemon_url = "http://10.88.0.1:8080/";
var tv_channellist_type = "mosaic"; // vertical, not_vertical, mosaic
var tv_auth_function; // callback on auth
var tv_weather_enabled = true;
var tv_weather_icon_enabled = true;

//off, on
var tv_key_mute = "on";
var tv_key_source = "off";
var tv_key_menu = "off";

var config = {
  //        'admin_url': 'http://admin.hoteza.com/',
  //        'static_url': 'https://static.hoteza.com/',
  //        'queue_url': 'http://queue.hoteza.com/',
  //        'remotedebug_url': 'http://weinre.hoteza.com/',

  region: "eu",
  use_ssl: true,

  rcu_url: "https://rcudemo.hoteza.com/",
  rcu_ac_temp_range: {
    min: 16,
    max: 32,
  },
  modules: [
    "RemoteControl",
    "RADIO",
    "MOD",
    "Housekeeping",
    "Wakeupcall",
    "VOD",
    "ScandicWelcome",
  ],
};

config["desktop"] = {
  channellist: "channellist/new.json",
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
    howInterfaceSwitches: "rotate",
  },
};

var tv_channels_languages_def = [
  { en: { transcription: "English", image: "i/flag/United-Kingdom.png" } },
  { ru: { transcription: "Русский", image: "i/flag/Russia.png" } },
  { zh: { transcription: "汉语", image: "i/flag/China.png" } },
  { ar: { transcription: "العربية", image: "i/flag/_Arabic.png" } },
  { de: { transcription: "Deutsch", image: "i/flag/Germany.png" } },
  { es: { transcription: "Español", image: "i/flag/Spain.png" } },
  { fr: { transcription: "Français", image: "i/flag/France.png" } },
  { tr: { transcription: "Türkçe", image: "i/flag/Turkey.png" } },
  { it: { transcription: "Italiano", image: "i/flag/Italy.png" } },
  { pt: { transcription: "Português", image: "i/flag/Portugal.png" } },
  { ja: { transcription: "日本の", image: "i/flag/Japan.png" } },
  { fa: { transcription: "فارسی", image: "i/flag/_Arabic.png" } },
  { ko: { transcription: "한국의", image: "i/flag/South-Korea.png" } },
  { vi: { transcription: "Tiếng Việt", image: "i/flag/Vietnam.png" } },
];

config["hotelId"] = 277;
config["timezone"] = "HCMC";
config["defaults"] = {
  language: "en",
};

config["menu"] = "scandic";
config["preload_images"] = 2; // false - без предзагрузки, 1 - параллельно, быстрее, но залипает; 2 - последовательно, медленнее, но визуальнее;
config["preload_threads"] = 3; // количество потоков предзагрузки. только для preload_images == 2;
config["error_reporting"] = true; // Отправка глобальных ошибок на сервер для отладки
config["tv"] = {
  external_devices: ["SOURCES", "MIRACAST", "USB", "AIRSTREAM", "BLUETOOTH"],
  wakeup: {
    channel: 1,
    start_volume: 1,
    end_volume: 20,
  },
  messages_listener: "queue_poll", // epmty для обычного запроса im, queue_poll для im по куям, queue_longpoll для longpoll, queue_ws для websocket
  virtual_standby: false,
  vod: {
    enabled: true,
    categories_in_menu: false,
    use_pay: false,
    use_media_fragment_uri: true,
    confirm_by: "room", // room, pin, sum. default - room
  },
  welcome_screen: {
    //object {'channel': 2, 'volume': 10}
    enabled: true,
    mediaType: "video",
    video: "http://localhost:8080/video/HITEC_Scandic_Video_No_Sound.mp4",
    // mediaType: "image",
    // image: "images/0_Sea View Villa 2 - Salinda Resort - Phu Quoc_HD.jpg",
    always: true,
    channel: 0,
    volume: 10,
  },
  parental_lock: true,
  wakeup_status_exist: true,
  channel_sorting: false,
  sleep_timer: {
    enabled: true,
    data: [
      {
        item: "Off",
        itemName: false,
        onvclick: "sleep_timer.off()",
      },
      {
        item: 30,
        itemName: true,
        onvclick: "sleep_timer.set(1800000)",
      },
      {
        item: 60,
        itemName: true,
        onvclick: "sleep_timer.set(3600000)",
      },
      {
        item: 90,
        itemName: true,
        onvclick: "sleep_timer.set(5400000)",
      },
      {
        item: 120,
        itemName: true,
        onvclick: "sleep_timer.set(7200000)",
      },
      {
        item: 150,
        itemName: true,
        onvclick: "sleep_timer.set(9000000)",
      },
      {
        item: 180,
        itemName: true,
        onvclick: "sleep_timer.set(10800000)",
      },
    ],
  },
  allowed_apps: ["Tanks", "YouTube"],
  allowed_sources: [
    ["HDMI", 0],
    ["HDMI", 1],
  ],
  extra_menu: {
    items: [
      { title: "TV", icon8: "icons8-tv", onvclick: "tv_mode()" },
      { title: "Settings", icon8: "icons8-settings", href: "#settings" },
    ],
    layout: [
      [7, 1, 2, 2],
      [7, 3, 2, 2],
    ],
  },
  roomcontrol: true,
  suppress_log: false,
  welcome_select_language: true,
  /**
   * Управление функциями MAG'a. Когда значение отсутствует MAG работает в режиме true
   * @value string MAG хак применяемый в приставках MAG
   * @param bool - true работает VIDEO, VOD и MOSAIC, false не работает
   */
  hacks: {
    tv_registration_v2: true,
    MAG: true,
  },
};
