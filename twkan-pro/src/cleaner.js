var TWKAN_SEC_KEY = 'jieqi2026abcd12';
var TWKAN_SEC_KNOWN_VER = '20260916b';
var _B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function decodeBase64ToBytes(b64) {
    var s = String(b64 || '')
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .replace(/[^A-Za-z0-9+/=]/g, '');
    var out = [];
    var len = s.length;
    for (var i = 0; i < len; i += 4) {
        var e1 = _B64_CHARS.indexOf(s.charAt(i));
        var e2 = _B64_CHARS.indexOf(s.charAt(i + 1));
        var c3 = s.charAt(i + 2);
        var c4 = s.charAt(i + 3);
        var e3 = (!c3 || c3 === '=') ? -1 : _B64_CHARS.indexOf(c3);
        var e4 = (!c4 || c4 === '=') ? -1 : _B64_CHARS.indexOf(c4);
        if (e1 < 0 || e2 < 0) break;
        out.push((e1 << 2) | (e2 >> 4));
        if (e3 >= 0) {
            out.push(((e2 & 15) << 4) | (e3 >> 2));
            if (e4 >= 0) {
                out.push(((e3 & 3) << 6) | e4);
            }
        }
    }
    return out;
}

function decodeUtf8BytesStrict(bytes) {
    var out = '';
    var i = 0;
    var len = bytes.length;
    while (i < len) {
        var b1 = bytes[i++] & 0xff;
        if (b1 < 0x80) {
            if ((b1 < 0x20 && b1 !== 9 && b1 !== 10 && b1 !== 13) || b1 === 0x7f) {
                return {ok: false, text: '', reason: 'invalid_utf8'};
            }
            out += String.fromCharCode(b1);
        } else if (b1 >= 0xc2 && b1 <= 0xdf) {
            if (i >= len) return {ok: false, text: '', reason: 'invalid_utf8'};
            var b2 = bytes[i++] & 0xff;
            if ((b2 & 0xc0) !== 0x80) return {ok: false, text: '', reason: 'invalid_utf8'};
            var cp2 = ((b1 & 0x1f) << 6) | (b2 & 0x3f);
            if (cp2 >= 0x80 && cp2 <= 0x9f) return {ok: false, text: '', reason: 'invalid_utf8'};
            out += String.fromCharCode(cp2);
        } else if (b1 >= 0xe0 && b1 <= 0xef) {
            if (i + 1 >= len) return {ok: false, text: '', reason: 'invalid_utf8'};
            var c2 = bytes[i++] & 0xff;
            var c3 = bytes[i++] & 0xff;
            if ((c2 & 0xc0) !== 0x80 || (c3 & 0xc0) !== 0x80) return {ok: false, text: '', reason: 'invalid_utf8'};
            if (b1 === 0xe0 && c2 < 0xa0) return {ok: false, text: '', reason: 'invalid_utf8'};
            if (b1 === 0xed && c2 > 0x9f) return {ok: false, text: '', reason: 'invalid_utf8'};
            out += String.fromCharCode(((b1 & 0x0f) << 12) | ((c2 & 0x3f) << 6) | (c3 & 0x3f));
        } else if (b1 >= 0xf0 && b1 <= 0xf4) {
            if (i + 2 >= len) return {ok: false, text: '', reason: 'invalid_utf8'};
            var d2 = bytes[i++] & 0xff;
            var d3 = bytes[i++] & 0xff;
            var d4 = bytes[i++] & 0xff;
            if ((d2 & 0xc0) !== 0x80 || (d3 & 0xc0) !== 0x80 || (d4 & 0xc0) !== 0x80) {
                return {ok: false, text: '', reason: 'invalid_utf8'};
            }
            if (b1 === 0xf0 && d2 < 0x90) return {ok: false, text: '', reason: 'invalid_utf8'};
            if (b1 === 0xf4 && d2 > 0x8f) return {ok: false, text: '', reason: 'invalid_utf8'};
            var cp4 = (((b1 & 0x07) << 18) | ((d2 & 0x3f) << 12) | ((d3 & 0x3f) << 6) | (d4 & 0x3f)) - 0x10000;
            out += String.fromCharCode(0xd800 + (cp4 >> 10), 0xdc00 + (cp4 & 0x3ff));
        } else {
            return {ok: false, text: '', reason: 'invalid_utf8'};
        }
    }
    return {ok: true, text: out, reason: ''};
}

function decodeUtf8Bytes(bytes) {
    var r = decodeUtf8BytesStrict(bytes);
    return r.ok ? r.text : '';
}

function _isDisallowedTextBlock(c) {
    return (c >= 0x0590 && c <= 0x1fff) ||
        (c >= 0xa000 && c <= 0xd7af) ||
        (c >= 0xe000 && c <= 0xf8ff) ||
        (c >= 0xfb00 && c <= 0xfdff) ||
        (c >= 0xfe70 && c <= 0xfeff) ||
        (c >= 0xfff0 && c <= 0xffff);
}

function _isPlausibleDecodedText(text) {
    if (!text || !text.length) return false;
    var readable = 0;
    var total = 0;
    for (var i = 0; i < text.length; i++) {
        var c = text.charCodeAt(i);
        if (_isDisallowedTextBlock(c)) return false;
        if ((c < 0x20 && c !== 9 && c !== 10 && c !== 13) || c === 0x7f || (c >= 0x80 && c <= 0x9f)) {
            return false;
        }
        if (c >= 0xd800 && c <= 0xdbff && i + 1 < text.length) {
            var lo = text.charCodeAt(i + 1);
            if (lo >= 0xdc00 && lo <= 0xdfff) {
                var cp = 0x10000 + ((c - 0xd800) << 10) + (lo - 0xdc00);
                i++;
                total++;
                if ((cp >= 0x20000 && cp <= 0x2ebef) || (cp >= 0x30000 && cp <= 0x323af)) {
                    readable++;
                }
                continue;
            }
            return false;
        }
        if (c >= 0xdc00 && c <= 0xdfff) return false;
        total++;
        if ((c >= 0x4e00 && c <= 0x9fff) ||
            (c >= 0x3400 && c <= 0x4dbf) ||
            (c >= 0xf900 && c <= 0xfaff) ||
            (c >= 0x3000 && c <= 0x303f) ||
            (c >= 0xff00 && c <= 0xffef) ||
            (c >= 0x20 && c <= 0x7e) ||
            (c >= 0x2000 && c <= 0x206f) ||
            c === 9 || c === 10 || c === 13 ||
            c === 0x00a0 || c === 0x00b7) {
            readable++;
        }
    }
    return total > 0 && (readable / total) >= 0.95;
}

function decodeHtmlEntities(s) {
    return String(s || '')
        .replace(/&emsp;/gi, '\u2003')
        .replace(/&ensp;/gi, '\u2002')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&mdash;/gi, '\u2014')
        .replace(/&ndash;/gi, '\u2013')
        .replace(/&hellip;/gi, '\u2026')
        .replace(/&ldquo;/gi, '\u201c')
        .replace(/&rdquo;/gi, '\u201d')
        .replace(/&lsquo;/gi, '\u2018')
        .replace(/&rsquo;/gi, '\u2019')
        .replace(/&quot;/gi, '"')
        .replace(/&apos;|&#0*39;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&#(\d+);/g, function (_, dec) {
            var cp = parseInt(dec, 10);
            if (isNaN(cp) || cp <= 0) return '';
            if (cp <= 0xffff) return String.fromCharCode(cp);
            cp -= 0x10000;
            return String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
        })
        .replace(/&#x([0-9a-f]+);/gi, function (_, hex) {
            var cp = parseInt(hex, 16);
            if (isNaN(cp) || cp <= 0) return '';
            if (cp <= 0xffff) return String.fromCharCode(cp);
            cp -= 0x10000;
            return String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
        })
        .replace(/&amp;/gi, '&');
}

function _escapeHtmlText(s) {
    return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function _extractAttr(attrs, name) {
    var re = new RegExp('(?:^|\\s)' + name + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\')', 'i');
    var m = attrs.match(re);
    if (!m) return '';
    return m[1] !== undefined ? m[1] : (m[2] !== undefined ? m[2] : '');
}

function decodeSecLastPayloadStrict(dataC, dataV) {
    if (!dataC || !dataV) return {ok: false, text: '', reason: 'missing_attrs'};
    if (!/^[A-Za-z0-9+/=_\-\s]+$/.test(String(dataC))) {
        return {ok: false, text: '', reason: 'invalid_base64'};
    }
    var raw = decodeBase64ToBytes(dataC);
    if (!raw.length) return {ok: false, text: '', reason: 'empty_payload'};
    var k1 = TWKAN_SEC_KEY;
    var k1Len = k1.length;
    var k2Len = dataV.length;
    var out = new Array(raw.length);
    for (var i = 0; i < raw.length; i++) {
        out[i] = raw[i] ^ (k1.charCodeAt(i % k1Len) & 0xff) ^ (dataV.charCodeAt(i % k2Len) & 0xff);
    }
    var utf8Res = decodeUtf8BytesStrict(out);
    if (!utf8Res.ok) return {ok: false, text: '', reason: utf8Res.reason};

    // Match reader-sec.js (_0x3f48c2 sets innerHTML then reads textContent)
    var decoded = utf8Res.text.replace(/<\s*br\s*\/?\s*>/gi, '\n').replace(/<[^>]+>/g, '');
    decoded = decodeHtmlEntities(decoded);
    if (/&[a-z]{2,10};/i.test(decoded)) {
        return {ok: false, text: '', reason: 'corrupted_entity'};
    }
    decoded = decoded.replace(/^[\s\u00a0\u2002\u2003\u3000]+|[\s\u00a0\u2002\u2003\u3000]+$/g, '');
    if (!_isPlausibleDecodedText(decoded)) {
        return {ok: false, text: '', reason: 'unreadable_text'};
    }
    return {ok: true, text: decoded, reason: ''};
}

function decodeSecLastPayload(dataC, dataV) {
    var r = decodeSecLastPayloadStrict(dataC, dataV);
    return r.ok ? r.text : '';
}

function decodeSecLastCanvasesDetailed(html) {
    var decodedCount = 0;
    var failedCount = 0;
    var failReason = '';
    var replaced = String(html || '').replace(/<canvas\b([^>]*)>(?:[\s\S]*?<\/canvas>)?/gi, function (_, attrs) {
        try {
            var cls = _extractAttr(attrs, 'class');
            var dataC = _extractAttr(attrs, 'data-c');
            var dataV = _extractAttr(attrs, 'data-v');
            var isSecCanvas = /(?:^|\s)sec-last(?:\s|$)/i.test(cls) || !!dataC || !!dataV;
            if (!isSecCanvas) return '';

            var res = decodeSecLastPayloadStrict(dataC, dataV);
            if (!res.ok) {
                failedCount++;
                if (!failReason) failReason = res.reason;
                return '';
            }
            var lines = res.text.split(/\r?\n/);
            var htmlLines = [];
            for (var i = 0; i < lines.length; i++) {
                var t = lines[i].replace(/^[\s\u00a0\u2002\u2003\u3000]+|[\s\u00a0\u2002\u2003\u3000]+$/g, '');
                if (t) htmlLines.push(_escapeHtmlText(t));
            }
            if (!htmlLines.length) {
                failedCount++;
                if (!failReason) failReason = 'empty_decoded_text';
                return '';
            }
            decodedCount++;
            return htmlLines.join('<br>\n');
        } catch (e) {
            failedCount++;
            if (!failReason) failReason = 'exception';
            return '';
        }
    });
    return {
        html: replaced,
        decodedCount: decodedCount,
        failedCount: failedCount,
        failReason: failReason
    };
}

function decodeSecLastCanvases(html) {
    return decodeSecLastCanvasesDetailed(html).html;
}

var _BMP_SPECIAL_MAP = {
    // Letterlike Symbols holes in Mathematical Alphanumerics
    0x2102: 'c', 0x2103: 'c', 0x210a: 'g', 0x210b: 'h', 0x210c: 'h', 0x210d: 'h', 0x210e: 'h',
    0x210f: 'h', 0x2110: 'i', 0x2111: 'i', 0x2112: 'l', 0x2113: 'l', 0x2115: 'n',
    0x2119: 'p', 0x211a: 'q', 0x211b: 'r', 0x211c: 'r', 0x211d: 'r', 0x2124: 'z',
    0x2128: 'z', 0x212c: 'b', 0x212d: 'c', 0x212f: 'e', 0x2130: 'e', 0x2131: 'f',
    0x2133: 'm', 0x2134: 'o', 0x2139: 'i',
    // Circled / Dingbat digits & superscripts
    0x24ea: '0', 0x24ff: '0',
    0x2776: '1', 0x2777: '2', 0x2778: '3', 0x2779: '4', 0x277a: '5',
    0x277b: '6', 0x277c: '7', 0x277d: '8', 0x277e: '9',
    0x2780: '1', 0x2781: '2', 0x2782: '3', 0x2783: '4', 0x2784: '5',
    0x2785: '6', 0x2786: '7', 0x2787: '8', 0x2788: '9',
    0x278a: '1', 0x278b: '2', 0x278c: '3', 0x278d: '4', 0x278e: '5',
    0x278f: '6', 0x2790: '7', 0x2791: '8', 0x2792: '9',
    0x24f5: '1', 0x24f6: '2', 0x24f7: '3', 0x24f8: '4', 0x24f9: '5',
    0x24fa: '6', 0x24fb: '7', 0x24fc: '8', 0x24fd: '9',
    0x2070: '0', 0x00b9: '1', 0x00b2: '2', 0x00b3: '3', 0x2074: '4',
    0x2075: '5', 0x2076: '6', 0x2077: '7', 0x2078: '8', 0x2079: '9',
    0x02e2: 's', 0x02b0: 'h', 0x1d58: 'u', 0x02e3: 'x', 0x1d9c: 'c', 0x1d52: 'o', 0x1d50: 'm',
    // Small caps & IPA / Latin Extended / Greek / Cyrillic / Thai / Hebrew homoglyphs
    0x1d00: 'a', 0x1d04: 'c', 0x1d05: 'd', 0x1d07: 'e', 0x0262: 'g', 0x029c: 'h',
    0x026a: 'i', 0x1d0a: 'j', 0x1d0b: 'k', 0x029f: 'l', 0x1d0d: 'm', 0x0274: 'n',
    0x1d0f: 'o', 0x1d18: 'p', 0x0280: 'r', 0x1d1b: 't', 0x1d1c: 'u', 0x1d20: 'v',
    0x1d21: 'w', 0x028f: 'y', 0x1d22: 'z',
    0x019a: 't', 0x026f: 'm', 0x0265: 'h', 0x02d9: '.', 0x0199: 'k', 0x03b1: 'a', 0x0273: 'n', 0x0188: 'c',
    0x03c3: 'o', 0x0271: 'm', 0x0272: 'n', 0x027e: 'r', 0x01ab: 't', 0x0192: 'f',
    0x0282: 's', 0x0267: 'h', 0x0173: 'u', 0x01a1: 'o', 0x0254: 'c', 0x00a2: 'c',
    0x00f8: 'o', 0x00d8: 'o', 0x0127: 'h', 0x0126: 'h', 0x0124: 'h', 0x0125: 'h',
    0x015c: 's', 0x015d: 's', 0x015e: 's', 0x015f: 's', 0x0160: 's', 0x0161: 's',
    0x0106: 'c', 0x0107: 'c', 0x010c: 'c', 0x010d: 'c', 0x00e7: 'c', 0x00c7: 'c',
    0x01d7: 'u', 0x01d8: 'u', 0x00f9: 'u', 0x00fa: 'u', 0x00fb: 'u', 0x00fc: 'u',
    0x1ed6: 'o', 0x1ed7: 'o', 0x0203: 'a', 0x0202: 'a', 0x0103: 'a', 0x0102: 'a',
    0x00e0: 'a', 0x00e1: 'a', 0x00e2: 'a', 0x00e3: 'a', 0x00e4: 'a', 0x00e5: 'a', 0x0101: 'a',
    0x020f: 'o', 0x020e: 'o', 0x014f: 'o', 0x014e: 'o', 0x00f2: 'o', 0x00f3: 'o',
    0x00f4: 'o', 0x00f5: 'o', 0x00f6: 'o', 0x014d: 'o', 0x03cc: 'o', 0x03bf: 'o',
    // Cyrillic / Greek / Thai / Hebrew
    0x043d: 'h', 0x041d: 'h', 0x04bb: 'h', 0x04ba: 'h', 0x0452: 'h', 0x0402: 'h', 0x045b: 'h', 0x040b: 'h',
    0x0430: 'a', 0x0410: 'a', 0x0432: 'b', 0x0412: 'b', 0x0435: 'e', 0x0415: 'e',
    0x043e: 'o', 0x041e: 'o', 0x0440: 'p', 0x0420: 'p', 0x0441: 'c', 0x0421: 'c',
    0x043a: 'k', 0x041a: 'k', 0x043c: 'm', 0x041c: 'm', 0x0442: 't', 0x0422: 't',
    0x0443: 'y', 0x0423: 'y', 0x0455: 's', 0x0405: 's', 0xa645: 's', 0xa644: 's',
    0x0445: 'x', 0x0425: 'x', 0x04b3: 'x', 0x04b2: 'x', 0x0416: 'x', 0x0436: 'x',
    0x0391: 'a', 0x03b5: 'e', 0x03b9: 'i', 0x039a: 'k', 0x039c: 'm', 0x03bc: 'm', 0x03fb: 'm',
    0x039f: 'o', 0x03c1: 'p', 0x03c5: 'u', 0x03ba: 'k', 0x03bd: 'n', 0x03c4: 't', 0x03c9: 'w',
    0x03c2: 'c', 0x03f2: 'c', 0x03c7: 'x', 0x03a7: 'x',
    0x0e23: 's', 0x0e22: 'u', 0x05d0: 'x', 0x0e4f: 'o', 0x0e53: 'm',
    0x0431: '6',
    // Canadian Aboriginal / Hiragana / Katakana / Hangul / CJK lookalikes
    0x1515: 's', 0x157c: 'h', 0x144c: 'u', 0x1458: 'u', 0x166d: 'x',
    0x1455: 'c', 0x1462: 'c', 0x15dd: 'o', 0x14cd: 'o', 0x15f0: 'm', 0x163b: 'm',
    0x4e02: 's', 0x531a: 'c', 0x722a: 'm', 0x4e42: 'x', 0x3116: 'o', 0x5344: 'h',
    0x3093: 'h', 0x3072: 'u', 0x306e: 'o', 0xff92: 'x', 0x30e1: 'x',
    0x1103: 'c', 0x3137: 'c', 0xffb6: 'm',
    0x262f: 'o', 0x26bd: 'o', 0x2b55: 'o',
    // Dot lookalikes (KHÔNG map 0x3002 '。' để không dính dấu câu tiếng Trung)
    0x2024: '.', 0x2027: '.', 0xff0e: '.', 0xfe52: '.', 0xff61: '.', 0x00b7: '.'
};

function _isCombiningOrInvisible(code) {
    return (code >= 0x0300 && code <= 0x036f) ||
        (code >= 0x0483 && code <= 0x0489) ||
        (code >= 0x1ab0 && code <= 0x1aff) ||
        (code >= 0x1dc0 && code <= 0x1dff) ||
        (code >= 0x20d0 && code <= 0x20ff) ||
        (code >= 0xfe20 && code <= 0xfe2f) ||
        (code >= 0x200b && code <= 0x200f) ||
        code === 0xfeff || code === 0x00ad || code === 0xfe0e || code === 0xfe0f;
}

function _mapWatermarkCodePoint(cp) {
    // Surrogate-pair Mathematical Alphanumerics & Squared Latin & emoji 'o'
    if (cp >= 0x1d400 && cp <= 0x1d6a3) {
        var offset = (cp - 0x1d400) % 52;
        return { ch: String.fromCharCode(97 + (offset % 26)), obf: true };
    }
    if (cp >= 0x1d7ce && cp <= 0x1d7ff) {
        return { ch: String.fromCharCode(48 + ((cp - 0x1d7ce) % 10)), obf: true };
    }
    if (cp >= 0x1f130 && cp <= 0x1f149) return { ch: String.fromCharCode(97 + (cp - 0x1f130)), obf: true };
    if (cp >= 0x1f150 && cp <= 0x1f169) return { ch: String.fromCharCode(97 + (cp - 0x1f150)), obf: true };
    if (cp >= 0x1f170 && cp <= 0x1f189) return { ch: String.fromCharCode(97 + (cp - 0x1f170)), obf: true };
    if (cp === 0x1f48d || cp === 0x1f518 || cp === 0x1f4bf || cp === 0x1f36a || cp === 0x1f369) {
        return { ch: 'o', obf: true };
    }
    // Circled & Parenthesized Latin (Ⓐ-ⓩ, ⒜-⒵)
    if (cp >= 0x24b6 && cp <= 0x24cf) return { ch: String.fromCharCode(97 + (cp - 0x24b6)), obf: true };
    if (cp >= 0x24d0 && cp <= 0x24e9) return { ch: String.fromCharCode(97 + (cp - 0x24d0)), obf: true };
    if (cp >= 0x249c && cp <= 0x24b5) return { ch: String.fromCharCode(97 + (cp - 0x249c)), obf: true };
    if (cp >= 0x2460 && cp <= 0x2468) return { ch: String.fromCharCode(49 + (cp - 0x2460)), obf: true };
    // Fullwidth ASCII
    if (cp >= 0xff01 && cp <= 0xff5e) {
        var fw = cp - 0xfee0;
        if (fw >= 65 && fw <= 90) return { ch: String.fromCharCode(fw + 32), obf: true };
        if ((fw >= 97 && fw <= 122) || (fw >= 48 && fw <= 57) || fw === 46 || fw === 45) {
            return { ch: String.fromCharCode(fw), obf: true };
        }
    }
    var mapped = _BMP_SPECIAL_MAP[cp];
    if (mapped) return { ch: mapped, obf: true };
    if (cp >= 65 && cp <= 90) return { ch: String.fromCharCode(cp + 32), obf: false };
    if ((cp >= 97 && cp <= 122) || (cp >= 48 && cp <= 57) || cp === 46 || cp === 45 || cp === 47 || cp === 58) {
        return { ch: String.fromCharCode(cp), obf: false };
    }
    return null;
}

function normalizeForWatermarkCheck(str) {
    var s = String(str || '');
    var out = '';
    for (var i = 0; i < s.length; i++) {
        var hi = s.charCodeAt(i);
        var cp = hi;
        if (hi >= 0xd800 && hi <= 0xdbff && i + 1 < s.length) {
            var lo = s.charCodeAt(i + 1);
            if (lo >= 0xdc00 && lo <= 0xdfff) {
                cp = 0x10000 + ((hi - 0xd800) << 10) + (lo - 0xdc00);
                i++;
            }
        }
        if (cp <= 0xffff && _isCombiningOrInvisible(cp)) continue;
        var m = _mapWatermarkCodePoint(cp);
        if (m) {
            out += m.ch;
        } else if (cp <= 0xffff) {
            out += String.fromCharCode(cp);
        }
    }
    return out;
}

function _isStrongDecorativeCp(cp) {
    if (cp >= 0x1f000) return true;
    if (cp >= 0x2190 && cp <= 0x21ff) return true;
    if (cp >= 0x2300 && cp <= 0x23ff) return true;
    if (cp >= 0x2500 && cp <= 0x27bf) return true;
    if (cp >= 0x2b00 && cp <= 0x2bff) return true;
    if (cp === 0x0d60 || cp === 0x0d8f || cp === 0x0e51 || cp === 0x06de || cp === 0x06e9) return true;
    return cp === 0x00a4 || cp === 0x00a7 || cp === 0x00af || cp === 0x00b0 || cp === 0x00b4 ||
        cp === 0x00b7 || cp === 0x00b8 || cp === 0x00ba || cp === 0x00d7 || cp === 0x00f7 ||
        cp === 0x00f8 || cp === 0x00ab || cp === 0x00bb || cp === 0x00a8 || cp === 0x2022 ||
        cp === 0x2039 || cp === 0x203a;
}

function _isInterleaveNoiseCp(cp) {
    if (cp === 32 || cp === 9 || cp === 0x00a0 || (cp >= 0x2000 && cp <= 0x200f) || cp === 0x3000) return true;
    if (cp === 95 || cp === 42 || cp === 126 || cp === 0x00b7 || cp === 0x2022 || cp === 0x00b0) return true;
    return (cp >= 0x2500 && cp <= 0x27bf) || cp >= 0x1f000;
}

function _isInlineSpaceCp(cp) {
    return cp === 32 || cp === 9 || cp === 0x00a0 || (cp >= 0x2000 && cp <= 0x200a) || cp === 0x3000;
}

function _isWideSpaceCp(cp) {
    return (cp >= 0x2000 && cp <= 0x200a) || cp === 0x3000;
}

function _codePointAtCompat(s, i) {
    var hi = s.charCodeAt(i);
    if (hi >= 0xd800 && hi <= 0xdbff && i + 1 < s.length) {
        var lo = s.charCodeAt(i + 1);
        if (lo >= 0xdc00 && lo <= 0xdfff) {
            return { cp: 0x10000 + ((hi - 0xd800) << 10) + (lo - 0xdc00), len: 2 };
        }
    }
    return { cp: hi, len: 1 };
}

function _codePointBeforeCompat(s, i) {
    var lo = s.charCodeAt(i - 1);
    if (lo >= 0xdc00 && lo <= 0xdfff && i - 2 >= 0) {
        var hi = s.charCodeAt(i - 2);
        if (hi >= 0xd800 && hi <= 0xdbff) {
            return { cp: 0x10000 + ((hi - 0xd800) << 10) + (lo - 0xdc00), len: 2 };
        }
    }
    return { cp: lo, len: 1 };
}

var _LEFT_BANNER_RE = /(?:(?:\.o0×X×0o\.|\(-_-\)|•\]|\([¯´`☆✭★v¸._\s]+\)|[«»¤*·•°øº¸¯´`§¨'÷×░▒▓█๑۞۩★☆✭♩♪♫♬\-=~\^_,\s.])+)$/;
var _RIGHT_BANNER_RE = /^(?:(?:\.o0×X×0o\.|\(-_-\)|\[•|\([¯´`☆✭★v¸._\s]+\)|[«»¤*·•°øº¸¯´`§¨'÷×░▒▓█๑۞۩★☆✭♩♪♫♬\-=~\^_,\s.])+)/;
var _KNOWN_SITE_RE = /^(?:69shux|69shnx|69shu|69shuba|69xinshu|69yuedu|69shuh|69shuw|twkan|twaakan|twkaan|uukanshu|biquge|xbiquge|bqg|5200|quanben|piaotia|ptwxz|shuquge|shubaow)/;
var _DOMAIN_RE = /(?:https?:\/\/)?(?:www\.)?([a-z0-9][a-z0-9\-]{1,28})\.(com|net|org|cc|co|me|pro|vip|xyz|top|la|tw|cn|info|io|app|site|club|live|tv|pw|icu|wang|xin|fun|ink|work|run|ren|one|biz)/g;
var _REVERSED_DOMAIN_RE = /(?:moc|ten|gro|cc|oc|em|orp|piv|zyx|pot|nc|wt)\.(?:xuhs96?|uhs96?|abuhs96?|nakwt|uhsnakuu|eguqib)/g;

function _hasBannerAnchor(s) {
    if (s.indexOf('(-_-)') !== -1 || s.indexOf('.o0×X×0o.') !== -1) return true;
    for (var i = 0; i < s.length; ) {
        var r = _codePointAtCompat(s, i);
        if (_isStrongDecorativeCp(r.cp)) return true;
        i += r.len;
    }
    return false;
}

function _expandWrapper(seg, start, end) {
    var leftLimit = Math.max(0, start - 48);
    var rightLimit = Math.min(seg.length, end + 48);

    var leftCursor = start;
    var leftStrong = false;
    while (leftCursor > leftLimit) {
        var prefix = seg.substring(leftLimit, leftCursor);
        var lm = _LEFT_BANNER_RE.exec(prefix);
        if (lm && lm[0] && _hasBannerAnchor(lm[0])) {
            var nextL = leftLimit + lm.index;
            if (nextL < leftCursor) {
                leftCursor = nextL;
                leftStrong = true;
                continue;
            }
        }
        var prev = _codePointBeforeCompat(seg, leftCursor);
        if (_isStrongDecorativeCp(prev.cp)) {
            leftCursor -= prev.len;
            leftStrong = true;
        } else if (_isInlineSpaceCp(prev.cp) || (prev.cp <= 0xffff && _isCombiningOrInvisible(prev.cp))) {
            leftCursor -= prev.len;
        } else {
            break;
        }
    }
    var newStart = leftStrong ? leftCursor : start;
    if (leftStrong) {
        while (newStart < start && seg.charAt(newStart) === ' ') newStart++;
    }

    var rightCursor = end;
    var rightStrong = false;
    while (rightCursor < rightLimit) {
        var suffix = seg.substring(rightCursor, rightLimit);
        var rm = _RIGHT_BANNER_RE.exec(suffix);
        if (rm && rm[0] && _hasBannerAnchor(rm[0])) {
            var nextR = rightCursor + rm[0].length;
            if (nextR > rightCursor) {
                rightCursor = nextR;
                rightStrong = true;
                continue;
            }
        }
        var next = _codePointAtCompat(seg, rightCursor);
        if (_isStrongDecorativeCp(next.cp)) {
            rightCursor += next.len;
            rightStrong = true;
        } else if (_isInlineSpaceCp(next.cp) || (next.cp <= 0xffff && _isCombiningOrInvisible(next.cp))) {
            rightCursor += next.len;
        } else {
            break;
        }
    }
    var newEnd = rightStrong ? rightCursor : end;
    if (rightStrong) {
        while (newEnd > end && seg.charAt(newEnd - 1) === ' ') newEnd--;
    }

    if (newStart < start) {
        while (newStart < start && '.,\''.indexOf(seg.charAt(newStart)) !== -1 &&
            seg.substring(newStart, newStart + 9) !== '.o0×X×0o.' &&
            (newStart + 1 >= start || !_isStrongDecorativeCp(_codePointAtCompat(seg, newStart + 1).cp))) {
            newStart++;
        }
    }
    if (newEnd > end) {
        while (newEnd > end && '.,\''.indexOf(seg.charAt(newEnd - 1)) !== -1 &&
            (newEnd < 9 || seg.substring(newEnd - 9, newEnd) !== '.o0×X×0o.') &&
            (newEnd - 1 <= end || !_isStrongDecorativeCp(_codePointBeforeCompat(seg, newEnd - 1).cp))) {
            newEnd--;
        }
    }

    return { start: newStart, end: newEnd, symmetric: leftStrong && rightStrong };
}

function _stripInlineDomainsAndShells(seg) {
    if (!seg || seg.length < 4) return seg;

    var sChars = [], sStart = [], sEnd = [], sObf = [];
    var cChars = [], cStart = [], cEnd = [], cObf = [], cSkip = [];
    var pendingNoise = false;

    for (var i = 0; i < seg.length; ) {
        var r = _codePointAtCompat(seg, i);
        var cp = r.cp;
        var nextI = i + r.len;

        if (cp <= 0xffff && _isCombiningOrInvisible(cp)) {
            if (sChars.length > 0 && sChars[sChars.length - 1] !== '\u0000') {
                sEnd[sEnd.length - 1] = nextI;
                sObf[sObf.length - 1] = true;
            }
            if (cChars.length > 0 && cChars[cChars.length - 1] !== '\u0000') {
                cEnd[cEnd.length - 1] = nextI;
                cObf[cObf.length - 1] = true;
            }
            i = nextI;
            continue;
        }

        var m = _mapWatermarkCodePoint(cp);
        if (m) {
            sChars.push(m.ch); sStart.push(i); sEnd.push(nextI); sObf.push(m.obf);
            cChars.push(m.ch); cStart.push(i); cEnd.push(nextI); cObf.push(m.obf); cSkip.push(pendingNoise);
            pendingNoise = false;
        } else {
            sChars.push('\u0000'); sStart.push(i); sEnd.push(nextI); sObf.push(false);
            if (_isInterleaveNoiseCp(cp)) {
                pendingNoise = true;
            } else {
                cChars.push('\u0000'); cStart.push(i); cEnd.push(nextI); cObf.push(false); cSkip.push(false);
                pendingNoise = false;
            }
        }
        i = nextI;
    }

    var spans = [];
    function scanProj(chars, starts, ends, obfs, skips, isCompact) {
        var text = chars.join('');
        var m;
        _DOMAIN_RE.lastIndex = 0;
        while ((m = _DOMAIN_RE.exec(text)) !== null) {
            var idx = m.index;
            var last = idx + m[0].length - 1;
            var core = m[1];
            var oStart = starts[idx];
            var oEnd = ends[last];
            if (isCompact && (oEnd - oStart) > m[0].length * 4 + 6) continue;
            var obfCount = 0;
            var skipCount = 0;
            for (var k = idx; k <= last; k++) {
                if (obfs[k]) obfCount++;
                if (isCompact && k > idx && skips[k]) skipCount++;
            }
            var isKnown = _KNOWN_SITE_RE.test(core);
            var hasPrefix = m[0].indexOf('www.') === 0 || m[0].indexOf('http://') === 0 || m[0].indexOf('https://') === 0;
            var exp = _expandWrapper(seg, oStart, oEnd);
            if (isKnown || obfCount >= 2 || (skipCount >= 3 && core.length >= 4) || hasPrefix || exp.symmetric) {
                spans.push({ start: exp.start, end: exp.end });
            }
        }
        _REVERSED_DOMAIN_RE.lastIndex = 0;
        while ((m = _REVERSED_DOMAIN_RE.exec(text)) !== null) {
            var rIdx = m.index;
            var rLast = rIdx + m[0].length - 1;
            var rStart = starts[rIdx];
            var rEnd = ends[rLast];
            if (isCompact && (rEnd - rStart) > m[0].length * 4 + 4) continue;
            var rExp = _expandWrapper(seg, rStart, rEnd);
            spans.push({ start: rExp.start, end: rExp.end });
        }
    }

    scanProj(sChars, sStart, sEnd, sObf, null, false);
    scanProj(cChars, cStart, cEnd, cObf, cSkip, true);

    // Vỏ watermark rỗng: `[2+ emoji/symbol][2+ khoảng trắng rộng \u2003][2+ emoji/symbol]`
    for (var p = 0; p < seg.length; ) {
        var pr = _codePointAtCompat(seg, p);
        if (!_isWideSpaceCp(pr.cp)) { p += pr.len; continue; }
        var spStart = p;
        var spCount = 0;
        while (p < seg.length) {
            var sr = _codePointAtCompat(seg, p);
            if (_isWideSpaceCp(sr.cp)) { spCount++; p += sr.len; }
            else if (sr.cp === 32) { p += 1; }
            else break;
        }
        var spEnd = p;
        if (spCount < 2) continue;

        var left = spStart, leftCnt = 0;
        while (left > 0 && leftCnt < 5) {
            var lr = _codePointBeforeCompat(seg, left);
            if (lr.cp <= 0xffff && _isCombiningOrInvisible(lr.cp)) left -= lr.len;
            else if (_isStrongDecorativeCp(lr.cp)) { left -= lr.len; leftCnt++; }
            else break;
        }
        var right = spEnd, rightCnt = 0;
        while (right < seg.length && rightCnt < 5) {
            var rr = _codePointAtCompat(seg, right);
            if (rr.cp <= 0xffff && _isCombiningOrInvisible(rr.cp)) right += rr.len;
            else if (_isStrongDecorativeCp(rr.cp)) { right += rr.len; rightCnt++; }
            else break;
        }
        if (leftCnt >= 2 && rightCnt >= 2) {
            spans.push({ start: left, end: right });
            p = right;
        }
    }

    if (!spans.length) return seg;
    spans.sort(function (a, b) { return a.start - b.start; });
    var merged = [spans[0]];
    for (var mIdx = 1; mIdx < spans.length; mIdx++) {
        var prevSpan = merged[merged.length - 1];
        if (spans[mIdx].start <= prevSpan.end) {
            if (spans[mIdx].end > prevSpan.end) prevSpan.end = spans[mIdx].end;
        } else {
            merged.push(spans[mIdx]);
        }
    }
    var out = '';
    var cur = 0;
    for (var j = 0; j < merged.length; j++) {
        if (merged[j].start > cur) out += seg.substring(cur, merged[j].start);
        if (merged[j].end > cur) cur = merged[j].end;
    }
    if (cur < seg.length) out += seg.substring(cur);
    return out;
}

function _isWatermarkLine(line) {
    var plain = String(line || '').replace(/<[^>]+>/g, '');
    var norm = normalizeForWatermarkCheck(plain).trim();
    if (!norm) return true;

    // CHỈ xóa nguyên dòng nếu đó là câu quảng cáo đứng riêng lẻ (KHÔNG xóa đoạn văn truyện dài
    // vô tình nhắc từ khóa — watermark inline đã được _stripInlineWatermarks cắt riêng ở bước trước).
    if (norm.length > 140) return false;

    var compact = norm.replace(/[\s\u3000\u2003\u2002\u00a0\-_→➔>·•,，.。!！?？:：;；【】（）()《》「」『』\[\]]+/g, '');

    if (/google\s*搜索\s*twkan/i.test(norm)) return true;
    if (compact.indexOf('twkan') !== -1 && norm.length < 60) return true;

    var hasSiteName = /台灣小說網|臺灣小[說説]網|台湾小说网/.test(norm);
    if (hasSiteName && /首發|首发|記住|记住|域名|超全|超好用|超讚|超赞|超實用|超实用|超靠譜|超靠谱|超便捷|輕鬆讀|轻松读|等你尋|等你寻|書庫多|书库多|解書荒|解书荒|解無聊|解无聊|無錯章節|无错章节|無亂序|无乱序|隨時看|随时看|好書|好书|追台灣小說|追台湾小说|→/.test(norm)) {
        return true;
    }

    if (/^(?:本書由|本书由).*(?:全網首發|全网首发)/.test(norm)) return true;
    if (/^(?:本書首發|本书首发).*(?:提供給你無錯章節|無亂序章節|提供给你无错章节|无乱序章节)/.test(norm)) return true;
    if (/^(?:請)?(?:記住首發網站域名|记住首发网站域名|記住本站域名|记住本站域名)/.test(norm)) return true;
    if (/寫到這裡我希望讀者記一下我們域名|写到这里我希望读者记一下我们域名/.test(norm)) return true;
    if (/(?:請記住|请记住).*(?:觀看最快的章節更新|观看最快的章节更新)/.test(norm)) return true;
    if (/麻煩您動動手指.*分享到facebook|麻烦您动动手指.*分享到facebook/i.test(norm)) return true;

    return false;
}

function _stripInlineWatermarks(line) {
    var s = String(line || '')
        .replace(/【[^】]*(?:記住本站域名|记住本站域名|寫到這裡我希望讀者記一下|麻煩您動動手指|把本網站分享到Facebook|台灣小說網|臺灣小[說説]網)[^】]*】/gi, '')
        .replace(/[（(][^）)]*(?:請記住|请记住)[^）)]*(?:觀看最快的章節更新|观看最快的章节更新|台灣小說網|臺灣小[說説]網)[^）)]*[）)]/gi, '')
        .replace(/💘🎈[^\n<]*♨🐧/g, '')
        .replace(/\|!¤\*'~``~'\*¤!\|\s+\|!¤\*'~``~'\*¤!\|/g, '')
        .replace(/\(¯`·\.¸¸\.·´¯`·\.¸¸\.(?:->|-&gt;)\s+(?:<-|&lt;-)\.¸¸\.·´¯`·\.¸¸\.·´¯\)/g, '')
        .replace(/ıllıllı\s+ıllıllı/g, '')
        .replace(/,-\*\x27\s*\^\s*\x27~\*-\.,_,\.-\*~\s+~\*-\.,_,\.-\*~\x27\s*\^\s*\x27\*-,\s*/g, '');
    s = _stripInlineDomainsAndShells(s);
    return s.replace(/^[\s\u00a0\u2002\u2003\u3000]+|[\s\u00a0\u2002\u2003\u3000]+$/g, '');
}

function cleanChapterHtmlDetailed(html) {
    var sec = decodeSecLastCanvasesDetailed(html);
    var s = sec.html
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/[\u200b-\u200d\ufeff]/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&emsp;/gi, '')
        .replace(/<\s*p\b[^>]*>/gi, '')
        .replace(/<\s*\/p\s*>/gi, '\n')
        .replace(/<\s*br\s*\/?\s*>/gi, '\n')
        .replace(/\r\n?/g, '\n');

    var rawLines = s.split('\n');
    var kept = [];
    var checkedFirstHeading = false;

    for (var i = 0; i < rawLines.length; i++) {
        var line = rawLines[i].replace(/^[\s\u00a0\u2002\u2003\u3000]+|[\s\u00a0\u2002\u2003\u3000]+$/g, '');
        if (!line) continue;

        line = _stripInlineWatermarks(line);
        if (!line) continue;

        if (!checkedFirstHeading) {
            checkedFirstHeading = true;
            var headingPlain = line.replace(/<[^>]+>/g, '').trim();
            if (headingPlain.length < 80 && /^第[\d零一二三四五六七八九十百千万兩两]+[章回节節](?:[\s:：]|$)/.test(headingPlain)) {
                continue;
            }
        }

        if (_isWatermarkLine(line)) continue;
        kept.push(line);
    }

    return {
        html: kept.join('<br>\n'),
        decodedCount: sec.decodedCount,
        failedCount: sec.failedCount,
        failReason: sec.failReason
    };
}

function cleanChapterHtml(html) {
    return cleanChapterHtmlDetailed(html).html;
}

function extractSecScriptUrl(doc) {
    var found = '';
    if (!doc) return '';
    try {
        doc.select('script[src]').forEach(function (el) {
            if (found) return;
            var src = String(el.attr('src') || '');
            if (/reader-sec\.js/i.test(src)) {
                found = src;
            }
        });
    } catch (e) {
    }
    return found;
}

function extractSecScriptVersion(src) {
    var m = String(src || '').match(/[?&]v=([^&#]+)/i);
    return m ? m[1] : '';
}

function cleanPlainText(s) {
    return decodeHtmlEntities(String(s || ''))
        .replace(/[\u200b-\u200d\ufeff]/g, '')
        .replace(/[\s\u00a0\u2002\u2003\u3000]+/g, ' ')
        .trim();
}

function stripHtmlToText(html) {
    var s = String(html || '')
        .replace(/<\s*br\s*\/?\s*>/gi, '\n')
        .replace(/<\s*\/(?:p|div|li|h[1-6])\s*>/gi, '\n')
        .replace(/<[^>]+>/g, '');
    s = decodeHtmlEntities(s).replace(/[\u200b-\u200d\ufeff]/g, '');
    var lines = s.split(/\r?\n/);
    var out = [];
    for (var i = 0; i < lines.length; i++) {
        var t = lines[i].replace(/^[\s\u00a0\u2002\u2003\u3000]+|[\s\u00a0\u2002\u2003\u3000]+$/g, '')
            .replace(/[ \t\u00a0\u2002\u2003\u3000]+/g, ' ');
        if (t) out.push(t);
    }
    return out.join('\n');
}
