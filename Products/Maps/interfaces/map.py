from zope.interface import Interface
from zope.interface import Attribute


class IMapEnabled(Interface):
    """Marker interface for content which should have the Maps JavaScript
       enabled.

       This is used for the default adapter, a more specific adapter may
       override the 'enabled' implementation for IMapEnabledView.
    """


class IMapEnabledView(Interface):
    """ View to determine whether the map view is enabled
    """

    enabled = Attribute("True if maps display is enabled")


class IMap(Interface):
    """ Interface for maps
    """

    def getMarkers():
        """Returns an iterable of markers."""


class IMapView(IMapEnabledView):
    """ View for maps
    """

    def getMarkers():
        """Returns an iterable of markers."""

    def iconTagForMarker(marker):
        """Returns the img tag for the icon of the marker."""
