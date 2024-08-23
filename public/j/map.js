var guide_map;
var googleMapsAPIKey = "AIzaSyDOj_kAW1ORdRbDZaBT--eJtgBZ1NhSX-k";
function map_init(only_js) {
  if ($("#guide_map").length) {
    if (check_internet()) {
      if (!$("#google_maps_script").length) {
        $("#guide_map").html(
          '<div style="text-align:center;padding-top:20px;">Loading Google Maps</div>'
        );
        //Включение Google карт
        var script = document.createElement("script");
        script.id = "google_maps_script";
        script.type = "text/javascript";
        if (only_js) {
          script.src =
            "https://maps.googleapis.com/maps/api/js?key=" +
            googleMapsAPIKey +
            "&callback=map_preinitialize&language=" +
            get_language();
        } else {
          script.src =
            "https://maps.googleapis.com/maps/api/js?key=" +
            googleMapsAPIKey +
            "&callback=map_initialize&language=" +
            get_language();
        }
        $(document.body).append(script);
      } else if (typeof google != "undefined") {
        map_initialize();
      } else {
        $("#google_maps_script").remove();
        map_init();
      }
    } else {
      $("#guide_map").html(
        '<div style="text-align:center;padding-top:20px;">Internet Connection required<br/><div class="button" onvclick="map_init()">Retry</div></div>'
      );
    }
  }
}

function map_preinitialize() {}
function map_initialize() {
  if (typeof google == "undefined" || typeof google.maps == "undefined") {
    map_init();
    return false;
  }
  var mapOptions = {
    zoom: 14,
    maxZoom: 16,
    center: new google.maps.LatLng(
      structv2.guide.hotel_position.lat,
      structv2.guide.hotel_position.lng
    ),
    disableDefaultUI: true,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    zoomControl: false,
    streetViewControl: false,
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
      },
    ],
  };
  guide_map = new google.maps.Map(
    document.getElementById("guide_map"),
    mapOptions
  );
  //map_fix();
  if (!$("#guide.active_page").length) {
    $("#guide").hide();
  }
  map_show_hotel();
}

function map_fix() {
  if (!$('.fixed[href^="http://www.google.com/"]').length) {
    $('[href^="http://www.google.com/"]').hide().addClass("fixed");
    log.add("map fixxing...");
    setTimeout(map_fix, 500);
  } else {
    log.add("map fixed.");
  }
}

var guide_map_points = Array();
var infowindow;
function map_show_group(group) {
  if (typeof google == "undefined") {
    map_init();
  } else {
    if (!guide_map) {
      map_initialize();
    } else {
      if (typeof guide == "object") {
        if (typeof guide[group] == "object") {
          map_remove_points();
          $("#guide .guide_icon.active_group").removeClass("active_group");

          if (guide[group].length) {
            var latlngbounds = new google.maps.LatLngBounds();

            latlngbounds.extend(
              new google.maps.LatLng(
                structv2.guide.hotel_position.lat,
                structv2.guide.hotel_position.lng
              )
            );

            var icon = new google.maps.MarkerImage(
              "i/map_marker.png",
              new google.maps.Size(23, 32),
              new google.maps.Point(0, 0),
              new google.maps.Point(13, 32),
              new google.maps.Size(23, 32)
            );

            $(guide[group]).each(function () {
              var marker = new google.maps.Marker({
                icon: icon,
                position: new google.maps.LatLng(this[1], this[2]),
                map: guide_map,
                title: this[0],
              });
              guide_map_points.push(marker);
              var title = this[0];
              var descr = this[3] || "";
              //descr = descr.replace(/<a url="(.+)">/ig, '<a onclick="go_ext(\'$1\');">');
              var link = "";
              if (this[4]) {
                link =
                  '<p><a class="map_info_sign" onclick="navigate(\'' +
                  this[4] +
                  "');\">More information</a></p>";
              }
              google.maps.event.addListener(marker, "click", function () {
                if (infowindow) {
                  infowindow.close();
                }
                if (guide_map.getZoom() < 14) {
                  guide_map.setZoom(14);
                  guide_map.setCenter(this.getPosition());
                }

                //ссылка на построение маршрута до объекта
                var route = "";
                if (false) {
                  route =
                    '<a onclick="map_show_route(new google.maps.LatLng' +
                    this.getPosition() +
                    ');">route</a>';
                }

                infowindow = new google.maps.InfoWindow({
                  pixelOffset: new google.maps.Size(-1, 10),
                  content:
                    '<div class="guide_infowindow"><span>' +
                    title +
                    "</span><p>" +
                    descr +
                    "</p>" +
                    route +
                    link +
                    "</div>",
                  maxWidth: 220,
                });
                infowindow.open(guide_map, marker);
              });
              latlngbounds.extend(new google.maps.LatLng(this[1], this[2]));
            });
            guide_map.fitBounds(latlngbounds);
          }
          //$('#guide .guide_icon.'+group).addClass('active_group');

          $("#guide_group_" + group).addClass("active_group");
        } else {
          custom_alert("not a map points");
        }
      }
    }
  }
}

function map_remove_points() {
  if (guide_map_points.length) {
    $(guide_map_points).each(function () {
      this.setMap(null);
    });
    guide_map_points.length = 0;
  }
}

function map_show_me(cb) {
  if (typeof google == "undefined") {
    map_init();
  } else {
    if (!guide_map) {
      map_initialize();
    } else {
      $("#map_show_my_pos").addClass("inactive");
      setTimeout(function () {
        if (!cb) {
          navigator.geolocation.getCurrentPosition(_map_show_me, map_error, {
            timeout: 10000,
            enableHighAccuracy: true,
          });
        } else {
          navigator.geolocation.getCurrentPosition(
            function (coords) {
              _map_show_me(coords);
              cb();
            },
            map_error,
            { timeout: 10000, enableHighAccuracy: true }
          );
        }
      }, 300);
    }
  }
}

var map_my_pos;
var map_hotel;
function _map_show_me(geopos) {
  if (map_my_pos) {
    map_my_pos.setMap(null);
    map_my_pos = null;
  }
  var tmp_pos = new google.maps.LatLng(
    geopos.coords.latitude,
    geopos.coords.longitude
  );
  map_my_pos = new google.maps.Marker({
    icon: "i/map_my_pos.png",
    position: tmp_pos,
    map: guide_map,
    title: "Your position",
  });
  if (guide_map.getZoom() < 14) {
    guide_map.setZoom(14);
  }
  guide_map.panTo(tmp_pos);
  $("#map_show_my_pos").removeClass("inactive error");
}

function map_error(e) {
  if (e.code == 3) {
    $("#map_show_my_pos").addClass("error");
  } else {
    custom_alert("error: " + e.message + "(" + e.code + ")");
  }
  $("#map_show_my_pos").removeClass("inactive");
}

function map_show_hotel() {
  if (typeof google == "undefined") {
    map_init();
  } else {
    if (!guide_map) {
      map_initialize();
    } else {
      var tmp_pos = new google.maps.LatLng(
        structv2.guide.hotel_position.lat,
        structv2.guide.hotel_position.lng
      );
      if (!map_hotel) {
        map_hotel = new google.maps.Marker({
          icon: "i/map_hotel.png",
          position: tmp_pos,
          map: guide_map,
          title: "Resort position",
        });
        google.maps.event.addListener(map_hotel, "click", function () {
          if (infowindow) {
            infowindow.close();
          }
          if (guide_map.getZoom() < 14) {
            guide_map.setZoom(14);
            guide_map.setCenter(this.getPosition());
          }

          //ссылка на построение маршрута до отеля
          route =
            '<a onclick="map_show_route(new google.maps.LatLng' +
            this.getPosition() +
            ');">route</a>';

          infowindow = new google.maps.InfoWindow({
            pixelOffset: new google.maps.Size(-1, 10),
            content:
              '<div class="guide_infowindow"><span>' +
              structv2.guide.hotel_name +
              "</span><p></p>" +
              route +
              "</div>",
            maxWidth: 220,
          });
          infowindow.open(guide_map, map_hotel);
        });
      }
      if (guide_map.getZoom() < 14) {
        guide_map.setZoom(14);
      }
      guide_map.panTo(tmp_pos);
    }
  }
}

var directionsDisplay;
var directionsService;
function map_show_route(coords) {
  if (!directionsDisplay) {
    directionsDisplay = new google.maps.DirectionsRenderer();
    directionsDisplay.setMap(guide_map);
  }
  if (!directionsService) {
    directionsService = new google.maps.DirectionsService();
  }
  if (map_my_pos) {
    //		console.log(map_my_pos.getPosition());
    //		console.log(coords);
    var request = {
      origin: map_my_pos.getPosition(),
      destination: coords,
      travelMode: google.maps.DirectionsTravelMode.WALKING,
    };
    directionsService.route(request, function (response, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        infowindow.close();
        directionsDisplay.setDirections(response);
      }
    });
  } else {
    //custom_alert('my_pos is unknown');
    map_show_me(function () {
      map_show_route(coords);
    });
  }
}
