from zope.interface import implementer
from zope.component import adapter

from Products.Maps.interfaces import IGeoLocation, IMarker, IRichMarker, IMap

from Products.CMFPlone.utils import base_hasattr

try:
    from plone.app.collection.interfaces import ICollection
except ImportError:
    ICollection = None


@implementer(IMap)
class BaseMap(object):

    def __init__(self, context):
        self.context = context

    def getMarkers(self):
        results = []
        for item in self._getItems():
            marker = IMarker(item, None)
            if marker is None:
                if base_hasattr(item, 'getObject'):
                    marker = IMarker(item.getObject(), None)
            if marker is not None:
                results.append(marker)
        return results


if ICollection:
    @adapter(ICollection)
    class CollectionMap(BaseMap):
    
        def _getItems(self):
            return self.context.queryCatalog()


@implementer(IGeoLocation)
class GeoLocation(object):

    def __init__(self, context):
        self.context = context

    @property
    def latitude(self):
        location = self.context.getRawGeolocation()
        return location[0]

    @property
    def longitude(self):
        location = self.context.getRawGeolocation()
        return location[1]


@implementer(IMap)
class ContextMap(object):

    def __init__(self, context):
        self.context = context

    def getMarkers(self):
        yield IGeoLocation(self.context)


@implementer(IRichMarker)
@adapter(IMarker)
class RichMarker(object):

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
