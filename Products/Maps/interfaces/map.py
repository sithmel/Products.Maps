from zope.interface import Interface
from zope.interface import Attribute


class IMap(Interface):
    """ Interface for maps
    """

    def getMarkers():
        """Returns a list or tuple of markers."""


class IMapEnabledView(Interface):
    """ View to determine whether the map view is enabled
    """

    enabled = Attribute("True if maps display is enabled")

class IMapView(IMapEnabledView):
    """ View for maps
    """

    def getMarkers():
        """Returns a list or tuple of markers."""

    def iconTagForMarker(marker):
        """Returns the img tag for the icon of the marker."""
