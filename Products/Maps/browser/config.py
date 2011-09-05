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
