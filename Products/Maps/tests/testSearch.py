
from Products.Maps.tests import MapsTestCase
from Products.CMFCore.utils import getToolByName



class TestIndexes(MapsTestCase.MapsTestCase):

    def afterSetUp(self):
        self.catalog = getToolByName(self.portal, 'portal_catalog')

    def test_catalog_index(self):
        indexes = self.catalog.indexes()
        self.failUnless('latitude' in indexes)
        self.failUnless('longitude' in indexes)

    def test_indexes_works(self):
        self.folder.invokeFactory('GeoLocation', 'mylocation', geolocation = (1.1,1.2))
        self.folder.mylocation.reindexObject()

        brains = self.catalog.searchResults(latitude=1.1)

        self.assertTrue(brains)
        self.assertTrue(brains[0].id == 'mylocation')

        brains = self.catalog.searchResults(longitude=1.2)
        self.assertTrue(brains)
        self.assertTrue(brains[0].id == 'mylocation')
        
def test_suite():
    from unittest import TestSuite, makeSuite
    suite = TestSuite()
    suite.addTest(makeSuite(TestIndexes))
    return suite
