const margin = { top: 40, right: 20, bottom: 60, left: 200 };
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

function fadeIn(selection) {
    selection.style("opacity", 0)
        .transition()
        .duration(800)
        .style("opacity", 1);
}

function showScene1() {
    d3.select("#chart").html("");
    d3.select("#filters").style("display", "none");

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    fadeIn(svg);

    d3.csv("data/u21_by_league.csv").then(data => {
        const leagueNameMap = {
        "fr": "France",
        "es": "Spain",
        "eng": "UK",
        "it": "Italy",
        "de": "Germany"
        };

        data.forEach(d => {
            d.U21_Player_Count = +d.U21_Player_Count;
            const parts = d.Comp.split(" ");
            const prefix = parts[0];
            const rest = parts.slice(1).join(" ");
            const country = leagueNameMap[prefix] || prefix;
            d.Comp = `${country} - ${rest}`;
            });

        const x = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.U21_Player_Count)])
            .range([0, width]);

        const y = d3.scaleBand()
            .domain(data.map(d => d.Comp))
            .range([0, height])
            .padding(0.4);

        svg.append("g")
            .call(d3.axisLeft(y))
            .selectAll("text")
            .style("font-size", "16px");

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("font-size", "16px");

        svg.selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("y", d => y(d.Comp))
            .attr("x", 0)
            .attr("height", y.bandwidth())
            .attr("width", d => x(d.U21_Player_Count))
            .attr("fill", "#4F8A10");

        svg.append("text")
            .attr("x", 10)
            .attr("y", y(data[0].Comp) + y.bandwidth() / 2)
            .attr("alignment-baseline", "middle")
            .attr("fill", "black")
            .text("👑 Highest number of U21 players");
    });
}

function showScene2() {
    d3.select("#chart").html("");
    d3.select("#filters").style("display", "none");

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right + 120)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    fadeIn(svg);

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "white")
        .style("padding", "6px")
        .style("border", "1px solid #ccc")
        .style("font-size", "12px")
        .style("opacity", 0)
        .style("pointer-events", "none");

    d3.csv("data/u21_scatter_data.csv").then(data => {

        data.forEach(d => {
            d.xG_90 = +d.xG_90;
            d.Gls_90 = +d.Gls_90;
        });

        const x = d3.scaleLinear().domain([0, 1.5]).range([0, width]);
        const y = d3.scaleLinear().domain([0, 1.5]).range([height, 0]);
        const color = d3.scaleOrdinal(d3.schemeCategory10);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text").style("font-size", "16px");

        svg.append("g")
            .call(d3.axisLeft(y))
            .selectAll("text").style("font-size", "16px");

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + 40)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Expected Goals per 90");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -50)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Actual Goals per 90");

        svg.append("line")
            .attr("x1", x(0))
            .attr("y1", y(0))
            .attr("x2", x(1.5))
            .attr("y2", y(1.5))
            .attr("stroke", "gray")
            .attr("stroke-dasharray", "4 2");

        svg.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => x(d.xG_90))
            .attr("cy", d => y(d.Gls_90))
            .attr("r", 5)
            .attr("fill", d => color(d.Comp))
            .attr("opacity", 0.7)
            .on("mouseover", (event, d) => {
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip.html(
                `<strong>${d.Player}</strong><br>
                Team: ${d.Squad}<br>
                League: ${d.Comp}<br>
                Actual Goal/90: ${d.Gls_90.toFixed(2)}<br>
                Expected Goal/90: ${d.xG_90.toFixed(2)}`
                )
                .style("left", event.pageX + 10 + "px")
                .style("top", event.pageY - 28 + "px");
            })
            .on("mouseout", () => {
                tooltip.transition().duration(300).style("opacity", 0);
            });

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .text("Actual vs Expected Goals per 90 min");

        const topPlayers = data
            .map(d => ({ ...d, diff: d.Gls_90 - d.xG_90 }))
            .sort((a, b) => b.diff - a.diff)
            .slice(0, 3);

        svg.selectAll(".annotation")
            .data(topPlayers)
            .enter()
            .append("text")
            .attr("x", d => x(d.xG_90) + 8)
            .attr("y", d => y(d.Gls_90) - 8)
            .text(d => `👑 ${d.Player}`)
            .style("font-size", "12px")
            .style("fill", "black");

        const leagues = Array.from(new Set(data.map(d => d.Comp)));

        const legend = svg.selectAll(".legend")
            .data(leagues)
            .enter()
            .append("g")
            .attr("class", "legend")
            .attr("transform", (d, i) => `translate(${width + 20}, ${i * 25})`);

        legend.append("rect")
            .attr("x", 0)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", d => color(d));

        legend.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .style("font-size", "13px")
            .text(d => d);
    });
}

function showScene3() {
    d3.select("#chart").html("");
    d3.select("#filters").style("display", "none");

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right + 120)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    fadeIn(svg);

    d3.csv("data/u21_by_nation_summary_with_score.csv").then(data => {
        data.forEach(d => {
        d.U21_Player_Count = +d.U21_Player_Count;
        d.Avg_xG_90 = +d.Avg_xG_90;
        d.Avg_Gls_90 = +d.Avg_Gls_90;
        d.YouthOutputScore = +d.YouthOutputScore;
        });

        const x = d3.scaleLinear().domain([0, 0.25]).range([0, width]);
        const y = d3.scaleLinear().domain([0, 0.25]).range([height, 0]);
        const r = d3.scaleSqrt()
            .domain([0, d3.max(data, d => d.YouthOutputScore)])
            .range([4, 30]);
        const color = d3.scaleOrdinal().range(["#1E88E5"]);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x)).selectAll("text").style("font-size", "14px");
        svg.append("g")
            .call(d3.axisLeft(y)).selectAll("text").style("font-size", "14px");

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + 40)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Average Expected Goals per 90");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -50)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Average Actual Goals per 90");

        svg.append("line")
            .attr("x1", x(0))
            .attr("y1", y(0))
            .attr("x2", x(0.25))
            .attr("y2", y(0.25))
            .attr("stroke", "gray")
            .attr("stroke-dasharray", "4 2");

        const tooltip = d3.select(".tooltip").empty()
            ? d3.select("body").append("div").attr("class", "tooltip")
                .style("position", "absolute")
                .style("background", "white")
                .style("padding", "6px")
                .style("border", "1px solid #ccc")
                .style("font-size", "12px")
                .style("opacity", 0)
                .style("pointer-events", "none")
            : d3.select(".tooltip");

        svg.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => x(d.Avg_xG_90))
            .attr("cy", d => y(d.Avg_Gls_90))
            .attr("r", d => r(d.YouthOutputScore))
            .attr("fill", d => color("default"))
            .attr("opacity", 0.7)
            .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(
                `<strong>${d.Nation}</strong><br>` +
                `U21 Players: ${d.U21_Player_Count}<br>` +
                `Avg Gls/90: ${d.Avg_Gls_90.toFixed(3)}<br>` +
                `Youth Output Score: ${d.YouthOutputScore.toFixed(2)}`
            )
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px");
        })
        .on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0));

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .text("Youth Output Score (Avg Goals/90 * U21 Players) by Country");

        const topNation = data[0];
        svg.append("text")
            .attr("x", x(topNation.Avg_xG_90))
            .attr("y", y(topNation.Avg_Gls_90))
            .attr("alignment-baseline", "left")
            .style("font-size", "13px")
            .text(`👑 ${topNation.Nation} has the most U21 Output Score`);
    });
}

function showScene4() {
    d3.select("#chart").html("");
    d3.select("#filters").style("display", "block");

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right + 120)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    fadeIn(svg);

    d3.csv("data/u21_scatter_data.csv").then(data => {
        data.forEach(d => {
        d.xG_90 = +d.xG_90;
        d.Gls_90 = +d.Gls_90;
        });

        const leagues = Array.from(new Set(data.map(d => d.Comp))).sort();
        const nations = Array.from(new Set(data.map(d => d.Nation))).sort();
        const players = Array.from(new Set(data.map(d => d.Player))).sort();

        const leagueSel = d3.select("#leagueFilter");
        leagueSel.append("option").text("All");
        leagues.forEach(l => leagueSel.append("option").text(l));

        const nationSel = d3.select("#nationFilter");
        nationSel.append("option").text("All");
        nations.forEach(n => nationSel.append("option").text(n));

        const playerSel = d3.select("#playerFilter");
        players.forEach(p => playerSel.append("option").text(p).attr("value", p));

        d3.selectAll("#leagueFilter, #nationFilter, #playerFilter")
            .on("change", update);

        // The filtering logic below is inspired by the implementation at:
        // https://d3-graph-gallery.com/graph/line_filter.html
        
        update(); 

        function update() {
            svg.selectAll("*").remove();

            let filtered = data;

            const selectedLeague = leagueSel.property("value");
            const selectedNation = nationSel.property("value");
            const selectedPlayers = Array.from(playerSel.property("selectedOptions")).map(opt => opt.value);

            if (selectedLeague !== "All") {
                filtered = filtered.filter(d => d.Comp === selectedLeague);
            }
            if (selectedNation !== "All") {
                filtered = filtered.filter(d => d.Nation === selectedNation);
            }
            if (selectedPlayers.length > 0) {
                filtered = filtered.filter(d => selectedPlayers.includes(d.Player));
            }

            const x = d3.scaleLinear().domain([0, 1.5]).range([0, width]);
            const y = d3.scaleLinear().domain([0, 1.5]).range([height, 0]);
            const color = d3.scaleOrdinal(d3.schemeCategory10);

            svg.append("g").attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x)).selectAll("text").style("font-size", "14px");
            svg.append("g")
                .call(d3.axisLeft(y)).selectAll("text").style("font-size", "14px");

            svg.append("text").attr("x", width / 2).attr("y", height + 40)
                .attr("text-anchor", "middle").style("font-size", "14px")
                .text("Expected Goals per 90");
            svg.append("text").attr("transform", "rotate(-90)").attr("x", -height / 2).attr("y", -50)
                .attr("text-anchor", "middle").style("font-size", "14px")
                .text("Actual Goals per 90");
            svg.append("line")
                .attr("x1", x(0)).attr("y1", y(0)).attr("x2", x(1.5)).attr("y2", y(1.5))
                .attr("stroke", "gray").attr("stroke-dasharray", "4 2");

            const tooltip = d3.select(".tooltip").empty()
                ? d3.select("body").append("div").attr("class", "tooltip")
                    .style("position", "absolute").style("background", "white")
                    .style("padding", "6px").style("border", "1px solid #ccc")
                    .style("font-size", "12px").style("opacity", 0).style("pointer-events", "none")
                : d3.select(".tooltip");

            svg.selectAll("circle")
                .data(filtered)
                .enter()
                .append("circle")
                .attr("cx", d => x(d.xG_90))
                .attr("cy", d => y(d.Gls_90))
                .attr("r", 5)
                .attr("fill", d => color(d.Comp))
                .attr("opacity", 0.7)
                .on("mouseover", (event, d) => {
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip.html(`<strong>${d.Player}</strong><br>Team: ${d.Squad}<br>League: ${d.Comp}<br>Gls/90: ${d.Gls_90.toFixed(2)}<br>xG/90: ${d.xG_90.toFixed(2)}`)
                    .style("left", event.pageX + 10 + "px")
                    .style("top", event.pageY - 28 + "px");
                })
                .on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0));

            svg.append("text")
                .attr("x", width / 2)
                .attr("y", -10)
                .attr("text-anchor", "middle")
                .style("font-size", "18px")
                .text("Filtered U21 Player Performance");
        }
    });
}

showScene1();
