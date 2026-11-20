var TWKAN_SEC_KEY = 'jieqi2026abcd12';
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

function decodeUtf8Bytes(bytes) {
    var out = '';
    var i = 0;
    var len = bytes.length;
    while (i < len) {
        var b1 = bytes[i++] & 0xff;
        if (b1 < 0x80) {
            out += String.fromCharCode(b1);
        } else if ((b1 & 0xe0) === 0xc0 && i < len) {
            var b2 = bytes[i++] & 0x3f;
            out += String.fromCharCode(((b1 & 0x1f) << 6) | b2);
        } else if ((b1 & 0xf0) === 0xe0 && i + 1 < len) {
            var c2 = bytes[i++] & 0x3f;
            var c3 = bytes[i++] & 0x3f;
            out += String.fromCharCode(((b1 & 0x0f) << 12) | (c2 << 6) | c3);
        } else if ((b1 & 0xf8) === 0xf0 && i + 2 < len) {
            var d2 = bytes[i++] & 0x3f;
            var d3 = bytes[i++] & 0x3f;
            var d4 = bytes[i++] & 0x3f;
            var cp = (((b1 & 0x07) << 18) | (d2 << 12) | (d3 << 6) | d4) - 0x10000;
            out += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
        }
    }
    return out;
}

function decodeHtmlEntities(s) {
    return String(s || '')
        .replace(/&emsp;/gi, '\u2003')
        .replace(/&ensp;/gi, '\u2002')
        .replace(/&nbsp;/gi, ' ')
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

function decodeSecLastPayload(dataC, dataV) {
    if (!dataC || !dataV) return '';
    var raw = decodeBase64ToBytes(dataC);
    if (!raw.length) return '';
    var k1 = TWKAN_SEC_KEY;
    var k1Len = k1.length;
    var k2Len = dataV.length;
    var out = new Array(raw.length);
    for (var i = 0; i < raw.length; i++) {
        out[i] = raw[i] ^ (k1.charCodeAt(i % k1Len) & 0xff) ^ (dataV.charCodeAt(i % k2Len) & 0xff);
    }
    var decoded = decodeUtf8Bytes(out);
    // Match reader-sec.js (_0x3f48c2 sets innerHTML then reads textContent)
    decoded = decoded.replace(/<\s*br\s*\/?\s*>/gi, '\n').replace(/<[^>]+>/g, '');
    decoded = decodeHtmlEntities(decoded);
    decoded = decoded.replace(/^[\s\u00a0\u2002\u2003\u3000]+|[\s\u00a0\u2002\u2003\u3000]+$/g, '');
    return decoded;
}

function decodeSecLastCanvases(html) {
    return String(html || '').replace(/<canvas\b([^>]*)>(?:[\s\S]*?<\/canvas>)?/gi, function (_, attrs) {
        try {
            var dataC = _extractAttr(attrs, 'data-c');
            var dataV = _extractAttr(attrs, 'data-v');
            if (!dataC || !dataV) return '';
            var text = decodeSecLastPayload(dataC, dataV);
            if (!text) return '';
            var lines = text.split(/\r?\n/);
            var htmlLines = [];
            for (var i = 0; i < lines.length; i++) {
                var t = lines[i].replace(/^[\s\u00a0\u2002\u2003\u3000]+|[\s\u00a0\u2002\u2003\u3000]+$/g, '');
                if (t) htmlLines.push(_escapeHtmlText(t));
            }
            return htmlLines.join('<br>\n');
        } catch (e) {
            return '';
        }
    });
}

var _BMP_SPECIAL_MAP = {
    // Letterlike Symbols holes in Mathematical Alphanumerics
    0x2102: 'c', 0x210a: 'g', 0x210b: 'h', 0x210c: 'h', 0x210d: 'h', 0x210e: 'h',
    0x210f: 'h', 0x2110: 'i', 0x2111: 'i', 0x2112: 'l', 0x2113: 'l', 0x2115: 'n',
    0x2119: 'p', 0x211a: 'q', 0x211b: 'r', 0x211c: 'r', 0x211d: 'r', 0x2124: 'z',
    0x2128: 'z', 0x212c: 'b', 0x212d: 'c', 0x212f: 'e', 0x2130: 'e', 0x2131: 'f',
    0x2133: 'm', 0x2134: 'o', 0x2139: 'i',
    // Small caps & IPA / Latin Extended / Greek / Cyrillic / Thai / Hebrew homoglyphs
    0x1d00: 'a', 0x1d04: 'c', 0x1d05: 'd', 0x1d07: 'e', 0x0262: 'g', 0x029c: 'h',
    0x026a: 'i', 0x1d0a: 'j', 0x1d0b: 'k', 0x029f: 'l', 0x1d0d: 'm', 0x0274: 'n',
    0x1d0f: 'o', 0x1d18: 'p', 0x0280: 'r', 0x1d1b: 't', 0x1d1c: 'u', 0x1d20: 'v',
    0x1d21: 'w', 0x028f: 'y', 0x1d22: 'z',
    0x019a: 't', 0x026f: 'w', 0x0199: 'k', 0x03b1: 'a', 0x0273: 'n', 0x0188: 'c',
    0x03c3: 'o', 0x0271: 'm', 0x0272: 'n', 0x027e: 'r', 0x01ab: 't', 0x0192: 'f',
    0x0203: 'a', 0x0202: 'a', 0x0103: 'a', 0x0102: 'a', 0x00e0: 'a', 0x00e1: 'a',
    0x00e2: 'a', 0x00e3: 'a', 0x00e4: 'a', 0x00e5: 'a', 0x0101: 'a',
    0x020f: 'o', 0x020e: 'o', 0x014f: 'o', 0x014e: 'o', 0x00f2: 'o', 0x00f3: 'o',
    0x00f4: 'o', 0x00f5: 'o', 0x00f6: 'o', 0x014d: 'o', 0x03cc: 'o', 0x03bf: 'o',
    0x015f: 's', 0x0161: 's', 0x043d: 'h', 0x0430: 'a', 0x0435: 'e', 0x043e: 'o',
    0x0440: 'p', 0x0441: 'c', 0x0445: 'x', 0x03c5: 'u', 0x03ba: 'k', 0x03bd: 'n',
    0x03c4: 't', 0x03c9: 'w', 0x03c2: 'c',
    0x0e23: 's', 0x0452: 'h', 0x0e22: 'u', 0x05d0: 'x', 0x0e4f: 'o', 0x0e53: 'm',
    0x0431: '6', 0x2079: '9',
    0x2024: '.', 0x2027: '.', 0xff0e: '.', 0x3002: '.', 0x24b6: 'a'
};

function _isCombiningOrInvisible(code) {
    return (code >= 0x0300 && code <= 0x036f) ||
        (code >= 0x0483 && code <= 0x0489) ||
        (code >= 0x1ab0 && code <= 0x1aff) ||
        (code >= 0x1dc0 && code <= 0x1dff) ||
        (code >= 0x20d0 && code <= 0x20ff) ||
        (code >= 0xfe20 && code <= 0xfe2f) ||
        (code >= 0x200b && code <= 0x200f) ||
        code === 0xfeff || code === 0x00ad;
}

function normalizeForWatermarkCheck(str) {
    var s = String(str || '');
    var out = '';
    for (var i = 0; i < s.length; i++) {
        var hi = s.charCodeAt(i);
        if (hi >= 0xd800 && hi <= 0xdbff && i + 1 < s.length) {
            var lo = s.charCodeAt(i + 1);
            if (lo >= 0xdc00 && lo <= 0xdfff) {
                var cp = 0x10000 + ((hi - 0xd800) << 10) + (lo - 0xdc00);
                i++;
                if (cp >= 0x1d400 && cp <= 0x1d6a3) {
                    var offset = (cp - 0x1d400) % 52;
                    out += String.fromCharCode(97 + (offset % 26));
                } else if (cp >= 0x1d7ce && cp <= 0x1d7ff) {
                    out += String.fromCharCode(48 + ((cp - 0x1d7ce) % 10));
                } else if (cp >= 0x1f130 && cp <= 0x1f149) {
                    out += String.fromCharCode(97 + (cp - 0x1f130));
                }
                continue;
            }
        }
        if (_isCombiningOrInvisible(hi)) continue;
        if (hi >= 0xff01 && hi <= 0xff5e) {
            hi -= 0xfee0;
        }
        var mapped = _BMP_SPECIAL_MAP[hi];
        if (mapped) {
            out += mapped;
        } else if (hi >= 65 && hi <= 90) {
            out += String.fromCharCode(hi + 32);
        } else {
            out += String.fromCharCode(hi);
        }
    }
    return out;
}

function _isWatermarkLine(line) {
    var plain = String(line || '').replace(/<[^>]+>/g, '');
    var norm = normalizeForWatermarkCheck(plain).trim();
    if (!norm) return true;

    var compact = norm.replace(/[\s\u3000\u2003\u2002\u00a0\-_→➔>·•,，.。!！?？:：;；【】（）()《》「」『』\[\]]+/g, '');

    if (norm.indexOf('twkan.com') !== -1 || compact.indexOf('twkancom') !== -1) return true;
    if (norm.indexOf('69shux.com') !== -1 || compact.indexOf('69shuxcom') !== -1) return true;
    if (norm.indexOf('69shuba.com') !== -1 || compact.indexOf('69shubacom') !== -1) return true;
    if (norm.indexOf('69shu.com') !== -1 || compact.indexOf('69shucom') !== -1) return true;
    if (/google\s*搜索\s*twkan/i.test(norm)) return true;
    if (compact.indexOf('twkan') !== -1 && norm.length < 80) return true;

    var hasSiteName = /台灣小說網|臺灣小[說説]網|台湾小说网/.test(norm);
    if (hasSiteName && /首發|首发|記住|记住|域名|超全|超好用|超讚|超赞|超實用|超实用|超靠譜|超靠谱|超便捷|輕鬆讀|轻松读|等你尋|等你寻|書庫多|书库多|解書荒|解书荒|解無聊|解无聊|無錯章節|无错章节|無亂序|无乱序|隨時看|随时看|好書|好书|追台灣小說|追台湾小说|→/.test(norm)) {
        return true;
    }

    if (/本書由.*全網首發|本书由.*全网首发/.test(norm)) return true;
    if (/本書首發.*(?:提供給你無錯章節|無亂序章節)|本书首发.*(?:提供给你无错章节|无乱序章节)/.test(norm)) return true;
    if (/記住首發網站域名|记住首发网站域名/.test(norm)) return true;
    if (/記住本站域名|记住本站域名/.test(norm)) return true;
    if (/寫到這裡我希望讀者記一下我們域名|写到这里我希望读者记一下我们域名/.test(norm)) return true;
    if (/(?:請記住|请记住).*(?:觀看最快的章節更新|观看最快的章节更新)/.test(norm)) return true;
    if (/麻煩您動動手指.*分享到facebook|麻烦您动动手指.*分享到facebook/i.test(norm)) return true;

    return false;
}

function _stripInlineWatermarks(line) {
    return String(line || '')
        .replace(/【[^】]*(?:記住本站域名|记住本站域名|寫到這裡我希望讀者記一下|麻煩您動動手指|把本網站分享到Facebook|台灣小說網|臺灣小[說説]網)[^】]*】/gi, '')
        .replace(/[（(][^）)]*(?:請記住|请记住)[^）)]*(?:觀看最快的章節更新|观看最快的章节更新|台灣小說網|臺灣小[說説]網)[^）)]*[）)]/gi, '')
        .replace(/💘🎈[^\n<]*♨🐧/g, '')
        .trim();
}

function cleanChapterHtml(html) {
    var s = decodeSecLastCanvases(html);
    s = s
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

    return kept.join('<br>\n');
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
