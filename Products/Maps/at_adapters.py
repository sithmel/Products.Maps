# -*- coding: utf-8 -*-
from .adapters import BaseMap
from Products.ATContentTypes.interface import IATFolder
from Products.ATContentTypes.interface import IATTopic
from zope.component import adapter


@adapter(IATTopic)
class SmartFolderMap(BaseMap):

    def _getItems(self):
        return self.context.queryCatalog()


@adapter(IATFolder)
class FolderMap(BaseMap):

    def _getItems(self):
        return self.context.getFolderContents()
