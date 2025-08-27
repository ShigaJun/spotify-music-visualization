/* --- ビューポート --- */
const viewport = { width: 0, height: 0, aspect: 2.4 };
const margin = { top: 60, right: 60, bottom: 60, left: 60 };
const legendsize = { width: -110, height: 0 };

let viewportContainer,
  chartContainer,
  axisContainer,
  tooltipContainer,
  legendContainer,
  axisUnit;
let legendContent;

/* --- データセット --- */
let dataAll;

/* --- ランキング表の初期表示件数 --- */
let rankingDisplayCount = 100;

let getWindowSize = function () {
  console.log("getWindowSize");

  /*--- サイズを取得 ---*/
  const container = $("#viewportContainer");
  viewport.width = container.width();
  viewport.height = Math.round(viewport.width / viewport.aspect);

  /*--- 次を呼び出し ---*/
  PubSub.publish("init:viewport");
};

let initViewport = function () {
  console.log("initViewport");

  /*--- SVG作成 ---*/
  viewportContainer = d3
    .select("#viewportContainer")
    .append("svg")
    .attr("width", viewport.width)
    .attr("height", viewport.height)
    .attr("id", "svgArea")
    .attr("viewBox", "0 0 " + viewport.width + " " + viewport.height)
    .attr("preserveAspectRatio", "xMidYMid");

  /*--- SVG内にグループ作成 ---*/
  chartContainer = viewportContainer.append("g").attr("id", "chartContainer");

  axisContainer = viewportContainer
    .append("g")
    .attr("id", "axisContainer")
    .attr("class", "x axis")
    .attr(
      "transform",
      "translate(0," + (viewport.height - margin.bottom) + ")"
    );

  axisUnit = axisContainer
    .append("g")
    .attr("id", "axisUnit")
    .attr(
      "transform",
      "translate(0" + (viewport.width - margin.right) + ",-20)"
    )
    .attr("width", 100)
    .attr("height", 100)
    .attr("text-anchor", "start");

  tooltipContainer = d3
    .select("#viewportContainer")
    .append("div")
    .attr("id", "tooltipContainer")
    .style("opacity", 0);

  legendContainer = viewportContainer
    .append("g")
    .attr("id", "legendContainer")
    .attr(
      "transform",
      "translate(" +
        (viewport.width - margin.left + legendsize.width) + // X座標
        "," +
        (margin.top + legendsize.height) + // Y座標
        ")"
    );

  /*--- 次を呼び出し ---*/
  PubSub.publish("load:data");
};

let loadData = function () {
  console.log("loadData");

  /*--- データを読み込む ---*/
  Promise.all([d3.csv("assets/data/spotify_tracks_dataset_anime.csv")]).then(
    function (_data) {
      /*--- データを格納 ---*/
      dataAll = _.cloneDeep(_data[0]);
      _data[0] = null;
      console.log(dataAll);

      /*--- 次を呼び出し ---*/
      PubSub.publish("draw:rankingtable", dataAll);
    }
  );
};

function drawRadarChartInline(track) {
  console.log("drawRadarChartInline");

  // コンテナをクリア
  d3.select("#inlineRadarChartContainer").html("");

  const width = 350,
    height = 350,
    margin = 40;
  const radius = Math.min(width, height) / 2 - margin;
  const features = ["danceability", "energy", "valence"];
  const data = features.map((f) => +track[f]);

  const angleSlice = (2 * Math.PI) / features.length;
  const rScale = d3.scaleLinear().domain([0, 1]).range([0, radius]);

  const svg = d3
    .select("#inlineRadarChartContainer")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const g = svg
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`);

  // 同心円の描画
  const levels = 5;
  for (let l = 1; l <= levels; l++) {
    const r = (radius / levels) * l;
    const value = (l / levels).toFixed(1);

    g.append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", r)
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .attr("stroke-dasharray", "2,2")
      .attr("stroke-width", 1);

    g.append("text")
      .attr("x", 0)
      .attr("y", -r)
      .attr("dy", "0.35em")
      .attr("text-anchor", "start")
      .attr("font-size", "12px")
      .attr("fill", "#888")
      .text(value);
  }

  features.forEach((f, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    g.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", rScale(1) * Math.cos(angle))
      .attr("y2", rScale(1) * Math.sin(angle))
      .attr("stroke", "#bbb");
    g.append("text")
      .attr("x", rScale(1.1) * Math.cos(angle))
      .attr("y", rScale(1.1) * Math.sin(angle))
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .text(f);
  });

  const radarLine = d3
    .lineRadial()
    .radius((d) => rScale(d))
    .angle((d, i) => i * angleSlice);

  const radarPath = g
    .append("path")
    .datum(data.concat([data[0]]))
    .attr("fill", "#2185d0")
    .attr("fill-opacity", 0.5)
    .attr("stroke", "#2185d0")
    .attr("stroke-width", 2)
    .attr(
      "d",
      d3
        .lineRadial()
        .radius(() => 0)
        .angle((d, i) => i * angleSlice)
    );

  radarPath.transition().duration(800).attr("d", radarLine);

  g.selectAll(".radar-point")
    .data(data.map((d, i) => ({ value: d, index: i })))
    .enter()
    .append("circle")
    .attr("class", "radar-point")
    .attr("r", 4)
    .attr("fill", "#2185d0")
    .attr("cx", 0)
    .attr("cy", 0)
    .on("mouseover", function (event, d) {
      const feature = features[d.index];
      d3.select("#radarTooltip")
        .style("display", "block")
        .html(`${feature}: <b>${d.value.toFixed(3)}</b>`);
      d3.select(this).attr("fill", "#ff6600");
    })
    .on("mousemove", function (event) {
      d3.select("#radarTooltip")
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 10 + "px");
    })
    .on("mouseout", function () {
      d3.select("#radarTooltip").style("display", "none");
      d3.select(this).attr("fill", "#2185d0");
    })
    .transition()
    .duration(800)
    .attr(
      "cx",
      (d) => rScale(d.value) * Math.cos(angleSlice * d.index - Math.PI / 2)
    )
    .attr(
      "cy",
      (d) => rScale(d.value) * Math.sin(angleSlice * d.index - Math.PI / 2)
    )
    .attr("r", 4)
    .attr("fill", "#2185d0");
}

/* --- 人気度ランキング表の描画 --- */
let drawRankingTable = function (dataAll) {
  console.log("drawRankingTable");

  // popularityでソート
  const rankingData = _.orderBy(dataAll, ["popularity"], ["desc"]).slice(
    0,
    rankingDisplayCount
  );

  // 既存のテーブルをクリア
  d3.select("#rankingTableContainer").html("");

  // テーブル作成
  const table = d3
    .select("#rankingTableContainer")
    .append("table")
    .attr("class", "ui celled table");

  // ヘッダー
  const thead = table.append("thead");
  thead
    .append("tr")
    .selectAll("th")
    .data(["順位", "曲名", "アーティスト"])
    .enter()
    .append("th")
    .text((d) => d);

  // ボディ
  const tbody = table.append("tbody");
  const rows = tbody
    .selectAll("tr")
    .data(rankingData)
    .enter()
    .append("tr")
    .style("cursor", "pointer")
    .on("click", function (event, d) {
      // チャートのハイライト処理
      d3.selectAll(".bees").style("stroke", null).style("stroke-width", null);

      d3.selectAll(".bees")
        .filter((b) => b.track_name === d.track_name && b.artists === d.artists)
        .style("stroke", "#ff6600")
        .style("stroke-width", 4);

      const currentRow = d3.select(this);
      const tableRow = currentRow.node();

      // すでに直後にチャート行があるか判定
      const nextRow = tableRow.nextSibling;
      if (
        nextRow &&
        nextRow.classList &&
        nextRow.classList.contains("radar-chart-row")
      ) {
        // 既にチャートが表示されている場合は閉じる（削除）
        d3.select(nextRow).remove();
        // ★チャートを閉じた時は背景色も戻す
        currentRow.classed("selected-row", false);
        return;
      }

      // 他のチャート行は削除
      d3.selectAll(".radar-chart-row").remove();

      // チャート行を挿入
      const chartRow = d3
        .select(tableRow.parentNode)
        .insert("tr", function () {
          return tableRow.nextSibling;
        })
        .attr("class", "radar-chart-row");

      // 全行から.selected-rowを外し、クリック行に付与
      d3.selectAll("tr").classed("selected-row", false);
      d3.select(this).classed("selected-row", true);

      // チャート用セルを追加（colspan=3で横幅を揃える）
      chartRow
        .append("td")
        .attr("colspan", 3)
        .append("div")
        .attr("id", "inlineRadarChartContainer");

      // レーダーチャートを表示
      drawRadarChartInline(d);
    });

  rows.append("td").text((d, i) => i + 1);
  rows.append("td").text((d) => d.track_name);
  rows.append("td").text((d) => d.artists);

  // もっと見るボタン
  if (rankingDisplayCount < dataAll.length) {
    d3.select("#rankingTableContainer")
      .append("button")
      .attr("id", "showMoreRanking")
      .attr("class", "ui button")
      .text("もっと見る")
      .on("click", function () {
        rankingDisplayCount += 100;
        drawRankingTable(dataAll);
      });
  }
};

window.addEventListener("scroll", function () {
  const btn = document.getElementById("toTopBtn");
  if (window.scrollY > 200) {
    btn.style.display = "block";
  } else {
    btn.style.display = "none";
  }
});

document.getElementById("toTopBtn").onclick = function () {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

PubSub.subscribe("init:windowsize", getWindowSize);
PubSub.subscribe("init:viewport", initViewport);
PubSub.subscribe("load:data", loadData);
PubSub.subscribe("draw:rankingtable", (msg, data) => {
  drawRankingTable(data);
});

PubSub.publish("init:windowsize");
