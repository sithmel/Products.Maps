A OpenLayers maps solution for Plone
------------------------------------

This is a branch of the original Products.Maps which used Google Maps.

The product uses OpenLayers and OpenStreetMap for map display and gisgraphy.com
for geocoding.

Installation
------------

Maps shows up in the "Add-ons" configuration panel.

As a result of using OpenLayers and OSM, the only modifiable setting in
Site setup is the initial location.


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

    <div class="openlayersMapView openlayersMapLocation"
         tal:define="view context/@@maps_openlayers_view">
        <dl metal:use-macro="here/maps_map/macros/markers">
        </dl>
    </div>


Dependencies
------------

- Plone 4.x


Credits
-------

Created by Florian Schulze for Jarn AS in 2007.

Parts are based on:

- "ATGoogleMaps":http://takanory.net/plone/develop/atgooglemaps
- "qPloneGoogleMaps":http://projects.quintagroup.com/products/wiki/qPloneGoogleMaps
- "geolocation":http://svn.quintagroup.com/products/geolocation/


Development sponsored by
------------------------

The "Student Services of Bergen, Norway":http://sib.no

"University of Oxford":http://medsci.ox.ac.uk (Medical Sciences Division)


A Jarn AS product
-----------------

"http://www.jarn.com":http://www.jarn.com

"info@jarn.com":mailto:info@jarn.com
