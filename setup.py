from setuptools import setup, find_packages
import os

version = open(os.path.join('Products', 'Maps', 'version.txt')).read().strip()
readme = open("README.txt").read()
history = open(os.path.join('docs', 'HISTORY.txt')).read()

setup(name='Products.Maps',
      version=version,
      description="A simple, easy to use Plone integration with Google Maps by Jarn AS.",
      long_description=readme[readme.find('\n\n'):] + '\n' + history,
      classifiers=[
        "Framework :: Zope2",
        "License :: OSI Approved :: GNU General Public License (GPL)",
        "Programming Language :: Python",
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
      download_url='http://pypi.python.org/pypi/Products.Maps',
      install_requires=[
        'setuptools',
      ],
)
