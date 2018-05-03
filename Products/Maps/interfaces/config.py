from zope.interface import Interface
from zope.interface import Attribute


class IMapsConfig(Interface):
    """Interface to the configuration of Maps
    """
    googlemaps_keys = Attribute("The API key for Google Maps for the current portal URL")

    marker_icons = Attribute("A list of dictionaries with infos about marker icons")

#    default_location = Attribute("The default coordinates for new locations.")

    default_maptype = Attribute("The default maptype (normal, satellite, hybrid).")

    show_contents = Attribute("Show contents")

    layers_active = Attribute("Show layers")

    search_active = Attribute("Show search interface")
