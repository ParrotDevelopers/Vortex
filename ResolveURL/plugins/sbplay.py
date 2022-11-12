from ..utils.browser import Firefox
from ..utils.resolve import Resolver
from ..utils.common import girc
import requests
import re
import re
import base64
import binascii
import random
import string
import requests
import json
from urllib.parse import urlparse

class SBPlay(Resolver):
    def __init__(self):
        self.firefox = Firefox()


    def cleanse_html(self, html):
        for match in re.finditer('<!--(.*?)-->', html, re.DOTALL):
            if match.group(1)[-2:] != '//':
                html = html.replace(match.group(0), '')

        html = re.sub(r'''<(div|span)[^>]+style=["'](visibility:\s*hidden|display:\s*none);?["']>.*?</\\1>''', '', html, re.I | re.DOTALL)
        return html

    def get_hidden(self, html, form_id=None, index=None, include_submit=True):
        hidden = {}
        if form_id:
            pattern = r'''<form [^>]*(?:id|name)\s*=\s*['"]?%s['"]?[^>]*>(.*?)</form>''' % (form_id)
        else:
            pattern = '''<form[^>]*>(.*?)</form>'''

        html = self.cleanse_html(html)

        for i, form in enumerate(re.finditer(pattern, html, re.DOTALL | re.I)):
            if index is None or i == index:
                for field in re.finditer('''<input [^>]*type=['"]?hidden['"]?[^>]*>''', form.group(1)):
                    match = re.search(r'''name\s*=\s*['"]([^'"]+)''', field.group(0))
                    match1 = re.search(r'''value\s*=\s*['"]([^'"]*)''', field.group(0))
                    if match and match1:
                        hidden[match.group(1)] = match1.group(1)

                if include_submit:
                    match = re.search('''<input [^>]*type=['"]?submit['"]?[^>]*>''', form.group(1))
                    if match:
                        name = re.search(r'''name\s*=\s*['"]([^'"]+)''', match.group(0))
                        value = re.search(r'''value\s*=\s*['"]([^'"]*)''', match.group(0))
                        if name and value:
                            hidden[name.group(1)] = value.group(1)

        return hidden

    def get_embedurl(self, host, media_id):
        # Copyright (c) 2019 vb6rocod
        def makeid(length):
            t = string.ascii_letters + string.digits
            return ''.join([random.choice(t) for _ in range(length)])

        x = '{0}||{1}||{2}||streamsb'.format(makeid(12), media_id, makeid(12))
        c1 = binascii.hexlify(x.encode('utf8')).decode('utf8')
        x = '{0}||{1}||{2}||streamsb'.format(makeid(12), makeid(12), makeid(12))
        c2 = binascii.hexlify(x.encode('utf8')).decode('utf8')
        x = '{0}||{1}||{2}||streamsb'.format(makeid(12), c2, makeid(12))
        c3 = binascii.hexlify(x.encode('utf8')).decode('utf8')
        return 'https://{0}/sources48/{1}/{2}'.format(host, c1, c3)

    def grab(self, web_url, referer):
        parsed = urlparse(web_url)
        host = parsed.netloc
        media_id = parsed.path.replace("/e/", "").replace("/d/", "")

        rurl = 'https://{0}/'.format(host)
        headers = {'User-Agent': self.firefox.ua,
                'Referer': rurl}
        html = requests.get(web_url, headers=headers).text
        sources = re.findall(r'download_video([^"]+)[^\d]+\d+x(\d+)', html)
        if sources:
            sources.sort(key=lambda x: int(x[1]), reverse=True)
            sources = [(x[1] + 'p', x[0]) for x in sources]
            print(sources)
            code, mode, dl_hash = sources
            dl_url = 'https://{0}/dl?op=download_orig&id={1}&mode={2}&hash={3}'.format(host, code, mode, dl_hash)
            html = requests.get(dl_url, headers=headers).text
            domain = base64.b64encode((rurl[:-1] + ':443').encode('utf-8')).decode('utf-8').replace('=', '')
            token = girc(html, rurl, domain)
            if token:
                payload = self.get_hidden(html)
                payload.update({'g-recaptcha-response': token})
                req = requests.post(dl_url, form_data=payload, headers=headers).text
                r = re.search('href="([^"]+).+?>(?:Direct|Download)', req)
                if r:
                    return r.group(1), headers

        eurl = self.get_embedurl(host, media_id)
        headers.update({'watchsb': 'sbstream'})
        html = requests.get(eurl, headers=headers).text
        data = json.loads(html).get("stream_data", {})
        strurl = data.get('file') or data.get('backup')
        if strurl:
            headers.pop('watchsb')
            return strurl, headers
        return "", {}

        

    