from zope.interface import implements

from Products.Five.browser import BrowserView

from Products.Maps.config import *
from Products.Maps.interfaces import IMapsConfig
from Products.Maps.validator import LocationFieldValidator

from Products.CMFCore.utils import getToolByName


def getSizeFromString(s):
    values = s.split(",")
    # return a list so the data can be used unchanged in javascript
    return [int(values[0]), int(values[1])]


class MapsConfig(BrowserView):

    implements(IMapsConfig)

    def __init__(self, context, request):
        """ init view """
        self.context = context
        self.request = request
        portal_props = getToolByName(context, 'portal_properties')
        self.properties = getattr(portal_props, PROPERTY_SHEET, None)

    def _search_key(self, property_id):
        if self.properties is None:
            return None
        keys_list = getattr(self.properties, property_id, None)
        if keys_list is None:
            return None
        keys = {}
        for key in keys_list:
            url, key = key.split('|')
            url = url.strip()
            # remove trailing slashes
            url = url.strip('/')
            key = key.strip()
            keys[url] = key
        portal_url_tool = getToolByName(self.context, 'portal_url')
        portal_url = portal_url_tool()
        portal_url = portal_url.split('/')
        while len(portal_url) > 2:
            url = '/'.join(portal_url)
            if keys.has_key(url):
                return keys[url]
            portal_url = portal_url[:-1]
        return None

    @property
    def googlemaps_key(self):
        return self._search_key(PROPERTY_GOOGLE_KEYS_FIELD)

    @property
    def googleajaxsearch_key(self):
        return self._search_key(PROPERTY_GOOGLE_AJAXSEARCH_KEYS_FIELD)

    @property
    def marker_icons(self):
        if self.properties is None:
            return {}
        icons_list = getattr(self.properties, PROPERTY_MARKERS_FIELD, None)
        if icons_list is None:
            return {}
        portal_url_tool = getToolByName(self.context, 'portal_url')
        portal_url = portal_url_tool()
        icons = []
        for icon in icons_list:
            parts = icon.split("|")
            if parts[0].strip() == "Name":
                continue
            data = {
                'name': parts[0].strip(),
                'icon': "%s/%s" % (portal_url, parts[1].strip()),
                'iconSize': getSizeFromString(parts[2]),
                'iconAnchor': getSizeFromString(parts[3]),
                'infoWindowAnchor': getSizeFromString(parts[4]),
                'shadow': "%s/%s" % (portal_url, parts[5].strip()),
                'shadowSize': getSizeFromString(parts[6]),
                'infoShadowAnchor': getSizeFromString(parts[7]),
            }
            icons.append(data)
        return icons

    @property
    def default_location(self):
        if self.properties is None:
            return (0.0, 0.0)
        default_location = getattr(self.properties,
                                   PROPERTY_DEFAULT_LOCATION_FIELD,
                                   (0.0, 0.0))
        if isinstance(default_location, basestring):
            default_location = default_location.split(',')
        validator = LocationFieldValidator('default_location')
        if validator(default_location) != 1:
            return (0.0, 0.0)
        return default_location

    @property
    def default_maptype(self):
        if self.properties is None:
            return "normal"
        default_maptype = getattr(self.properties,
                                   PROPERTY_DEFAULT_MAPTYPE_FIELD,
                                   "normal")
        return default_maptype
