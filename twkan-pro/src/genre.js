load('config.js');
load('cleaner.js');

function execute() {
    var out = [];
    var seen = {};
    var res = fetch(BASE_URL + "/novels/class", {timeout: 15000});
    if (res.ok) {
        var doc = res.html();
        doc.select('a[href*="/novels/class/"]').forEach(function (a) {
            if (out.length >= 24) return;
            var href = String(a.attr('href') || '');
            var m = href.match(/\/novels\/class\/(\d+)_\d+\.html/);
            if (!m) return;
            var title = cleanPlainText(a.text());
            var input = BASE_URL + "/novels/class/" + m[1] + "_{{page}}.html";
            if (!title || seen[input]) return;
            seen[input] = true;
            out.push({title: title, input: input, script: "gen.js"});
        });
    }
    if (out.length === 0) {
        var fallback = [
            ["全部分類", "0"], ["言情小說", "3"], ["玄幻魔法", "1"],
            ["修真武俠", "2"], ["穿越時空", "11"], ["都市小說", "9"],
            ["歷史軍事", "4"], ["遊戲競技", "5"], ["科幻空間", "6"],
            ["懸疑驚悚", "7"], ["同人小說", "8"], ["官場職場", "10"],
            ["青春校園", "12"]
        ];
        for (var i = 0; i < fallback.length; i++) {
            out.push({
                title: fallback[i][0],
                input: BASE_URL + "/novels/full/" + fallback[i][1] + "_{{page}}.html",
                script: "gen.js"
            });
        }
    }
    return Response.success(out);
}
