from zope.interface import Interface
from zope.component import adapts
from zope.interface import implements
from zope.formlib.form import FormFields

from zope.schema import Choice
from zope.schema import Tuple
from zope.schema import TextLine

from zope.schema.vocabulary import SimpleTerm, SimpleVocabulary

from plone.app.controlpanel.form import ControlPanelForm

from Products.CMFCore.utils import getToolByName
from Products.CMFDefault.formlib.schema import SchemaAdapterBase
from Products.CMFPlone.interfaces import IPloneSiteRoot

from Products.Maps import MapsMessageFactory as _
from Products.Maps.config import *

DEFAULT_MAPTYPE_CHOICES = SimpleVocabulary((
    SimpleTerm('normal', 'normal',
               _('label_schematic_map',
                 default=u"Schematic map")),
    SimpleTerm('satellite', 'satellite',
               _('label_satellite_map',
                 default=u"Satellite images")),
    SimpleTerm('hybrid', 'hybrid',
               _('label_satellite_schematic_map',
                 default=u"Satellite images with schematic overlay")),
))


class IMapsSchema(Interface):

    default_location = TextLine(
                        title=_('label_default_coordinates',
                                default=u'Default coordinates'),
                        description=_('help_default_coordinated',
                                      default=u"Specify the default "
                                               "coordinates for new "
                                               "locations."),
                        default=u'0.0, 0.0',
                        required=True,
                       )


class MapsControlPanelAdapter(SchemaAdapterBase):

    adapts(IPloneSiteRoot)
    implements(IMapsSchema)

    def __init__(self, context):
        super(MapsControlPanelAdapter, self).__init__(context)
        properties = getToolByName(context, 'portal_properties')
        self.context = properties.maps_properties

    def get_default_location(self):
        return getattr(self.context,
                       PROPERTY_DEFAULT_LOCATION_FIELD,
                       "0.0, 0.0")

    def set_default_location(self, value):
        self.context._updateProperty(PROPERTY_DEFAULT_LOCATION_FIELD, value)

    default_location = property(get_default_location,set_default_location)


class MapsControlPanel(ControlPanelForm):

    form_fields = FormFields(IMapsSchema)
    label = _("Maps settings")
    description = None
    form_name = _("Maps settings")
    def _on_save(self, data):
        # This ensures the change is reflected on the served javascripts
        jstool = getToolByName(self.context, 'portal_javascripts')
        jstool.cookResources()
