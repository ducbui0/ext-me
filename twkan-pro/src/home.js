load('config.js');

function execute() {
    return Response.success([
        {title: "熱門", input: BASE_URL + "/novels/newhot_0_0_{{page}}.html", script: "gen.js"},
        {title: "完本", input: BASE_URL + "/novels/newfull_0_0_{{page}}.html", script: "gen.js"},
        {title: "全部分類", input: BASE_URL + "/novels/full/0_{{page}}.html", script: "gen.js"},
        {title: "玄幻魔法", input: BASE_URL + "/novels/full/1_{{page}}.html", script: "gen.js"},
        {title: "都市小說", input: BASE_URL + "/novels/full/9_{{page}}.html", script: "gen.js"},
        {title: "科幻空間", input: BASE_URL + "/novels/full/6_{{page}}.html", script: "gen.js"},
        {title: "懸疑驚悚", input: BASE_URL + "/novels/full/7_{{page}}.html", script: "gen.js"}
    ]);
}
