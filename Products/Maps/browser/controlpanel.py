from zope.interface import Interface
from zope.component import adapts
from zope.interface import implements
from zope.formlib.form import FormFields

from zope.schema import Choice
from zope.schema import Tuple
from zope.schema import TextLine
from zope.schema import Bool

from zope.schema.vocabulary import SimpleTerm, SimpleVocabulary

from plone.app.controlpanel.form import ControlPanelForm

from Products.CMFCore.utils import getToolByName
from Products.CMFDefault.formlib.schema import SchemaAdapterBase
from Products.CMFPlone.interfaces import IPloneSiteRoot

from Products.Maps import MapsMessageFactory as _
from Products.Maps.config import *

DEFAULT_MAPTYPE_CHOICES = SimpleVocabulary((
    SimpleTerm('roadmap', 'roadmap',
               _('label_schematic_map',
                 default=u"Schematic map")),
    SimpleTerm('satellite', 'satellite',
               _('label_satellite_map',
                 default=u"Satellite images")),
    SimpleTerm('hybrid', 'hybrid',
               _('label_satellite_schematic_map',
                 default=u"Satellite images with schematic overlay")),
    SimpleTerm('terrain', 'terrain',
               _('label_terrain_map',
                 default=u"Physical relief tiles for displaying elevation and water features (mountains, rivers, etc.)"))
))

class IMapsSchema(Interface):
#    googlemaps_keys = Tuple(
#                        title=_('label_google_maps_api_keys',
#                                default=u'Google Maps API Keys'),
#                        description=_('help_google_maps_api_keys',
#                                      default=u"Add Google Maps API keys. "
#                                               "You have to use the client "
#                                               "side url at which your site "
#                                               "is visible."),
#                        unique=True,
#                        value_type=GoogleAPIKey(
#                            title=_(u'Key'),
#                        ),
#                      )

#    googleajaxsearch_keys = Tuple(
#                        title=_('label_google_ajax_search_api_keys',
#                                default=u'Google AJAX Search API Keys'),
#                        description=_('help_google_ajax_search_api_keys',
#                                      default=u"Add Google AJAX Search API "
#                                               "keys. You have to use the "
#                                               "client side url at which "
#                                               "your site is visible. This "
#                                               "key is used to search for "
#                                               "locations which weren't "
#                                               "found with the default "
#                                               "geocoding from Google Maps."),
#                        unique=True,
#                        value_type=GoogleAPIKey(
#                            title=_(u'Key'),
#                        ),
#                      )

    googlemaps_keys = TextLine(
                        title=_('label_google_maps_api3_key',
                                default=u'Google Maps API3 Key'),
                        description=_('help_google_maps_api3_key',
                                      default=u"Add Google Maps API key."),
                        required=False,
                        default=u'',
                      )

    default_maptype = Choice(
                        title=_('label_default_map_type',
                                default=u'Default map type'),
                        description=_('help_default_map_type',
                                      default=u"Select the default map type "
                                               "initially used on maps."),
                        required=True,
                        vocabulary=DEFAULT_MAPTYPE_CHOICES,
                      )

#    default_location = TextLine(
#                        title=_('label_default_coordinates',
#                                default=u'Default coordinates'),
#                        description=_('help_default_coordinated',
#                                      default=u"Specify the default "
#                                               "coordinates for new "
#                                               "locations."),
#                        default=u'0.0, 0.0',
#                        required=True,
#                       )

    show_contents = Bool(
                        title=_('label_show_contents',
                                    default=u"Show contents"),
                        description=_('help_show_contents',
                                    default=u"Show items\' contents in map "
                                             "pop-up when clicked. "
                                             "Warning: may take up a lot of "
                                             "room on the map area!"),
                        default=True,
                        )

    layers_active = Bool(
                        title=_('label_layers_active',
                                    default=u"Activate layers"),
                        description=_('help_layers_active',
                                    default=u""),
                        default=True,
                        )

    search_active = Bool(
                        title=_('label_search_active',
                                    default=u"Activate search interface"),
                        description=_('help_search_active',
                                    default=u""),
                        default=False,
                        )

class MapsControlPanelAdapter(SchemaAdapterBase):

    adapts(IPloneSiteRoot)
    implements(IMapsSchema)

    def __init__(self, context):
        super(MapsControlPanelAdapter, self).__init__(context)
        properties = getToolByName(context, 'portal_properties')
        self.context = properties.maps_properties

    def get_googlemaps_keys(self):
        return getattr(self.context,
                       PROPERTY_GOOGLE_KEYS_FIELD,
                       "")

    def set_googlemaps_keys(self, value):
        self.context._updateProperty(PROPERTY_GOOGLE_KEYS_FIELD, value)

    googlemaps_keys = property(get_googlemaps_keys,set_googlemaps_keys)

    def get_default_maptype(self):
        return getattr(self.context,
                       PROPERTY_DEFAULT_MAPTYPE_FIELD,
                       "roadmap")

    def set_default_maptype(self, value):
        self.context._updateProperty(PROPERTY_DEFAULT_MAPTYPE_FIELD, value)

    default_maptype = property(get_default_maptype,set_default_maptype)

#    def get_default_location(self):
#        return getattr(self.context,
#                       PROPERTY_DEFAULT_LOCATION_FIELD,
#                       "0.0, 0.0")

#    def set_default_location(self, value):
#        self.context._updateProperty(PROPERTY_DEFAULT_LOCATION_FIELD, value)

#    default_location = property(get_default_location,set_default_location)

    def get_show_contents(self):
        return getattr(self.context, PROPERTY_SHOW_CONTENTS, True)

    def set_show_contents(self, value):
        self.context._updateProperty(PROPERTY_SHOW_CONTENTS, value)

    show_contents = property(get_show_contents,set_show_contents)

    def get_layers_active(self):
        return getattr(self.context, PROPERTY_LAYERS_ACTIVE, True)

    def set_layers_active(self, value):
        self.context._updateProperty(PROPERTY_LAYERS_ACTIVE, value)

    layers_active = property(get_layers_active,set_layers_active)

    def get_search_active(self):
        return getattr(self.context, PROPERTY_SEARCH_ACTIVE, False)

    def set_search_active(self, value):
        self.context._updateProperty(PROPERTY_SEARCH_ACTIVE, value)

    search_active = property(get_search_active,set_search_active)

class MapsControlPanel(ControlPanelForm):

    form_fields = FormFields(IMapsSchema)
    label = _("Maps settings")
    description = None
    form_name = _("Maps settings")
    def _on_save(self, data):
        # This ensures the change is reflected on the served javascripts
        jstool = getToolByName(self.context, 'portal_javascripts')
        jstool.cookResources()
