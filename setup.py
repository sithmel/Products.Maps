from setuptools import setup, find_packages

version = '2.1.1'


setup(name='Products.Maps',
      version=version,
      description="A simple, easy to use Plone integration with Google Maps "
                  "by Jarn AS.",
      long_description=open("README.txt").read() + '\n' +
                       open('CHANGES.txt').read(),
      classifiers=[
        "Framework :: Zope2",
        "License :: OSI Approved :: GNU General Public License (GPL)",
        "Programming Language :: Python",
      ],
      keywords='Google Maps Zope Plone',
      author='Florian Schulze',
      author_email='fschulze@jarn.com',
      url='http://pypi.python.org/pypi/Products.Maps',
      license='GPL',
      packages=find_packages(exclude=['ez_setup']),
      namespace_packages=['Products'],
      include_package_data=True,
      zip_safe=False,
      install_requires=[
        'setuptools',
      ],
)
