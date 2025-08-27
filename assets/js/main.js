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

// /* --- ステータス --- */
// const dimensionObj =
// [
// {
//     "label": "価格",
//     "value": "price",
//     "unit": "円"
// },
// {
//     "label": "レビュー数",
//     "value": "number_of_reviews",
//     "unit": "件"
// },
// {
//     "label": "一月あたりのレビュー数",
//     "value": "reviews_per_month",
//     "unit": "件"
// },
// {
//     "label": "365日間の空き状況",
//     "value": "availability_365",
//     "unit": "日"
// }
// ];

// let selectedDimension = dimensionObj[0]["value"];
// let selectedUnit = dimensionObj[0]["unit"];

// /*--- スケール ---*/

// // 円の面積スケール
// let areaScale = d3.scaleSqrt();
// const areaMinMix = [0,20];

// // X軸スケール
// let xScale;

// // 色スケール
// let colorScale = d3.scaleOrdinal();
// let colorValue = d3.schemeSet1;

/*--- 軸 ---*/
// let xAxis;

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
      /*--- 列ごとにデータ型を整理 ---*/
      _data[0].forEach(function (d) {
        //     d.artists = parseInt(d["price"]);
        //     d.minimum_nights = parseInt(d["minimum_nights"]);
        //     d.availability_365 = parseInt(d["availability_365"]);
        //     d.number_of_reviews = parseInt(d["number_of_reviews"]);
        //     d.reviews_per_month = parseInt(d["reviews_per_month"]);
        //     d.number_of_reviews_ltm = parseInt(d["number_of_reviews_ltm"]);
        //     d.calculated_host_listings_count = parseInt(d["calculated_host_listings_count"]);
      });

      /*--- データを格納 ---*/
      dataAll = _.cloneDeep(_data[0]);
      _data[0] = null;
      console.log(dataAll);

      // /*--- room_typeのファセット値に基づいて、カラースケールを設定 ---*/
      // const _facetArr = _.uniq(_.map(dataAll, 'room_type'))
      // colorScale.domain(_facetArr).range(colorValue);

      /*--- 次を呼び出し ---*/
      // PubSub.publish('init:navi');
      PubSub.publish("parse:data");
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

// let initNavi = function() {

//     console.log("initNavi");

//     /*--- ドロップダウンを作成 ---*/
//     var countNaviContainer = d3.select("#variableSelector").append('form').selectAll("span")
//         .data( dimensionObj ).enter().append("div").attr("class", "item").append("div").attr("class", "ui radio");

//     countNaviContainer.append("input")
//         .attr('type', "radio")
//         .attr('class', "measure")
//         .attr('name', "measure")
//         .attr('id', function(d, i) { return "id_count_" + i; })
//         .attr('value', function(d, i) { return d.value; })
//         .property("checked", function(d, i) {
//             if (d.value === selectedDimension) { return true; } else { return false; };
//         });

//     countNaviContainer.append("label")
//         .attr('for', function(d, i) { return "id_count_" + i; })
//         .text(function(d,i) { return d.label; });

//     /*--- クリック時の動作を定義 ---*/
//     d3.selectAll(".measure").on("click", function() {
//         selectedDimension = this.value;
//         selectedUnit = _.find(dimensionObj, { value: this.value })["unit"];

//         PubSub.publish('parse:data');
//     });

//     /*--- 次を呼び出し ---*/
//     PubSub.publish('parse:data');
// };

let parseData = function () {
  console.log("parseData");

  //     /*--- X Scaleの更新 ---*/
  //     xScale = d3.scaleLinear().range([ margin.left, viewport.width - margin.right ])

  //     xScale.domain(d3.extent(dataAll, function(d) {
  //         return +d[selectedDimension];
  //     }));

  //     /*--- Area Scaleの更新 ---*/
  //     const _min = parseInt( d3.min(dataAll, function(d){return d[dimensionObj[0]["value"]];}) );
  //     const _max = parseInt( d3.max(dataAll, function(d){return d[dimensionObj[0]["value"]];}) );

  //     areaScale.domain([_min,_max]).range(areaMinMix);

  //     /*--- 配置を計算 ---*/
  //     const simulation = d3.forceSimulation(dataAll)
  //         .force("x", d3.forceX(function(d) {
  //             return xScale(+d[selectedDimension]);
  //         }).strength(2))
  //         .force("y", d3.forceY((viewport.height / 2) - margin.bottom / 2))
  //         .force("collide", d3.forceCollide().radius(function(d){
  //             return areaScale( +d[dimensionObj[0]["value"]] );
  //         }))
  //         .stop();

  //     /*--- シミュレーションを実行 ---*/
  //     for (let i = 0; i < dataAll.length; ++i) {
  //         simulation.tick(10);
  //     }

  //     /*--- Axisの更新 ---*/
  //     xAxis = d3.axisBottom(xScale)
  //             .ticks(10)
  //             .tickSizeOuter(0);

  //     d3.transition(viewportContainer).select(".x.axis")
  //         .transition()
  //         .duration(1000)
  //         .call(xAxis);

  //     /*--- 単位の更新 ---*/
  //     const unitLabel = axisUnit.selectAll(".units")
  //         .data(selectedUnit);

  //     unitLabel.exit()
  //         .remove();

  //     unitLabel.enter()
  //         .append("text")
  //         .merge(unitLabel)
  //         .attr("class", "units")
  //         .text(selectedUnit);

  //     /*--- 凡例の描画 ---*/

  //     legendContent = d3.legendColor()
  //         .shapePadding(5)
  //         .labelOffset(5)
  //         .scale(colorScale);

  //     d3.select("#legendContainer")
  //         .call(legendContent);

  //     /*--- 次を呼び出し ---*/
  //     PubSub.publish('draw:charts');
  drawRankingTable(dataAll);
};

// let drawCharts = function() {

//     console.log("drawCharts");

//     /*--- 円（Bee）を描画 ---*/
//     const countriesCircles = chartContainer.selectAll(".bees")
//         .data(dataAll, function(d) { return d.name });

//     countriesCircles.exit()
//         .transition()
//         .duration(1000)
//         .ease(d3.easeBounce)
//         .attr("cx", 0)
//         .attr("cy", (viewport.height / 2) - margin.bottom / 2)
//         .remove();

//     countriesCircles.enter()
//         .append("circle")
//         .attr("class", "bees")
//         .attr("cx", 0)
//         .attr("cy", (viewport.height / 2) - margin.bottom / 2)
//         .attr("r", function(d){
//             return 8;
//         })
//         .style("fill", function(d,i){
//             return "#FFFFFF"
//         })
//         .merge(countriesCircles)
//         .transition()
//         .duration(2000)
//         .ease(d3.easeBounce)
//         .attr("cx", function(d) {
//             return d.x;
//         })
//         .attr("cy", function(d) { return d.y; })
//         .attr("r", function(d){
//             return areaScale( +d[dimensionObj[0]["value"]] );
//         })
//         .style("fill", function(d,i){
//             return colorScale(d["room_type"]);
//         });

//     /*--- ツールチップを描画 ---*/

//     d3.selectAll(".bees").on("mousemove", function() { //マウスオーバー時

//         const d = d3.select(this).datum();
//         tooltipContainer.html(
//             `Name: <strong>${d.name}</strong><br>
//             Room Type: <strong>${d.room_type}</strong><br>
//             Price: <strong>${d.price}</strong><br>`
//             )
//             .style('top', event.pageY - 12 + 'px')
//             .style('left', event.pageX + 25 + 'px')
//             .style("opacity", 0.9);

//     }).on("mouseout", function(_) { //マウスアウト時

//         tooltipContainer.style("opacity", 0);

//     });

// };

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
// PubSub.subscribe('init:navi', initNavi);
PubSub.subscribe("parse:data", parseData);
// PubSub.subscribe('draw:charts', drawCharts);

PubSub.publish("init:windowsize");
