const width = 750;
const height = 600;
const radius = Math.min(width, height) / 2 - 50; // Leave padding for strokes or labels

// Define base colors for each depth level
const baseColors = [
    "#8A2BE2", // Violet
    "#4B0082", // Indigo
    "#0000FF", // Blue
    "#008000", // Green
    "#FFFF00", // Yellow
    "#FFA500", // Orange
    "#FF0000"  // Red
];

// Function to get color with variation by depth
function getColorByDepth(d) {
    const baseColor = baseColors[d.depth % baseColors.length];
    const lightenFactor = 0.1; // Adjust lightness factor
    return d3.color(baseColor).brighter(lightenFactor);
}

function createSunburst(json) {
    const svg = d3.select("#chart").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const partition = d3.partition().size([2 * Math.PI, radius * radius]);

    const root = d3.hierarchy(json)
        .sum(d => d.value || 0)
        .sort((a, b) => (b.value || 0) - (a.value || 0));

    partition(root);

    // const arc = d3.arc()
    //     .startAngle(d => d.x0)
    //     .endAngle(d => d.x1)
    //     .innerRadius(d => Math.sqrt(d.y0))
    //     .outerRadius(d => Math.sqrt(d.y1));

    const maxDepth = root.height; // Maximum depth of the hierarchy
    const arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .innerRadius(d => (d.depth / maxDepth) * radius)
        .outerRadius(d => ((d.depth + 1) / maxDepth) * radius);

    const paths = svg.selectAll("path")
        .data(root.descendants())
        .enter().append("path")
        .attr("display", d => d.depth ? null : "none")
        .attr("d", arc)
        .style("stroke", "#fff")
        .style("fill", d => getColorByDepth(d))
        .style("fill-opacity", 0.7)
        .on("mouseover", mouseover)
        .on("mouseleave", mouseleave);

    function mouseover(event, d) {
        const percentage = ((100 * d.value) / root.value).toFixed(1);
        const raagaName = d.data.raaga || "";

        d3.select("#explanation")
            .html(`<br><br><b>${raagaName}</b>`)
            .style("visibility", "");

        const sequenceArray = d.ancestors().reverse().slice(1);
        
        paths.style("opacity", 0.3);
        paths.filter(pathD => sequenceArray.some(seqD => seqD === pathD))
            .style("opacity", 1);

        updateBreadcrumbs(sequenceArray, percentage);
    }

    function mouseleave() {
        paths.style("opacity", 1);
        d3.select("#trail").selectAll("*").remove();
        d3.select("#explanation").style("visibility", "hidden");
    }

    function updateBreadcrumbs(nodeArray, percentage) {
        const trail = d3.select("#trail").selectAll("div")
            .data(nodeArray);

        trail.enter()
            .append("div")
            .attr("class", "trailpart")
            .style("color", "white")
            .style("background-color", d => getColorByDepth(d))
            .text(d => d.data.name);
    }
}

function buildHierarchy(csvData) {
    const root = { name: "Scale", children: [] };
    csvData.forEach(row => {
        const parts = row.path.split("-");
        let currentNode = root;
        for (let i = 0; i < parts.length; i++) {
            const nodeName = parts[i];
            let childNode = currentNode.children.find(child => child.name === nodeName);
            if (!childNode) {
                childNode = { name: nodeName, children: [] };
                currentNode.children.push(childNode);
            }
            currentNode = childNode;
        }
        currentNode.value = +row.value;
        currentNode.raaga = row.raaga;
    });
    return root;
}

d3.csv("Data/Tabular/Melakarta_Raagams.csv").then(data => {
    const json = buildHierarchy(data);
    createSunburst(json);
});
