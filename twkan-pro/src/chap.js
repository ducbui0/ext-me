load('config.js');
load('cleaner.js');

function execute(url) {
    url = normalizeHost(url);
    var res = fetch(url, {timeout: 15000});
    if (!res.ok) return Response.error('HTTP ' + res.status);

    var doc = res.html();
    var secScript = extractSecScriptUrl(doc);
    var secVer = extractSecScriptVersion(secScript);

    var contEls = doc.select('#txtcontent0');
    if (contEls.size() === 0) contEls = doc.select('#txtcontent');
    if (contEls.size() === 0) return Response.error('Nội dung chương trống');

    contEls.select('script, style, h1, div, ins, iframe, .txtad, .txtcenter, .sharebtn').remove();
    var rawHtml = String(contEls.html() || '');
    var result = cleanChapterHtmlDetailed(rawHtml);

    if (result.failedCount > 0) {
        var errMsg = 'twkan có thể đã đổi khóa giải mã canvas (' + result.failReason +
            (secScript ? ', script: ' + secScript : '') + ') — cần cập nhật twkan Pro';
        try { Console.log('[twkan Pro] ' + errMsg); } catch (e) {}
        return Response.error(errMsg);
    }

    if (secVer && secVer !== TWKAN_SEC_KNOWN_VER) {
        try {
            Console.log('[twkan Pro] reader-sec.js version changed: ' + secVer +
                ' (known: ' + TWKAN_SEC_KNOWN_VER + ')');
        } catch (e) {}
    }

    if (!result.html) return Response.error('Nội dung chương trống');

    return Response.success(result.html);
}
