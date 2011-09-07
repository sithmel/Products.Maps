var mapsOpenLayers = function () {

    var _size = null;
    var _offset = null;
    var _markericons = null;

    var _mapsConfig = mapsConfig;
    var _mapsConfig_openlayers = _mapsConfig.openlayers;


    function _createIcon(definition) {
        var icon_size = new OpenLayers.Size(
            parseInt(definition['iconSize'][0]),
            parseInt(definition['iconSize'][1]));
        var icon_offset = new OpenLayers.Pixel(-(icon_size.w/2), -icon_size.h);
        return new OpenLayers.Icon(definition['icon'], icon_size, icon_offset);
    }

    function _initDefaults(defaults) {
        _size = new OpenLayers.Size(21, 25); //w,h
        _offset = new OpenLayers.Pixel(-(_size.w/2), -_size.h);

        if (_markericons === null) {
            _markericons = {};

            jQuery.each(defaults.markericons, function(i, definition) {
                _markericons[definition['name']] = _createIcon(definition);
            });
        }
    }

    function _removePopup(map, popup) {
        map.removePopup(popup);
    }

    function _clearPopups(map) {
        jQuery.each(map.popups, function(i, popup) {
            _removePopup(map, popup);
        });
    }

    function _createPopup(lonlat, content, callback) {
        var id = contentSize = null;
        var closeBox = true;
        var popupAnchor = {
            // fix for OpenLayers 2.10 positioning bug
            size: new OpenLayers.Size(0, 0),
            offset: new OpenLayers.Pixel(0, -(_size.h/2))
        };
        return new OpenLayers.Popup.FramedCloud(id, lonlat, contentSize, content, popupAnchor, closeBox, callback);
    }

    function _createMarker(data, map) {
        var marker_layer = map.getLayersByName('Markers')[0];
        if (!marker_layer) {
            marker_layer = new OpenLayers.Layer.Markers("Markers");
            map.addLayer(marker_layer);
        }

        data['marker'] = new OpenLayers.Marker(data['point'], data['icon']);

        var marker = data['marker'];
        var marker_lonlat = marker.lonlat;
        var marker_html = '';

        jQuery.each(data['tabs'], function(i, tab) {
            marker_html += tab['node'].html();
        });

        marker.removePopup = function() {
            if (marker.popup !== null) {
                _removePopup(map, marker.popup);
                marker.popup = null;
            }
        };

        marker.events.register("click", marker, function(evt) {
            jQuery.each(map.popups, function(x, p) {
                map.removePopup(p);
            });
            marker.popup = _createPopup(marker_lonlat,
                                        marker_html,
                                        marker.removePopup);
            map.addPopup(marker.popup);
        });
        marker_layer.addMarker(marker);
    }

    function _parseMarkers(markers, map, result) {
        var result = [];
        var data;
        var first_tab = true;

        jQuery.each(markers, function(i, node) {
            var node = jQuery(node);

            if (node.get(0).nodeType != 1) {
                return true;
            }

            if (node.hasClass('title')) {
                node.remove();
                if (data) {
                    _createMarker(data, map);
                    result.push(data);
                }
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
                    icon = _markericons[alt];
                    data['icon'] = icon.clone();
                }
                return true;
            }

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
            }

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
                tab['title'] = node.attr('title');
                return true;
            }

            if (node.hasClass('layers')) {
                node.remove();
                var nodes = jQuery("li", node);
                data['layers'] = {};
                jQuery.each(nodes, function(i, nd) {
                    data['layers'][nd.text()] = true;
                });
                return true;
            }
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
    }

    function _getBounds(locations) {
        var bounds = new OpenLayers.Bounds();
        jQuery.each(locations, function(i, location) {
            bounds.extend(location.marker.lonlat);
        });
        return bounds;
    }

    function transLatLon(lat, lon, map) {
        return new OpenLayers.LonLat(lon, lat).transform(
            new OpenLayers.Projection("EPSG:4326"),
            map.getProjectionObject()
        );
    }

    function getFeatureLatLon(feature) {
        var feature_clone = feature.clone();
        return feature_clone.geometry.transform(
            new OpenLayers.Projection("EPSG:900913"),
            new OpenLayers.Projection("EPSG:4326")
        );
    }

    function _initMap(obj) {
        var map_node = jQuery('<div>').addClass('openlayersMapPane');
        obj.addClass('openlayersMapActive');
        obj.append(map_node);

        var map = new OpenLayers.Map({
            div: map_node.get(0),
            projection: new OpenLayers.Projection("EPSG:900913"),
            units: "m"
        });

        var osm = new OpenLayers.Layer.OSM();

        map.addLayers([osm]);

        var locations = _getLocations(obj, map);
        var bounds = _getBounds(locations);
        var center = bounds.getCenterLonLat();

        var zoom_level = map.getZoomForExtent(bounds);
        if (zoom_level > _mapsConfig_openlayers.maxzoomlevel) {
            zoom_level = _mapsConfig_openlayers.maxzoomlevel;
        }

        map.setCenter(center, zoom_level);
    }

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
                if (!data || data.length === 0) {
                    var msg = _mapsConfig_openlayers.locationnotfound;
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
                    var popup_callback = function() {
                        _removePopup(map, popup);
                    };
                    var popup = _createPopup(place_lonlat, data[0].name, popup_callback);
                    map.addPopup(popup);
                    map.setCenter(place_lonlat, _mapsConfig_openlayers.initialzoomlevel);
                }
            };
            var window_location = window.location.pathname;
            var parent_url = window_location.split('/').slice(0, -1).join('/');
            var geocode_url = parent_url + '/geocode_string';
            jQuery.getJSON(geocode_url, {
                'query': address
            }, _geoSearchFunc);
            // Prevent "You already submitted this form" message
            var nodes = jQuery('input[type=submit]', form);
            jQuery.each(nodes, function(i, node) {
                jQuery(node).removeClass('submitting');
            });
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
    }

    function _initLocationEditMap(node) {
        var input = jQuery('input', node);
        if (input.length != 2) {
            return;
        }

        var location = jQuery('<div>').addClass('locationString discreet');
        var map_node = jQuery('<div>').addClass('openlayersMapPane');
        node.addClass('openlayersMapActive');
        node.append(map_node);
        node.append(location);

        map_width = parseInt(node.css('width'));
        map_height = parseInt(node.css('height'));
        map_options = {
            div: map_node.get(0),
            projection: new OpenLayers.Projection("EPSG:900913"),
            units: "m"
        };
        if (!isNaN(map_width) && !isNaN(map_height)) {
            map_options['size'] = new OpenLayers.Size(map_width, map_height);
        }

        var markerIconValue = jQuery('#markerIcon').attr('value');
        var marker_icon = _markericons[markerIconValue];

        var map = new OpenLayers.Map(map_options);
        var osm = new OpenLayers.Layer.OSM();

        var vector_layer = new OpenLayers.Layer.Vector("Vector Markers", {
            styleMap: new OpenLayers.StyleMap({
                'default': new OpenLayers.Style(OpenLayers.Util.applyDefaults({
                    'externalGraphic': marker_icon.url,
                    'graphicOpacity': 1,
                    'graphicWidth': marker_icon.size.w,
                    'graphicHeight': marker_icon.size.h,
                    'graphicYOffset': marker_icon.offset.y
                }, OpenLayers.Feature.Vector.style["default"]))
            })
        });

        map.addLayers([osm, vector_layer]);

        location.html(input.get(0).value + "," + input.get(1).value);
        var center = transLatLon(parseFloat(input.get(0).value),
                                  parseFloat(input.get(1).value), map);
        map.setCenter(center, _mapsConfig_openlayers.initialzoomlevel);

        var vector_point = new OpenLayers.Geometry.Point(center.lon, center.lat);
        var marker_feature = new OpenLayers.Feature.Vector(vector_point);
        vector_layer.addFeatures([marker_feature]);

        marker_feature.update_feature_location = function() {
            var latlon = getFeatureLatLon(this);
            input.get(0).value = latlon.y;
            input.get(1).value = latlon.x;
            location.html(latlon.y + ', ' + latlon.x);
        };

        drag_feature = new OpenLayers.Control.DragFeature(vector_layer);
        drag_feature.onComplete = function(feature, pixel) {
            feature.update_feature_location();
        };

        drag_feature.onStart = function(feature, pixel) {
            _clearPopups(map);
        };

        map.addControl(drag_feature);
        drag_feature.activate();

        map.events.register('click', map, function(evt) {
            _clearPopups(map);
            var position = this.events.getMousePosition(evt);
            marker_feature.move(position);
            marker_feature.update_feature_location();
        });
        _setupGeocoding(input, map, marker_feature, location);
    }

    return {
        init: function() {
            _initDefaults(_mapsConfig_openlayers);

            var maps = jQuery("div.openlayersMapView");
            maps.each(function(i, obj) {
                _initMap(jQuery(obj));
            });

            var maps = jQuery("div.openlayersMapEdit");
            maps.each(function(i, obj) {
                _initLocationEditMap(jQuery(obj));
            });

        }
    };
}();

jQuery(window).load(function() {
    jQuery.getScript("/OpenLayers.js", mapsOpenLayers.init);
});
