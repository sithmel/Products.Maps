# -*- coding: utf-8 -*-
from datetime import datetime
from datetime import timedelta
from plone.app.contenttypes.migration.field_migrators import migrate_richtextfield
from plone.app.contenttypes.migration.field_migrators import migrate_simplefield
from plone.app.contenttypes.migration.migration import ATCTContentMigrator
from plone.app.contenttypes.migration.migration import migrate
from plone.app.contenttypes.migration.utils import restore_references
from plone.app.contenttypes.migration.utils import store_references
from plone.formwidget.geolocation.geolocation import Geolocation
from pprint import pformat
from Products.CMFCore.utils import getToolByName
from Products.Five.browser import BrowserView
from zExceptions import NotFound
import logging

logger = logging.getLogger(__name__)


class LocationMigrator(ATCTContentMigrator):

    src_portal_type = 'GeoLocation'
    src_meta_type = 'GeoLocation'
    dst_portal_type = 'GeoLocation'
    dst_meta_type = None

    def migrate_schema_fields(self):
        old = self.old
        new = self.new
        migrate_richtextfield(old, new, 'text', 'text')
        migrate_simplefield(old, new, 'markerIcon', 'icon')
        location = old.getRawGeolocation()
        new.geolocation = Geolocation(*location)


def migrate_locations(portal):
    return migrate(portal, LocationMigrator)


class MigrateLocations(BrowserView):

    def __call__(self):
        portal = self.context
        catalog = getToolByName(portal, 'portal_catalog')
        start = datetime.now()
        stats_before = self.stats()
        msg = 'Starting GeoLocation Migration\n\n'
        msg += '\n-----------------------------\n'
        msg += 'Stats before:\n'
        msg += pformat(stats_before)
        msg += '\n-----------------------------\n'
        logger.info(msg)

        store_references(portal)
        migrate_locations(portal)
        restore_references(portal)
        catalog.clearFindAndRebuild()

        duration = str(timedelta(seconds=(datetime.now() - start).seconds))
        msg = 'Finished GeoLocation Migration\n\n'
        msg += '\n-----------------------------\n'
        msg += 'Migration finished in: {0} seconds'.format(duration)
        msg += '\n-----------------------------\n'
        msg += 'Stats before:\n'
        msg += pformat(stats_before)
        msg += '\n-----------------------------\n'
        msg += 'Stats after:\n'
        msg += pformat(self.stats())
        msg += '\n-----------------------------\n'
        logger.info(msg)
        return msg

    def stats(self):
        results = dict()
        catalog = getToolByName(self.context, 'portal_catalog')
        for brain in catalog.searchResults(portal_type='GeoLocation'):
            try:
                class_name = brain.getObject().__class__.__name__
            except (KeyError, NotFound):
                continue
            results[class_name] = results.get(class_name, 0) + 1
        return results