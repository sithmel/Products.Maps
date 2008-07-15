from zope.interface import implements
from zope.component import adapts

from Products.Maps.interfaces import IGeoLocation, IMarker, IRichMarker, IMap

from Products.CMFPlone.utils import base_hasattr


class SmartFolderMap(object):
    implements(IMap)

    def __init__(self, context):
        self.context = context

    def getMarkers(self):
        rawresults = self.context.queryCatalog()
        results = []
        for item in rawresults:
            marker = IMarker(item, None)
            if marker is None:
                if base_hasattr(item, 'getObject'):
                    marker = IMarker(item.getObject(), None)
            if marker is not None:
                results.append(marker)
        return results


class FolderMap(object):
    implements(IMap)

    def __init__(self, context):
        self.context = context

    def getMarkers(self):
        rawresults = self.context.getFolderContents()
        results = []
        for item in rawresults:
            marker = IMarker(item, None)
            if marker is None:
                if base_hasattr(item, 'getObject'):
                    marker = IMarker(item.getObject(), None)
            if marker is not None:
                results.append(marker)
        return results


class RichMarker(object):
    adapts(IMarker)
    implements(IRichMarker)

    def __init__(self, context):
        self.context = context

    @property
    def latitude(self):
        return self.context.latitude

    @property
    def longitude(self):
        return self.context.longitude

    @property
    def title(self):
        return self.context.title

    @property
    def description(self):
        return self.context.description

    @property
    def layers(self):
        return self.context.layers

    @property
    def icon(self):
        return self.context.icon

    @property
    def url(self):
        return self.context.url

    @property
    def related_items(self):
        return tuple()

    @property
    def contents(self):
        return tuple()


class qPloneGoogleMapsMarker(object):
    implements(IGeoLocation, IMarker)

    def __init__(self, context):
        self.context = context

    @property
    def latitude(self):
        location = self.context.getRawLocation()
        return location[0]

    @property
    def longitude(self):
        location = self.context.getRawLocation()
        return location[1]

    @property
    def title(self):
        return self.context.Title()

    @property
    def description(self):
        return self.context.Description()

    @property
    def layers(self):
        return self.context.Subject()

    @property
    def icon(self):
        color = self.context.getColor()
        if color == 'green':
            return "Green Marker"
        elif color == 'blue':
            return "Blue Marker"
        else:
            return "Red Marker"

    @property
    def url(self):
        return self.context.absolute_url()


try:
    from Products.geolocation.interfaces.geolocation import IGEOLocated
except ImportError:
    IGEOLocated = None

class GEOLocatedMarker(object):
    implements(IGeoLocation, IMarker)

    def __init__(self, context):
        self.context = context
        if IGEOLocated is not None:
            self.adapter = IGEOLocated(context, None)
        else:
            self.adapter = None

    @property
    def latitude(self):
        if self.adapter is not None:
            return self.adapter.getLatitude()

    @property
    def longitude(self):
        if self.adapter is not None:
            return self.adapter.getLongitude()

    @property
    def title(self):
        return self.context.Title()

    @property
    def description(self):
        return self.context.Description()

    @property
    def layers(self):
        return self.context.Subject()

    @property
    def icon(self):
        return "Red Marker"

    @property
    def url(self):
        return self.context.absolute_url()
