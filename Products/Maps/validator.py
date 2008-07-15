from Products.validation.interfaces import ivalidator

class LocationFieldValidator:

    __implements__ = (ivalidator,)

    def __init__(self, name):
        self.name = name

    def __call__(self, value, *args, **kwargs):
        try:
            if isinstance(value, basestring):
                value = value.split(",", 1)
            value = (float(value[0]), float(value[1]))
        except (ValueError, TypeError):
            return """ Validation failed. Coordinates must be an decimal numbers. """
        if not (-90  <= value[0] <= 90 ):
            return """ Validation failed. Latitude not in bounds [-90, 90]. """
        if not (-180 <= value[1] <= 180):
            return """ Validation failed. Longitude not in bounds [-180, 180]. """
        return 1
