
import unittest
from plone.app.testing import login
from plone.app.testing import SITE_OWNER_NAME
from Products.Maps.config import TEST_FOLDER_ID
from Products.Maps.testing import MAPS_FUNCTIONAL_TESTING
from Products.Maps.testing import MAPS_INTEGRATION_TESTING


class BaseTestCase(unittest.TestCase):

    def setUp(self):
        self.app = self.layer['app']
        self.portal = self.layer['portal']
        login(self.portal, SITE_OWNER_NAME)
        self.folder = self.portal[TEST_FOLDER_ID]


class MapsTestCase(BaseTestCase):

    layer = MAPS_INTEGRATION_TESTING


class MapsFunctionalTestCase(BaseTestCase):

    layer = MAPS_FUNCTIONAL_TESTING
