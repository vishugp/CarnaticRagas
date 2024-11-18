const width = 600;
const height = 600;
const radius = Math.min(width, height) / 2 - 50; // Leave padding for strokes or labels

const baseColors = [
    "#8A2BE2", // Violet
    "#4B0082", // Indigo
    "#0000FF", // Blue
    "#008000", // Green
    "#FFFF00", // Yellow
    "#FFA500", // Orange
    "#FF0000"  // Red
];

function getColorByDepth(d) {
    const baseColor = baseColors[d.depth % baseColors.length];
    const lightenFactor = 0.1;
    return d3.color(baseColor).brighter(lightenFactor);
}

let colormap = {};
function loadColormap() {
    return d3.csv("colormap.csv").then(data => {
        data.forEach(row => {
            colormap[row.name] = row.color;
        });
    });
}

function getColorByName(d) {
    return colormap[d.data.name] || "#ccc";
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

    const maxDepth = root.height;
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
        .style("fill", d => getColorByName(d))
        .style("fill-opacity", 0.7)
        .on("mouseover", mouseover)
        .on("mouseleave", mouseleave);

    const labels = svg.selectAll("text")
        .data(root.descendants())
        .enter().append("text")
        .attr("transform", function (d) {
            const angle = (d.x0 + d.x1) / 2 * (180 / Math.PI) - 90;
            const r = ((d.depth + 0.27) / maxDepth) * radius;
            return `rotate(${angle}) translate(${r},0) rotate(${angle > 90 ? 180 : 0})`;
        })
        .attr("text-anchor", d => ((d.x0 + d.x1) / 2) > Math.PI ? "end" : "start")
        .style("font-size", "12px")
        .style("fill", "black")
        .style("visibility", "visible")  // Start with all labels visible
        .text(d => d.data.name);

    function mouseover(event, d) {
        const raagaName = d.data.raaga || "";
        d3.select("#explanation")
            .html(`<b>${raagaName}</b>`)
            .style("visibility", "");

        paths.style("opacity", 0.3);
        
        const sequenceArray = d.ancestors().reverse().slice(1);
        paths.filter(pathD => sequenceArray.some(seqD => seqD === pathD))
            .style("opacity", 1);

        // Show labels for the entire selected path
        labels.style("visibility", l => {
            // Check if the label's node is in the selected path (ancestors)
            const isInPath = sequenceArray.includes(l);
            // Check if the label's node is a descendant of the selected node
            const isDescendant = l.ancestors().includes(d);
            
            return (isInPath || isDescendant) ? "visible" : "hidden";
        });

        updateBreadcrumbs(sequenceArray);
    }

    function mouseleave() {
        paths.style("opacity", 1);
        // Show all labels again when nothing is selected
        labels.style("visibility", "visible");
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
    const root = { name: "", children: [] };
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

Promise.all([
    d3.csv("Data/Tabular/Melakarta_Raagams.csv"),
    loadColormap()
]).then(([data]) => {
    const json = buildHierarchy(data);
    createSunburst(json);
});