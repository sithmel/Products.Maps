
// start namespace
var mapsGoogleMaps = function($) {
    // local shadows for improved packing

    var _mapsConfig = mapsConfig;
    var _mapsConfig_google = _mapsConfig.google;
    var _cssQuery = cssQuery;
    var _parseInt = parseInt;
    var _parseFloat = parseFloat;

    // privates

    var _markericons = null;
    var _defaultmaptype = null;

    var _localSearch = null;
    var _LayerControl = null;

    function _LayerControlFactory() {
        // This is a bit stupid. The Google Maps javascript is loaded later,
        // so GControl and other things aren't yet available. We put this
        // into a factory function, so we can call it later.
        function $LayerControl($$locations, $$layers) {
            this._locations = $$locations;
            this._layers = $$layers;
        };
        $LayerControl.prototype = new GControl();

        $LayerControl.prototype._addLayerButton = function($$container, $$layer) {
            var $checkbox = document.createElement("input");
            var $$locations = this._locations;
            var layers = this._layers['enabled'];
            $checkbox.type = "checkbox";
            $checkbox.defaultChecked = true;
            $checkbox.onclick = function(e) {
                layers[$$layer] = $checkbox.checked;
                for (var i=0; i < $$locations.length; i++) {
                    var $location = $$locations[i];
                    var $marker = $location['marker'];
                    var $visible = false;
                    if (typeof $location['layers'] == 'undefined') {
                        $visible = true;
                    } else {
                        for (var $name in $location['layers']) {
                            if (layers[$name] == true) {
                                $visible = true;
                                break;
                            }
                        }
                    }
                    if ($visible) {
                        $marker.show();
                    } else {
                        $marker.hide();
                    }
                }
            };

            var $label = document.createElement("label");
            $label.style.display = "block";
            $label.appendChild($checkbox);
            $label.appendChild(document.createTextNode($$layer));
            $$container.appendChild($label);
        };

        $LayerControl.prototype.initialize = function($map) {
            var $container = document.createElement("div");
            var $$layers = this._layers['enabled'];

            for (var $name in $$layers) {
                if ($$layers[$name]) {
                    this._addLayerButton($container, $name);
                }
            }

            $container.style.backgroundColor = "white";
            $container.style.border = "1px solid black";
            $container.style.padding = "2px";
            $container.style.fontSize = "90%";
            $map.getContainer().appendChild($container);

            return $container;
        };

        $LayerControl.prototype.getDefaultPosition = function() {
            return new GControlPosition(G_ANCHOR_BOTTOM_RIGHT, new GSize(7, 16));
        };

        return $LayerControl;
    };

    function _initDefaults($$defaults) {
        if (_markericons == null) {
            _markericons = {};
            for (var j=0; j < $$defaults.markericons.length; j++) {
                var $definition = $$defaults.markericons[j];
                var $icon = new GIcon();
                $icon.image = $definition['icon'];
                $icon.iconSize = new GSize(_parseInt($definition['iconSize'][0]), _parseInt($definition['iconSize'][1]));
                $icon.iconAnchor = new GPoint(_parseInt($definition['iconAnchor'][0]), _parseInt($definition['iconAnchor'][1]));
                $icon.infoWindowAnchor = new GPoint(_parseInt($definition['infoWindowAnchor'][0]), _parseInt($definition['infoWindowAnchor'][1]));
                $icon.shadow = $definition['shadow'];
                $icon.shadowSize = new GSize(_parseInt($definition['shadowSize'][0]), _parseInt($definition['shadowSize'][1]));
                $icon.infoShadowAnchor = new GPoint(_parseInt($definition['infoShadowAnchor'][0]), _parseInt($definition['infoShadowAnchor'][1]));
                _markericons[$definition['name']] = $icon;
            }
        }
        if (_defaultmaptype == null) {
            if ($$defaults.defaultmaptype == 'satellite') {
                _defaultmaptype = G_SATELLITE_MAP;
            } else if ($$defaults.defaultmaptype == 'hybrid') {
                _defaultmaptype = G_HYBRID_MAP;
            } else if ($$defaults.defaultmaptype == 'physical') {
                _defaultmaptype = G_PHYSICAL_MAP;
            } else {
                _defaultmaptype = G_NORMAL_MAP;
            }
        }
    };

    function _addInfoWindow($marker, $node) {
        // this needs to be done in a seperate function to keep the correct
        // references to node and marker
        GEvent.addListener($marker, "click", function() {
            $marker.openInfoWindow($node, {maxWidth: _mapsConfig_google.maxinfowidth});
        });
    };

    function _addInfoWindowTabs($marker, $tabs) {
        // this needs to be done in a seperate function to keep the correct
        // references to node and marker
        GEvent.addListener($marker, "click", function() {
            $marker.openInfoWindowTabs($tabs, {maxWidth: _mapsConfig_google.maxinfowidth});
        });
    };

    function _createMarker($data) {
        $data['marker'] = new GMarker($data['point'], $data['icon']);
        $data['info_windows'] = [];
        for (var j=0; j < $data['tabs'].length; j++) {
            var $tab = $data['tabs'][j];
            var $info_window = new GInfoWindowTab($tab['title'], $tab['node']);
            $data['info_windows'].push($info_window);
        }
        if ($data['info_windows'].length > 1) {
            _addInfoWindowTabs($data['marker'], $data['info_windows']);
        } else {
            _addInfoWindow($data['marker'], $data['tabs'][0]['node']);
        }
    };

    function _parseMarkers($markers, $result) {
        var $result = [];
        var $data;
        var $first_tab = true;
        for (var j=0; j < $markers.length; j++) {
            $node = $markers[j];
            if ($node.nodeType != 1)
                continue;
            if (hasClassName($node, 'title')) {
                $node.parentNode.removeChild($node);
                if ($data) {
                    _createMarker($data);
                    $result.push($data);
                }
                $data = {};
                $data['tabs'] = [];
                var $tab = {};
                $data['tabs'].push($tab);
                var dl = document.createElement('dl');
                dl.appendChild($node);
                addClassName(dl, "mapsMarker");
                $tab['node'] = dl;
                $first_tab = true;
                var $icon = _cssQuery("img.marker", $node);
                if ($icon.length > 0) {
                    $icon = $icon[0];
                    $icon.parentNode.removeChild($icon);
                    $alt = $icon.alt;
                    $icon = _markericons[$alt];
                    $data['icon'] = $icon;
                    $data['type'] = $alt;
                }
                continue;
            }
            if (hasClassName($node, 'geo')) {
                $node.parentNode.removeChild($node);
                var $$lat_node = _cssQuery(".latitude", $node);
                var $$long_node = _cssQuery(".longitude", $node);
                if ($$lat_node.length > 0 && $$long_node.length > 0) {
                    $data['point'] = new GLatLng(
                        _parseFloat(getInnerTextFast($$lat_node[0])),
                        _parseFloat(getInnerTextFast($$long_node[0]))
                    );
                }
                continue;
            }
            if (hasClassName($node, 'tab')) {
                $node.parentNode.removeChild($node);
                var $tab = {};
                if ($first_tab) {
                    $first_tab = false;
                    $tab = $data['tabs'][0];
                } else {
                    $data['tabs'].push($tab);
                    dl = document.createElement('dl');
                    addClassName(dl, "mapsMarker");
                    $tab['node'] = dl;
                }
                $tab['node'].appendChild($node);
                $tab['title'] = $node.title;
                continue;
            }
            if (hasClassName($node, 'layers')) {
                $node.parentNode.removeChild($node);
                var $$nodes = _cssQuery("li", $node);
                $data['layers'] = {};
                for (var k=0; k < $$nodes.length; k++) {
                    $data['layers'][getInnerTextFast($$nodes[k])] = true;
                }
                continue;
            }
            $node.parentNode.removeChild($node);
            $data['tabs'][0]['node'].appendChild($node);
        }
        if ($data) {
            _createMarker($data);
            $result.push($data);
        }
        return $result;
    };

    function _getLocations($node) {
        var $lists = _cssQuery("dl", $node);
        var $nodes = [];

        // we first have to copy all nodes to a list, because some will be
        // removed and looping over the childNodes directly doesn't work then
        for (var j=0; j < $lists.length; j++) {
            for (var k=0; k < $lists[j].childNodes.length; k++) {
                $nodes.push($lists[j].childNodes[k]);
            }
            $lists[j].parentNode.removeChild($lists[j]);
        }
        return _parseMarkers($nodes);
    };

    function _getBounds($locations) {
        var $bounds = new GLatLngBounds();

        for (var i=0; i < $locations.length; i++) {
            $bounds.extend($locations[i]['point']);
        }
        return $bounds;
    };

    function _getLayers($$locations) {
        var $data = {names: [],
                     counts: {},
                     enabled_names: [],
                     enabled: {}};

        for (var i=0; i < $$locations.length; i++) {
            var $location = $$locations[i];

            if ($location['layers']) {
                for (var $name in $location['layers']) {
                    if ($data['counts'][$name] == null) {
                        $data['counts'][$name] = 1;
                        $data['names'].push($name);
                    } else {
                        $data['counts'][$name] = $data['counts'][$name] + 1;
                    }
                }
            }
        }

        for (var i=0; i < $data['names'].length; i++) {
            var $name = $data['names'][i];

            if ($data['counts'][$name] > 0) {
                $data['enabled'][$name] = true;
                $data['enabled_names'].push($name);
            } else {
                $data['enabled'][$name] = false;
            }
        }

        return $data;
    };

    function _initMapSearchNearest($node) {
        var $geocoder = new GClientGeocoder();
        
        // setting up markup - start
        $($node).addClass('googleMapActive').wrap('<form id="googleMapForm" />');

        var $searchbox = (function (){

            var $search = $('<div class="googleMapSearch">Position:\
            <input class="googleMapImHere" name="searchtxt" type="text" value="">\
            </div>').insertBefore($node);

            if (navigator.geolocation) {
                $('<input id="googleMapAskTheBrowser" value="ask" type="checkbox" />')
                .appendTo($search)
                .click(function (){
                    var $this = $(this);
                    if ($this.is(':checked')){
                       $this.prev().hide();
                   }
                   else{
                       $this.prev().show();
                   }
                });
                $('<label for="askTheBrowser">Auto Detect</label>').appendTo($search);
            }
    
            return $search;
            
        })();

        var $maxlocations = (function (){
            var $ml = $('<div class="googleMapMaxLocation">Max location: \
            <select name="maxlocations" class="googleMapSearchMaxLocations">\
            </select>\
            </div>')
            .insertBefore($node)
            .find('.googleMapSearchMaxLocations');
            for(var i = 1;i < 11;i++){
                 $ml.append('<option value="' + i.toString() + '">' + i.toString() + '</option>');
            }
            return $ml;
        })();
        
        var $legend = (function (){
            var legend = $('<div class="googleMapLegend"/>').insertBefore($node);
            // populate legend
            var i = 0;
            for (prop in _markericons){
                i++;
                if (_markericons.hasOwnProperty(prop)){
                    $('<div class="marker">\
                    <input checked="checked" id="marker' + i.toString() +  '" type="checkbox" value="' + prop + '" />\
                    <label for="marker' + i.toString() +  '" >\
                    <img src="' + _markericons[prop].image + '" alt="' + prop + '"/>' + prop + '\
                    </label>\
                    </div>').appendTo(legend);
                }
            }
            return legend;

        })();


        var $button = $('<input type="submit" value="Search" />').insertBefore($node);

        var $map_node = $('<div />').addClass('googleMapPane').appendTo($node);
        var $directions = $('<div />').addClass('googleMapSearchDirs').insertAfter($node);
        var $results = $('<div />').addClass('googleMapSearchResults').insertAfter($node);

        // setting up markup - end

        // setting up map - start

        var $locations = _getLocations($node);
        var $$layers = _getLayers($locations);
        var $bounds = _getBounds($locations);
        var $center = $bounds.getCenter();

        var $map = new GMap2($map_node[0]);
        var gdir = new GDirections($map, $directions[0]);

        $map.addMapType(G_PHYSICAL_MAP);
        $map.addControl(new GLargeMapControl());
        if (($$layers['enabled_names'].length > 0) && ($locations.length > 1)) {
            $map.addControl(new _LayerControl($locations, $$layers));
        }
        if (_mapsConfig_google.selectablemaptypes) {
            $map.addControl(new GMapTypeControl());
        }
        // setting up map - end

        // load overlays - start        
        var load = function (center, markers, maxlocations){
        
            var locations = $.grep($locations,function (loc){
                if($.inArray(loc.type, markers) !== -1){
                    return true;
                }
                return false;
            });

            // add to $locations the distance from the center (decorate for sorting):
            $.each(locations,function (){
                this['distance_from_center'] = center.distanceFrom(this.point);
            });

            locations.sort(function (a,b){
                if (a.distance_from_center > b.distance_from_center){
                    return 1
                }
                else {
                    return -1
                }
            });
            // filter by distance to center
            var newlocations = locations.slice(0, maxlocations);
            // draw new overlays
            // first get an "I'm here" pointer
            var $data = {
                icon: _markericons['Yellow Marker'],
                point: center,
                tabs: [{title:'Here',node:$('<dl class="mapsMarker"><dd class="title">You are here!</dd><dt class="tab">xxx</dt></dl>')[0]}]
            }
            _createMarker($data)
            //newlocations.push($data);
            newlocations.unshift($data);
            //calculate bounds and center
            $bounds = _getBounds(newlocations);
            var $mapcenter = $bounds.getCenter();

            $zoom_level = $map.getBoundsZoomLevel($bounds);

//            $map.setCenter($mapcenter, $zoom_level, _defaultmaptype);
            $map.setCenter($mapcenter, $zoom_level);
            // add overlays
            $map.clearOverlays();//empty the map
            $results.empty();// empty the results
            var newlocations_len = newlocations.length
            for (var i = 0; i < newlocations_len; i++) { 
                $map.addOverlay(newlocations[i]['marker']);
                // add results
                (function (l,index){
                    var node = $(l.tabs[0].node);
                    var title = node.children('.title').html();
                    var description = node.children('.tab').html();
                    var distance = l.distance_from_center && parseInt(l.distance_from_center) + " m" || '';
                    
                    var imageurl = l.icon.image
                    var $res = $('<div class="googleMapResult">\
                    <span class="googleMapResultImg">\
                    <img src="' + imageurl +'" />\
                    </span>\
                    <span class="googleMapResultTitle">' + title + '</span>\
                    <span class="googleMapResultDesc">' + description + '</span>\
                    </div>') //<span class="googleMapResultDistance">' + distance + '</span>
                    .appendTo($results);
                    if(index !== 0){
                        $res.append('<a href="#" class="googleMapResultDir">Directions</a>');
                    }

                    $res.find('.googleMapResultImg').click(function (){
                        if(index === 0){
                            gdir.clear();
                            $map.setCenter($mapcenter, $zoom_level);
                        }
                        else{
                            $map.panTo(l['point']);

                        }
                        l['marker'].openInfoWindow(l.info_windows);
                        return false;

                    });

                    $res.find('.googleMapResultDir')
                    .click(function (){
                        $map.closeInfoWindow();
                        gdir.clear();
                        if(index === 0){
//                            $map.setCenter($mapcenter, $zoom_level);

                            return false;
                        }
//
                        function handleErrors(){
                            if (gdir.getStatus().code == G_GEO_UNKNOWN_ADDRESS)
                                alert("No corresponding geographic location could be found for one of the specified addresses. This may be due to the fact that the address is relatively new, or it may be incorrect.\nError code: " + gdir.getStatus().code);
                            else if (gdir.getStatus().code == G_GEO_SERVER_ERROR)
                                alert("A geocoding or directions request could not be successfully processed, yet the exact reason for the failure is not known.\n Error code: " + gdir.getStatus().code);
                            else if (gdir.getStatus().code == G_GEO_MISSING_QUERY)
                                alert("The HTTP q parameter was either missing or had no value. For geocoder requests, this means that an empty address was specified as input. For directions requests, this means that no query was specified in the input.\n Error code: " + gdir.getStatus().code);
                            else if (gdir.getStatus().code == G_GEO_BAD_KEY)
                                alert("The given key is either invalid or does not match the domain for which it was given. \n Error code: " + gdir.getStatus().code);
                            else if (gdir.getStatus().code == G_GEO_BAD_REQUEST)
                                alert("A directions request could not be successfully parsed.\n Error code: " + gdir.getStatus().code);
                            else alert("An unknown error occurred.");
                        }
 
                        function onGDirectionsLoad(){ 
                            var poly = gdir.getPolyline();
                            if (poly.getVertexCount() > 100) {
                                alert("This route has too many vertices");
                                return;
                            }
                        }
//
                        GEvent.addListener(gdir, "addoverlay", onGDirectionsLoad);
                        GEvent.addListener(gdir, "error", handleErrors);

                        gdir.loadFromWaypoints([center, l.point]);
//                        alert(gdir.getDistance());
//                        $map.panTo(l['point']);
//                        l['marker'].openInfoWindow(l.info_windows);
                        return false;
                    });
                    
                })(newlocations[i],i)

            }
            
        };


        // start search
        $('#googleMapForm').submit(function (){
            var $this = $(this);
            
            var searchstring = $this.find('.googleMapImHere').val();
            var geolocation = $this.find('#googleMapAskTheBrowser');
            var getLatLng;
            
            var markers = (function (){
                var $inputs = $this.find('.googleMapLegend').find('input:checked');
                var output = [];
                $inputs.each(function (){
                    output.push($(this).val());
                });
                return output;
            })()
            
            var maxlocations = $maxlocations.val();

            if (geolocation.is(':checked')){
                navigator.geolocation.getCurrentPosition(function(position) {
                    var myLatlng = new GLatLng(position.coords.latitude, position.coords.longitude);
                    load(myLatlng, markers, maxlocations);
                });
            }
            else{
                $geocoder.getLatLng(searchstring,function (latlng){
                    if(!latlng){
                        return false; // log error ???
                    }
                    load(latlng, markers, maxlocations);
                });
            }

            return false;
        });

    };


    function _initMap($node) {
        var $locations = _getLocations($node);
        var $$layers = _getLayers($locations);
        var $bounds = _getBounds($locations);
        var $center = $bounds.getCenter();
        var $$map_node = document.createElement('div');
        addClassName($node, 'googleMapActive');
        addClassName($$map_node, 'googleMapPane');
        $node.appendChild($$map_node);
        var $map = new GMap2($$map_node);
        $map.addMapType(G_PHYSICAL_MAP);
        var $zoom_level = $map.getBoundsZoomLevel($bounds);
        if ($zoom_level > _mapsConfig_google.maxzoomlevel)
            $zoom_level = _mapsConfig_google.maxzoomlevel;
        $map.setCenter($center, $zoom_level, _defaultmaptype);
        $map.addControl(new GLargeMapControl());
        if (($$layers['enabled_names'].length > 0) && ($locations.length > 1)) {
            $map.addControl(new _LayerControl($locations, $$layers));
        }
        if (_mapsConfig_google.selectablemaptypes) {
            $map.addControl(new GMapTypeControl());
        }
        for (var i=0; i < $locations.length; i++) {
            $map.addOverlay($locations[i]['marker']);
        }
    };

    function _setupGeocoding($input, $map, $$marker, $location) {
        var $geocoder = new GClientGeocoder();
        var $query = document.createElement('input');
        var $search = document.createElement('input');
        var $form = null;
        var $old_submit = null;

        // search for the form
        $form = $input[0];
        do {
            if ($form.tagName) {
                if ($form.tagName.toLowerCase() == 'form') {
                    break;
                }
                if ($form.tagName.toLowerCase() == 'body') {
                    $form = null;
                    break;
                }
                $form = $form.parentNode;
            }
        } while ($form);

        $input[0].style.display = "none";
        $input[1].style.display = "none";
        $query.setAttribute("type", "text");
        $query.value = $input[0].value + ', ' + $input[1].value;
        $search.setAttribute("type", "button");
        $search.value = "Search";
        $search.className = "searchButton";

        $$func = function(e) {
            var $address = $query.value;
            var _localSearchFunc = function() {
                var $$place = _localSearch.results[0];
                if ($$place) {
                    var $point = new GLatLng($$place.lat, $$place.lng);
                    $input[0].value = $point.lat();
                    $input[1].value = $point.lng();
                    $location.innerHTML = $point.lat() + ", " + $point.lng();
                    $$marker.setPoint($point);
                    if ($$place.streetAddress) {
                        $$marker.openInfoWindowHtml($$place.streetAddress);
                    } else {
                        $$marker.openInfoWindowHtml($address);
                    }
                    $map.setCenter($point, _mapsConfig_google.initialzoomlevel);
                } else {
                    var msg = _mapsConfig_google.locationnotfound;
                    msg = msg.replace(/\[LOCATION\]/, $address);
                    alert(msg);
                }
            };
            var _geoSearchFunc = function($response) {
                if (!$response || $response.Status.code != 200) {
                    if (_localSearch != null) {
                        // try Google AJAX Search
                        _localSearch.setSearchCompleteCallback(
                            null, _localSearchFunc
                        );
                        _localSearch.execute($address);
                    } else {
                        var msg = _mapsConfig_google.locationnotfound;
                        msg = msg.replace(/\[LOCATION\]/, $address);
                        alert(msg);
                    }
                } else {
                    var $$place = $response.Placemark[0];
                    var $point = $$place.Point.coordinates;
                    $point = new GLatLng($point[1], $point[0]);
                    $input[0].value = $point.lat();
                    $input[1].value = $point.lng();
                    $location.innerHTML = $point.lat() + ", " + $point.lng();
                    $$marker.setPoint($point);
                    $$marker.openInfoWindowHtml($$place.address);
                    $map.setCenter($point, _mapsConfig_google.initialzoomlevel);
                }
            };
            $geocoder.getLocations($address, _geoSearchFunc);
            // Prevent "You already submitted this form" message
            var $nodes = _cssQuery("input[type=submit]", $form);
            for (var j=0; j<$nodes.length; j++) {
                removeClassName($nodes[j], 'submitting');
            }
            return false;
        };
        $query.onfocus = function(e) {
            if ($form) {
                $old_submit = $form.onsubmit;
                $form.onsubmit = $$func;
            }
        };
        $query.onblur = function(e) {
            if ($form) {
                $form.onsubmit = $old_submit;
            }
        };
        $search.onclick = $$func;

        $input[0].parentNode.insertBefore($query, $input[0]);
        $input[0].parentNode.insertBefore($search, $input[0]);
    };

    function _initLocationEditMap($node) {
        var $input = _cssQuery("input", $node);
        if ($input.length != 2)
            return;

        var $location = document.createElement('div');
        addClassName($location, "locationString discreet");

        var $$map_node = document.createElement('div');
        addClassName($node, 'googleMapActive');
        addClassName($$map_node, 'googleMapPane');
        $node.appendChild($$map_node);
        $node.appendChild($location);

        $map_width = parseInt($($node).css('width'));
        $map_height = parseInt($($node).css('height'));
        if (isNaN($map_width) || isNaN($map_height)) {
            var $map = new GMap2($$map_node);
        } else {
            var $map = new GMap2($$map_node, {size:new GSize($map_width,$map_height)});
        }

        $location.innerHTML = $input[0].value + "," + $input[1].value;
        var $center = new GLatLng(_parseFloat($input[0].value),
                                  _parseFloat($input[1].value));
        $map.setCenter($center, _mapsConfig_google.initialzoomlevel, _defaultmaptype);
        $map.addControl(new GLargeMapControl());
        if (_mapsConfig_google.selectablemaptypes) {
            $map.addControl(new GMapTypeControl());
        }
        var $$marker = new GMarker($center, {draggable: true});
        $map.addOverlay($$marker);
        GEvent.addListener($$marker, "dragend", function() {
            var $point = $$marker.getPoint();
            $input[0].value = $point.lat();
            $input[1].value = $point.lng();
            $location.innerHTML = $point.lat() + ", " + $point.lng();
        });
        GEvent.addListener($map, "click", function($overlay, $point) {
            if (!$overlay) {
                $$marker.setPoint($point);
                $input[0].value = $point.lat();
                $input[1].value = $point.lng();
                $location.innerHTML = $point.lat() + ", " + $point.lng();
            }
        });
        _setupGeocoding($input, $map, $$marker, $location);
    };

    // namespace dictionary
    return {
        init: function() {
            registerEventListener(window, 'unload', GUnload);

            _LayerControl = _LayerControlFactory();
            if (GBrowserIsCompatible()) {
                _initDefaults(_mapsConfig_google);

                if (mapsConfig.google.ajaxsearchkey) {
                    _localSearch = new GlocalSearch();
                }

                var $maps = _cssQuery("div.googleMapView");
                for (var i=0; i < $maps.length; i++) {
                    _initMapSearchNearest($maps[i]);
    //                _initMap($maps[i]);
                }
                var $maps = _cssQuery("div.googleMapEdit");
                for (var i=0; i < $maps.length; i++) {
                    _initLocationEditMap($maps[i]);
                }
            }
        },

        loadJS: function(url) {
            document.write('<'+'script type="text/javascript" src="'+url+'"><'+'/script>');
        }

    };
// end namespace
}(jQuery);

mapsGoogleMaps.loadJS("http://maps.google.com/maps?file=api&v=2&key="+mapsConfig.google.apikey);
if (mapsConfig.google.ajaxsearchkey) {
    mapsGoogleMaps.loadJS("http://www.google.com/uds/api?file=uds.js&amp;v=1.0&key="+mapsConfig.google.ajaxsearchkey);
}
registerEventListener(window, 'load', mapsGoogleMaps.init);
