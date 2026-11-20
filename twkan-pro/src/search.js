load('config.js');
load('cleaner.js');

function _parseSearchList(doc) {
    var data = [];
    var seen = {};
    var items = doc.select('#article_list_content li');
    if (items.size() === 0) items = doc.select('.newbox li');

    items.forEach(function (li) {
        var nameEls = li.select('.newnav h3 > a:not([class])');
        if (nameEls.size() === 0) nameEls = li.select('h3 > a:not([class])');
        if (nameEls.size() === 0) nameEls = li.select('h3 > a');
        if (nameEls.size() === 0) return;

        var nameEl = nameEls.first();
        var name = cleanPlainText(nameEl.text());
        var linkHref = nameEl.attr('href') || li.select('.newnav > a').attr('href') || li.select('h3 > a').attr('href');
        var link = absUrl(linkHref);
        if (!name || !link || seen[link]) return;
        seen[link] = true;

        var cover = '';
        var imgEls = li.select('.imgbox > img');
        if (imgEls.size() > 0) {
            var img = imgEls.first();
            var cov = cleanPlainText(img.attr('data-src') || img.attr('src'));
            if (cov && cov.indexOf('nocover') === -1) cover = absUrl(cov);
        }

        var desc = '';
        var olEls = li.select('ol');
        if (olEls.size() > 0) {
            desc = cleanPlainText(olEls.first().text());
        } else {
            var zxzj = li.select('.zxzj > p');
            if (zxzj.size() > 0) {
                desc = cleanPlainText(zxzj.first().text()).replace(/^最近[章章][节節]\s*/, '');
            }
        }

        var item = {name: name, link: link, cover: cover, host: BASE_URL};
        if (desc) item.description = desc;
        data.push(item);
    });
    return data;
}

function _parseDirectDetailResult(doc) {
    var titleEls = doc.select('div.booknav2 > h1 > a');
    if (titleEls.size() === 0) return [];
    var titleEl = titleEls.first();
    var name = cleanPlainText(titleEl.text());
    var link = absUrl(titleEl.attr('href'));
    if (!name || !link) return [];
    var cover = '';
    var imgEls = doc.select('div.bookimg2 > img');
    if (imgEls.size() > 0) cover = absUrl(imgEls.first().attr('src'));
    var author = cleanPlainText(doc.select('div.booknav2 > p:nth-child(2) > a').text());
    var item = {name: name, link: link, cover: cover, host: BASE_URL};
    if (author) item.description = author;
    return [item];
}

function execute(key, page) {
    if (!page) page = '1';
    var p = parseInt(page, 10) || 1;
    var trimmedKey = String(key || '').trim();
    if (!trimmedKey) return Response.error('Từ khóa trống');
    var encKey = encodeURIComponent(trimmedKey);

    var doc = null;
    var data = [];
    if (p === 1) {
        var res = fetch(BASE_URL + "/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest"
            },
            body: "searchkey=" + encKey + "&searchtype=all",
            timeout: 15000
        });
        if (res.ok) {
            doc = res.html();
            data = _parseSearchList(doc);
            if (data.length === 0) data = _parseDirectDetailResult(doc);
        }
        if (data.length === 0) {
            var res2 = fetch(BASE_URL + "/modules/article/search.php", {
                method: "POST",
                body: {
                    "searchkey": trimmedKey,
                    "searchtype": "all"
                },
                timeout: 15000
            });
            if (!res2.ok) {
                if (!res.ok) return Response.error('HTTP ' + res2.status);
            } else {
                doc = res2.html();
                data = _parseSearchList(doc);
                if (data.length === 0) data = _parseDirectDetailResult(doc);
            }
        }
    } else {
        var resP = fetch(BASE_URL + "/search/" + encKey + "/" + p + ".html", {timeout: 15000});
        if (!resP.ok) return Response.error('HTTP ' + resP.status);
        doc = resP.html();
        data = _parseSearchList(doc);
    }

    if (data.length === 0) return Response.error('Không tìm thấy');
    var next = null;
    if (doc) {
        var nextEls = doc.select('.pagelink a.next');
        if (nextEls.size() > 0 && nextEls.first().attr('href')) {
            next = String(p + 1);
        }
    }
    return Response.success(data, next);
}
