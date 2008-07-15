from zope.interface import Interface
from zope.interface import Attribute
from zope.schema import Float


class IGeoLocation(Interface):
    """ geographic location cordinates
    """

    latitude = Float(
        title=u"Latitude",
        description=u"",
        required = False,
    )

    longitude = Float(
        title=u"Longitude",
        description=u"",
        required = False,
    )
