load('config.js');
load('cleaner.js');

function _metaContent(doc, prop) {
    var els = doc.select('meta[property="' + prop + '"]');
    if (els.size() === 0) return '';
    return cleanPlainText(els.first().attr('content'));
}

function execute(url) {
    url = normalizeHost(url).replace('/txt/', '/book/');
    var res = fetch(url, {timeout: 15000});
    if (!res.ok) return Response.error('HTTP ' + res.status);

    var doc = res.html();
    var name = _metaContent(doc, 'og:novel:book_name');
    var cover = _metaContent(doc, 'og:image');
    var author = _metaContent(doc, 'og:novel:author');
    var statusText = _metaContent(doc, 'og:novel:status');
    var category = _metaContent(doc, 'og:novel:category');

    if (!name) name = cleanPlainText(doc.select('.booknav2 h1 a').text());
    if (!cover) {
        var imgEls = doc.select('.bookimg2 img');
        if (imgEls.size() > 0) {
            var covAttr = imgEls.first().attr('src') || imgEls.first().attr('data-src');
            cover = absUrl(covAttr);
        }
    } else {
        cover = absUrl(cover);
    }
    if (!author) {
        var aEls = doc.select('.booknav2 p:nth-child(2) a');
        if (aEls.size() === 0) aEls = doc.select('.booknav2 p a');
        if (aEls.size() > 0) author = cleanPlainText(aEls.first().text());
    }

    var descParts = [];
    doc.select('.navtxt p').forEach(function (p) {
        var t = stripHtmlToText(p.html());
        if (t) descParts.push(t);
    });
    var desc = descParts.join('\n');
    if (!desc) {
        var npAll = doc.select('div.navtxt');
        if (npAll.size() > 0) {
            npAll.select('script, style').remove();
            desc = stripHtmlToText(npAll.html());
        }
    }
    if (!desc) {
        desc = stripHtmlToText(_metaContent(doc, 'og:description'));
    }

    var parts = [];
    doc.select('.booknav2 p').forEach(function (p) {
        var t = cleanPlainText(p.text());
        if (t) parts.push(t);
    });
    var detail = parts.join('<br>');

    var statusCombined = statusText || detail;
    var ongoing = true;
    if (statusCombined) {
        if (/已[完][结結]|全本|完結|完结|完本/.test(statusCombined)) {
            ongoing = false;
        }
    }

    var genres = [];
    var catId = '';
    var catTitle = category;
    var bcEls = doc.select('.bread a[href*="/novels/class/"]');
    if (bcEls.size() > 0) {
        var bc = bcEls.first();
        var ch = String(bc.attr('href') || '');
        if (!catTitle) catTitle = cleanPlainText(bc.text());
        var m = ch.match(/\/novels\/class\/(\d+)_\d+\.html/);
        if (m) catId = m[1];
    }
    if (catId && catTitle) {
        genres.push({
            title: catTitle,
            input: BASE_URL + "/novels/class/" + catId + "_{{page}}.html",
            script: "gen.js"
        });
    }

    return Response.success({
        name: name,
        cover: cover,
        host: BASE_URL,
        author: author,
        description: desc,
        detail: detail,
        ongoing: ongoing,
        genres: genres
    });
}
