/**
 * Global JavaScript variables
 */

var routeFromStartToBusStopInfo = {
	destLatLng: [0,0],
	totalDistance: Number.MAX_VALUE,
	distanceLeft: 0
}
var routeFromEndToBusStopInfo = {
	destLatLng: [0,0],
	totalDistance: Number.MAX_VALUE,
	distanceLeft: 0
}
var busses = MVC.List();
var busStops = MVC.List();
var foundAddresses = MVC.List();
var currentLocationMarker;
var homeAddressMarker;
var destAddressMarker;
var canLocatePerson = true;
var router;
var line1;
var line2;
var center;
var map;

/**
 * Initialize Leaflet Map
 */

//Tórshavn city center
center = new L.LatLng(62.01412, -6.77753);

map = L.map('map', {
	minZoom: 13,
	maxZoom: 19/*,
	maxBounds: [
		//south west
	    [61.98486353139726, -6.839590072631835],
	    //north east
	    [62.0470263884128, -6.7221736907958975]
    ]*/
}).setView(center, 15);

L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '<a href="http://bnji.github.com">Benjamin Hammer</a> | <a href="http://citypulse.torshavn.fo">Citypulse</a>',
	/*attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
		'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
		'Imagery © <a href="http://mapbox.com">Mapbox</a>',*/
	id: 'examples.map-i86knfo3'
}).addTo(map);

/**
 * Leaflet Map Events
 */

map.on('locationfound', function(data) {
	var lat = data['latitude'];
	var lng = data['longitude'];
	console.log("Lat: " + lat + ", Lng: " + lng);
	locatePerson(lat, lng);

	if(currentLocationMarker !== undefined) {
		currentLocationMarker.setLatLng(getLatLng(lat, lng));
		currentLocationMarker.setPopupContent(getLocatePersonPopupContent());
	}
	setTimeout(function() {
		map.locate({
			setView : false,
			maxZoom : 17
		});
	}, 1000);
});

/*map.on('popupopen', function(e) {
  var marker = e;
  console.log(marker);
});*/

//map.on('click', onMapClick);

/*map.on('click', function(e) {
    waypoints.push({latLng: e.latlng});
    if (waypoints.length >= 2) {
        router.route(waypoints, function(err, routes) {
            if (line) {
                map.removeLayer(line);
            }

            if (err) {
                alert(err);
            } else {
                line = L.Routing.line(routes[0]).addTo(map);
            }
        });
    }
});*/

/*L.Routing.osrm({
    waypoints: [
        L.latLng(62.01574938688206, -6.787834167480469),
        L.latLng(62.013030754675505, -6.78455114364624)
    ]
}).addTo(map);*/

/**
 * Device specific events
 */

if (window.DeviceOrientationEvent) {
	// Listen for the event and handle DeviceOrientationEvent object
		window.addEventListener('deviceorientation', function(eventData) {
	    // gamma is the left-to-right tilt in degrees, where right is positive
	    var tiltLR = eventData.gamma;

	    // beta is the front-to-back tilt in degrees, where front is positive
	    var tiltFB = eventData.beta;

	    // alpha is the compass direction the device is facing in degrees
	    var dir = eventData.alpha

	    // call our orientation event handler
	    //deviceOrientationHandler(tiltLR, tiltFB, dir);
	    console.log(dir);
	    //console.log(homeAddressMarker);
			//var img = homeAddressMarker['_icon'];
			//console.log(img);
			if(currentLocationMarker !== undefined) {
				//homeAddressMarker.foobar();
				console.log(currentLocationMarker);
				currentLocationMarker.rotate(-(dir+180));
				//console.log(homeAddressMarker['marker']);
				//$(homeAddressMarker['_icon']).css('-webit-transform','rotate(90deg)')
				//homeAddressMarker['marker'].setIconAngle(dir);
			}
			//$(img).rotate(dir);
	  }, false);
}

/**
 * jQuery code to execute when DOM is ready
 */
$(function() {
	$('#map').hide();

	init(function(result) {
		router = L.Routing.osrm()

		$.getJSON('assets/data/busroutes.json', function(json) {
			$.each(json, function(k,v) {
				$('#selectBusLine').append($('<option />').val(v['key']).text(v['val']));
			});
		});

		if(result) {
			$('body').removeClass('background-image');
			loadBusStops(function() {
				//$('#nodata').hide();
				$('#menu').show();
				$('#map').show();
				update();

				setTimeout(function() {
					var busColor = Store.get("busColor");
					var showBusStops = Boolean(Store.get("showBusStops"));
					// Update UI with bus color
					if(busColor !== null) {
						changeBusLine(busColor);
						$('#selectBusLine').val(busColor);
					}
					if(showBusStops !== null) {
						toggleBusStops(showBusStops, busColor);
						$('#showBusStops').prop('checked', showBusStops);
					}
				}, 1000);
			});
		}
		else {
			$('#nodata').show();
			//$('#map').show();
		}
	});

	/**
	 * jQuery Events
	 */

	$('#selectBusLine').change(function() {
		console.log("#selectBusLine changed");
		var busColor = this.value;
		changeBusLine(busColor);
		Store.save("busColor", busColor);
		console.log(Store.get("busColor"));
		toggleBusStops($('#showBusStops').prop('checked'), $('#selectBusLine option:selected').val());
	});

	$('#showBusStops').click(function() {
		toggleBusStops($(this).prop('checked'), $('#selectBusLine option:selected').val());
	});

	$('#findMe').click(function() {
		findMe();
	});

	$('#destinationOptions').change(function() {
		locateDestination($(this).val());
		$(this).hide();
	});

	$('#destinationAddress').keydown(function(e) {
		var keyCode = e.keyCode;
		//console.log(e);
		if(e.keyCode === 13) {
			console.log(foundAddresses.Clear());
			var address = $(this).val();
			//console.log(address);
			geoLookup(address, function(json) {
				console.log("Length: " + json.length);
				if(json.length === 1) {
					$('#destinationOptions').hide();
					//console.log(json[0]);
					foundAddresses.Add(json[0]);
					locateDestination(0);
				}
				else {
					$('#destinationOptions').empty().show();
					$('#destinationOptions').append($('<option />').val('-1').text('Choose an address...'));
					$.each(json, function(k,v) {
						foundAddresses.Add(v);
						$('#destinationOptions').append($('<option />').val(k).text(v['display_name']));
						//console.log(json);
					});
				}
			});
			e.preventDefault();
		}
	});
}); // End of jQuery 'onDocumentReady' function

/**
 * JavaScript functions
 */

function onMapClick(e) {
	console.log(e.latlng);
}

function locateDestination(selectedId) {
	var jsonData = foundAddresses.Get(parseInt(selectedId));
	var lat = parseFloat(jsonData['lat']);
	var lng = parseFloat(jsonData['lon']);
	var latLngFrom = getLatLng(lat, lng);

	//console.log(latLngFrom);
	var address = jsonData['display_name']; // country, country_code, house_number, postcode, road, state, town
	console.log(jsonData);

	var closestBusStop;
	//var shortestDistanceFound = Number.MAX_VALUE;
	// busStop: [color, data: [id, info:[bus:[]], isStation, lat, lng, name, prevStationId, sms], marker: [..], number]
	$.each(busStops, function(k,v) {
		var latLng = getLatLng(v['data']['lat'], v['data']['lng']);
		var distance = latLngFrom.distanceTo(latLng);
		if(distance < routeFromEndToBusStopInfo['totalDistance']) {
			routeFromEndToBusStopInfo['totalDistance'] = distance;
			closestBusStop = v;
			routeFromEndToBusStopInfo['destLatLng'] = latLng;
		}
	});
	console.log(closestBusStop);
	console.log("Shortest distance: " + routeFromEndToBusStopInfo['totalDistance'] + ", bus stop name: " + closestBusStop['data']['name']);
	//console.log(closestBusStop);

	removeMarker(destAddressMarker);
	destAddressMarker = addMarker(latLngFrom,
								  0,
								  "<b>"+address+"</b>",
								  //"<b>" + address['road'] + "</b><br />" + address['postcode'] + " " + address['town'],
								  'assets/icons/house/1.png',
								  [32, 37]);

	removeRoute(line2);
	line2 = createRoute([latLngFrom, routeFromEndToBusStopInfo['destLatLng']]);
}

function locatePerson(lat, lng) {
	if(canLocatePerson) {
		canLocatePerson = false;

		//getWSData('http://nominatim.openstreetmap.org/reverse?lat='+lat+'&lon='+lng+'&format=json', '', 'json', function(json) {
		reverseGeoLookup(lat, lng, function(json) {
			//console.log(json);
			var lat = parseFloat(json['lat']);
			var lng = parseFloat(json['lon']);
			var latLngFrom = getLatLng(lat, lng);
			var address = json['address']; // country, country_code, house_number, postcode, road, state, town

			var closestBusStop;
			//var shortestDistanceFound = Number.MAX_VALUE;
			// busStop: [color, data: [id, info:[bus:[]], isStation, lat, lng, name, prevStationId, sms], marker: [..], number]
			$.each(busStops, function(k,v) {
				var latLng = getLatLng(v['data']['lat'], v['data']['lng']);
				var distance = latLngFrom.distanceTo(latLng);
				if(distance < routeFromStartToBusStopInfo['totalDistance']) {
					//shortestDistanceFound = distance;
					routeFromStartToBusStopInfo['totalDistance'] = distance;
					closestBusStop = v;
					routeFromStartToBusStopInfo['destLatLng'] = latLng;
				}
			});
			console.log("Shortest distance: " + routeFromStartToBusStopInfo['totalDistance'] + ", bus stop name: " + closestBusStop['data']['name']);
			//console.log(closestBusStop);

			removeMarker(homeAddressMarker);
			homeAddressMarker = addMarker(latLngFrom,
										  0,
										  "<b>" + address['road'] + "</b><br />" + address['postcode'] + " " + address['town'],
										  'assets/icons/house/1.png',
										  [32, 37]);

			removeMarker(currentLocationMarker);
			currentLocationMarker = addMarker(latLngFrom,
										  0,
										  getLocatePersonPopupContent(),
										  'assets/icons/person/1.png',
										  [32, 37]);

			line1 = createRoute([latLngFrom, routeFromStartToBusStopInfo['destLatLng']]);

		});
	}
}

//http://wiki.openstreetmap.org/wiki/Nominatim#Reverse%5FGeocoding%5F.2F%5FAddress%5Flookup
function reverseGeoLookup(lat, lng, callbackSuccess) {
	getWSData('http://nominatim.openstreetmap.org/reverse?lat='+lat+'&lon='+lng+'&format=json', '', 'json', function(json) {
		callbackSuccess(json);
	});
}

function geoLookup(address, callbackSuccess) {
	$.getJSON('http://nominatim.openstreetmap.org/search?q='+address+'&countrycodes=FO&format=json', function(json) {
		callbackSuccess(json);
	});
}

function getLocatePersonPopupContent() {
	var result = "<b>You are here</b>";
	if(currentLocationMarker !== undefined) {
		var latLngFrom = getLatLng(currentLocationMarker['_latlng']['lat'], currentLocationMarker['_latlng']['lng']);
		var distanceLeft = round(latLngFrom.distanceTo(routeFromStartToBusStopInfo['destLatLng']), 2);
		var totalDistance = round(routeFromStartToBusStopInfo['totalDistance'], 2);
		result += "<br />Distance left: " + distanceLeft + " km<br />Total distance: " + totalDistance + " km";
	}
	return result;
}

function round(value, decimals) {
	return Math.round(value, Math.pow(10, decimals)) / Math.pow(10, decimals);
}

function removeRoute(line) {
	if (line) {
		console.log("removed line");
        map.removeLayer(line);
    }
}

function createRoute(list) {
	var line;
	var waypoints = [];
	$.each(list, function(k,v) {
		waypoints.push({
	    	latLng: v
	    });
	});
    router.route(waypoints, function(err, routes) {
    	removeRoute(line);
        /*if (line) {
            map.removeLayer(line);
        }*/
        if (err) {
            alert(err);
        } else {
            line = L.Routing.line(routes[0]).addTo(map);
        }
    });
    return line;
}

function removeMarker(marker) {
	if(marker !== undefined) {
		map.removeLayer(marker);
	}
}

function addMarker(_latlng, _angle, _popupContent, _iconUrl, _iconSize) {
	var popup = L.popup({
		autoPan: false,
		keepInView: false,
		closeOnClick: true
	});
	popup.setContent(_popupContent);
	var marker = L.rotatedMarker(_latlng, {angle: _angle});
	marker
		.setIcon(L.icon({
		iconUrl: _iconUrl,
		iconSize: _iconSize // [x, y]
	}))
	.addTo(map)
	.bindPopup(popup);
	return marker;
}

function changeBusLine(busColor) {
	$.each(busses, function(k,v) {
		if(busColor === '-1') {
			v['canDrawUI'] = true;
		}
		else {
			v['canDrawUI'] = v['lineColor'] === busColor;
		}
	});
}

function findMe() {
	canLocatePerson = true;
	map.locate({
		setView : true,
		maxZoom : 17
	});
}

function toggleBusStops(isChecked, selectedColor) {
	var opacity = isChecked === true ? 1 : 0;
	$.each(busStops, function(k,v) {
		var busColor = v['color'];
		if(selectedColor === busColor || selectedColor === '-1') {
			v['marker'].setOpacity(opacity);
		}
		else {
			v['marker'].setOpacity(0);
		}
	});
	Store.save("showBusStops", isChecked);
}

function loadBusStops(callbackSuccess) {
	getStationDataAsArray(function(data) {
		$.each(data, function(k,station) {

			$.each(station['info'], function(k,v) {
				$.each(v, function(k,busStop) {
					var busStopLineId = busStop['lineId'];
					if(busStopLineId !== undefined) {
						//console.log(busStopLineId);
						var busNoAndColor = lineIdToBusNoAndColor(busStopLineId);
						if(busNoAndColor !== null) {
							busStops.Add(new BusStop(busStop, station, busNoAndColor));
						}
					}
				});
			});
		});
	});
	callbackSuccess();
}

function lineIdToBusNoAndColor(_lineId) {
	var lineId = parseInt(_lineId);
	var result = null;
	switch(lineId) {
		case 241:
			result = {no: 1, color: 'Red'};
			break;
		case 242:
			result = {no: 2, color: 'Green'};
			break;
		case 243:
			result = {no: 3, color: 'Blue'};
			break;
		case 261:
			result = {no: 4, color: 'Orange'};
			break;
		case 301:
			result = {no: 5, color: 'Violet'};
			break;
	}
	return result;
}

function init(callbackSuccess) {
	getBusDataAsArray(function(data) {
		var hasData = data !== undefined;
		if(hasData) {
			$.each(data, function(k,v) {
				var w = window.innerWidth;
				var h = window.innerHeight;
				var popup = L.popup({
								autoPan: true,
								keepInView: true,
								autoPanPadding: L.point(w/2, h/2),
								closeOnClick: false
							});
					popup.setContent(getMarkerPopupContent(v));

	      		var marker = L.marker(getLatLng(v['lat'], v['lng']));
	      			marker
	      				.setIcon(getMapIcon(v))
	      				.addTo(map)
	      				.bindPopup(popup);
	      		var bus = new Bus(v, marker, true);
				busses.Add(bus);
				//console.log(bus);
		   	});
		   	//console.log(busses.Size());
		}
		callbackSuccess(hasData);
	});
}

function update() {
	setInterval(function() {
		getBusDataAsArray(function(data) {
			var hasData = data !== undefined;
			if(hasData) {
				$.each(data, function(k,bus) {
					//console.log(busses[k]['marker']);
					// TODO: Change zero (0)
					//console.log(busses[k]['marker'].getLatLng());
					var icon = getMapIcon(bus);
					var marker = busses[k]['marker'];
					if(busses[k]['canDrawUI']) {
						var latLng = [bus['lat'], bus['lng']];// getLatLng(bus['lat'], bus['lng']);
						// Show the bus
						marker.setOpacity(1);
						marker.setIcon(icon);
						marker.setPopupContent(getMarkerPopupContent(bus));
						marker.setLatLng(latLng);

						//getRouteData(latlng);
						//addCircle(latLng, 10);
						//console.log(latLng);

					}
					else {
						// Hide the bus
						marker.setOpacity(0);
					}
					//console.log(bus);
			   	});
			}
		});
		//console.log(busses.Size());
	}, 1000);
}

function addCircle(latlng, size) {
	L.circle(latlng, size).addTo(map);
}

function getMapIcon(bus) {
	return L.icon({
		iconUrl: getIcon(bus),
		iconSize: [27, 27]
	});
}

function getMarkerPopupContent(bus) {
	return "<b>" + bus['lineName'] + "</b>" +
		"<br />Speed: " + bus['speed'] + " km/h" +
		"<br />ID: " + bus['busId'] + ", Route: " + bus['route'] +
		"<br />Line no.: " + bus['lineNumber'] +
		"<br />Line color: " + bus['lineColor'];
}

function getLatLng(lat, lng) {
	return L.latLng(lat, lng);
}

function Bus(v, _marker, _canDrawUI) {
	this.speed = v['speed'];
	this.info = v['info'];
	this.route = v['route'];
	this.peopleCount = v['peopleCnt'];
	this.lineNumber = v['lineNumber'];
	this.lineName = v['lineName'];
	this.lineColor = v['lineColor'];
	this.lat = v['lat'];
	this.lng = v['lng'];
	this.inStation = v['inStation'];
	this.direction = v['direction'];
	this.busNo = v['busNo'];
	this.busId = v['busId'];
	this.marker = _marker;
	this.marker.setOpacity(0);
	this.canDrawUI = _canDrawUI;
}

function BusStop(_busStop, _station, _busNoAndColor) {
	this.number = _busNoAndColor['no'];
	this.color = _busNoAndColor['color'];
	this.data = _station;
	this.marker = createBusStopMarker(_busStop, _station, _busNoAndColor['color']);
	this.marker.setOpacity(0);
}

function createBusStopMarker(_busStop, station, busStopIconColor) {
	var busStopIconRelativePath = 'assets/icons/busStop/';
	var busStopIconNo = '/8.png';
	var popup = L.popup({
					autoPan: false,
					keepInView: false,
					closeOnClick: true
				});
	//console.log(station);
	popup.setContent("<b>" + station['name'] + "</b><br /> Time left: " + _busStop['timeLeft']);
	var marker = L.marker(getLatLng(station['lat'], station['lng']));
	marker
		.setIcon(L.icon({
		iconUrl: busStopIconRelativePath + busStopIconColor + busStopIconNo,
		iconSize: [32, 37]
	}))
	.addTo(map)
	.bindPopup(popup);
  	return marker;
}

function getIcon(bus) {
	var direction = parseFloat(bus['direction']);
	var inStation = parseFloat(bus['inStation']);
	var isDelayed = 0;
	var iconUrl = 'assets/icons/bus/';

  	if (isDelayed === 1) {
  		return iconUrl + "BusWarning.png";
  	} else {
  		iconUrl += bus['lineColor'] + '/';
	  		if (inStation === 1){
	  			return iconUrl + "Stop.png";
	  		}
	  		else if (direction > 22.5 && direction < 67.5) {
	  			//NE
	  			return iconUrl + "NE.png";
	  		}
	  		else if (direction >= 67.5 && direction <= 112.5) {
	  			//E
	  			return iconUrl + "E.png";
	  		}
	  		else if (direction > 112.5 && direction < 157.5) {
	  			//SE
	  			return iconUrl + "SE.png";
	  		}
	  		else if (direction >= 157.5 && direction <= 202.5) {
	  			//S
	  			return iconUrl + "S.png";
	  		}
	  		else if (direction > 202.5 && direction < 247.5) {
	  			//SV
	  			return iconUrl + "SV.png";
	  		}
	  		else if (direction >= 247.5 && direction <= 292.5) {
	  			//V
	  			return iconUrl + "V.png";
	  		}
	  		else if (direction > 292.5 && direction < 337.5) {
	  			//NV
	  			return iconUrl + "NV.png";
	  		}
	  		else {
	  			//N
	  			return iconUrl + "N.png";
	  		}
		}
}

function getBusDataAsArray(callback) {
	getBusDataAsJson(function(json) {
		callback(json['bus']);
	});
}

function getStationDataAsArray(callback) {
	getStationDataAsJson(function(json) {
		callback(json['station']);
	});
}

function getBusDataAsJson(callback) {
	getWSData('http://168.63.68.113/cityroute2/proxy.php', 'buses', 'xml', function(xml) {
		// Parse XML to JSON
	    callback($.xml2json(xml));
	});
}

function getStationDataAsJson(callback) {
	//getWSData('http://kt-husid-webapp.cloudapp.net/cityroute2/proxy.php', 'stations', function(xml) {
	getWSData('assets/data/stations.xml', 'stations', 'xml', function(xml) {
		// Parse XML to JSON
	    callback($.xml2json(xml));
	});
}

// Method used to retreive data from REST service, if CORS is not enabled, it
// will fail...
function getWSData(url, query, _dataType, callback) {
	/*$.ajax({
	  url: url,
	  dataType: 'xml'
	}).success(function(data) {
		//var json = $.xml2json($.parseXML(data));
	    //alert(json);
	});*/
  $.ajax({
    type: 'GET',
    cache: false,
    crossDomain: true,
    dataType: _dataType,
    data: {'q': query},
    url: url,
    success: function(xml) {
      //console.log(xml);
      callback(xml);
    },
    error: function(xhr, status, errorThrown) {
      //alert(errorThrown+'\n'+status+'\n'+xhr.statusText);
    }
  });
}