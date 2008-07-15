from zope.app.form.browser.widget import renderElement
from zope.app.form.browser.textwidgets import ASCIIWidget

class GoogleAPIKey(ASCIIWidget):
    """Google API Key widget"""

    type = 'google_api_key'

    def hasInput(self):
        return (self.name+'.url' in self.request.form and
                self.name+'.key' in self.request.form)

    def _getFormInput(self):
        url = self.request.get(self.name+'.url').strip()
        key = self.request.get(self.name+'.key').strip()
        return "%s | %s" % (url, key)

    def __call__(self):
        value = self._getFormValue()
        if value is None or value == self.context.missing_value:
            value = ''
        value = value.split("|")
        if len(value) == 2:
            value = (value[0].strip(), value[1].strip())
        else:
            value = ('', '')

        url = renderElement(self.tag,
                            type=self.type,
                            name=self.name+'.url',
                            id=self.name+'.url',
                            value=value[0],
                            cssClass=self.cssClass,
                            size=85,
                            extra=self.extra)

        key = renderElement(self.tag,
                            type=self.type,
                            name=self.name+'.key',
                            id=self.name+'.key',
                            value=value[1],
                            cssClass=self.cssClass,
                            size=85,
                            extra=self.extra)

        return "%s %s" % (url, key)
