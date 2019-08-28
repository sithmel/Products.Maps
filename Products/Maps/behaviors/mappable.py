# TODO: figure out how to provide maps_googlemaps_enabled_view
# for an add form when the addable has this behavior.


from plone.autoform.interfaces import IFormFieldProvider
from plone.dexterity.interfaces import IDexterityContent
from plone.formwidget.geolocation.geolocation import Geolocation
from plone.formwidget.geolocation.field import GeolocationField
from plone.supermodel import model
from Products.Five.browser import BrowserView
from Products.Five.utilities.marker import mark
from Products.Maps.interfaces import IMapEnabled
from Products.Maps.interfaces import IMarker
from zope import schema
from zope.component import adapter
from zope.component import getMultiAdapter
from zope.globalrequest import getRequest
from zope.interface import implementer
from zope.interface import Interface
from zope.interface import provider
from zope.schema.interfaces import IContextAwareDefaultFactory
from zope.schema.interfaces import IContextSourceBinder
from zope.schema.vocabulary import SimpleVocabulary

from Products.Maps import MapsMessageFactory as _


@provider(IContextAwareDefaultFactory)
def defaultLocation(context):
    config = getMultiAdapter(
        (context, getRequest()), name="maps_configuration")
    lat, lon = [float(s) for s in config.default_location.split(',')]
    return Geolocation(lat, lon)


@provider(IContextSourceBinder)
def getMarkerIconVocab(context):
    config = getMultiAdapter(
        (context, getRequest()), name="maps_configuration")
    marker_icons = config.marker_icons
    terms = []
    for icon in marker_icons:
        if icon['name'].startswith('_'):
            continue
        terms.append(SimpleVocabulary.createTerm(icon['name'], icon['name']))
    return SimpleVocabulary(terms)


@provider(IFormFieldProvider)
class IMappable(model.Schema):
    """
       Marker/Form interface for Mappable
    """

    icon = schema.Choice(
        title=_(u"Map Marker"),
        source=getMarkerIconVocab,
        required=True,
    )

    geolocation = GeolocationField(
        title=_('label_geolocation', default=u'Geolocation'),
        description=_('help_geolocation',
                      default=u'Click on the map to select a location, or '
                              u'use the text input to search by address.'),
        required=False,
        defaultFactory=defaultLocation,
    )


class IMappableMarker(Interface):
    """Marker interface that will be provided by instances using the
       IMappable behavior.
       We use this to provide an adapter to IMarker and adapter
       and a BrowserView that shows we're enabled.
    """


def context_property(name):
    def getter(self):
        return getattr(self.context, name, None)

    def setter(self, value):
        setattr(self.context, name, value)

    def deleter(self):
        delattr(self.context, name)
    return property(getter, setter, deleter)


@implementer(IMappable)
@adapter(IDexterityContent)
class Mappable(object):
    """
       Adapter for Mappable; provides geolocation property
    """

    def __init__(self, context):
        self.context = context
        mark(context, IMapEnabled)

    geolocation = context_property('geolocation')

    icon = context_property('icon')


@implementer(IMarker)
@adapter(IMappableMarker)
class Marker(object):
    """ Get a marker from a mappable
    """

    def __init__(self, context):
        self.context = context

    @property
    def latitude(self):
        return self.context.geolocation.latitude

    @property
    def longitude(self):
        return self.context.geolocation.longitude

    @property
    def title(self):
        return self.context.title

    @property
    def description(self):
        return self.context.description

    @property
    def layers(self):
        return None

    @property
    def icon(self):
        return self.context.icon

    @property
    def url(self):
        return self.context.absolute_url()


class MapView(BrowserView):
    """ browser page maps_googlemaps_enabled_view
        This exists just to return enabled so
        that we get the javascript support.
    """

    @property
    def enabled(self):
        return True
