from zope.interface import Interface
from zope.interface import Attribute

from Products.Maps.interfaces import IGeoLocation


class IMarker(IGeoLocation):
    """Interface for a map marker
    """

    title = Attribute("Title of this marker")

    description = Attribute("Short description of this marker")

    layers = Attribute("A tuple of names of the layers this marker is in")

    icon = Attribute("Icon for this marker")

    url = Attribute("URL used on the title")


class IRichMarker(IMarker):
    """Interface for a map marker with additional content"""

    related_items = Attribute("Returns a tuple of dictionaries with the keys "
                              "'title', 'url' and an optional 'description'.")

    contents = Attribute("Returns a tuple of dictionaries with the keys "
                         "'title', and 'text', where text is a HTML string.")
