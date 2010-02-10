from Products.CMFCore.utils import ContentInit
from Products.CMFCore.DirectoryView import registerDirectory

from Products.Archetypes.public import listTypes
from Products.Archetypes.public import process_types

from Products.GenericSetup import EXTENSION
from Products.GenericSetup import profile_registry
from Products.CMFPlone.interfaces import IPloneSiteRoot

from Products.Maps import config

registerDirectory(config.SKINS_DIR, config.GLOBALS)

def initialize(context):

    from Products.Maps import content
    content # pyflakes

    content_types, constructors, ftis = process_types(
        listTypes(config.PROJECTNAME), config.PROJECTNAME)

    ContentInit(
        config.PROJECTNAME + ' Content',
        content_types = content_types,
        permission = 'Maps: Add GeoLocation',
        extra_constructors = constructors,
        fti = ftis,
    ).initialize(context)

    # Register the extension profile
    profile_registry.registerProfile('default',
                                     'Maps',
                                     'maps',
                                     'profiles/default',
                                     'Maps',
                                     EXTENSION,
                                     IPloneSiteRoot)
