#
# Test the config view
#

from plone.app.testing import SITE_OWNER_NAME
from plone.app.testing import SITE_OWNER_PASSWORD
from plone.testing.zope import Browser
from Products.CMFCore.utils import getToolByName
from Products.CMFPlone.interfaces import IBundleRegistry
from Products.Maps.tests import MapsTestCase


class TestBrowserConfig(MapsTestCase.MapsFunctionalTestCase):
    def test_control_panel(self):
        browser = Browser(self.app)
        browser.addHeader('Authorization', 'Basic %s:%s' %
                          (SITE_OWNER_NAME, SITE_OWNER_PASSWORD))
        registry = getToolByName(self.portal, 'portal_registry')
        bundles = registry.collectionOfInterface(
            IBundleRegistry, prefix="plone.bundles", check=False)
        bundle = bundles['Products-Maps']
        last_compilation = bundle.last_compilation
        browser.open(self.portal.absolute_url() + '/@@maps-controlpanel')
        browser.getControl('Default coordinates').value = "1.0, 1.5"
        browser.getControl('Apply').click()
        self.assertTrue(bundle.last_compilation != last_compilation)


class TestConfig(MapsTestCase.MapsTestCase):

    def testViewAvailable(self):
        config = self.folder.restrictedTraverse('@@maps_configuration')
