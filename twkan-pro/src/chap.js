load('config.js');
load('cleaner.js');

function execute(url) {
    url = normalizeHost(url);
    var res = fetch(url, {timeout: 15000});
    if (!res.ok) return Response.error('HTTP ' + res.status);

    var doc = res.html();
    var contEls = doc.select('#txtcontent0');
    if (contEls.size() === 0) contEls = doc.select('#txtcontent');
    if (contEls.size() === 0) return Response.error('Nội dung chương trống');

    contEls.select('script, style, h1, div, ins, iframe, .txtad, .txtcenter, .sharebtn').remove();
    var rawHtml = String(contEls.html() || '');
    var cleaned = cleanChapterHtml(rawHtml);
    if (!cleaned) return Response.error('Nội dung chương trống');

    return Response.success(cleaned);
}
