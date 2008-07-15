from setuptools import setup, find_packages
import sys, os

version = '1.2'

setup(name='Products.Maps',
      version=version,
      description="A simple, easy to use Plone integration with Google Maps by Plone Solutions.",
      long_description="""\
""",
      classifiers=[
        "Framework :: Zope2",
        "License :: OSI Approved :: GNU General Public License (GPL)",
        "Programming Language :: Python",
      ],
      keywords='Google Maps Zope Plone',
      author='Florian Schulze',
      author_email='',
      url='http://plone.org/products/maps',
      license='GPL',
      packages=find_packages(exclude=['ez_setup']),
      namespace_packages=['Products'],
      include_package_data=True,
      zip_safe=False,
      download_url='http://plone.org/products/maps/releases',
      install_requires=[
        'setuptools',
      ],
)
