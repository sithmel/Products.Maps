# -*- coding: utf-8 -*-

from plone.dexterity.content import Item
from Products.CMFCore.utils import getToolByName
from Products.CMFPlone.utils import base_hasattr
from Products.Maps import MapsMessageFactory as _
from Products.Maps.adapters import GeoLocation
from Products.Maps.interfaces import IDXLocation
from Products.Maps.interfaces import IMapEnabled
from Products.Maps.interfaces import IRichMarker
from zope.component import adapter
from zope.interface import implementer


@implementer(IMapEnabled, IDXLocation)
class Location(Item):
    """ Dexterity based Location """


@implementer(IRichMarker)
@adapter(IDXLocation)
class LocationMarker(GeoLocation):

    @property
    def title(self):
        return self.context.title

    @property
    def description(self):
        return self.context.description

    @property
    def layers(self):
        return None

    @property
    def icon(self):
        return self.context.icon

    @property
    def url(self):
        return self.context.absolute_url()

    def computeRelatedItems(self):
        """ Shamelessly pulled from the ContentRelatedItems viewlet in
            plone.app.layout """
        context = self.context
        if not base_hasattr(context, 'relatedItems'):
            return tuple()
        related = context.relatedItems
        if not related:
            return tuple()
        catalog = getToolByName(context, 'portal_catalog')
        res = list()
        for r in related:
            path = r.to_path
            if path is None:
                continue
            res.extend(catalog.searchResults(path=dict(query=path, depth=0)))
        return res

    @property
    def related_items(self):
        related = self.computeRelatedItems()
        result = []
        for obj in related:
            result.append({'title': obj.title,
                           'url': obj.absolute_url(),
                           'description': obj.description})
        return tuple(result)

    @property
    def contents(self):
        context = self.context
        text = context.text.output_relative_to(context)
        if text:
            return ({'title': _("Info"),
                     'text': text},)
