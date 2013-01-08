A Google Maps solution for Plone
--------------------------------

The main purpose of this product is to provide a very simple to use
Google Maps integration for Plone. The following goals were set for
development:

- Ease of use
    - Add locations to a folder
    - Set the view of the folder to Map
    - It figures out how to center and zoom the map automatically
- Flexibility for enhancement by using the Zope 3 component architecture
- Sane fallbacks when Javascript is not available
- Clean separation of javascript, templates and logic
- Works on Topics

Installation
------------

Maps shows up in the "Add-ons" configuration panel.

Implementing custom content with map field
------------------------------------------

If you want to add location foeld to your custom content type, you should
implement the following steps:

Add GeoLocation field::

    from Products.Maps.field import LocationWidget, LocationField
    from Products.Maps.interfaces import IMapEnabled, ILocation

    MyContentSchema = ...

        LocationField('geolocation',
                  required=False,
                  searchable=False,
                  validators=('isGeoLocation',),
                  widget = LocationWidget(label = u'Event location'),
        ),
        ... 

Update your class definition::

    class MyContent(ATCTContent):
        """ my content description """
        implements(IMyContent, IMapEnabled, ILocation)
    
        ... 

        def getMarkerIcon(self):
            """ Can be implemented as select field. See Maps.Location content """
            return "Red Marker"

Add following snippet to custom content view/template::

    <div class="googleMapView googleMapLocation"
         tal:define="view context/@@maps_googlemaps_view">
        <dl metal:use-macro="here/maps_map/macros/markers">
        </dl>
    </div>


Dependencies
------------

- Plone 3.3 / 4.x


Credits
-------

Created by Florian Schulze for Jarn AS in 2007.

Parts are based on:

- "ATGoogleMaps":http://takanory.net/plone/develop/atgooglemaps
- "qPloneGoogleMaps":http://projects.quintagroup.com/products/wiki/qPloneGoogleMaps
- "geolocation":http://svn.quintagroup.com/products/geolocation/

Development originally sponsored by
-----------------------------------

The "Student Services of Bergen, Norway":http://sib.no

"University of Oxford":http://medsci.ox.ac.uk (Medical Sciences Division)

Contributors for version 3.0
----------------------------

Maurizio Lupo @sithmel - maurizio.lupo@redomino.com
Luca Fabbri   @keul    - luca@keul.it

