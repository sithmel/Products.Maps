from zope.interface import implements
from zope.component import adapts, getMultiAdapter

from AccessControl import Unauthorized
from AccessControl import ClassSecurityInfo
try:
    from Products.LinguaPlone.public import *
except ImportError:
    # No multilingual support
    from Products.Archetypes.public import *
from Products.CMFPlone.utils import base_hasattr
from Products.ATContentTypes.atct import *
from Products.ATContentTypes.content.schemata import finalizeATCTSchema
from Products.ATContentTypes.configuration import zconf

from Products.Maps.config import *
from Products.Maps import validator # Force registration of validator
from Products.Maps import MapsMessageFactory as _

from Products.Maps.adapters import GeoLocation
from Products.Maps.field import LocationWidget, LocationField
from Products.Maps.interfaces import ILocation
from Products.Maps.interfaces import IRichMarker, IMapEnabled


LocationSchema = ATContentTypeSchema.copy() + Schema(
    (
        LocationField(
            'geolocation',
            languageIndependent = 1,
            default_method="getDefaultLocation",
            required=True,
            validators=('isGeoLocation',),
            widget=LocationWidget(
                label='Location',
                label_msgid='label_geolocation',
                description_msgid='help_geolocation',
                i18n_domain='maps',
            ),
        ),

        StringField(
            'markerIcon',
            languageIndependent = 1,
            vocabulary="getMarkerIconVocab",
            enforceVocabulary=True,
            widget=SelectionWidget(
                format="select",
                label='Marker icon',
                label_msgid='label_markericon',
                description_msgid='help_markericon',
                i18n_domain='maps',
            ),
        ),

        TextField('text',
            searchable=True,
            primary=True,
            storage = AnnotationStorage(migrate=True),
            validators = ('isTidyHtmlWithCleanup',),
            default_content_type = zconf.ATDocument.default_content_type,
            default_output_type = 'text/x-html-safe',
            allowable_content_types = zconf.ATDocument.allowed_content_types,
            widget = RichWidget(
                description = "",
                description_msgid = "help_body_text",
                label = "Body Text",
                label_msgid = "label_body_text",
                rows = 25,
                i18n_domain = "plone",
                allow_file_upload = zconf.ATDocument.allow_document_upload
            ),
        ),
    ), marshall = RFC822Marshaller()
)
finalizeATCTSchema(LocationSchema)


class Location(ATCTContent):
    """Location content type.
    """

    implements(IMapEnabled, ILocation)

    schema = LocationSchema

    meta_type = portal_type = archetype_name = 'Location'
    content_icon   = 'location_icon.gif'
    meta_type      = 'GeoLocation'
    portal_type    = 'GeoLocation'
    archetype_name = 'Location'
    default_view   = 'maps_map'
    immediate_view = 'maps_map'
    suppl_views    = ()

    security = ClassSecurityInfo()

    security.declarePublic("getMarkerIconVocab")
    def getMarkerIconVocab(self):
        config = getMultiAdapter((self, self.REQUEST), name="maps_configuration")
        marker_icons = config.marker_icons
        result = DisplayList()
        for icon in marker_icons:
            if icon['name'].startswith('_'): continue
            result.add(icon['name'], icon['name'])
        return result

    security.declarePublic("getDefaultLocation")
    def getDefaultLocation(self):
        config = getMultiAdapter((self, self.REQUEST), name="maps_configuration")
        return config.default_location.split(',')
        #return [0,0]

registerType(Location, PROJECTNAME)


class LocationMarker(GeoLocation):
    implements(IRichMarker)
    adapts(ILocation)

    @property
    def title(self):
        return self.context.Title()

    @property
    def description(self):
        return self.context.Description()

    @property
    def layers(self):
        try:
            return self.context.getValidMapLayers()
        except AttributeError:
            return self.context.Subject()

    @property
    def icon(self):
        return self.context.getMarkerIcon()

    @property
    def url(self):
        return self.context.absolute_url()

    def computeRelatedItems(self):
        # BBB: re-implementation of the old computeRelatedItems CMF python script.
        # We can do it better
        context = self.context
        if base_hasattr(context, 'getRelatedItems'):
            outgoing = context.getRelatedItems()
            incoming = []
            # if you want to show up the items which point to this one, too, then use the
            # line below
            #incoming = context.getBRefs('relatesTo') 
            res = []
            mtool = context.portal_membership

            in_out = outgoing+incoming
            for d in range(len(in_out)):
                try:
                    obj = in_out[d]
                except Unauthorized:
                    continue
                if obj not in res:
                    if mtool.checkPermission('View', obj):
                        res.append(obj)
            return res

    @property
    def related_items(self):
        related = self.computeRelatedItems()
        result = []
        for obj in related:
            result.append({'title': obj.Title(),
                           'url': obj.absolute_url(),
                           'description': obj.Description()})
        return tuple(result)

    @property
    def contents(self):
        text = self.context.getText(mimetype="text/plain").strip()
        if text:
            return ({'title': _("Info"),
                     'text': self.context.getText()},)
