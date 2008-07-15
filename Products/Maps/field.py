from AccessControl import ClassSecurityInfo

from Products.Archetypes import atapi
from Products.Archetypes.Widget import TypesWidget
from Products.Archetypes.Field import ObjectField
from Products.Archetypes.Registry import registerWidget, registerField


class LocationWidget(TypesWidget):

    _properties = TypesWidget._properties.copy()
    _properties.update({
        'type': 'map',
        'macro': 'maps_map_widget',
    })

    security = ClassSecurityInfo()

registerWidget(
    LocationWidget,
    title='Geological coordinates',
    used_for=('Products.Archetypes.Field.StringField',)
)


class LocationField(ObjectField):
    """A field that stores strings"""
    _properties = ObjectField._properties.copy()
    _properties.update({
        'type' : 'string',
        'widget' : LocationWidget,
        'default': (0.0, 0.0),
        'default_content_type' : 'text/plain',
        })

    security  = ClassSecurityInfo()

    security.declarePrivate('get')
    def get(self, instance, **kwargs):
        return ObjectField.get(self, instance, **kwargs)

    security.declarePrivate('getRaw')
    def getRaw(self, instance, **kwargs):
        return self.get(instance, **kwargs)

    security.declarePrivate('set')
    def set(self, instance, value, **kwargs):
        """Convert passed-in value to a float. If failure, set value to
        None."""
        if value is not None:
            # should really blow if value is not valid
            __traceback_info__ = (self.getName(), instance, value, kwargs)
            value = (float(value[0]), float(value[1]))
        self.getStorage(instance).set(self.getName(), instance, value, **kwargs)


registerField(LocationField,
              title="LocationField",
              description=("Field that can store coordinate information")
)

# Zope 3

from zope.interface import implements
from zope.schema import ASCIILine

from Products.Maps.interfaces import IGoogleAPIKey


class GoogleAPIKey(ASCIILine):
    __doc__ = IGoogleAPIKey.__doc__
    implements(IGoogleAPIKey)
