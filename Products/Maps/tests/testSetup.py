#
# GE Setup Tests
#

from Products.Maps.tests import MapsTestCase

from Products.CMFCore.utils import getToolByName


class TestSetup(MapsTestCase.MapsTestCase):

    def testContentTypes(self):
        pt = getToolByName(self.portal, 'portal_types')
        types = pt.objectIds()
        contents = ['GeoLocation']
        for content in contents:
            self.assertTrue(content in types, '%s not installed' % content)

    def testSkinDirsInstalled(self):
        skinstool = getToolByName(self.portal, 'portal_skins')
        skins = skinstool.objectIds()
        ourSkins = [ 'Maps' ]
        for thisSkin in ourSkins:
            self.assertTrue(thisSkin in skins, "%s skin not created automatically" % thisSkin)

    def testMapsPropertiesInstalled(self):
        propertiestool = getToolByName(self.portal, 'portal_properties')
        mapsprops = getattr(propertiestool.aq_base, 'maps_properties', None)
        self.failIf(mapsprops is None, 'portal_properties.maps_properties not found.')

    def testViewTemplatesInstalled(self):
        pt = getToolByName(self.portal, 'portal_types')
        folder = getattr(pt.aq_base, 'Folder')
        self.assertTrue('maps_map' in folder.view_methods)
        collection = getattr(pt.aq_base, 'Collection')
        self.assertTrue('maps_map' in collection.view_methods)
        # test whether the normal templates are still there
        self.assertTrue('listing_view' in folder.view_methods)
        self.assertTrue('listing_view' in collection.view_methods)
