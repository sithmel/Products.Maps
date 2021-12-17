# -*- coding: utf-8 -*-
import six
from Products.Maps import MapsMessageFactory as _


def validate_location(value):
    try:
        if isinstance(value, six.string_types):
            value = value.split(",", 1)
        value = (float(value[0]), float(value[1]))
    except (ValueError, TypeError):
        return _(
            u""" Validation failed. Coordinates must be an decimal numbers. """)
    if not (-90 <= value[0] <= 90):
        return _(u""" Validation failed. Latitude not in bounds [-90, 90]. """)
    if not (-180 <= value[1] <= 180):
        return _(
            u""" Validation failed. Longitude not in bounds [-180, 180]. """)
    return 1
