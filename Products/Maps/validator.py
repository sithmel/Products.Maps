from zope.interface import implements

from Products.validation import validation
from Products.validation.interfaces import ivalidator
from Products.validation.interfaces.IValidator import IValidator

from Products.Maps.utils import validate_location

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
        return validate_location(value)


validation.register(LocationFieldValidator('isGeoLocation'))
