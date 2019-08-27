from setuptools import setup, find_packages
from os.path import join

version = '4.0.dev0'

setup(name='Products.Maps',
      version=version,
      description="A simple, easy to use Plone integration with Google Maps",
      long_description=open("README.rst").read() + '\n' +
                       open(join('docs','HISTORY.rst')).read(),
      classifiers=[
        "Framework :: Zope2",
        "Programming Language :: Python",
        "Programming Language :: Python :: 2.7",
        "Programming Language :: Python :: 3.7",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Framework :: Plone",
        "Framework :: Plone :: 5.0",
        "Framework :: Plone :: 5.1",
        "Framework :: Plone :: 5.2",
        "License :: OSI Approved :: GNU General Public License (GPL)",
      ],
      keywords='Google Maps Zope Plone',
      author='Florian Schulze',
      author_email='fschulze@jarn.com',
      url='http://plone.org/products/maps',
      license='GPL',
      packages=find_packages(exclude=['ez_setup']),
      namespace_packages=['Products'],
      include_package_data=True,
      zip_safe=False,
      install_requires=[
          'setuptools',
          'six',
          'plone.formwidget.geolocation',
      ],
      extras_require={
          'test': [
              'cssselect',
              'lxml',
              'mock',
              'plone.api >=1.8.5',
              'plone.app.robotframework',
              'plone.app.testing [robot]',
              'plone.browserlayer',
              'plone.cachepurging',
              'plone.testing',
              'robotsuite',
              'testfixtures',
              'transaction',
              'tzlocal',
          ],
      },
)
