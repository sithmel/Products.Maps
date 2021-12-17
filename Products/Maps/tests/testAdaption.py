#
# GE Setup Tests
#

from Products.Maps.tests import MapsTestCase

from Products.Maps.interfaces import IMap, IMapView

from zope.interface.verify import verifyObject

AddPortalTopics = 'Add portal topics'


class TestAdaption(MapsTestCase.MapsTestCase):

    def testFolderAdaption(self):
        map = IMap(self.folder)
        self.assertTrue(IMap.providedBy(map))
        self.assertTrue(verifyObject(IMap, map))

    def testCollectionAdaption(self):
        self.folder.invokeFactory('Collection', 'collection')
        map = IMap(self.folder.collection)
        self.assertTrue(IMap.providedBy(map))
        self.assertTrue(verifyObject(IMap, map))

    def testGoogleMapView(self):
        self.folder.invokeFactory('Collection', 'collection')
        map_view = self.folder.restrictedTraverse('@@maps_googlemaps_view')
        self.assertTrue(IMapView.providedBy(map_view))
        self.assertTrue(verifyObject(IMapView, map_view))
        map_view = self.folder.collection.restrictedTraverse('@@maps_googlemaps_view')
        self.assertTrue(IMapView.providedBy(map_view))
        self.assertTrue(verifyObject(IMapView, map_view))
