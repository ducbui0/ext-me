var BASE_URL = 'https://twkan.com';
try {
    var _cu = String(typeof CONFIG_URL === 'undefined' ? '' : CONFIG_URL)
        .replace(/["']/g, '')
        .trim();
    if (_cu.indexOf('http') === 0) {
        BASE_URL = _cu.replace(/\/+$/, '');
    }
} catch (e) {
}

function absUrl(u) {
    u = String(u || '').trim();
    if (!u) return '';
    if (u.indexOf('http://') === 0 || u.indexOf('https://') === 0) return u;
    if (u.indexOf('//') === 0) {
        var scheme = BASE_URL.indexOf('http://') === 0 ? 'http:' : 'https:';
        return scheme + u;
    }
    if (u.charAt(0) === '/') return BASE_URL + u;
    return BASE_URL + '/' + u;
}

function normalizeHost(url) {
    url = String(url || '').trim();
    if (!url) return '';
    if (url.indexOf('http://') === 0 || url.indexOf('https://') === 0) {
        return url.replace(/^https?:\/\/[^\/?#]+/i, BASE_URL);
    }
    return absUrl(url);
}
