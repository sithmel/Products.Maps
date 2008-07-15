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
            self.failUnless(content in types, '%s not installed' % content)

    def testPortalFactory(self):
        factory = self.portal.portal_factory
        types = factory.getFactoryTypes().keys()
        # Factory types
        contents = ['GeoLocation']
        for content in contents:
            self.failUnless(content in types, '%s not registered with portal factory' % content)
        # Not factory types (for copying last weeks data)
        contents = []
        for content in contents:
            self.failIf(content in types, '%s erroneously registered with portal factory' % content)

    def testSkinDirsInstalled(self):
        skinstool = getToolByName(self.portal, 'portal_skins')
        skins = skinstool.objectIds()
        ourSkins = [ 'Maps' ]
        for thisSkin in ourSkins:
            self.failUnless(thisSkin in skins, "%s skin not created automatically" % thisSkin)

    def testMapsPropertiesInstalled(self):
        propertiestool = getToolByName(self.portal, 'portal_properties')
        mapsprops = getattr(propertiestool.aq_base, 'maps_properties', None)
        self.failIf(mapsprops is None, 'portal_properties.maps_properties not found.')

    def testViewTemplatesInstalled(self):
        pt = getToolByName(self.portal, 'portal_types')
        folder = getattr(pt.aq_base, 'Folder')
        self.failUnless('maps_map' in folder.view_methods)
        topic = getattr(pt.aq_base, 'Topic')
        self.failUnless('maps_map' in topic.view_methods)
        # test whether the normal templates are still there
        self.failUnless('folder_listing' in folder.view_methods)
        self.failUnless('folder_listing' in topic.view_methods)


def test_suite():
    from unittest import TestSuite, makeSuite
    suite = TestSuite()
    suite.addTest(makeSuite(TestSetup))
    return suite
