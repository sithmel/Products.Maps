from cgi import escape

from zope.interface import implements
from zope.component import adapts, getMultiAdapter

from Products.Five.browser import BrowserView

from Products.Maps.interfaces import IRichMarker, IMap, IMapView
from Products.Maps.interfaces import IMapEnabled, IMapEnabledView


class BaseMapView(BrowserView):
    def __init__(self, context, request):
        """ init view """
        self.context = context
        self.request = request
        self.map = IMap(self.context)
        self.config = getMultiAdapter((context, request), name="maps_configuration")
        marker_icons = self.config.marker_icons
        icons = {}
        for icon in marker_icons:
            icons[icon['name']] = icon
        icons['default'] = marker_icons[0]
        self.icons = icons

    def getMarkers(self):
        if self.map is None:
            return
        for x in self.map.getMarkers():
            if x.longitude is not None:
                yield IRichMarker(x)

    def iconTagForMarker(self, marker):
        icon = self.icons.get(marker.icon, None)
        if icon is None:
            icon = self.icons['default']
        tag = '<img src="%s" alt="%s"' % (icon['icon'], escape(icon['name']))
        tag = tag + ' width="%i" height="%i"' % (icon['iconSize'][0], icon['iconSize'][1])
        tag = tag + ' class="marker" />'
        return tag


class DefaultMapView(BaseMapView):
    implements(IMapView)
    adapts(IMapEnabled)

    @property
    def enabled(self):
        if self.map is None:
            return False
        return True


class FolderMapView(BaseMapView):
    implements(IMapView)

    @property
    def enabled(self):
        if self.map is None:
            return False
        if self.context.getLayout() == "maps_map":
            return True
        return False
