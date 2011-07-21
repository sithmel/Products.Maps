function initialize_maps() {
    // todo

    // layer
    // search
    // zoom

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
//                                                       new Point(parseInt(this.infoWindowAnchor[0]), parseInt(this.infoWindowAnchor[1]))); //anchor)

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
//                                                       new Point(parseInt(this.infoShadowAnchor[0]), parseInt(this.infoShadowAnchor[1]))); //anchor)

                out[this.name] = icon;
            });
            return out;
        };
    
        var _all_icons = _createMarkerIcons();
        var _all_shadows = _createMarkerShadows();
    
        var _createMarker = function($node, map) {
            var _getPoint = function (){
                var $geo = $node.find('.geo');
                return new google.maps.LatLng(parseFloat($geo.find('.latitude').text()), 
                                              parseFloat($geo.find('.longitude').text()));
            };
            var _getLayers = function (){
                var out = {};
                $node.find('.layers li').each(function (){
                    out[$(this).text()] = true;
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
            out.info_window = _getInfoWindow();
            out.marker = _getMarker();
            out.layers = _getLayers();
            
            google.maps.event.addListener(out.marker, 'click', function (){
                out.info_window.open(map, out.marker);
            });
            out.marker.setMap(map);
            return out;
            
        };
    
        var _getLocations = function(node, map) {
            var $node = $(node);
            var $lists = $node.find("li");
            var out = [];

            $lists.each(function (){
                out.push(_createMarker($(this), map));
            });
            return out;
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
        
        var _initMap = function (index, element){
            $(this).find('ul').hide();
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
            // manage layers ????

            var bounds = _getBounds(locations);

            map.setCenter(bounds.getCenter());
            map.fitBounds(bounds);
            
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
            $search_button = $('<input type="button" value="search" class="searchButton" />').prependTo($this);
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
        script.src = "https://maps.google.com/maps/api/js?sensor=false&callback=initialize_maps";
        document.body.appendChild(script);
    }
      
    $(document).ready(loadScript);

}(jQuery));

