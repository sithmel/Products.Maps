#
# MapsTestCase Skeleton
#
from Products.Maps.behaviors.mappable import defaultLocation
from Products.Maps.behaviors.mappable import getMarkerIconVocab
from plone.app.textfield.value import RichTextValue
from Products.Maps.tests import MapsTestCase

from Products.Maps.interfaces import IGeoLocation, IMarker, IRichMarker
from Products.Maps.interfaces import IMapView
from Products.Maps.content import dx_location

from zope.interface.verify import verifyClass, verifyObject


class TestLocation(MapsTestCase.MapsTestCase):

    def testLocationTypeAddable(self):
        self.folder.invokeFactory('GeoLocation', 'mylocation')

    def testInterfaces(self):
        self.assertTrue(IGeoLocation.implementedBy(dx_location.LocationMarker))
        self.assertTrue(verifyClass(IGeoLocation, dx_location.LocationMarker))
        self.assertTrue(IMarker.implementedBy(dx_location.LocationMarker))
        self.assertTrue(verifyClass(IMarker, dx_location.LocationMarker))
        self.assertTrue(IRichMarker.implementedBy(dx_location.LocationMarker))
        self.assertTrue(verifyClass(IRichMarker, dx_location.LocationMarker))

    def testAdaption(self):
        icon = [t for t in getMarkerIconVocab(self.folder)][0].value
        self.folder.invokeFactory('GeoLocation', 'mylocation',
                                  geolocation=defaultLocation(self.folder),
                                  icon=icon,
                                  text=RichTextValue(
                                      u'Lorem ipsum',
                                      'text/plain',
                                      'text/html'
                                  ))
        mylocation = IRichMarker(self.folder.mylocation)
        self.assertTrue(IGeoLocation.providedBy(mylocation))
        self.assertTrue(verifyObject(IGeoLocation, mylocation))
        self.assertTrue(IMarker.providedBy(mylocation))
        self.assertTrue(verifyObject(IMarker, mylocation))
        self.assertTrue(IRichMarker.providedBy(mylocation))
        self.assertTrue(verifyObject(IRichMarker, mylocation))

    def testGoogleMapView(self):
        self.folder.invokeFactory('GeoLocation', 'mylocation')
        map_view = self.folder.mylocation.restrictedTraverse('@@maps_googlemaps_view')
        self.assertTrue(IMapView.providedBy(map_view))
        self.assertTrue(verifyObject(IMapView, map_view))
