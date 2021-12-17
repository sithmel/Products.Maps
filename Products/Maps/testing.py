# -*- coding: utf-8 -*-

from plone.app.testing import applyProfile
from plone.app.testing import FunctionalTesting
from plone.app.testing import IntegrationTesting
from plone.app.testing import login
from plone.app.testing import PLONE_FIXTURE
from plone.app.testing import PloneSandboxLayer
from plone.app.testing import SITE_OWNER_NAME
from plone.app.testing import SITE_OWNER_PASSWORD
from plone.testing import z2
from Products.Maps.config import TEST_FOLDER_ID


class Maps(PloneSandboxLayer):

    defaultBases = (PLONE_FIXTURE, )

    def setUpZope(self, app, configurationContext):
        import plone.app.contenttypes
        self.loadZCML(package=plone.app.contenttypes)
        import plone.formwidget.geolocation
        self.loadZCML(package=plone.formwidget.geolocation)
        import Products.Maps
        self.loadZCML(package=Products.Maps)

    def setUpPloneSite(self, portal):
        applyProfile(portal, 'plone.app.contenttypes:default')
        applyProfile(portal, 'plone.formwidget.geolocation:default')
        applyProfile(portal, 'Products.Maps:default')
        portal.portal_workflow.setDefaultChain('simple_publication_workflow')
        portal.acl_users.userFolderAddUser(
            SITE_OWNER_NAME, SITE_OWNER_PASSWORD, ['Manager'], [])
        login(portal, SITE_OWNER_NAME)
        portal.invokeFactory('Folder', TEST_FOLDER_ID)


MAPS_FIXTURE = Maps()
MAPS_INTEGRATION_TESTING = IntegrationTesting(
    bases=(MAPS_FIXTURE,),
    name='Maps:Integration'
)
MAPS_FUNCTIONAL_TESTING = FunctionalTesting(
    bases=(MAPS_FIXTURE,),
    name='Maps:Functional'
)
