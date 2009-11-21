from zope.interface import implements

from Products.validation import validation
from Products.validation.interfaces import ivalidator
from Products.validation.interfaces.IValidator import IValidator

try: 
    # Plone 4 and higher
    import plone.app.upgrade
    USE_BBB_VALIDATORS = False
except ImportError:
    # BBB Plone 3
    USE_BBB_VALIDATORS = True


class LocationFieldValidator:

    if USE_BBB_VALIDATORS:
        __implements__ = (ivalidator,)
    else:
        implements(IValidator)

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

validation.register(LocationFieldValidator('isGeoLocation'))
