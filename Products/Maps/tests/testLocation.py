#
# MapsTestCase Skeleton
#

from Products.Maps.tests import MapsTestCase

from Products.Maps.interfaces import IGeoLocation, IMarker, IRichMarker
from Products.Maps.interfaces import IMapView
from Products.Maps.content import Location
from Products.CMFCore.utils import getToolByName

from zope.interface.verify import verifyClass, verifyObject


class TestLocation(MapsTestCase.MapsTestCase):

    def testLocationTypeAddable(self):
        self.folder.invokeFactory('GeoLocation', 'mylocation')

    def testInterfaces(self):
        self.assertTrue(IGeoLocation.implementedBy(Location.LocationMarker))
        self.failUnless(verifyClass(IGeoLocation, Location.LocationMarker))
        self.failUnless(IMarker.implementedBy(Location.LocationMarker))
        self.failUnless(verifyClass(IMarker, Location.LocationMarker))
        self.failUnless(IRichMarker.implementedBy(Location.LocationMarker))
        self.failUnless(verifyClass(IRichMarker, Location.LocationMarker))

    def testAdaption(self):
        self.folder.invokeFactory('GeoLocation', 'mylocation')
        mylocation = IRichMarker(self.folder.mylocation)
        self.failUnless(IGeoLocation.providedBy(mylocation))
        self.failUnless(verifyObject(IGeoLocation, mylocation))
        self.failUnless(IMarker.providedBy(mylocation))
        self.failUnless(verifyObject(IMarker, mylocation))
        self.failUnless(IRichMarker.providedBy(mylocation))
        self.failUnless(verifyObject(IRichMarker, mylocation))

    def testGoogleMapView(self):
        self.folder.invokeFactory('GeoLocation', 'mylocation')
        map_view = self.folder.mylocation.restrictedTraverse('@@maps_googlemaps_view')
        self.failUnless(IMapView.providedBy(map_view))
        self.failUnless(verifyObject(IMapView, map_view))


def test_suite():
    from unittest import TestSuite, makeSuite
    suite = TestSuite()
    suite.addTest(makeSuite(TestLocation))
    return suite
