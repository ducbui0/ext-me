load('config.js');

function execute(url) {
    url = String(url || '');
    var m = url.match(/\/(\d+)\.html/);
    if (m && m[1]) {
        return Response.success([BASE_URL + "/ajax_novels/chapterlist/" + m[1] + ".html"]);
    }
    return Response.success([normalizeHost(url)]);
}
