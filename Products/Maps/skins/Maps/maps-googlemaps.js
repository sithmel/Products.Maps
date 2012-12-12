function initialize_maps() {
    (function ($){
        var _mapsConfig_google = mapsConfig.google;
        var _createMarkerIcons = function (){
            var out = {};
            var Point = google.maps.Point,
                Size = google.maps.Size;
            $.each(_mapsConfig_google.markericons, function (){
                var icon = new google.maps.MarkerImage(this.icon, //url
                                                       new Size(parseInt(this.iconSize[0]), parseInt(this.iconSize[1])), //size
                                                       null,
                                                       new Point(parseInt(this.iconAnchor[0]), parseInt(this.iconAnchor[1]))); //origin

                out[this.name] = icon;
            });

            return out;
        };
        var _createMarkerShadows = function (){
            var out = {};
            var Point = google.maps.Point,
                Size = google.maps.Size;
            $.each(_mapsConfig_google.markericons, function (){

                var icon = new google.maps.MarkerImage(this.shadow, //url
                                                       new Size(parseInt(this.shadowSize[0]), parseInt(this.shadowSize[1])), //size
                                                       null,
                                                       new Point(parseInt(this.iconAnchor[0]), parseInt(this.iconAnchor[1]))); //origin

                out[this.name] = icon;
            });
            return out;
        };
    
        var _all_icons = _createMarkerIcons();
        var _all_shadows = _createMarkerShadows();
    
        var _createMarker = function($node, map) {
            var _getTitle = function (){
                return $node.find('.title').text().replace(/^\s+|\s+$/g, '');
            };
            var _getLink = function (){
                return $node.find('.title a').attr('href');
            };

            var _getPoint = function (){
                var $geo = $node.find('.geo');
                return new google.maps.LatLng(parseFloat($geo.find('.latitude').text()), 
                                              parseFloat($geo.find('.longitude').text()));
            };
            var _getLayers = function (){
                var out = [];
                $node.find('.layers li').each(function (){
                    out.push($(this).text());
                });
                return out;
            };
            var _getMarker = function (){
                var icon_name = $node.find('img.marker').attr('alt');
                return new google.maps.Marker({
                    icon: _all_icons[icon_name],
                    shadow:_all_shadows[icon_name],
                    position: _getPoint()
                });
            };
            var _getInfoWindow = function (){
                var $wrapper = $('<div/>'),
                    $tabs, $handlers;
                $node.find('.tab').clone().appendTo($wrapper);
                
                $tabs = $wrapper.find('.tab');
                // create tabs
                if ($tabs.length > 1){
                    $handlers = $('<div class="infowindowTabHandlers" />');
                    
                    $tabs.each(function (){
                        var $this = $(this);
                        var title = $this.attr('title');
                        var $handler = $('<div class="infowindowTabHandler">' + title + '</div>').click(function (){
                            $tabs.not($this).hide();
                            $this.show();
                            $(this).addClass('selected').siblings().removeClass('selected');
                        });
                        $handlers.append($handler);
                    });
                    $handlers.find('.infowindowTabHandler').eq(0).click();
                    $wrapper.prepend($handlers);
                }
                
                return new google.maps.InfoWindow({
                    content: $wrapper.get(0)
                });
            };

            var out = {};
            out.title = _getTitle();
            out.link = _getLink();
            out.info_window = _getInfoWindow();
            out.marker = _getMarker();
            out.layers = _getLayers();
            
            google.maps.event.addListener(out.marker, 'click', function (){
                out.info_window.open(map, out.marker);
            });

            google.maps.event.addListener(out.marker, 'dblclick', function (){
                map.panTo(out.marker.getPosition());
            });


            out.marker.setMap(map);
            return out;
            
        };
    
        var _getLocations = function(node, map) {
            var $node = $(node);
            var $lists = $node.find("li:not(.layers li)");
            var out = [];

            $lists.each(function (){
                out.push(_createMarker($(this), map));
            });
            return out;
        };

        var _getLayersList = function(locations){
            var layers = [];
            $.each(locations,function (){
                $.each(this.layers, function (){
                    var s = this.toString();
                    if ($.inArray(s, layers) === -1){
                        layers.push(s);
                    }
                });
            });
            return layers;
        };
        
        var _reverseGeocoding = function (latLng, $search_text){
            var geocoder = new google.maps.Geocoder();
            geocoder.geocode({'latLng': latLng}, function(results, status) {
                if (status == google.maps.GeocoderStatus.OK && results[0]) {
                    $search_text.val(results[0].formatted_address);
                }
                else {
                    $search_text.val(latLng.lat() + ', ' + latLng.lng());
                }
            });            
        };

        var _setupGeocoder = function ($search_text, $search_button, callback){
            var geocoder = new google.maps.Geocoder();
            $search_text.autocomplete({
                delay: 500,
                //This bit uses the geocoder to fetch address values
                source: function(request, response) {
                    geocoder.geocode( {'address': request.term }, function(results, status) {
                        response($.map(results, function(item) {
                            return {
                                label:  item.formatted_address,
                                value: item.formatted_address,
                                latitude: item.geometry.location.lat(),
                                longitude: item.geometry.location.lng()
                            }
                        }));
                    })
                },
                //This bit is executed upon selection of an address
                select: function(event, ui) {
                    callback(new google.maps.LatLng(ui.item.latitude, ui.item.longitude));
                }
            });            
            $search_button.click(function (){
                geocoder.geocode( {'address': $search_text.val() }, function(results, status) {
                    if(status === google.maps.GeocoderStatus.OK && results[0]){
                        $search_text.val(results[0].formatted_address);
                        callback(results[0].geometry.location);
                    }
                });
            
            });
        };
        var _LayerControl = function (layers, $layerControlDiv, map, layeractive){
            $.each(layers, function (index, value){
                var i = 'layer' + index, checked='';
                if($.inArray(value, layeractive) !== -1){
                    checked = 'checked="checked"';
                }
                $('<div><label for="' + i + '"><input type="checkbox" ' + checked + '" id="' + i +'" value="' + value + '" />' + value + '</label></div>')
                .appendTo($layerControlDiv).css('padding','2px');
            });

        };

        var _initMap = function (index, element){
            var $this = $(this);
            $this.find('ul').hide();
            var _getBounds = function (locations){
                var out = new google.maps.LatLngBounds();
                $.each(locations, function (){
                    out.extend(this.marker.getPosition());
                });
                return out;
            };

            $(this).addClass('googleMapActive');
            var $map_node = $('<div class="googleMapPane" />').appendTo(this);
            var map_options = {
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };
            var map = new google.maps.Map($map_node.get(0), map_options);

            var locations = _getLocations(this, map);
            var layers = _getLayersList(locations);

            if(! window._maps_saved_settings){
                window._maps_saved_settings = {};
            }
            if(! _maps_saved_settings.layers){
                _maps_saved_settings.layers = layers;
            }

            // manage layers
            if (layers.length && locations.length > 1){
                var $layerControlDiv = $('<div />')
                .css('background-color', 'white')
                .css('border-color','#A9BBDF')
                .css('border-style','solid')
                .css('border-width','0 1px 1px')
                .css('box-shadow','2px 2px 3px rgba(0, 0, 0, 0.35)')
                .css('margin-right','5px');
                var layerControl = new _LayerControl(layers, $layerControlDiv, map, _maps_saved_settings.layers.split('#'));
                map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push($layerControlDiv.get(0));
                var _update_layers = function (){
                    var layersActive = [];
                    $(this).find('input:checked').each(function (){
                        layersActive.push($(this).val());
                    });
                    $.each(locations, function (){
                        var visibility = false;
                        var layers = this.layers;
                        if (layers.length === 0){
                            visibility = true;
                        }
                        else {
                            for(var i = 0, len = layersActive.length;i < len;i++){
                                if ($.inArray(layersActive[i], layers) !== -1){
                                    visibility = true;
                                }
                            }
                        }
                        this.marker.setVisible(visibility);
                    });
                    _maps_saved_settings.layers = layersActive.join('#');
                };
                $layerControlDiv.click(_update_layers);
                _update_layers.apply($layerControlDiv.get(0));
            }

            var bounds = _getBounds(locations);


            // save/restore settings
            var _save_settings = function (){
                _maps_saved_settings.maptype = map.getMapTypeId();
                var center = map.getCenter();
                _maps_saved_settings.center = [center.lat(), center.lng()];
                _maps_saved_settings.zoom = map.getZoom()
                // layers are already updated
                var l = window.location;
                var url = l.protocol + '//' +l.host + l.pathname + '/' + '@@maps_save_config';
                $.post( url, _maps_saved_settings, function (){
                    $('#kssPortalMessage').show();
                    $('#kssPortalMessage dd').text(_mapsConfig_google.label_updatedmapsettings);
                });
            };
            
            var _restore_zoom = function (){
                if(_maps_saved_settings.center && _maps_saved_settings.zoom){
                    var c = _maps_saved_settings.center;
                    map.setCenter(new google.maps.LatLng(c[0], c[1]));
                    map.setZoom(_maps_saved_settings.zoom);
                }  
                else {
                    if (locations.length === 1){
                        map.setCenter(locations[0].marker.getPosition());
                        map.setZoom(16);
                    }
                    else {
                        map.fitBounds(bounds);
                    }
                }

            };
            
            
            var _restore_type = function (){
                if(_maps_saved_settings.maptype){
                    map.setMapTypeId(_maps_saved_settings.maptype)
                }

            };

            _restore_zoom();
            _restore_type();

            if($('.portaltype-folder #edit-bar, .portaltype-topic #edit-bar').length){
                $('<input type="button" value="' + _mapsConfig_google.label_savemapsettings +'"/>')
                .click(_save_settings)
                .insertAfter(this);
            }

            // search doesn't make sense with only one location            
            if (locations.length <= 1){
                return;
            }
            // map search
            // 1 - wrap the map
            $this.wrap('<div class="googleMapWrapper" />');
            
            var $search = $('\
<div>\
    <div class="googleMapSearchBar">' + _mapsConfig_google.label_searchnearto + '</div>\
    <div class="googleMapSearch">\
        <h4 class="label_search">' + _mapsConfig_google.label_searchnearto + '</h4>\
        <input type="text" value="" placeholder="' + _mapsConfig_google.label_city_address + '" title="' + _mapsConfig_google.label_city_address + '" name="searchtxt" class="googleMapImHere inputLabel inputLabelActive">\
        <br>\
        <input class="searchButton" type="submit" value="' + _mapsConfig_google.label_search + '">\
        <input class="searchButton" type="reset" value="' + _mapsConfig_google.label_cancel + '">\
        <div class="googleMapSearchResults">\
        </div>\
    </div>\
</div>\
').insertBefore($this);
            var $directions = $('<div class="googleMapDirections"></div>').insertAfter($this);
            var $search_text = $search.find('.googleMapImHere');
            var $search_button = $search.find(':submit');
            var $reset_button = $search.find(':reset');
            var $search_results = $search.find('.googleMapSearchResults');
            var marker_imhere = new google.maps.Marker({
                icon: _all_icons['_yah'],
                shadow:_all_shadows['_yah'],
                map: map,
                visible:false
            });

            var directionsRendererOptions = {};
            
            var directionsRenderer = new google.maps.DirectionsRenderer(directionsRendererOptions);            

            $reset_button.click(function (){
                directionsRenderer.setPanel(null);
                directionsRenderer.setMap(null);
                marker_imhere.setVisible(false);
                $search_text.val('');
                $search_results.empty();
                _restore_zoom();
            });

            var _search_results = function (center){
                directionsRenderer.setPanel(null);
                directionsRenderer.setMap(null);
                marker_imhere.setVisible(true);
                marker_imhere.setPosition(center);
                var computeDistanceBetween = google.maps.geometry.spherical.computeDistanceBetween;
                var visible_locations = $.grep(locations, function (item, index){return item.marker.getVisible()});
                $.each(visible_locations,function (){
                    this.distance_from_center = computeDistanceBetween(center,this.marker.getPosition());
                });
                visible_locations.sort(function (a,b){
                    if (a.distance_from_center > b.distance_from_center){
                        return 1;
                    }
                    else {
                        return -1;
                    }
                });
                $search_results.empty();

                var $i_am_here = $('\
<div class="googleMapIMHere">\
    <div><h4><img src="' + marker_imhere.icon.url + '"/> ' + _mapsConfig_google.label_nearestplaces + '</h4>\
    </div>\
</div>').appendTo($search_results);
                
                var bound = new google.maps.LatLngBounds();
                $.each(visible_locations.slice(0,5), function (){
                    var thislocation = this;
                    bound.extend(thislocation.marker.getPosition());
                    var $result = $('\
<div class="googleMapResult">\
    <div>\
    <img src="' + thislocation.marker.icon.url + '"/><a href="' + thislocation.link + '">' + thislocation.title + '</a>\
    </div>\
    <div class="indication">' + _mapsConfig_google.label_directions + ' &raquo;&nbsp;</div>\
</div>').appendTo($search_results);
                    $result
                    .find('.indication')
                    .click(function (){
                         $(this).closest('.googleMapResult').addClass('selected').siblings().removeClass('selected');
                         var dservice = new google.maps.DirectionsService();
                         var directionRequest = {origin: center,
                                                 destination:thislocation.marker.getPosition(),
                                                 travelMode: google.maps.TravelMode.DRIVING};
                         dservice.route(directionRequest, function (directionResult, directionStatus){
                             if(! directionStatus === google.maps.DirectionsStatus.OK){
                                 return ;
                             }
                             directionsRenderer.setDirections(directionResult);
                             directionsRenderer.setPanel($directions.get(0));
                             directionsRenderer.setMap(map);
                         });
                    });
                    $result
                    .find('img')
                    .click(function (){
                        thislocation.info_window.open(map, thislocation.marker);
                    });
                });
                bound.extend(center);
                map.fitBounds(bound);

                $i_am_here.click(function (){
                    directionsRenderer.setPanel(null);
                    directionsRenderer.setMap(null);
                    map.fitBounds(bound);
                    $(this).closest('.googleMapSearchResults').find('.googleMapResult').removeClass('selected');
                });

            };

            $search.find('.googleMapSearchBar').click(function (){
                var $this = $(this);
                var $googleMapSearch = $this.next();
                if ($this.is('.open')){
                    $googleMapSearch.animate({'margin-left':'-180px'}, 'fast',  function(){$this.toggleClass('open')});
                }
                else {
                    // try to guess the user position if the input is empty
                    if (! $search_text.val().length){
                        if (navigator.geolocation){
                            navigator.geolocation.getCurrentPosition(function(position) {
                                var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                                _reverseGeocoding(pos, $search_text);
                                 _search_results(pos);
                            });
                        }
                    }
                    $googleMapSearch.animate({'margin-left':'0px'}, 'fast',  function(){
                        $this.toggleClass('open').next().hide().show(); // this is a hack for IE7
                    });
                }
            });

            // setting up the geocoder            
            _setupGeocoder($search_text, $search_button,_search_results);

        };


        var _initLocationEditMap = function (index, element){
            var $this = $(this).addClass('googleMapActive');
            var $input = $this.find("input");
            var map, $location, $map_node,
                map_width, map_height, map_options,
                center, marker, $search_button, $search_text;

            var _update_position = function (){
                var pos = marker.getPosition();
                $location.text(pos.lat() + ', ' + pos.lng());
                $input.eq(0).val(pos.lat());
                $input.eq(1).val(pos.lng());
                map.setCenter(pos);
                _reverseGeocoding(pos, $search_text);
            };

            if ($input.length != 2)
                return;

            $location = $('<div class="locationString discreet" />');

            $map_node = $('<div class="googleMapPane" />');
            $this.append($map_node).append($location);

            map_width = $this.width();
            map_height = $this.height();
            map_options = {
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                zoom: 16
            };
            map = new google.maps.Map($map_node.get(0), map_options);

            center = new google.maps.LatLng(parseFloat($input.eq(0).val()), 
                                            parseFloat($input.eq(1).val()));

            marker = new google.maps.Marker({draggable: true, position: center, map: map});

            google.maps.event.addListener(map, 'click', function (evt){
                marker.setPosition(evt.latLng);
                _update_position();
            });

            google.maps.event.addListener(marker, 'dragend', function (evt){
                _update_position();
            });
            // setting up geocoding
            $search_button = $('<input type="button" value="' + _mapsConfig_google.label_search + '" class="searchButton" />').prependTo($this);
            $search_text = $('<input type="text" class="mapSearchBar" />').prependTo($this);

            _setupGeocoder($search_text, $search_button, function (latLng){
                marker.setPosition(latLng);
                _update_position();                
            });
            $input.hide();

            _update_position();

        };

        $('.googleMapView').each(_initMap);
        $('.googleMapEdit').each(_initLocationEditMap);

    }(jQuery));

}

(function ($){
      
    function loadScript() {
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = "https://maps.google.com/maps/api/js?libraries=geometry&sensor=false&callback=initialize_maps&language=" + mapsConfig.google.language ;
        document.body.appendChild(script);
    }
      
    $(document).ready(loadScript);

}(jQuery));

