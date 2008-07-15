from zope.interface import Interface
from zope.interface import Attribute


class IMapsConfig(Interface):
    """Interface to the configuration of Maps
    """

    googlemaps_key = Attribute("The API key for Google Maps for the current portal URL")

    googleajaxsearch_key = Attribute("The API key for Google AJAX Search for the current portal URL")

    marker_icons = Attribute("A list of dictionaries with infos about marker icons")

    default_location = Attribute("The default coordinates for new locations.")

    default_maptype = Attribute("The default maptype (normal, satellite, hybrid).")
