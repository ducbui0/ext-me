load('config.js');
load('cleaner.js');

function execute(url) {
    url = normalizeHost(url);
    var m = url.match(/\/(\d+)\.html/);
    if (m && url.indexOf('chapterlist') === -1) {
        url = BASE_URL + "/ajax_novels/chapterlist/" + m[1] + ".html";
    }
    var res = fetch(url, {timeout: 15000});
    if (!res.ok) return Response.error('HTTP ' + res.status);

    var doc = res.html();
    var data = [];
    var seen = {};
    doc.select('ul > li > a').forEach(function (a) {
        var name = cleanPlainText(a.text());
        var link = absUrl(a.attr('href'));
        if (!name || !link || seen[link]) return;
        seen[link] = true;
        data.push({name: name, url: link, host: BASE_URL});
    });
    return Response.success(data);
}
