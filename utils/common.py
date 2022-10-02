import random
import requests
from string import ascii_lowercase, digits

symbols = "[@_!#$%^&*()<>?/\|}{~:]\"'"
exceptions = ["!", ":", "?"]

def randStr(length = 32):
    s = ''.join(random.choice(ascii_lowercase + digits) for _ in range(length))
    return s

def chunkedDownload(url, filename, chunkSize=8192):
    r = requests.get(url, stream=True)
    with open(filename, 'wb') as f:
        for chunk in r.iter_content(chunkSize):
            if chunk:
                f.write(chunk)
    return filename

def sanitize(text):
    for symbol in symbols:
        if symbol not in exceptions:
            text = text.replace(symbol, "")
    return text