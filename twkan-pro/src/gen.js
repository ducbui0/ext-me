load('config.js');
load('cleaner.js');

function _buildPageUrl(u, page) {
    u = String(u || '');
    if (u.indexOf('{{page}}') !== -1) {
        u = u.replace(/\{\{page\}\}/g, String(page));
    } else if (u.indexOf('{0}') !== -1) {
        u = u.replace(/\{0\}/g, String(page));
    }
    return absUrl(u);
}

function _parseNovelList(doc) {
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

function execute(url, page) {
    page = page || '1';
    var target = _buildPageUrl(url, page);
    var res = fetch(target, {timeout: 15000});
    if (!res.ok) return Response.error('HTTP ' + res.status);

    var doc = res.html();
    var data = _parseNovelList(doc);
    var pNum = parseInt(page, 10) || 1;
    var next = null;
    var pagelink = doc.select('.pagelink');
    if (pagelink.size() > 0) {
        var nextBtn = pagelink.select('a.next');
        if (nextBtn.size() > 0 && nextBtn.attr('href')) {
            next = String(pNum + 1);
        }
    } else if (data.length >= 10) {
        next = String(pNum + 1);
    }

    return Response.success(data, next);
}
