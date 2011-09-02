var mapsOpenLayers = function() {

    var _size = null;
    var _offset = null;

    var _mapsConfig = mapsConfig;
    var _mapsConfig_google = _mapsConfig.google;

    function _removePopup(map, popup) {
        map.removePopup(popup);
    }

    function _clearPopups(map) {
        jQuery.each(map.popups, function(i, popup) {
            _removePopup(map, popup);
        });
    }

    function _createPopup(lonlat, content, callback) {
        return new OpenLayers.Popup.FramedCloud(
            id=null,
            lonlat=lonlat,
            contentSize=null,
            contentHTML=content,
            anchor={
                    // fix for OpenLayers 2.10 positioning bug
                    size: new OpenLayers.Size(0, 0),
                    offset: new OpenLayers.Pixel(0, -(_size.h/2))
                },
            closeBox=true,
            closeBoxCallback=callback
        )
    }

    function _createMarker(data, map) {
        // WIP
        var marker_layer = map.getLayersByName('Markers')[0];
        if (!marker_layer) {
            marker_layer = new OpenLayers.Layer.Markers("Markers");
            map.addLayer(marker_layer);
        }

        data['marker'] = new OpenLayers.Marker(data['point']);//, icon.clone());

        data['info_windows'] = [];

        jQuery.each(data['tabs'], function(i, tab) {
            // not handling tabs yet
            //var $info_window = new GInfoWindowTab($tab['title'], $tab['node']);
            //$data['info_windows'].push($info_window);
        });

        if (data['info_windows'].length > 1) {
            // not handling tabs yet
            //_addInfoWindowTabs($data['marker'], $data['info_windows']);
        }
        else {
            var marker = data['marker'];
            var marker_lonlat = marker.lonlat;
            var marker_html = jQuery(data['tabs'][0]['node']).html();

            marker.removePopup = function() {
                if (marker.popup != null) {
                    _removePopup(map, marker.popup);
                    marker.popup = null;
                }
            }

            marker.events.register("click", marker, function(evt) {
                jQuery.each(map.popups, function(x, p) {
                    map.removePopup(p);
                });
                marker.popup = _createPopup(lonlat=marker_lonlat,
                                            content=marker_html,
                                            callback=marker.removePopup);
                map.addPopup(marker.popup);
            });
            marker_layer.addMarker(marker);
        }






/*
        for (var j=0; j < $data['tabs'].length; j++) {
            var $tab = $data['tabs'][j];
            var $info_window = new GInfoWindowTab($tab['title'], $tab['node']);
            $data['info_windows'].push($info_window);
        }
        if ($data['info_windows'].length > 1) {
            _addInfoWindowTabs($data['marker'], $data['info_windows']);
        //DONE!:
        } else {
            _addInfoWindow($data['marker'], $data['tabs'][0]['node']);
        }
*/
    }

    function _parseMarkers(markers, map, result) {
        var result = [];
        var data;
        var first_tab = true;

        jQuery.each(markers, function(i, node) {
            var node = jQuery(node);

            if (node.get(0).nodeType != 1) {
                return true;
            };

            if (node.hasClass('title')) {
                node.remove();
                if (data) {
                    _createMarker(data, map);
                    result.push(data);
                };
                data = {};
                data['tabs'] = [];
                var tab = {};
                data['tabs'].push(tab);
                var dl = jQuery('<dl>');
                dl.addClass('mapsMarker');
                dl.append(node);
                tab['node'] = dl;
                first_tab = true;
                var icon = jQuery('img.marker', node);
                if (icon.length > 0) {
                    jQuery(icon.get(0)).remove();
                    alt = icon.get(0).alt;
                };
                return true;
            };

            if (node.hasClass('geo')) {
                node.remove();
                var lat_node = jQuery('.latitude', node);
                var long_node = jQuery('.longitude', node);
                if (lat_node.length > 0 && long_node.length > 0) {
                    var lat_value = parseFloat(lat_node.text());
                    var lon_value = parseFloat(long_node.text());
                    data['point'] = transLatLon(lat_value, lon_value, map);
                }
                return true;
            };

            if (node.hasClass('tab')) {
                node.remove();
                var tab = {};
                if (first_tab) {
                    first_tab = false;
                    tab = data['tabs'][0];
                } else {
                    data['tabs'].push(tab);
                    var dl = jQuery('<dl>');
                    dl.addClass('mapsMarker');
                    tab['node'] = dl;
                }
                jQuery(tab['node']).append(node);
                tab['title'] = node.title;
                return true;
            };

            if (node.hasClass('layers')) {
                node.remove();
                var nodes = jQuery("li", node);
                data['layers'] = {};
                jQuery.each(nodes, function(i, nd) {
                    data['layers'][nd.text()] = true;
                });
                return true;
            };
            node.remove();
            jQuery(data['tabs'][0]['node']).append(node);
        });
        if (data) {
            _createMarker(data, map);
            result.push(data);
        }
        return result;
    }

    function _getLocations(node, map) {
        var lists = jQuery("dl", node);
        var nodes = [];

        // we first have to copy all nodes to a list, because some will be
        // removed and looping over the childNodes directly doesn't work then
        for (var j=0; j < lists.length; j++) {
            for (var k=0; k < lists[j].childNodes.length; k++) {
                nodes.push(lists[j].childNodes[k]);
            }
            lists[j].parentNode.removeChild(lists[j]);
        }
        return _parseMarkers(nodes, map);
    };

    function _getBounds(locations) {
        var bounds = new OpenLayers.Bounds();
        jQuery.each(locations, function(i, location) {
            bounds.extend(location.marker.lonlat);
        });
        return bounds;
    };

    function transLatLon(lat, lon, map) {
        return new OpenLayers.LonLat(lon, lat).transform(
            new OpenLayers.Projection("EPSG:4326"),
            map.getProjectionObject()
        )
    }

    function getFeatureLatLon(feature) {
        var feature_clone = feature.clone()
        return feature_clone.geometry.transform(
            new OpenLayers.Projection("EPSG:900913"),
            new OpenLayers.Projection("EPSG:4326")
        );
    }

    function _initMap(obj) {
        var map_node = jQuery('<div>').addClass('googleMapPane');
        obj.addClass('googleMapActive');
        obj.append(map_node);

        var map = new OpenLayers.Map({
            div: map_node.get(0),
            projection: new OpenLayers.Projection("EPSG:900913"),
            units: "m"
        });

        var osm = new OpenLayers.Layer.OSM();

        map.addLayers([osm]);
        map.addControl(new OpenLayers.Control.LayerSwitcher());

        var locations = _getLocations(obj, map);
        var bounds = _getBounds(locations);
        var center = bounds.getCenterLonLat();

        map.setCenter(center, 4);
    };

/*
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
*/


    function _setupGeocoding(input, map, marker_feature, location) {
        var query = jQuery('<input type="text">');
        var search = jQuery('<input type="button">');
        var form = null;
        var old_submit = null;

        form = jQuery('form[name="edit_form"]').get(0);

        input.get(0).style.display = "none";
        input.get(1).style.display = "none";
        query.attr('value', input.get(0).value + ', ' + input.get(1).value);
        search.attr('value','Search');
        search.addClass('searchButton');

        func = function(e) {
            var address = query.attr('value');
            var _geoSearchFunc = function(data) {
                if (!data || data.length == 0) {
                    var msg = _mapsConfig_google.locationnotfound;
                    msg = msg.replace(/\[LOCATION\]/, address);
                    alert(msg);
                } else {
                    var place = data[0];
                    var place_lonlat = transLatLon(place.lat, place.lng, map);
                    var place_px = map.getPixelFromLonLat(place_lonlat);
                    marker_feature.move(place_px);
                    marker_feature.update_feature_location();
                    input.get(0).value = place.lat;
                    input.get(1).value = place.lng;
                    location.html(place.lat + ", " + place.lng);

                    _clearPopups(map);
                    var popup = _createPopup(lonlat=place_lonlat,
                                              content=data[0].name,
                                              callback=function() {
                                                  _removePopup(map, popup);
                                                });
                    map.addPopup(popup);

                    map.setCenter(place_lonlat, _mapsConfig_google.initialzoomlevel);
                }
            };
            var window_location = window.location.pathname;
            var parent_url = window_location.split('/').slice(0, -1).join('/');
            var geocode_url = parent_url + '/geocode_string';
            jQuery.getJSON(geocode_url, {
                'query': address,
            }, _geoSearchFunc);
            // Prevent "You already submitted this form" message
            var nodes = jQuery('input[type=submit]', form);
            jQuery.each(nodes, function(i, node) {
                jQuery(node).removeClass('submitting');
            })
            return false;
        };
        query.focus(function() {
            if (form) {
                old_submit = form.onsubmit;
                form.onsubmit = func;
            }
        });
        query.blur(function() {
            if (form) {
                form.onsubmit = old_submit;
            }
        });
        search.click(func);

        query.insertBefore(jQuery(input.get(0)).parent());
        search.insertBefore(jQuery(input.get(0)).parent());
    };

    function _initLocationEditMap(node) {
        var input = jQuery('input', node);
        if (input.length != 2)
            return;

        var location = jQuery('<div>').addClass('locationString discreet');
        var map_node = jQuery('<div>').addClass('googleMapPane');
        node.addClass('googleMapActive');
        node.append(map_node);
        node.append(location);

        map_width = parseInt(node.css('width'));
        map_height = parseInt(node.css('height'));
        map_options = {
            div: map_node.get(0),
            projection: new OpenLayers.Projection("EPSG:900913"),
            units: "m"
        }
        if (!isNaN(map_width) && !isNaN(map_height)) {
            map_options['size'] = new OpenLayers.Size(map_width, map_height);
        }

        var map = new OpenLayers.Map(map_options);
        var osm = new OpenLayers.Layer.OSM();
        var vector_layer = new OpenLayers.Layer.Vector("Vector Markers", {
            styleMap: new OpenLayers.StyleMap({
                'default': new OpenLayers.Style(OpenLayers.Util.applyDefaults({
                    externalGraphic: "img/marker.png",
                    graphicOpacity: 1,
                    graphicWidth: _size.w,
                    graphicHeight: _size.h,
                    graphicYOffset: -_size.h
                }, OpenLayers.Feature.Vector.style["default"]))
            })
        });


        map.addLayers([osm, vector_layer]);
        map.addControl(new OpenLayers.Control.LayerSwitcher());
        map.setCenter(transLatLon(48.9, 10.2, map), 4);

        location.html(input.get(0).value + "," + input.get(1).value);
        var center = transLatLon(parseFloat(input.get(0).value),
                                  parseFloat(input.get(1).value), map);
        map.setCenter(center, _mapsConfig_google.initialzoomlevel);

        //$map.setCenter($center, _mapsConfig_google.initialzoomlevel, _defaultmaptype);
        //$map.addControl(new GLargeMapControl());
        //if (_mapsConfig_google.selectablemaptypes) {
        //    $map.addControl(new GMapTypeControl());
        //}

        var vector_point = new OpenLayers.Geometry.Point(center.lon, center.lat);
        var marker_feature = new OpenLayers.Feature.Vector(vector_point);
        vector_layer.addFeatures([marker_feature]);

        marker_feature.update_feature_location = function() {
            latlon = getFeatureLatLon(this);
            input.get(0).value = latlon.y;
            input.get(1).value = latlon.x;
            location.html(latlon.y + ', ' + latlon.x);
        }

        drag_feature = new OpenLayers.Control.DragFeature(vector_layer);
        drag_feature.onComplete = function(feature, pixel) {
            feature.update_feature_location();
        }

        drag_feature.onStart = function(feature, pixel) {
            _clearPopups(map);
        }

        map.addControl(drag_feature);
        drag_feature.activate();

        map.events.register('click', map, function(evt) {
            _clearPopups(map);
            var position = this.events.getMousePosition(evt);
            marker_feature.move(position);
            marker_feature.update_feature_location();
        });


        /*
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
        */
        _setupGeocoding(input, map, marker_feature, location);
    };


    return {
        init: function() {
            _size = new OpenLayers.Size(21, 25); //w,h
            _offset = new OpenLayers.Pixel(-(_size.w/2), -_size.h);

            var maps = jQuery("div.googleMapView");
            maps.each(function(i, obj) {
                _initMap(jQuery(obj));
            });

            var maps = jQuery("div.googleMapEdit");
            maps.each(function(i, obj) {
                _initLocationEditMap(jQuery(obj));
            });

        },
        loadJS: function(url) {
            document.write('<'+'script type="text/javascript" src="'+url+'"><'+'/script>');
        }
    };
}();



// start namespace
var mapsGoogleMaps = function() {
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

        $map_width = parseInt(jq($node).css('width'));
        $map_height = parseInt(jq($node).css('height'));
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
                    _initMap($maps[i]);
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
}();




//mapsOpenLayers.loadJS("/OpenLayers.js");
//registerEventListener(window, 'load', mapsOpenLayers.init);

jQuery(document).ready(function() {
    jQuery.getScript("/OpenLayers.js", mapsOpenLayers.init);
});

//jQuery(window).bind('load', mapsOpenLayers.init);

/*
mapsGoogleMaps.loadJS("http://maps.google.com/maps?file=api&v=2&key="+mapsConfig.google.apikey);
if (mapsConfig.google.ajaxsearchkey) {
    mapsGoogleMaps.loadJS("http://www.google.com/uds/api?file=uds.js&amp;v=1.0&key="+mapsConfig.google.ajaxsearchkey);
}
registerEventListener(window, 'load', mapsGoogleMaps.init);*/
