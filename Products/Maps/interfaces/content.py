from zope.interface import Interface


class ILocation(Interface):
    """Interface for content with a 'geolocation' field."""

    def getMarkerIcon():
        """ Returns name of marker icon. Allowed values are defined
            in maps_properties/map_markers property. 
            Method should return 'Red Marker' for example.
        """