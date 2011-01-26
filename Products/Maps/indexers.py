from plone.indexer.decorator import indexer
from Products.Maps.interfaces import IGeoLocation, IMapEnabled


@indexer(IMapEnabled)
def getLatitude(object, **kw):
    return IGeoLocation(object).latitude
     
@indexer(IMapEnabled)
def getLongitude(object, **kw):
    return IGeoLocation(object).longitude

