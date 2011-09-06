from zope.interface import Interface
from zope.interface import Attribute


class IMapsConfig(Interface):
    """Interface to the configuration of Maps
    """
    marker_icons = Attribute("A list of dictionaries with infos about marker icons")

    default_location = Attribute("The default coordinates for new locations.")
