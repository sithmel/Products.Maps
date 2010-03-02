from Products.PloneTestCase import PloneTestCase
from Testing import ZopeTestCase

# Make the boring stuff load quietly
ZopeTestCase.installProduct('Maps')

EXTENSION_PROFILES=['Maps:default']

PloneTestCase.setupPloneSite(extension_profiles=EXTENSION_PROFILES)


class MapsTestCase(PloneTestCase.PloneTestCase):
    pass

class MapsFunctionalTestCase(PloneTestCase.FunctionalTestCase):
    pass
